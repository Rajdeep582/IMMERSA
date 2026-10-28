# IMMERSA — 3D Human Anatomy & Medical Knowledge Platform

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Anatomy_Standard-FMA_%26_TA2-teal?style=for-the-badge" alt="TA2 FMA" />
</p>

> **IMMERSA** is an interactive, browser-based 3D anatomical atlas and medical knowledge platform designed for medical students, healthcare practitioners, and anatomical research. It features **2,260 segmented structures**, dual biological sex reference models, and comprehensive medical documentation with interactive visual tools.

---

## Key Capabilities

### 1. Dual Biological Sex Reference Models
* **Adult Male & Female Reference Assemblies:** Anatomically accurate models with scientifically proportioned anthropometry (shoulder breadth, carrying angle, pelvic inlet width, waist-to-hip ratio, and soft tissue distributions).
* **Curated Pelvic & Reproductive Viscera:** Procedurally modeled internal pelvic viscera and external genitalia tailored to each biological sex.
* **Strict Anatomical Integrity:** Dynamic sex-filtering ensures structures from opposite reference models never overlap.

### 2. Multi-Layer Presentation & Dissection
* **Surface View:** Intact cutaneous boundary with natural surface contours.
* **Musculoskeletal View:** Over 600 skeletal muscles articulated across the skeletal framework.
* **Organ / Visceral View:** Deep thoracic, abdominal, and pelvic visceral organs with isolated neurovascular conduits.
* **Layer Dissection Slider:** Interactive exploded view allowing continuous physical separation of anatomical layers along anatomical axes.

### 3. Dedicated Medical Documentation Engine
Every single anatomical part and system features a dedicated **"Know More"** medical dossier containing 15 standardized clinical sections:
* **Overview & Significance:** Functional overview and physiological imperatives.
* **Anatomy & Spatial Boundaries:** Exact coordinates, dimensions, landmarks, and spatial boundaries.
* **Microstructure & Histology:** Tissue types, cell types, and extracellular matrix composition.
* **Physiological Mechanisms:** Step-by-step cascades and feedback regulation.
* **Neurovascular Pedicles:** Arterial supply, venous drainage, lymphatic flow, and detailed innervation.
* **Clinical Pathologies:** Pathophysiology, prevalence, and severity ratings (Mild, Moderate, Critical).
* **Signs & Symptoms:** Hallmark indicators, clinical manifestations, and emergency red-flag callouts.
* **Diagnostic Workup:** Physical maneuvers, laboratory biomarkers, and imaging studies (X-ray, CT, MRI, Ultrasound).
* **Evidence-Based Treatments:** First-line pharmacotherapy, surgical interventions, and rehabilitation.
* **Authoritative Citations:** References to *Gray's Anatomy* (42nd ed.), *Terminologia Anatomica* (TA2), and peer-reviewed literature.

### 4. Interactive Visual Learning Tools
Embedded visual learning components within each documentation page:
* **Interactive Physiological Schematics:** Dynamic SVG diagrams (cardiac conduction, nephron countercurrent multiplier, alveolar gas exchange, sarcomere sliding filament, neural synapses, and organ vascular relations) with clickable nodes and metrics.
* **Embedded 3D Inspection Turntable:** Independent 360° WebGL turntable with auto-rotation, wireframe toggle, and bounding dimensions.
* **Normal vs. Pathological State Comparison:** Interactive split-view comparing healthy histology with diseased hallmarks.
* **Process Flow Pipelines:** Step-by-step interactive biochemical and physiological pathways.
* **Clinical Evidence Matrices:** Tabular summaries of diagnostic sensitivities and therapeutic guidelines.

---

## 15 Anatomical Systems

| Category | Systems Covered |
| :--- | :--- |
| **Structural** | Skeletal System · Muscular System · Connective & Cartilage |
| **Circulatory** | Cardiac & Chambers · Arterial Vasculature · Venous Vasculature · Lymphatic & Immune |
| **Neural & Sensory** | Central & Peripheral Nervous System · Sensory Organs (Vision, Auditory, Vestibular) |
| **Visceral** | Respiratory System · Digestive System · Urinary System · Endocrine System · Reproductive System |
| **Superficial** | Integumentary Surface & Cutaneous Layer |

---

## Quickstart

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/Rajdeep582/IMMERSA.git
cd IMMERSA

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build & Validation

```bash
# Run strict anatomical invariant verification (2,260 parts)
npm run validate:anatomy

# Compile TypeScript and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Navigation & Hotkeys

| Key / Gesture | Action |
| :---: | :--- |
| `Left Click + Drag` | 360° Orbit and camera rotation |
| `Right Click + Drag` | Pan camera across plane |
| `Scroll / Pinch` | Smooth zoom in / out |
| `/` | Open global anatomical search modal |
| `1` – `6` | Standard anatomical camera views (Anterior, Posterior, Left, Right, Superior, Isometric) |
| `R` | Reset camera to default orientation |
| `+` / `-` | Incremental zoom adjustments |
| `Esc` | Close documentation or active modal and return to 3D simulation |

---

## Scientific Attribution & Sources

* **Male Atlas Geometry:** [BodyParts3D](https://lifesciencedb.jp/bp3d/) 4.0 by Database Center for Life Science (DBCLS), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
* **Anatomical Nomenclature:** *Terminologia Anatomica* (TA2) by FIPAT / IFAA.
* **Anatomical Knowledge Base:** *Gray's Anatomy: The Anatomical Basis of Clinical Practice* (42nd ed., Elsevier, 2021).
* **Female Geometry & Viscera:** Curated educational procedural models conforming to anthropometric datasets.

> **Medical Disclaimer:** IMMERSA is engineered strictly for educational, instructional, and research purposes. It is not a clinical diagnostic medical device.

---

<p align="center">
  <b>IMMERSA</b> — Built for Next-Generation Medical Education
</p>
