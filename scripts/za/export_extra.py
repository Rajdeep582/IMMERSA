import bpy, json
bpy.ops.wm.open_mainfile(filepath='/home/claude/z-anatomy/Z-Anatomy/Startup.blend')
dg = bpy.context.evaluated_depsgraph_get()
NAMES = {'Ganglia of sympathetic trunk.l':'Sympathetic trunk ganglia','Ganglia of sympathetic trunk.r':'Sympathetic trunk ganglia','Spinal dura':'Meninges'}
out=[]
for name,grp in NAMES.items():
    o=bpy.data.objects.get(name)
    if not o: print('missing',name); continue
    ev=o.evaluated_get(dg); me=ev.to_mesh(); me.calc_loop_triangles(); M=o.matrix_world
    V=[list(M @ v.co) for v in me.vertices]; T=[list(t.vertices) for t in me.loop_triangles]
    if M.determinant()<0: T=[[a,c,b] for a,b,c in T]
    out.append({'name':name,'path':(['__cord__',grp] if grp=='Meninges' else ['__ans__',grp]),'type':o.type,'v':[round(x,5) for p in V for x in p],'t':[i for t in T for i in t]})
    ev.to_mesh_clear(); print(name,len(T))
json.dump(out,open('/home/claude/pipeline/za/za_extra.json','w'))
