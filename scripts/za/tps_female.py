import json, numpy as np, re
from scipy.interpolate import RBFInterpolator
M=json.load(open('/home/claude/pipeline/za/orig/male/registry.json'))['structures']
F=json.load(open('/home/claude/pipeline/za/orig/female/registry.json'))['structures']
m={v['name'].lower():v for v in M.values() if v['kind']=='structure'}
f={v['name'].lower():v for v in F.values() if v['kind']=='structure'}
P=[];Q=[];tag=[]
def add(a,b,t):
    P.append(np.asarray(a,float));Q.append(np.asarray(b,float));tag.append(t)
def box(b): b=np.array(b); return [b.mean(0),b[0],b[1]]
def union(recs):
    bs=np.array([r['bbox'] for r in recs]); return [bs[:,0].min(0),bs[:,1].max(0)]
# 1. same-named structures
for n in set(m)&set(f):
    if n=='skin': continue
    for a,b in zip(box(m[n]['bbox']),box(f[n]['bbox'])): add(a,b,n)
# 2. vertebrae
ords=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth']
for reg,cnt in (('cervical',7),('thoracic',12),('lumbar',5)):
    for i in range(cnt):
        fm=f.get(f'{reg} vertebra {i+1}')
        mn={('cervical',0):'atlas',('cervical',1):'axis'}.get((reg,i), f'{ords[i]} {reg} vertebra')
        mm=m.get(mn)
        if fm and mm:
            for a,b in zip(box(mm['bbox']),box(fm['bbox'])): add(a,b,mn)
# 3. hip bones
for s in ('left','right'):
    fr=[v for k,v in f.items() if k.startswith(s+' ') and re.search(r'(ilium|ischium|pubis) \(compact',k)]
    if fr and m.get(f'{s} hip bone'):
        for a,b in zip(box(m[f'{s} hip bone']['bbox']),box(union(fr))): add(a,b,s+' hip')
# 4. skin landmarks: arms, feet, head, torso
def load(fn): return np.fromfile(fn,dtype=np.float32).reshape(-1,3)
SM,SF=load('skin_m.f32'),load('skin_f.f32')
def arm_line(S,side,ylo):
    pts=[]; started=False
    for y in np.arange(S[:,1].min()+0.3, S[:,1].max(), 0.005):
        s=S[np.abs(S[:,1]-y)<0.003]
        if len(s)<10: continue
        xs=np.sort(s[:,0]*side); gaps=np.where(np.diff(xs)>0.012)[0]
        if len(gaps)==0:
            if started: break
            continue
        arm=s[s[:,0]*side>=xs[gaps[-1]+1]]
        c=arm.mean(0)
        if abs(c[0])<0.17 or np.ptp(arm[:,0])>0.13:
            if started: break
            continue
        started=True; pts.append(c)
    pts=np.array(pts)  # bottom (fingertips) -> top (axilla)
    k=7; pad=np.r_[np.repeat(pts[:1],k//2,0),pts,np.repeat(pts[-1:],k//2,0)]
    pts=np.array([pad[i:i+k].mean(0) for i in range(len(pts))])
    print('   arm y range',round(pts[0,1],3),round(pts[-1,1],3),'x',round(pts[0,0],3),round(pts[-1,0],3))
    L=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))]
    return pts,L
for side in (1,-1):
    pm,Lm=arm_line(SM,side,SM[:,1].min()+0.6); pf,Lf=arm_line(SF,side,SF[:,1].min()+0.6)
    print('arm',side,'male len',round(Lm[-1],3),len(pm),'female len',round(Lf[-1],3),len(pf))
    for t in np.linspace(0,1,14):
        a=np.array([np.interp(t*Lm[-1],Lm,pm[:,k]) for k in range(3)]); b=np.array([np.interp(t*Lf[-1],Lf,pf[:,k]) for k in range(3)])
        add(a,b,f'arm{side}:{t:.2f}')
    def shoulder(S,ytop):
        s=S[np.abs(S[:,1]-(ytop+0.07))<0.004]; s=s[s[:,0]*side>0]
        return s[np.argmax(s[:,0]*side)]
    add(shoulder(SM,pm[-1,1]),shoulder(SF,pf[-1,1]),'shoulder')
