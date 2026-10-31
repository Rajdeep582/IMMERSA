import json,re,collections
import os
exec(open(os.path.join(os.path.dirname(__file__), 'bp3d_common.py')).read())
SYSTEMS=['integumentary','muscular','skeletal','nervous','cardiovascular','respiratory','digestive','urinary','reproductive','endocrine','lymphatic','sensory']
SYS_NAME={'integumentary':'Integumentary system','muscular':'Muscular system','skeletal':'Skeletal system','nervous':'Nervous system','cardiovascular':'Cardiovascular system','respiratory':'Respiratory system','digestive':'Digestive system','urinary':'Urinary system','reproductive':'Reproductive system (male)','endocrine':'Endocrine glands','lymphatic':'Lymphoid organs','sensory':'Sense organs'}
sk=[r for r in rows if r.get('English name')=='Skin'][0]['b']
YC=(sk[0][1]+sk[1][1])/2; ZC=(sk[0][2]+sk[1][2])/2
def w(p): return [p[0]/1000,(p[2]-ZC)/1000,-(p[1]-YC)/1000]
def wbox(b):
    a=w(b[0]);c=w(b[1]); return [[round(min(a[i],c[i]),5) for i in range(3)],[round(max(a[i],c[i]),5) for i in range(3)]]
def side_name(n):
    if re.search(r'\bleft\b',n): return 'L'
    if re.search(r'\bright\b',n): return 'R'
    return None
units={}
for fj,r in meta.items():
    c=concept_of(fj); s=classify(c); b=wbox(r['b'])
    cen=[(b[0][i]+b[1][i])/2 for i in range(3)]
    units[fj]={'c':c,'s':s,'b':b,'cen':cen,'nf':r['nf']}
leaf=collections.defaultdict(list)
for fj,u in units.items(): leaf[u['c']].append(fj)
def bbox_of(us):
    bs=[units[f]['b'] for f in us]
    return [[min(b[0][i] for b in bs) for i in range(3)],[max(b[1][i] for b in bs) for i in range(3)]]
def cen_of(c):
    b=bbox_of(leaf[c]); return [(b[0][i]+b[1][i])/2 for i in range(3)]
def side_of(c):
    s=side_name(names[c].lower())
    if s: return s
    x=cen_of(c)[0]
    b=bbox_of(leaf[c])
    if b[0][0]>0.004: return 'L'
    if b[1][0]<-0.004: return 'R'
    return None
UL=r'hand|finger|thumb|palmar|metacarp|carpal|radial|ulnar|brachial|axillary|cubital|cephalic|basilic|antebrachial|humeral|interosseous of (left|right) forearm'
LL=r'foot|toe|plantar|metatars|tibial|fibular|femoral|popliteal|genicular|saphenous|sural|hallucis|arcuate|digital (vein|arter(y|ies)) of foot'
def region(c):
    x,y,z=cen_of(c); ax=abs(x); n=names[c].lower()
    if re.search(r'penis|pudendal|scrot|vesical|rectal|gluteal|obturator|sacral|iliac|testicular',n): return 'pelvis'
    if re.search(r'hepatic|portal|renal|splenic|gastric|mesenteric|colic|ileal|jejunal|pancrea|lumbar|suprarenal|celiac|cystic|cecal|appendicular|ileocolic|duoden|abdominal aorta|inferior vena cava|phrenic',n): return 'abdomen'
    if re.search(r'cerebr|cerebell|basilar|carotid|jugular|facial|lingual|ophthalmic|temporal|occipital|sulcus|vertebral|thyroid|pontine|choroidal|callosomarginal|pericallosal|frontal|parietal|insular|communicating artery|striate|retina|labyrinth|sinus',n): return 'head_neck'
    if 'brachiocephalic' in n: return 'thorax'
    if re.search(UL,n): return 'upper_limb'
    if re.search(LL,n): return 'lower_limb'
    if re.search(r'intercostal|bronchial|azygos|thoracic|pericard|mediastin|esophageal|arch of aorta|ascending aorta|thoracic aorta|brachiocephalic|subclavian|superior vena cava',n): return 'thorax'
    if y>0.595: return 'head_neck'
    if ax>0.15 and y>-0.3: return 'upper_limb'
    if y<-0.02: return 'lower_limb'
    if y>0.30: return 'thorax'
    if y>0.10: return 'abdomen'
    return 'pelvis'
