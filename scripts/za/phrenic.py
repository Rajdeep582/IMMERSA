"""Phrenic nerve course (C3–C5) constructed from the male model's own structures, following the
standard textbook path: lateral border of scalenus anterior at C4 → down its anterior surface,
lateral → medial → between subclavian artery (posterior) and vein (anterior) → right: lateral to the
right brachiocephalic vein and SVC, over the right border of the heart (pericardium) → diaphragm;
left: over the left side of the aortic arch, over the left border of the heart → diaphragm."""
import json, numpy as np
L={k:np.array(v).reshape(-1,3) for k,v in json.load(open('phrenic_lm.json')).items()}
def sl(P,y,h=0.004): return P[np.abs(P[:,1]-y)<h]
def catmull(pts,n=12):
    pts=np.asarray(pts); out=[]
    P=np.r_[pts[:1],pts,pts[-1:]]
    for i in range(1,len(P)-2):
        p0,p1,p2,p3=P[i-1],P[i],P[i+1],P[i+2]
        for t in np.linspace(0,1,n,endpoint=False):
            out.append(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3))
    out.append(pts[-1]); return np.array(out)
def path(side):
    s=1 if side=='L' else -1   # +x = left
    sc=L[('Left' if side=='L' else 'Right')+' scalenus anterior']
    heart=L['Heart']; dia=L['Diaphragm']
    sa=L[('Left' if side=='L' else 'Right')+' subclavian artery']; sv=L[('Left' if side=='L' else 'Right')+' subclavian vein']
    pts=[]
    ytop,ybot=sc[:,1].max(),sc[:,1].min()
    for t in np.linspace(0.1,0.95,7):     # anterior surface of scalenus anterior, lateral → medial
        y=ytop-t*(ytop-ybot); q=sl(sc,y)
        if len(q)<4: continue
        xl,xm=(q[:,0]*s).max()*s,(q[:,0]*s).min()*s
        x=xl+(xm-xl)*(0.15+0.7*t)
        front=q[np.abs(q[:,0]-x)<0.006]
        z=(front if len(front) else q)[:,2].max()+0.002
        pts.append([x,y,z])
    # between subclavian artery (behind) and vein (in front), at the medial edge of the scalene
    xm=pts[-1][0]
    a=sa[np.abs(sa[:,0]-xm)<0.008]; v=sv[np.abs(sv[:,0]-xm)<0.008]
    if len(a) and len(v):
        pts.append([xm, (a[:,1].mean()+v[:,1].mean())/2-0.004, (a[:,2].max()+v[:,2].min())/2])
    if side=='R':
        for nm in ('Right brachiocephalic vein','Superior vena cava'):
            P=L[nm]
            for y in np.linspace(P[:,1].max()-0.004,P[:,1].min()+0.004,3):
                q=sl(P,y)
                if len(q): i=np.argmin(q[:,0]); pts.append([q[i,0]-0.004,y,q[i,2]])
    else:
        P=L['Arch of aorta']
        for y in np.linspace(P[:,1].max()-0.003,P[:,1].min()+0.01,3):
            q=sl(P,y)
            if len(q): i=np.argmax(q[:,0]); pts.append([q[i,0]+0.004,y,q[i,2]+0.004])
    # over the heart border (fibrous pericardium), anterior to the lung root
    ystart=min(pts[-1][1]-0.01, heart[:,1].max()-0.01)
    for y in np.linspace(ystart, heart[:,1].min()+0.012, 7):
        q=sl(heart,y,0.003)
        if len(q)<10: continue
        i=np.argmax(q[:,0]*s)
        pts.append([q[i,0]+s*0.005,y,q[i,2]])
    # onto the diaphragm dome beside the heart
    x,z=pts[-1][0]+s*0.01,pts[-1][2]
    d=dia[(np.abs(dia[:,0]-x)<0.01)&(np.abs(dia[:,2]-z)<0.015)]
    if len(d): pts.append([x,d[:,1].max()+0.003,z])
    # drop near-duplicate / backtracking points (y must decrease monotonically)
    clean=[pts[0]]
    for p in pts[1:]:
        if p[1] < clean[-1][1]-0.002: clean.append(p)
    return catmull(clean)
def tube(c,r=0.0011,seg=10):
    V=[];T=[]
    for i,p in enumerate(c):
        t=c[min(i+1,len(c)-1)]-c[max(i-1,0)]; t/=np.linalg.norm(t)
        a=np.cross(t,[0,0,1]); 
        if np.linalg.norm(a)<1e-3: a=np.cross(t,[1,0,0])
        a/=np.linalg.norm(a); b=np.cross(t,a)
        for k in range(seg):
            th=2*np.pi*k/seg; V.append(p+r*(np.cos(th)*a+np.sin(th)*b))
    for i in range(len(c)-1):
        for k in range(seg):
            a0=i*seg+k; a1=i*seg+(k+1)%seg; b0=a0+seg; b1=a1+seg
            T+= [a0,b0,a1, a1,b0,b1]
    # end caps
    n=len(V); V.append(c[0]); V.append(c[-1])
    for k in range(seg):
        T+=[n, (k+1)%seg, k]; base=(len(c)-1)*seg; T+=[n+1, base+k, base+(k+1)%seg]
    return np.array(V),np.array(T)
out=[]
for side in ('R','L'):
    c=path(side); V,T=tube(c)
    print(side,'points',len(c),'y',round(c[:,1].max(),3),'→',round(c[:,1].min(),3),'length mm',round(np.linalg.norm(np.diff(c,axis=0),axis=1).sum()*1000))
    out.append({'name':f'Phrenic nerve.{side.lower()}','side':side,'v':V.ravel().round(5).tolist(),'t':T.tolist(),'centre':c.round(5).tolist()})
json.dump(out,open('phrenic_male.json','w'))
