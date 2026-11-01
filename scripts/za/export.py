import bpy, json, mathutils, re
bpy.ops.wm.open_mainfile(filepath='/home/claude/z-anatomy/Z-Anatomy/Startup.blend')
dg = bpy.context.evaluated_depsgraph_get()
def wbb(o):
    bb=[o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    return [[min(v[i] for v in bb) for i in range(3)],[max(v[i] for v in bb) for i in range(3)]]
# bones
bones={}
for o in bpy.data.collections['1: Skeletal system'].all_objects:
    if o.type=='MESH': bones[o.name]=wbb(o)
# organs/landmarks in other systems for registration checks
other={}
for cn in ['7: Nervous system & Sense organs','8: Visceral systems','5: Cardiovascular system']:
    for o in bpy.data.collections[cn].all_objects:
        if o.type=='MESH': other[o.name]=wbb(o)
# hierarchy paths in PNS subtree
root=bpy.data.collections['Peripheral nervous system']
paths={}
def walk(c, path):
    for o in c.objects:
        p=paths.get(o.name)
        if p is None or len(path)>len(p): paths[o.name]=path
    for ch in c.children: walk(ch, path+[ch.name])
walk(root, [])
nerves=[]
for name,path in paths.items():
    o=bpy.data.objects[name]
    if o.type=='CURVE' or (o.type=='MESH' and re.search(r'nerve|root of|ganglion', name, re.I) and not name.endswith('.j')):
        if o.type=='MESH' and re.search(r'muscle', name, re.I): continue
        ev=o.evaluated_get(dg)
        try: me=ev.to_mesh()
        except Exception as e: print('fail',name,e); continue
        if me is None or len(me.polygons)==0: ev.to_mesh_clear(); print('empty',name); continue
        me.calc_loop_triangles()
        M=o.matrix_world
        V=[list(M @ v.co) for v in me.vertices]
        T=[list(t.vertices) for t in me.loop_triangles]
        neg = M.determinant() < 0
        if neg: T=[[a,c,b] for a,b,c in T]
        nerves.append({'name':name,'path':path,'type':o.type,'v':[round(x,5) for p in V for x in p],'t':[i for t in T for i in t]})
        ev.to_mesh_clear()
json.dump({'bones':bones,'other':other,'nerves':nerves},open('/home/claude/pipeline/za/za_export.json','w'))
print('bones',len(bones),'other',len(other),'nerves',len(nerves),'tris',sum(len(n['t'])//3 for n in nerves))