REG_NAME={'head_neck':'Head and neck','thorax':'Thorax','abdomen':'Abdomen','pelvis':'Pelvis and perineum','upper_limb':'upper limb','lower_limb':'lower limb'}
inv={v.lower():k for k,v in names.items()}
def A(c): return {names[a].lower() for a in anc(c)}
# ---- per-system path rules: return list of group labels (outer->inner)
def limb(side,label): return ('Left ' if side=='L' else 'Right ' if side=='R' else '')+label
def sk_path(c,n,S):
    a=A(c)
    if 'tooth' in n: return ['Skull','Teeth','Upper teeth' if 'upper' in n else 'Lower teeth']
    if n in('mandible',): return ['Skull']
    if re.search(r'frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|ethmoid',n): return ['Skull','Cranium (neurocranium)']
    if re.search(r'zygomatic|maxilla|palatine|nasal bone|lacrimal bone|vomer',n): return ['Skull','Facial skeleton']
    if 'hyoid' in n: return []
    if 'intervertebral disk' in n: return ['Vertebral column','Intervertebral discs']
    if re.search(r'cervical vertebra|^atlas|^axis',n): return ['Vertebral column','Cervical vertebrae']
    if 'thoracic vertebra' in n: return ['Vertebral column','Thoracic vertebrae']
    if 'lumbar vertebra' in n: return ['Vertebral column','Lumbar vertebrae']
    if re.search(r'sacrum|coccyx',n): return ['Vertebral column']
    if 'costal cartilage' in n: return ['Thoracic cage','Costal cartilages']
    if re.search(r'\brib\b',n): return ['Thoracic cage', limb(S,'ribs').capitalize()]
    if re.search(r'sternum|manubrium|xiphoid',n): return ['Thoracic cage','Sternum']
    if re.search(r'clavicle|scapula',n): return ['Pectoral girdle']
    if 'hip bone' in n: return ['Pelvic girdle']
    if re.search(r'humerus',n): return [limb(S,'upper limb'),'Arm']
    if re.search(r'radius|ulna|forearm',n): return [limb(S,'upper limb'),'Forearm']
    if re.search(r'scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|wrist',n): return [limb(S,'upper limb'),'Hand','Carpal bones']
    if 'metacarpal' in n: return [limb(S,'upper limb'),'Hand','Metacarpal bones']
    if re.search(r'finger|thumb',n): return [limb(S,'upper limb'),'Hand','Phalanges of hand']
    if re.search(r'femur',n): return [limb(S,'lower limb'),'Thigh']
    if 'patella' in n: return [limb(S,'lower limb'),'Knee']
    if re.search(r'tibia|fibula|of left leg|of right leg',n): return [limb(S,'lower limb'),'Leg']
    if re.search(r'talus|calcaneus|navicular|cuboid|cuneiform bone',n): return [limb(S,'lower limb'),'Foot','Tarsal bones']
    if 'metatarsal' in n: return [limb(S,'lower limb'),'Foot','Metatarsal bones']
    if re.search(r'toe',n): return [limb(S,'lower limb'),'Foot','Phalanges of foot']
    if re.search(r'sesamoid|plantar',n): return [limb(S,'lower limb'),'Foot']
    return ['Ligaments and membranes'] if re.search(r'ligament|membrane|retinaculum',n) else ['Other skeletal structures']
