/**
 * Breeding Decision Support Utilities
 *
 * This module provides calculations and predictions for breeding decisions:
 * - Coefficient of Inbreeding (COI) calculation
 * - Health test requirements by breed and registry
 * - Predicted litter characteristics based on parent genetics
 */

import { Dog, DnaProfile } from '@/types/dog';

/**
 * Calculate Coefficient of Inbreeding (COI) based on pedigree
 * This is a simplified calculation - for accurate COI, use specialized software
 * or genetic testing services.
 *
 * @param sire - The male dog
 * @param dam - The female dog
 * @param generations - Number of generations to analyze (default 5)
 * @returns COI percentage (0-100)
 */
export function calculateCOI(sire: Dog, dam: Dog, generations: number = 5): number {
  // This is a simplified version. Full COI calculation requires:
  // 1. Complete pedigree data for both parents
  // 2. Identification of common ancestors
  // 3. Path coefficient calculation for each common ancestor
  // 4. Summation of all inbreeding coefficients

  // For now, we'll do a basic check for common ancestors in immediate pedigree
  const commonAncestors = findCommonAncestors(sire, dam);

  if (commonAncestors.length === 0) {
    return 0;
  }

  // Simplified COI estimation based on relationship
  if (commonAncestors.includes('parent')) {
    return 25; // Parent-offspring breeding
  } else if (commonAncestors.includes('grandparent')) {
    return 12.5; // Grandparent-grandchild
  } else if (commonAncestors.includes('sibling')) {
    return 25; // Full siblings
  } else if (commonAncestors.includes('half-sibling')) {
    return 12.5; // Half siblings
  }

  // Estimate based on number of common ancestors
  return Math.min(commonAncestors.length * 3.125, 50); // Cap at 50%
}

/**
 * Find common ancestors between two dogs
 */
function findCommonAncestors(sire: Dog, dam: Dog): string[] {
  const commonAncestors: string[] = [];

  // Check if they share parents (siblings)
  if (sire.sireId && dam.sireId && sire.sireId === dam.sireId) {
    if (sire.damId && dam.damId && sire.damId === dam.damId) {
      commonAncestors.push('sibling'); // Full siblings
    } else {
      commonAncestors.push('half-sibling'); // Half siblings (same sire)
    }
  } else if (sire.damId && dam.damId && sire.damId === dam.damId) {
    commonAncestors.push('half-sibling'); // Half siblings (same dam)
  }

  // Check parent-offspring relationships
  if (sire.id === dam.sireId || sire.id === dam.damId) {
    commonAncestors.push('parent');
  }
  if (dam.id === sire.sireId || dam.id === sire.damId) {
    commonAncestors.push('parent');
  }

  // For more complete analysis, would need to traverse full pedigree

  return commonAncestors;
}

/**
 * Health test requirements by breed and registry
 */
export interface HealthTestRequirement {
  testName: string;
  required: boolean; // Required vs recommended
  registry: string; // Which registry requires it
  description: string;
  minimumAge?: string; // Minimum age for testing
  frequency?: string; // How often to retest
}

/**
 * Get health test requirements for a specific breed
 */
