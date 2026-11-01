import json, numpy as np, re
from scipy.interpolate import RBFInterpolator
Z=json.load(open('za_export.json'))
R=json.load(open('/home/claude/pipeline/za/orig/male/registry.json'))['structures']
male={v['name'].lower():v for v in R.values() if v['kind']=='structure'}
ORD=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth']
REG={'C':'cervical','T':'thoracic','L':'lumbar'}
def mname(n):
    if n=='Atlas (C1)': return 'atlas'
    if n=='Axis (C2)': return 'axis'
    v=re.match(r'Vertebra ([CTL])(\d+)$',n)
    if v: return f"{ORD[int(v.group(2))-1]} {REG[v.group(1)]} vertebra"
    m=re.match(r'(.*)\.(l|r)$',n)
    return (('left ' if m.group(2)=='l' else 'right ')+m.group(1).lower()) if m else n.lower()
amap=lambda a: np.c_[a[:,0],a[:,2],-a[:,1]]
P=[];Q=[]
for n,bb in Z['bones'].items():   # bones only: nerves follow the skeleton
    k=mname(n)
    if k not in male: continue
    a=amap(np.array(bb)); b=np.array(male[k]['bbox'])
    if np.ptp(a,0).max()<0.008: continue
    pa=[a.mean(0),a[0],a[1]]; pb=[b.mean(0),b[0],b[1]]
    for x,y in zip(pa,pb): P.append(x);Q.append(y)
P=np.array(P);Q=np.array(Q)
d=np.median(Q-P,0); P=P+d
err=np.linalg.norm(P-Q,axis=1); ok=err<0.05
P,Q=P[ok],Q[ok]
# dedupe near-identical source points
_,idx=np.unique(np.round(P,4),axis=0,return_index=True); P,Q=P[idx],Q[idx]
print('landmarks',len(P),'pre median mm',np.median(np.linalg.norm(P-Q,axis=1))*1000)
f=RBFInterpolator(P,Q-P,kernel='thin_plate_spline',smoothing=1e-4,degree=1)
res=np.linalg.norm(P+f(P)-Q,axis=1); print('post median mm',np.median(res)*1000,'p90',np.percentile(res,90)*1000)
np.save('zm_P.npy',P); np.save('zm_D.npy',Q-P); json.dump(d.tolist(),open('zm_offset.json','w'))
