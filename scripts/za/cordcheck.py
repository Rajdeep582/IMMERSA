import json, numpy as np, re
from scipy.interpolate import RBFInterpolator
C=json.load(open('za_cord.json'))
zmP,zmD=np.load('zm_P.npy'),np.load('zm_D.npy'); off=np.array(json.load(open('zm_offset.json')))
mfP,mfD=np.load('mf_P.npy'),np.load('mf_D.npy')
f_zm=RBFInterpolator(zmP,zmD,kernel='thin_plate_spline',smoothing=1e-4,degree=1)
f_mf=RBFInterpolator(mfP,mfD,kernel='thin_plate_spline',smoothing=np.load('mf_S.npy'),degree=1)
wm=[c for c in C if c['name']=='White matter of spinal cord'][0]
v=np.array(wm['v']).reshape(-1,3); p=np.c_[v[:,0],v[:,2],-v[:,1]]+off; pm=p+f_zm(p); pf=pm+f_mf(pm)
F=json.load(open('/home/claude/immersa/public/data/female/registry.json'))['structures']
segs=[s for s in F.values() if re.search(r'segment of cervical spinal cord|thoracic spinal cord segment|lumbar spinal cord segment|sacral spinal cord segment|coccygeal',s['name'],re.I) and s['kind']=='structure']
cf=np.array([np.array(s['bbox']).mean(0) for s in segs]); cf=cf[np.argsort(-cf[:,1])]
print('female cord y range',cf[:,1].max(),cf[:,1].min())
print('warped ZA cord y range',pf[:,1].max(),pf[:,1].min(),'male',pm[:,1].max(),pm[:,1].min())
for c in cf[::3]:
    sl=pf[np.abs(pf[:,1]-c[1])<0.005]
    if len(sl): print('y',round(c[1],3),'HRA',np.round(c[[0,2]],3),'ZAwarp',np.round(sl.mean(0)[[0,2]],3),'d mm',round(np.linalg.norm(sl.mean(0)[[0,2]]-c[[0,2]])*1000,1))
np.save('male_cord_pts.npy',pm)
