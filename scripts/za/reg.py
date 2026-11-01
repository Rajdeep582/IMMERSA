import json, numpy as np, re
Z=json.load(open('za_export.json'))
R=json.load(open('/home/claude/immersa/public/data/male/registry.json'))['structures']
male={v['name'].lower():v for v in R.values() if v['kind']=='structure'}
def mname(n):
    m=re.match(r'(.*)\.(l|r)$',n)
    if m: return ('left ' if m.group(2)=='l' else 'right ')+m.group(1).lower()
    return n.lower()
P=[];Q=[];names=[]
for src in ('bones','other'):
  for n,bb in Z[src].items():
    k=mname(n)
    if k in male:
        a=np.array(bb); b=np.array(male[k]['bbox'])
        if np.ptp(a,axis=0).max()<0.01: continue
        for c in (a.mean(0),a[0],a[1]): P.append(c)
        for c in (b.mean(0),b[0],b[1]): Q.append(c)
        names.append(k)
P=np.array(P);Q=np.array(Q)
print('matched',len(names))
def fit(P,Q):
    A=np.c_[P,np.ones(len(P))]; X,*_=np.linalg.lstsq(A,Q,rcond=None); return X
keep=np.ones(len(P),bool)
for it in range(5):
    X=fit(P[keep],Q[keep]); err=np.linalg.norm(np.c_[P,np.ones(len(P))]@X-Q,axis=1)
    thr=max(0.006,np.percentile(err[keep],80)*2); keep=err<thr
    print(it,'median err mm',round(np.median(err)*1000,2),'p90',round(np.percentile(err,90)*1000,2),'kept',keep.sum())
np.set_printoptions(suppress=True,precision=5); print(X.T)
json.dump(X.tolist(),open('za_to_male.json','w'))
print('---- simple axis map')
Pm=np.c_[P[:,0],P[:,2],-P[:,1]]
d=np.median(Q-Pm,axis=0); print('offset',d)
e=np.linalg.norm(Pm+d-Q,axis=1); print('median mm',np.median(e)*1000)
for i,n in enumerate(names[:200]):
    print(n, round(e[3*i]*1000,1), np.round((Pm[3*i]+d-Q[3*i])*1000,1))