def mu_region(c,n,S):
    a=A(c)
    if any(k in a for k in ['muscle of upper limb']) or re.search(r'deltoid|biceps brachii|triceps|brachialis|coracobrachialis|pronator|supinator|flexor carpi|extensor carpi|palmaris|brachioradialis|anconeus|pollicis|of left hand|of right hand|digiti minimi of (left|right) hand|flexor digitorum (superficialis|profundus)|extensor digitorum$|extensor indicis|lumbrical of (left|right) hand|interosseous of (left|right) hand|teres (major|minor)|infraspinatus|supraspinatus|subscapularis',n):
        sub='Shoulder' if re.search(r'deltoid|teres (major|minor)|infraspinatus|supraspinatus|subscapularis',n) else 'Arm' if re.search(r'biceps brachii|triceps|brachialis$|coracobrachialis|anconeus',n) or 'muscle of arm' in a else 'Hand' if ('muscle of hand' in a or re.search(r'hand|pollicis brevis|opponens|adductor pollicis',n)) else 'Forearm'
        return [limb(S,'upper limb'),sub]
    if 'muscle of lower limb' in a or re.search(r'glute|piriformis|obturator|gemellus|quadratus femoris|tensor fasciae|sartorius|rectus femoris|vastus|adductor (longus|brevis|magnus|minimus)|gracilis|pectineus|biceps femoris|semitendinosus|semimembranosus|tibialis|fibularis|gastrocnemius|soleus|plantaris|popliteus|hallucis|digitorum longus|digitorum brevis|of (left|right) foot|calcaneal tendon|flexor accessorius|iliotibial|iliacus|psoas',n):
        sub='Hip and gluteal region' if re.search(r'glute|piriformis|obturator|gemellus|quadratus femoris|tensor fasciae|iliacus|psoas',n) else 'Thigh' if ('muscle of thigh' in a or re.search(r'sartorius|rectus femoris|vastus|adductor (longus|brevis|magnus|minimus)|gracilis|pectineus|biceps femoris|semitendinosus|semimembranosus|iliotibial',n)) else 'Foot' if ('muscle of foot' in a or 'foot' in n or re.search(r'brevis|accessorius|abductor hallucis|adductor hallucis',n)) else 'Leg'
        return [limb(S,'lower limb'),sub]
    if 'longus colli' in n or 'longus capitis' in n: return ['Neck','Prevertebral muscles']
    if 'muscle of head' in a or re.search(r'rectus$|superior oblique|inferior oblique$|levator palpebrae|masseter|temporalis|pterygoid|veli palatini|palato|glossus|buccinator|orbicularis|common tendinous ring',n) and 'capitis' not in n:
        sub='Extra-ocular muscles' if re.search(r'rectus|oblique|levator palpebrae|tendinous ring|check',n) else 'Muscles of mastication' if re.search(r'masseter|temporalis|pterygoid',n) else 'Tongue and palate' if re.search(r'glossus|palat|uvula',n) else 'Facial muscles'
        return ['Head',sub]
    if re.search(r'pharyngeal constrictor|pharyngeus|raphe',n): return ['Neck','Pharyngeal muscles']
    if 'muscle of neck' in a or re.search(r'hyoid|digastric|scalen|sternocleidomastoid|longus colli|longus capitis|rectus capitis anterior|rectus capitis lateralis|platysma|cricothyroid|thyroid',n):
        sub='Suprahyoid muscles' if re.search(r'digastric|mylohyoid|geniohyoid|stylohyoid',n) else 'Infrahyoid muscles' if re.search(r'sternohyoid|omohyoid|thyrohyoid|sternothyroid',n) else 'Scalene muscles' if 'scalen' in n else 'Prevertebral muscles' if re.search(r'longus|rectus capitis',n) else None
        return ['Neck']+([sub] if sub else [])
    if re.search(r'erector|spinalis|longissimus|iliocostalis|semispinalis|multifid|rotator|interspinal|intertransvers|splenius|obliquus capitis|rectus capitis posterior|trapezius|latissimus|rhomboid|levator scapulae|serratus posterior|levatores costarum',n) or 'muscle of back' in a or 'muscle of vertebral column' in a:
        sub='Superficial back muscles' if re.search(r'trapezius|latissimus|rhomboid|levator scapulae',n) else 'Suboccipital muscles' if re.search(r'obliquus capitis|rectus capitis posterior',n) else 'Deep (intrinsic) back muscles'
        return ['Back',sub]
    if re.search(r'diaphragm',n): return ['Thorax']
    if re.search(r'intercostal|pectoralis|serratus anterior|subclavius|transversus thoracis|subcostal',n) or 'muscle of thorax' in a:
        return ['Thorax']
    if re.search(r'rectus abdominis|external oblique|internal oblique|transversus abdominis|pyramidalis|quadratus lumborum|linea alba|cremaster',n) or 'muscle of abdomen' in a:
        return ['Abdomen']
    if re.search(r'levator ani|coccygeus|iliococcygeus|pubococcygeus|puborectalis|sphincter|perine|bulbospongiosus|ischiocavernosus|tendinous arch',n) or 'muscle of pelvis' in a or 'perineal muscle' in a:
        return ['Pelvis and perineum']
    reg=region(c)
    return [REG_NAME[reg] if reg not in('upper_limb','lower_limb') else limb(S,REG_NAME[reg])]