# feet: bottom slab per side
for side in (1,-1):
    for S,dst in ((SM,'m'),(SF,'f')): pass
    def foot(S):
        s=S[(S[:,1]<S[:,1].min()+0.03)&(S[:,0]*side>0)]
        return [s.mean(0), s[np.argmax(s[:,2])], s[np.argmin(s[:,2])]]
    for a,b in zip(foot(SM),foot(SF)): add(a,b,'foot')
add(SM[np.argmax(SM[:,1])],SF[np.argmax(SF[:,1])],'vertex')
# torso surface between sacrum top and C7
def lvl(reg,name): return np.array(reg[name]['bbox']).mean(0)[1]
y0m,y1m=m['sacrum']['bbox'][1][1],lvl(m,'seventh cervical vertebra')
y0f,y1f=f['sacrum']['bbox'][1][1],lvl(f,'cervical vertebra 7')
for t in np.linspace(-0.1,0.65,9):
    def ring(S,y):
        s=S[np.abs(S[:,1]-y)<0.004]; s=s[np.abs(s[:,0])<0.2]
        return [s[np.argmin(s[:,0])],s[np.argmax(s[:,0])],s[np.argmin(s[:,2])],s[np.argmax(s[:,2])]]
    for a,b in zip(ring(SM,y0m+t*(y1m-y0m)),ring(SF,y0f+t*(y1f-y0f))): add(a,b,f'torso{t:.2f}')
# spinal cord centreline (strong): male = Z-Anatomy cord in male frame, female = HRA cord segments
nP=len(P)
pm=np.load('male_cord_pts.npy')
segs=[v for k,v in f.items() if re.search(r'segment of cervical spinal cord|thoracic spinal cord segment|lumbar spinal cord segment|sacral spinal cord segment|coccygeal',k)]
fb=np.array([v['bbox'] for v in segs]); ftop,fbot=fb[:,1,1].max(),fb[:,0,1].min()
fc=np.array([np.array(v['bbox']).mean(0) for v in segs])
mtop,mbot=pm[:,1].max(),pm[:,1].min()
def mcen(y):
    sl=pm[np.abs(pm[:,1]-y)<0.004]; return sl.mean(0) if len(sl)>5 else None
for t in np.linspace(0.02,0.98,30):
    ym=mtop-t*(mtop-mbot); yf=ftop-t*(ftop-fbot)
    a=mcen(ym)
    # female centre: interpolate segment centres by y
    o=np.argsort(fc[:,1]); b=np.array([np.interp(yf,fc[o,1],fc[o,k]) for k in range(3)]); b[1]=yf
    if a is not None: add(a,b,'cord')
# brainstem
def un(reg,pat):
    r=[v for k,v in reg.items() if re.search(pat,k)]
    return union(r) if r else None
for pat in (r'pons',r'medulla oblongata',r'midbrain|mesencephal',r'cerebell'):
    a,b=un(m,pat),un(f,pat)
    if a is not None and b is not None:
        for x,y in zip(box(a),box(b)): add(x,y,'stem')
P=np.array(P);Q=np.array(Q)
strong=np.array([t in ('cord','stem') for t in tag])
_,idx=np.unique(np.round(P,4),axis=0,return_index=True); P,Q=P[idx],Q[idx]; tag=[tag[i] for i in idx]; strong=strong[idx]
d=np.linalg.norm(P-Q,axis=1); print('landmarks',len(P),'median disp mm',np.median(d)*1000,'max',d.max()*1000, tag[int(np.argmax(d))])
sm=np.where(strong,1e-6,3e-4)
fn=RBFInterpolator(P,Q-P,kernel='thin_plate_spline',smoothing=sm,degree=1)
r=np.linalg.norm(P+fn(P)-Q,axis=1); print('fit median mm',np.median(r)*1000,'p95',np.percentile(r,95)*1000)
np.save('mf_P.npy',P); np.save('mf_D.npy',Q-P); np.save('mf_S.npy',sm)
print('cord landmarks',int(strong.sum()))
