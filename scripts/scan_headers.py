"""Scan BodyParts3D OBJ headers into fj_meta.json (concept id, name, bounds, counts)."""
import glob, json, os, re, sys
D = os.environ.get('BP3D_DIR', 'raw/bp3d')
rows = []
for p in glob.glob(os.path.join(D, 'isa', '*', '*.obj')):
    h = {}; nv = nf = 0
    with open(p) as f:
        for line in f:
            if line.startswith('#'):
                m = re.match(r'# (.+?) : (.*)', line.strip())
                if m: h[m.group(1)] = m.group(2)
                m = re.match(r'# Bounds\(mm\): \((.*)\)-\((.*)\)', line.strip())
                if m: h['b'] = [list(map(float, m.group(1).split(','))), list(map(float, m.group(2).split(',')))]
            elif line.startswith('v '): nv += 1
            elif line.startswith('f '): nf += 1
    h.update(nv=nv, nf=nf, file=os.path.basename(p)); rows.append(h)
json.dump(rows, open(os.path.join(D, 'fj_meta.json'), 'w'))
print(len(rows), 'meshes')