def mu_path(c,n,S):
    p=mu_region(c,n,S)
    m=re.match(r'^(.*?\b(?:head|part|belly|portion)) of (.+)$',n)
    if m and not re.search(r'tendinous arch',n): p=p+[m.group(2)]
    return p
def nv_path(c,n,S):
    a=A(c)
    if 'spinal cord' in n or 'central canal' in n: return ['Spinal cord']
    if re.search(r'nerve|ganglion',n):
        return ['Cranial nerves and ganglia']
    if re.search(r'ventricle|aqueduct|interventricular foramen|choroid plexus',n): return ['Brain','Ventricular system']
    if re.search(r'cerebell|tentorium',n): return ['Brain','Cerebellum']
    if re.search(r'midbrain|pons|medulla oblongata|collicul|peduncle|interpeduncular|tegment',n): return ['Brain','Brainstem']
    if re.search(r'thalam|hypothalam|geniculate|habenula|mammillary|tuber cinereum|pineal|optic chiasm|optic tract|stria medullaris|third ventricle',n): return ['Brain','Diencephalon']
    if re.search(r'commissure|corpus callosum|fornix|septum|lamina terminalis|stria terminalis',n): return ['Brain','Cerebrum','Commissural and midline structures']
    if re.search(r'caudate nucleus|putamen|globus pallidus|amygdala|claustrum|internal capsule',n): return ['Brain','Cerebrum','Basal nuclei and deep structures']
    s=side_name(n)
    return ['Brain','Cerebrum',('Left cerebral hemisphere' if s=='L' else 'Right cerebral hemisphere' if s=='R' else 'Midline structures')]
def cv_path(c,n,S):
    a=A(c)
    if 'heart' in a or re.search(r'ventricle|atrium|valve|cusp|papillary|chorda|coronary|cardiac vein|coronary sinus|heart',n) or 'coronary sinus tree' in a or 'coronary artery' in a or 'cardiac vein' in a:
        sub='Coronary vessels' if (re.search(r'coronary|cardiac vein|circumflex|interventricular branch|marginal|diagonal|sinus',n) or 'coronary artery' in a or 'cardiac vein' in a or 'coronary sinus tree' in a) else 'Chambers and valves'
        return ['Heart',sub]
    if 'pulmonary artery' in a or 'pulmonary vein' in a or 'pulmonary venous tree organ' in a or re.search(r'pulmonary (trunk|artery|vein)|segmental (artery|vein)|lingular (artery|vein)|basal (artery|vein)|apical|lobar',n) and not 'bronch' in n:
        return ['Pulmonary circulation','Pulmonary arteries' if ('artery' in n or 'arter' in n or 'trunk' in n) else 'Pulmonary veins']
    kind='Veins' if re.search(r'vein|venous|vena|sinus',n) else 'Arteries'
    reg=region(c)
    rn=REG_NAME[reg] if reg not in('upper_limb','lower_limb') else (limb(S,REG_NAME[reg]) if S else cap(REG_NAME[reg])+'s (bilateral sets)')
    return [kind,rn]
def rs_path(c,n,S):
    if re.search(r'nasal|alar|concha|nose',n): return ['Nose']
    if re.search(r'laryn|epiglott|thyroid cartilage|cricoid|arytenoid|aryepiglott|crico|thyro|vocal|conus elasticus|corniculate|cuneiform',n):
        sub='Laryngeal cartilages' if 'cartilage' in n or 'epiglottis' in n else 'Intrinsic laryngeal muscles' if re.search(r'arytenoid$|aryepiglott|crico-arytenoid|thyro-arytenoid|vocalis|transverse arytenoid|oblique arytenoid',n) else 'Laryngeal ligaments and membranes'
        return ['Larynx',sub]
    if 'trachea' in n: return []
    return ['Bronchial tree',('Left' if S=='L' else 'Right')+' bronchial tree']
