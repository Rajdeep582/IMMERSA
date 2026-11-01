import json, numpy as np, re, collections
from scipy.interpolate import RBFInterpolator
Z=json.load(open('za_export.json'))
zmP,zmD=np.load('zm_P.npy'),np.load('zm_D.npy'); off=np.array(json.load(open('zm_offset.json')))
mfP,mfD=np.load('mf_P.npy'),np.load('mf_D.npy')
f_zm=RBFInterpolator(zmP,zmD,kernel='thin_plate_spline',smoothing=1e-4,degree=1)
f_mf=RBFInterpolator(mfP,mfD,kernel='thin_plate_spline',smoothing=np.load('mf_S.npy'),degree=1)
def to_male(v):
    p=np.c_[v[:,0],v[:,2],-v[:,1]]+off
    return p+f_zm(p)
def to_female(p): return p+f_mf(p)
regs={k:{s['name'].lower() for s in json.load(open(f'/home/claude/pipeline/za/orig/{k}/registry.json'))['structures'].values()} for k in ('male','female')}
def pretty(n):
    n=re.sub(r' \(([IVX]+)\)', r' (CN \1)', n)
    n=re.sub(r'\((?!CN )([^)]*)\)', r'\1', n).strip()
    m=re.match(r'(.*)\.(l|r)$',n)
    if m:
        b=m.group(1); return ('Left ' if m.group(2)=='l' else 'Right ')+b[0].lower()+b[1:], m.group(2).upper()
    return n, None
out={'male':[], 'female':[]}
skipped=collections.Counter()
CORD=json.load(open('za_cord.json'))+json.load(open('za_extra.json'))
PHR=json.load(open('phrenic_male.json'))
for p_ in PHR: p_['path']=['Spinal nerves','Cervical plexus']; p_['frame']='male'
for nv in Z['nerves']+CORD+PHR:
    name,side=pretty(nv['name'])
    v=np.array(nv['v'],float).reshape(-1,3); t=np.array(nv['t'],np.int64)
    if len(t)<12: skipped['tiny']+=1; continue
    pm=v if nv.get('frame')=='male' else to_male(v); pf=to_female(pm)
    for model,p in (('male',pm),('female',pf)):
        if nv['path'][:1]==['__cord__'] and model=='female': continue  # female keeps its HRA spinal cord
        if re.sub(r' \(cn [ivx]+\)','',name.lower()) in regs[model]: skipped[model+':dup']+=1; continue
        if nv['name']=='Spinal dura' and model=='female': continue
        out[model].append({'kind':('constructed' if nv.get('frame')=='male' else 'za'),'id':'Z_'+re.sub(r'[^A-Za-z0-9]+','_',nv['name']).strip('_'),'name':name,'side':side,'path':nv['path'],'za':nv['name'],
                           'v':np.round(p,5).ravel().tolist(),'t':t.tolist()})
print(skipped, {k:len(v) for k,v in out.items()})
json.dump(out,open('nerves_xf.json','w'))