export function getHealthTestRequirements(breed: string, registry?: string): HealthTestRequirement[] {
  const requirements: Record<string, HealthTestRequirement[]> = {
    'Golden Retriever': [
      {
        testName: 'Hip Dysplasia (OFA/PennHIP)',
        required: true,
        registry: 'AKC',
        description: 'Hip evaluation for dysplasia',
        minimumAge: '24 months',
      },
      {
        testName: 'Elbow Dysplasia (OFA)',
        required: true,
        registry: 'AKC',
        description: 'Elbow evaluation for dysplasia',
        minimumAge: '24 months',
      },
      {
        testName: 'Eye Exam (CERF/OFA)',
        required: true,
        registry: 'AKC',
        description: 'Annual eye examination',
        frequency: 'Annually',
      },
      {
        testName: 'Cardiac Exam (OFA)',
        required: true,
        registry: 'AKC',
        description: 'Heart examination',
        minimumAge: '12 months',
      },
      {
        testName: 'PRA1 & PRA2 (DNA)',
        required: true,
        registry: 'AKC',
        description: 'Progressive Retinal Atrophy genetic test',
      },
      {
        testName: 'Ichthyosis (DNA)',
        required: false,
        registry: 'AKC',
        description: 'Skin disorder genetic test',
      },
      {
        testName: 'NCL (DNA)',
        required: false,
        registry: 'AKC',
        description: 'Neuronal Ceroid Lipofuscinosis genetic test',
      },
    ],
    'German Shepherd': [
      {
        testName: 'Hip Dysplasia (OFA/SV)',
        required: true,
        registry: 'AKC',
        description: 'Hip evaluation for dysplasia',
        minimumAge: '24 months',
      },
      {
        testName: 'Elbow Dysplasia (OFA)',
        required: true,
        registry: 'AKC',
        description: 'Elbow evaluation for dysplasia',
        minimumAge: '24 months',
      },
      {
        testName: 'DM (Degenerative Myelopathy)',
        required: true,
        registry: 'AKC',
        description: 'DNA test for degenerative myelopathy',
      },
      {
        testName: 'MDR1',
        required: false,
        registry: 'AKC',
        description: 'Multi-Drug Resistance genetic test',
      },
    ],
    'Labrador Retriever': [
      {
        testName: 'Hip Dysplasia (OFA/PennHIP)',
        required: true,
        registry: 'AKC',
        description: 'Hip evaluation for dysplasia',
        minimumAge: '24 months',
      },
      {
        testName: 'Elbow Dysplasia (OFA)',
        required: true,
        registry: 'AKC',
        description: 'Elbow evaluation for dysplasia',
        minimumAge: '24 months',
      },
      {
        testName: 'Eye Exam (CERF/OFA)',
        required: true,
        registry: 'AKC',
        description: 'Annual eye examination',
        frequency: 'Annually',
      },
      {
        testName: 'PRA (prcd-PRA)',
        required: true,
        registry: 'AKC',
        description: 'Progressive Retinal Atrophy genetic test',
      },
      {
        testName: 'EIC (Exercise Induced Collapse)',
        required: true,
        registry: 'AKC',
        description: 'DNA test for exercise induced collapse',
      },
      {
        testName: 'CNM (Centronuclear Myopathy)',
        required: false,
        registry: 'AKC',
        description: 'Muscle disorder genetic test',
      },
    ],
    // Add more breeds as needed
  };

  const breedRequirements = requirements[breed] || [];

  if (registry) {
    return breedRequirements.filter(req => req.registry === registry);
  }

  return breedRequirements;
}

/**
 * Check if breeding pair meets health test requirements
 */
export function checkHealthTestCompliance(
  sire: Dog,
  dam: Dog,
  breed: string
): {
  compliant: boolean;
  missingTests: string[];
  warnings: string[];
} {
  const requirements = getHealthTestRequirements(breed);
  const requiredTests = requirements.filter(req => req.required);

  const missingTests: string[] = [];
  const warnings: string[] = [];

  // Check sire's health tests
  requiredTests.forEach(test => {
    const sireHasTest = sire.healthTests?.some(t =>
      t.testType.toLowerCase().includes(test.testName.toLowerCase())
    );
    const damHasTest = dam.healthTests?.some(t =>
      t.testType.toLowerCase().includes(test.testName.toLowerCase())
    );

    if (!sireHasTest) {
      missingTests.push(`Sire: ${test.testName}`);
    }
    if (!damHasTest) {
      missingTests.push(`Dam: ${test.testName}`);
    }
  });

  return {
    compliant: missingTests.length === 0,
    missingTests,
    warnings,
  };
}

/**
 * Predict coat color based on parent genetics
 */
export function predictCoatColor(sire: DnaProfile, dam: DnaProfile): {
  possibleColors: string[];
  probabilities: Record<string, number>;
  explanation: string;
} {
  const possibleColors: string[] = [];
  const probabilities: Record<string, number> = {};

  if (!sire.coatColor || !dam.coatColor) {
    return {
      possibleColors: ['Unknown - DNA data not available'],
      probabilities: {},
      explanation: 'DNA profile data required for coat color prediction',
    };
  }

  // E Locus (Extension) - Controls black vs red/yellow
  const eLocus = predictLocus(sire.coatColor.E, dam.coatColor.E);

  // K Locus (Dominant Black)
  const kLocus = predictLocus(sire.coatColor.K, dam.coatColor.K);

  // A Locus (Agouti) - Pattern
  const aLocus = predictLocus(sire.coatColor.A, dam.coatColor.A);

  // Simplified prediction logic
  let explanation = 'Coat color predictions based on parent genetics:\n';

  if (kLocus.includes('KB')) {
    possibleColors.push('Solid Black/Brown');
    probabilities['Solid Black/Brown'] = 75;
    explanation += '- K locus: Dominant black gene present\n';
  }

  if (eLocus.includes('e/e')) {
    possibleColors.push('Yellow/Red');
    probabilities['Yellow/Red'] = 25;
    explanation += '- E locus: Recessive red gene possible\n';
  }

  if (possibleColors.length === 0) {
    possibleColors.push('Variable - Multiple patterns possible');
  }

  return {
    possibleColors,
    probabilities,
    explanation,
  };
}

/**
 * Predict a single genetic locus
 */