def dg_path(c,n,S):
    if re.search(r'lip|tongue|gingiva|sublingual|submandibular|parotid',n): return ['Oral cavity and salivary glands']
    if re.search(r'duoden|jejun|ileum|mesentery',n): return ['Small intestine']
    if re.search(r'colon|cec|appendix|mesoappendix|rectum|taenia|anal',n): return ['Large intestine']
    if re.search(r'hepatovenous|lobe of liver|liver',n) and 'duct' not in n and 'biliary' not in n: return ['Liver']
    if re.search(r'hepatic duct|biliary|cystic duct|bile|gallbladder|duct of caudate',n): return ['Biliary tree']
    if re.search(r'pancrea',n): return ['Pancreas']
    return []
def ss_path(c,n,S):
    if re.search(r'lacrimal|nasolacrimal',n): return ['Lacrimal apparatus']
    if 'ear' in n: return []
    return [limb(S,'eye')]
PATH={'skeletal':sk_path,'muscular':mu_path,'nervous':nv_path,'cardiovascular':cv_path,'respiratory':rs_path,'digestive':dg_path,'sensory':ss_path,
      'integumentary':lambda c,n,S: ['Hair'] if 'hair' in n or 'eyebrow' in n else [],
      'urinary':lambda c,n,S: [], 'reproductive':lambda c,n,S: [], 'endocrine':lambda c,n,S: [], 'lymphatic':lambda c,n,S: []}
ROMAN=re.compile(r'\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b')
def cap(n):
    if not n: return n
    n=ROMAN.sub(lambda m:m.group(1).upper(), n) if 'segment' in n else n
    return n[0].upper()+n[1:]
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
S_={}
nodes={}; parent={}; children=collections.defaultdict(list)
def ensure(gid,name,sysn,par_id):
    if gid not in nodes:
        nodes[gid]={'id':gid,'name':name,'system':sysn,'kind':'group'}
        parent[gid]=par_id; children[par_id].append(gid)
for sysn in SYSTEMS:
    rid='sys:'+sysn; nodes[rid]={'id':rid,'name':SYS_NAME[sysn],'system':sysn,'kind':'system'}; parent[rid]=None
for c,fjs in leaf.items():
    sysn=units[fjs[0]]['s']; n=names[c].lower(); S=side_of(c)
    p=PATH[sysn](c,n,S)
    cur='sys:'+sysn; path=[]
    for lab in p:
        path.append(lab); gid='grp:'+sysn+'/'+'/'.join(slug(x) for x in path)
        ensure(gid,cap(lab),sysn,cur); cur=gid
    nodes[c]={'id':c,'name':cap(names[c]),'system':sysn,'kind':'structure','units':sorted(fjs)}
    parent[c]=cur; children[cur].append(c)
# remove empty systems
for sysn in SYSTEMS:
    if not children['sys:'+sysn]: del nodes['sys:'+sysn]
# compute units for groups
def all_units(i):
    if nodes[i]['kind']=='structure': return list(nodes[i]['units'])
    out=[]
    for ch in children[i]: out+=all_units(ch)
    return out
