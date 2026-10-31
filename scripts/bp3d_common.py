import json,collections,csv
import os
D=os.environ.get('BP3D_DIR', 'raw/bp3d') + '/'
def tsv(f): return list(csv.reader(open(D+f),delimiter='\t'))[1:]
names={}
for f in ['isa_parts_list_e.txt','partof_parts_list_e.txt']:
    for c,b,n in tsv(f): names[c]=n
par={'isa':collections.defaultdict(set),'partof':collections.defaultdict(set)}
kids={'isa':collections.defaultdict(set),'partof':collections.defaultdict(set)}
for t in ['isa','partof']:
    for p,pn,c,cn in tsv(t+'_inclusion_relation_list.txt'):
        par[t][c].add(p); kids[t][p].add(c); names.setdefault(p,pn); names.setdefault(c,cn)
el={'isa':collections.defaultdict(set),'partof':collections.defaultdict(set)}  # concept -> fj
fjc=collections.defaultdict(set)
for t in ['isa','partof']:
    for c,n,fj in tsv(t+'_element_parts.txt'): el[t][c].add(fj); fjc[fj].add(c)
rows=json.load(open(D+'fj_meta.json'))
meta={r['file'][:-4]:r for r in rows}
def anc(c,t=None):
    seen=set();st=[c]
    while st:
        x=st.pop()
        for tt in ([t] if t else ['isa','partof']):
            for p in par[tt][x]:
                if p not in seen: seen.add(p); st.append(p)
    return seen
def concept_of(fj):
    r=meta[fj]; c=r.get('Concept ID')
    if c: return c
    cs=[x for x in fjc[fj]]
    # most specific = fewest elements
    return min(cs,key=lambda x:len(el['isa'].get(x,()) or el['partof'].get(x,()) or range(99999)))

import re
def kw(*ws):
    rx=re.compile(r'\b('+'|'.join(ws)+r')s?\b')
    return lambda n,A: bool(rx.search(n))
def pre(*ws):
    rx=re.compile(r'\b('+'|'.join(ws)+r')')
    return lambda n,A: bool(rx.search(n))
def anyA(*ws): return lambda n,A: any(w in A for w in ws)
def OR(*fs): return lambda n,A: any(f(n,A) for f in fs)
MUSCLE_KW=['muscle','tendon','tendinous','aponeurosis','diaphragm','levator','sphincter','fascia','linea alba','raphe','perineum','coccygeus','iliococcygeus','pubococcygeus','puborectalis','cricothyroid','iliotibial tract','gluteus','deltoid','pectoralis','trapezius','biceps','triceps','rectus','oblique','latissimus','serratus','sartorius','gracilis','soleus','gastrocnemius','tibialis','peroneus','fibularis','vastus','adductor','abductor','flexor','extensor','pronator','supinator','brachialis','masseter','temporalis','platysma','sternocleidomastoid','scalen','splenius','iliacus','psoas','quadratus','piriformis','obturator','gemellus','pectineus','popliteus','plantaris','lumbrical','interosse','opponens','semitendinosus','semimembranosus','infraspinatus','supraspinatus','subscapularis','teres','rhomboid','coracobrachialis','anconeus','brachioradialis','orbicularis','buccinator','zygomaticus','digastric','mylohyoid','geniohyoid','stylohyoid','sternohyoid','omohyoid','thyrohyoid','sternothyroid','longus','multifid','rotator','spinalis','longissimus','iliocostalis','intertransvers','interspinal','tensor','pterygoid','constrictor','semispinalis']
RULES=[
 ('integumentary', kw('skin','hair','eyebrow','nail')),
 ('cardiovascular', OR(anyA('cardiovascular system','heart'), pre('arter','vein','venous','aort','vena cava','heart','atri','coronary','pulmonary trunk','palmar arch','plantar arch','papillary muscle','chorda','valve','cusp'))),
 ('endocrine', kw('adrenal gland','suprarenal gland','thyroid gland','parathyroid gland','pituitary gland','hypophysis','pineal body')),
 ('nervous', OR(anyA('nervous system'), pre('nerve','brain','cerebr','spinal cord','ganglion','thalam','hippocamp','cerebell','pons','medulla oblongata','midbrain','gyrus','putamen','amygdala','corpus callosum','fornix','optic chiasm','optic tract','geniculate','commissure','collicul','mammillary','stria','lamina terminalis','globus pallidus','telencephal','interpeduncular','interventricular foramen','caudate nucleus','insula','claustrum','tegmentum','tectum','peduncle','habenula','tuber cinereum','tentorium','wall of ventricle','lateral ventricle','third ventricle','fourth ventricle','central canal','internal capsule','white matter','occipital lobe','superior parietal lobule'))),
 ('sensory', OR(kw('eyeball','eyelid','lens','cornea','retina','iris','sclera','choroid','vitreous body','corona ciliaris','lacrimal gland','lacrimal sac','lacrimal lake','lacrimal canaliculus','nasolacrimal duct','external ear','auricle','cochlea','tympanic membrane','tarsal plate','conjunctiva','check ligament'), pre('anterior chamber','optic part of','suspensory ligament of'))),
 ('respiratory', OR(anyA('respiratory system'), pre('lung','bronch','trache','laryn','epiglott','thyroid cartilage','cricoid','arytenoid','aryepiglott','crico-arytenoid','thyro-arytenoid','vocal','conus elasticus','pleura','nasal concha','nasal cartilage','septal nasal','lateral nasal','major alar','hyo-epiglottic','thyro-epiglottic','corniculate','cuneiform cartilage'))),
 ('digestive', OR(pre('liver','hepat','pancrea','gallbladder','stomach','esophag','intestin','colon','cecum','rectum','duoden','jejun','ileum','ileocecal','appendix','mesoappendix','tongue','gingiva','salivary','parotid','submandibular gland','sublingual gland','anal canal','bile','biliary','cystic duct','mesocolon','mesentery','taenia','lip'), kw('lip'))),
 ('urinary', kw('kidney','ureter','urinary bladder','urethra','renal pelvis')),
 ('reproductive', pre('prostate','testis','penis','uterus','ovary','vagina','seminal','deferent','ductus deferens','epididym','scrotum','clitoris','uterine tube','glans','corpus cavernosum','corpus spongiosum')),
 ('lymphatic', pre('spleen','thymus','lymph','tonsil')),
 ('muscular', OR(anyA('muscle organ','musculature'), pre(*MUSCLE_KW))),
 ('skeletal', OR(anyA('bone organ','cartilage organ','skeletal system','skeleton (in vivo)'), kw('bone','vertebra','rib','sternum','body of sternum','manubrium','xiphoid process','skull','mandible','maxilla','clavicle','scapula','humerus','radius','ulna','femur','tibia','fibula','patella','sacrum','coccyx','phalanx','talus','calcaneus','tooth','cartilage','costal cartilage','intervertebral disk','meniscus','ligament','atlas','axis','ethmoid','vomer','sphenoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate','scaphoid','interosseous membrane','retinaculum'))),
]
def classify(c):
    n=names.get(c,'').lower(); A={names[a] for a in anc(c)}
    # muscles named after bones (e.g. tibialis anterior) must win before skeletal; bones before muscular when name has 'bone'
    if re.search(r'\bbone\b',n): return 'skeletal'
    if re.search(r'ligament|membrane|retinaculum',n) and not re.search(r'suspensory ligament of|check ligament',n):
        return 'respiratory' if re.search(r'thyrohyoid|cricothyroid|epiglottic|vocal|conus',n) else 'skeletal'
    for s,f in RULES:
        if f(n,A): return s
    return None
