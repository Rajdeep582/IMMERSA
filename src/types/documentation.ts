import { SystemId } from './anatomy';

export type DiagramType =
  | 'conduction'
  | 'nephron'
  | 'alveoli'
  | 'circulation'
  | 'neural'
  | 'sarcomere'
  | 'bone'
  | 'digestive'
  | 'endocrine'
  | 'ovarian'
  | 'integumentary'
  | 'lymphatic'
  | 'sensory'
  | 'generic';

export interface PathologyItem {
  name: string;
  prevalence?: string;
  pathophysiology: string;
  severity: 'mild' | 'moderate' | 'critical';
  typicalCourse?: string;
}

export interface RelatedStructureLink {
  id: string;
  name: string;
  relationship: string;
  system?: SystemId;
}

export interface MedicalReference {
  title: string;
  source: string;
  yearOrEdition?: string;
  doiOrUrl?: string;
  authoritativeBody?: string;
}

export interface VisualToolConfig {
  diagramType: DiagramType;
  diagramTitle: string;
  diagramSubtitle?: string;
  pathologyComparison: {
    diseaseName: string;
    normalState: {
      title: string;
      description: string;
      keyMarkers: string[];
    };
    pathologicalState: {
      title: string;
      description: string;
      keyMarkers: string[];
    };
  };
  processFlow: {
    processName: string;
    steps: {
      stage: string;
      title: string;
      description: string;
      factorOrRate?: string;
    }[];
  };
  clinicalSummaryMatrix: {
    category: string;
    items: {
      label: string;
      value: string;
    }[];
  }[];
}

export interface MedicalDocumentation {
  id: string;
  type: 'part' | 'system';
  canonicalName: string;
  latinName?: string;
  commonName?: string;
  system: SystemId;
  region: string;
  conceptId?: string; // FMA concept identifier
  biologicalSexSpecificity?: 'male' | 'female' | 'both';

  // 1. Overview
  overview: {
    summary: string;
    keyTakeaways: string[];
    physiologicalSignificance: string;
  };

  // 2. Anatomy and Location
  anatomyAndLocation: {
    location: string;
    shapeAndDimensions: string;
    surfaceProjections?: string;
    landmarks: string[];
    anatomicalRelations: {
      orientation: string;
      description: string;
    }[];
  };

  // 3. Structure and Composition
  structureAndComposition: {
    tissueTypes: string[];
    histologicalFeatures: string[];
    cellularMatrix: string;
    substructures: string[];
  };

  // 4. Functions
  functions: {
    primary: string[];
    secondary: string[];
    biomechanicalRole?: string;
  };

  // 5. Physiological Mechanisms
  physiologicalMechanisms: {
    mechanismTitle: string;
    stepByStepFlow: string[];
    regulatoryFeedback: string;
    cellularPathways: string;
  };

  // 6. Blood Supply, Lymphatic Drainage & Nerve Supply
  neurovascular: {
    arterialSupply: string;
    venousDrainage: string;
    lymphaticDrainage: string;
    innervation: {
      motor?: string;
      sensory?: string;
      autonomic?: string;
      general?: string;
    };
  };

  // 7. Related Organs and Systems
  relatedStructures: RelatedStructureLink[];

  // 8. Common Diseases and Disorders
  pathologies: PathologyItem[];

  // 9. Signs and Symptoms
  signsAndSymptoms: {
    hallmarkSigns: string[];
    clinicalPresentation: string;
    emergencyRedFlags: string[];
  };

  // 10. Causes and Risk Factors
  causesAndRiskFactors: {
    primaryCauses: string[];
    geneticFactors: string[];
    modifiableRisks: string[];
    environmentalTriggers: string[];
  };

  // 11. Diagnosis and Medical Investigations
  diagnosisAndInvestigations: {
    physicalExam: string[];
    laboratoryWorkup: string[];
    imagingStudies: string[];
    specialTests: string[];
  };

  // 12. Treatment and Management
  treatmentAndManagement: {
    pharmacotherapy: string[];
    surgicalInterventions: string[];
    conservativeCare: string[];
    rehabilitation: string[];
  };

  // 13. Prevention and Health Maintenance
  preventionAndHealth: {
    lifestyleInterventions: string[];
    screeningProtocols: string[];
    dietaryOrErgonomicRecommendations: string[];
  };

  // 14. Interesting Medical Facts
  interestingFacts: string[];

  // 15. References and Further Reading
  references: MedicalReference[];

  // Visual Learning Tools Configuration
  visualToolConfig: VisualToolConfig;
}