ORD={'first':1,'second':2,'third':3,'fourth':4,'fifth':5,'sixth':6,'seventh':7,'eighth':8,'ninth':9,'tenth':10,'eleventh':11,'twelfth':12}
COMMON={'femur':['thigh bone'],'tibia':['shin bone'],'fibula':['calf bone'],'clavicle':['collarbone'],'scapula':['shoulder blade'],'patella':['kneecap'],'sternum':['breastbone'],'hip bone':['os coxae','pelvic bone','innominate bone'],'mandible':['lower jaw','jawbone'],'maxilla':['upper jaw'],'calcaneus':['heel bone'],'calcaneal tendon':['achilles tendon'],'esophagus':['oesophagus','gullet'],'trachea':['windpipe'],'fibularis':['peroneus'],'atlas':['c1'],'axis':['c2'],'hyoid bone':['hyoid'],'talus':['ankle bone'],'pituitary gland':['hypophysis'],'adrenal gland':['suprarenal gland'],'urinary bladder':['bladder'],'gallbladder':['gall bladder'],'tympanic':['eardrum'],'external ear':['auricle','pinna'],'skin':['integument','cutis'],'hair of head':['scalp hair'],'pancreas':['pancreatic gland'],'kidney':['renal'],'testis':['testicle'],'thyroid cartilage':["adam's apple"]}
def synonyms(n0):
    out=[]; L={'cervical':'C','thoracic':'T','lumbar':'L'}
    m=re.match(r'(\w+) (cervical|thoracic|lumbar) vertebra$',n0)
    if m and m.group(1) in ORD: out.append(L[m.group(2)]+str(ORD[m.group(1)]))
    m=re.match(r'intervertebral disk of (\w+) (cervical|thoracic|lumbar) vertebra$',n0)
    if m and m.group(1) in ORD: o=L[m.group(2)]+str(ORD[m.group(1)]); out.append(o+' disc')
    if n0=='intervertebral disk of axis': out.append('C2 disc')
    m=re.match(r'(left|right) (\w+) rib$',n0)
    if m and m.group(2) in ORD: out.append(f'{m.group(1)} rib {ORD[m.group(2)]}')
    for k,v in COMMON.items():
        if re.search(r'\b'+re.escape(k)+r'\b',n0): out+=[re.sub(r'\b'+re.escape(k)+r'\b',x,n0) for x in v]
    if 'disk' in n0: out.append(n0.replace('disk','disc'))
    return sorted(set(x for x in out if x!=n0))
out={'version':1,'source':'BodyParts3D 4.0 (DBCLS)','structures':{},'units':{},'systems':[s for s in SYSTEMS if 'sys:'+s in nodes]}
def sortkey(i):
    n=nodes[i]['name'].lower()
    # natural ordering for numbered sequences
    for w_,v in ORD.items(): n=re.sub(r'\b'+w_+r'\b',f'{v:02d}',n)
    return (0 if nodes[i]['kind']!='structure' else 1, n)
for i,nd in nodes.items():
    us=all_units(i)
    if not us: continue
    rec={'id':i,'name':nd['name'],'system':nd['system'],'kind':nd['kind'],'parent':parent.get(i),
         'children':sorted([c for c in children.get(i,[]) if c in nodes],key=sortkey),'bbox':bbox_of(us),'unitCount':len(us)}
    if nd['kind']=='group':
        f=inv.get(nd['name'].lower())
        if f: rec['fma']=f
    if nd['kind']=='system' and nd['system'] in {'skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','integumentary'}:
        f=inv.get({'integumentary':'integument'}.get(nd['system'], nd['system']+' system'))
        if f: rec['fma']=f
    if nd['kind']=='structure':
        rec['units']=nd['units']; rec['fma']=i
        s=side_of(i)
        if side_name(names[i].lower()): rec['side']=s
        syn=synonyms(names[i].lower())
        if syn: rec['synonyms']=syn
        rec['tris']=sum(units[f]['nf'] for f in nd['units'])
    out['structures'][i]=rec
for fj,u in units.items(): out['units'][fj]={'structure':u['c'],'system':u['s']}
out['transform']={'YC':YC,'ZC':ZC,'note':'world_m = (x, z-ZC, -(y-YC))/1000 from BodyParts3D mm (z-up, -y anterior) to y-up, +z anterior'}
json.dump(out,open(os.environ.get('OUT_REGISTRY','public/data/male/registry.json'),'w'),separators=(',',':'))
print(len(out['structures']), collections.Counter(r['kind'] for r in out['structures'].values()))
def tree(i,d=0,maxd=3,lim=14):
    r=out['structures'][i]
    if r['kind']=='structure': return
    print('  '*d+f"{r['name']} [{r['unitCount']}]")
    if d<maxd:
        gs=[c for c in r['children'] if out['structures'][c]['kind']!='structure']
        for c in gs[:lim]: tree(c,d+1,maxd,lim)
        ss=[out['structures'][c]['name'] for c in r['children'] if out['structures'][c]['kind']=='structure']
        if ss: print('  '*(d+1)+'· '+', '.join(ss[:8])+(f' …(+{len(ss)-8})' if len(ss)>8 else ''))
for s in out['systems']: tree('sys:'+s)