function predictLocus(sireAllele?: string, damAllele?: string): string[] {
  if (!sireAllele || !damAllele) return [];

  const sireGenes = sireAllele.split('/');
  const damGenes = damAllele.split('/');

  const combinations: string[] = [];

  sireGenes.forEach(sg => {
    damGenes.forEach(dg => {
      combinations.push(`${sg}/${dg}`);
    });
  });

  return [...new Set(combinations)];
}

/**
 * Predict litter size based on breed and dam's history
 */
export function predictLitterSize(dam: Dog, breed: string): {
  min: number;
  max: number;
  average: number;
  confidence: string;
} {
  // Average litter sizes by breed
  const breedAverages: Record<string, { min: number; max: number; avg: number }> = {
    'Golden Retriever': { min: 6, max: 10, avg: 8 },
    'Labrador Retriever': { min: 6, max: 10, avg: 7 },
    'German Shepherd': { min: 5, max: 9, avg: 7 },
    'French Bulldog': { min: 3, max: 5, avg: 4 },
    'Bulldog': { min: 3, max: 5, avg: 4 },
    'Beagle': { min: 4, max: 7, avg: 6 },
    'Poodle': { min: 5, max: 8, avg: 6 },
    'Rottweiler': { min: 6, max: 12, avg: 8 },
    'Yorkshire Terrier': { min: 2, max: 5, avg: 3 },
    'Boxer': { min: 6, max: 10, avg: 7 },
  };

  const defaults = breedAverages[breed] || { min: 4, max: 8, avg: 6 };

  // If dam has previous litters, use that data for better prediction
  // TODO: Access litter history from dam's records

  return {
    min: defaults.min,
    max: defaults.max,
    average: defaults.avg,
    confidence: 'Based on breed average',
  };
}

/**
 * Generate breeding recommendation score
 */
export function calculateBreedingScore(
  sire: Dog,
  dam: Dog,
  breed: string
): {
  score: number; // 0-100
  factors: {
    name: string;
    score: number;
    weight: number;
    notes: string;
  }[];
  recommendation: 'Excellent' | 'Good' | 'Fair' | 'Not Recommended';
} {
  const factors: {
    name: string;
    score: number;
    weight: number;
    notes: string;
  }[] = [];

  // 1. Genetic Diversity (30% weight)
  const coi = calculateCOI(sire, dam);
  const diversityScore = Math.max(0, 100 - (coi * 2)); // Lower COI = higher score
  factors.push({
    name: 'Genetic Diversity',
    score: diversityScore,
    weight: 0.3,
    notes: `COI: ${coi.toFixed(1)}% - ${coi < 5 ? 'Excellent' : coi < 10 ? 'Good' : coi < 15 ? 'Acceptable' : 'High inbreeding'}`,
  });

  // 2. Health Testing Compliance (30% weight)
  const healthCompliance = checkHealthTestCompliance(sire, dam, breed);
  const healthScore = healthCompliance.compliant ? 100 : Math.max(0, 100 - (healthCompliance.missingTests.length * 20));
  factors.push({
    name: 'Health Test Compliance',
    score: healthScore,
    weight: 0.3,
    notes: healthCompliance.compliant ? 'All required tests completed' : `Missing: ${healthCompliance.missingTests.length} tests`,
  });

  // 3. Age Appropriateness (20% weight)
  let ageScore = 100;
  const damAge = calculateAge(dam.dateOfBirth);
  const sireAge = calculateAge(sire.dateOfBirth);

  if (damAge < 2 || damAge > 8) ageScore -= 30;
  if (sireAge < 2 || sireAge > 10) ageScore -= 20;

  factors.push({
    name: 'Age Appropriateness',
    score: Math.max(0, ageScore),
    weight: 0.2,
    notes: `Dam: ${damAge}yo, Sire: ${sireAge}yo`,
  });

  // 4. Temperament & Conformation (20% weight)
  // This would ideally come from show/trial results, behavioral assessments
  const conformationScore = 75; // Placeholder
  factors.push({
    name: 'Temperament & Quality',
    score: conformationScore,
    weight: 0.2,
    notes: 'Based on available records',
  });

  // Calculate weighted score
  const totalScore = factors.reduce((sum, factor) => {
    return sum + (factor.score * factor.weight);
  }, 0);

  let recommendation: 'Excellent' | 'Good' | 'Fair' | 'Not Recommended';
  if (totalScore >= 85) recommendation = 'Excellent';
  else if (totalScore >= 70) recommendation = 'Good';
  else if (totalScore >= 50) recommendation = 'Fair';
  else recommendation = 'Not Recommended';

  return {
    score: Math.round(totalScore),
    factors,
    recommendation,
  };
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
