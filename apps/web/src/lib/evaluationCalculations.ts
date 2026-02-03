// Evaluation Calculation Utilities
// Logic for interpreting and summarizing puppy evaluations

import {
  VolhardEvaluation,
  VolhardTestResult,
  VolhardScore,
  VolhardInterpretation,
  VOLHARD_INTERPRETATIONS,
  APETEvaluation,
  APETExerciseResult,
  APETTraitProfile,
  APETTraitName,
  APETScore,
  APETScoreCategory,
  APET_TRAITS,
  APET_SCORE_CATEGORIES,
  FlinksEvaluation,
  FlinksTestResult,
  FlinksRating,
  FlinksTestCategory,
  WorkingDogPotential,
  WorkingDiscipline,
  FLINKS_RATING_SCORES,
  FLINKS_POTENTIAL_THRESHOLDS,
  FLINKS_DISCIPLINE_REQUIREMENTS,
  PuppyEvaluation,
  isVolhardEvaluation,
  isAPETEvaluation,
  isFlinksEvaluation,
} from '@breeder/types';

// =============================================================================
// Volhard PAT Calculations
// =============================================================================

/**
 * Calculate score distribution for Volhard test results
 */
export function calculateVolhardScoreDistribution(
  results: VolhardTestResult[]
): Record<VolhardScore, number> {
  const distribution: Record<VolhardScore, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const result of results) {
    distribution[result.score]++;
  }

  return distribution;
}

/**
 * Calculate average score for Volhard test results
 */
export function calculateVolhardAverageScore(results: VolhardTestResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / results.length) * 10) / 10;
}

/**
 * Determine Volhard interpretation based on score distribution
 */
export function interpretVolhardScores(results: VolhardTestResult[]): VolhardInterpretation {
  const distribution = calculateVolhardScoreDistribution(results);

  // Find the most common score
  let maxCount = 0;
  let dominantScore: VolhardScore = 4;

  for (const score of [1, 2, 3, 4, 5, 6] as VolhardScore[]) {
    if (distribution[score] > maxCount) {
      maxCount = distribution[score];
      dominantScore = score;
    }
  }

  // Map dominant score to interpretation
  const interpretationMap: Record<VolhardScore, VolhardInterpretation> = {
    1: 'dominant_aggressive',
    2: 'high_drive_needs_training',
    3: 'high_energy_good',
    4: 'ideal_pet',
    5: 'shy_fearful',
    6: 'independent',
  };

  return interpretationMap[dominantScore];
}

/**
 * Get color for Volhard score visualization
 */
export function getVolhardScoreColor(score: VolhardScore): string {
  const colors: Record<VolhardScore, string> = {
    1: 'text-red-600',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500',
    5: 'text-blue-500',
    6: 'text-purple-500',
  };
  return colors[score];
}

/**
 * Get background color for Volhard interpretation badge
 */
export function getVolhardInterpretationColor(interpretation: VolhardInterpretation): string {
  const colors: Record<VolhardInterpretation, string> = {
    dominant_aggressive: 'bg-red-100 text-red-800',
    high_drive_needs_training: 'bg-orange-100 text-orange-800',
    high_energy_good: 'bg-yellow-100 text-yellow-800',
    ideal_pet: 'bg-green-100 text-green-800',
    shy_fearful: 'bg-blue-100 text-blue-800',
    independent: 'bg-purple-100 text-purple-800',
  };
  return colors[interpretation];
}

/**
 * Build complete Volhard evaluation from test results
 */
export function buildVolhardEvaluation(
  base: Omit<VolhardEvaluation, 'results' | 'interpretation' | 'averageScore' | 'scoreDistribution'>,
  results: VolhardTestResult[]
): VolhardEvaluation {
  return {
    ...base,
    testType: 'volhard',
    results,
    interpretation: interpretVolhardScores(results),
    averageScore: calculateVolhardAverageScore(results),
    scoreDistribution: calculateVolhardScoreDistribution(results),
  };
}

// =============================================================================
// Avidog APET Calculations
// =============================================================================

/**
 * Determine score category for an APET score
 */
export function getAPETScoreCategory(score: APETScore): APETScoreCategory {
  for (const [category, range] of Object.entries(APET_SCORE_CATEGORIES)) {
    if (score >= range.min && score <= range.max) {
      return category as APETScoreCategory;
    }
  }
  return 'average';
}

/**
 * Aggregate trait scores from exercise results
 * When a trait is evaluated multiple times, average the scores
 */
export function aggregateAPETTraitScores(
  exerciseResults: APETExerciseResult[]
): Record<APETTraitName, { total: number; count: number; average: APETScore }> {
  const traitScores: Record<string, { total: number; count: number }> = {};

  for (const exercise of exerciseResults) {
    for (const [trait, score] of Object.entries(exercise.scores)) {
      if (!traitScores[trait]) {
        traitScores[trait] = { total: 0, count: 0 };
      }
      traitScores[trait].total += score as number;
      traitScores[trait].count++;
    }
  }

  const result: Record<string, { total: number; count: number; average: APETScore }> = {};
  for (const [trait, data] of Object.entries(traitScores)) {
    const avg = Math.round(data.total / data.count);
    result[trait] = {
      ...data,
      average: Math.max(1, Math.min(10, avg)) as APETScore,
    };
  }

  return result as Record<APETTraitName, { total: number; count: number; average: APETScore }>;
}

/**
 * Generate training recommendations based on trait scores
 */
export function generateAPETTrainingRecommendations(
  trait: APETTraitName,
  score: APETScore
): string[] {
  const traitInfo = APET_TRAITS[trait];
  const recommendations: string[] = [];

  // Low scores (1-3)
  if (score <= 3) {
    if (trait === 'self_confidence' || trait === 'environmental_confidence') {
      recommendations.push('Gradual exposure to new environments with positive reinforcement');
      recommendations.push('Confidence-building exercises with high-value rewards');
    } else if (trait === 'sound_sensitivity' || trait === 'sight_sensitivity') {
      recommendations.push('Counter-conditioning to startling stimuli');
      recommendations.push('Gradual desensitization program starting at sub-threshold levels');
    } else if (trait === 'play_drive' || trait === 'retrieve_drive' || trait === 'tug_drive') {
      recommendations.push('Use high-value rewards to build toy interest');
      recommendations.push('Short, exciting play sessions to build drive');
    }
  }

  // High scores (8-10)
  if (score >= 8) {
    if (trait === 'energy_level') {
      recommendations.push('Provide ample physical and mental exercise daily');
      recommendations.push('Consider dog sports or working activities');
    } else if (trait === 'prey_drive') {
      recommendations.push('Strong recall training essential before off-leash');
      recommendations.push('Channel prey drive into appropriate outlets like fetch or lure coursing');
    } else if (trait === 'independence') {
      recommendations.push('Build engagement through play and high-value rewards');
      recommendations.push('Practice check-ins and attention exercises');
    } else if (trait === 'resource_guarding') {
      recommendations.push('Implement trading games and resource management');
      recommendations.push('Consult professional trainer for prevention protocols');
    }
  }

  // If no specific recommendations, add general ones
  if (recommendations.length === 0) {
    if (traitInfo.isStable) {
      recommendations.push(`This is a stable trait - focus on management rather than change`);
    } else {
      recommendations.push(`This trait can be influenced through early socialization and training`);
    }
  }

  return recommendations;
}

/**
 * Generate home matching notes based on trait score
 */
export function generateAPETHomeMatchNotes(trait: APETTraitName, score: APETScore): string {
  const category = getAPETScoreCategory(score);
  const traitInfo = APET_TRAITS[trait];

  if (category === 'low' || category === 'below_average') {
    return traitInfo.lowDescription;
  } else if (category === 'high' || category === 'above_average') {
    return traitInfo.highDescription;
  }
  return `Average ${traitInfo.name.toLowerCase()} - adaptable to most homes`;
}

/**
 * Generate trait profile from exercise results
 */
export function generateAPETTraitProfile(exerciseResults: APETExerciseResult[]): APETTraitProfile[] {
  const aggregated = aggregateAPETTraitScores(exerciseResults);
  const profiles: APETTraitProfile[] = [];

  for (const [trait, data] of Object.entries(aggregated)) {
    const traitName = trait as APETTraitName;
    const traitInfo = APET_TRAITS[traitName];

    profiles.push({
      trait: traitName,
      score: data.average,
      category: getAPETScoreCategory(data.average),
      isStableTrait: traitInfo?.isStable ?? false,
      trainingRecommendations: generateAPETTrainingRecommendations(traitName, data.average),
      homeMatchNotes: generateAPETHomeMatchNotes(traitName, data.average),
    });
  }

  // Sort by trait name for consistent display
  return profiles.sort((a, b) => a.trait.localeCompare(b.trait));
}

/**
 * Generate overall summary for APET evaluation
 */
export function generateAPETSummary(traitProfile: APETTraitProfile[]): string {
  const strengths = traitProfile.filter(t => t.category === 'high' || t.category === 'above_average');
  const challenges = traitProfile.filter(t => t.category === 'low' || t.category === 'below_average');

  let summary = '';

  if (strengths.length > 0) {
    summary += `Strengths: ${strengths.map(t => APET_TRAITS[t.trait].name).join(', ')}. `;
  }

  if (challenges.length > 0) {
    summary += `Areas needing attention: ${challenges.map(t => APET_TRAITS[t.trait].name).join(', ')}.`;
  }

  if (summary === '') {
    summary = 'Well-balanced puppy with average scores across most traits.';
  }

  return summary;
}

/**
 * Generate ideal home description based on trait profile
 */
export function generateIdealHomeDescription(traitProfile: APETTraitProfile[]): string {
  const traitMap = new Map(traitProfile.map(t => [t.trait, t]));
  const descriptions: string[] = [];

  // Energy level
  const energy = traitMap.get('energy_level');
  if (energy) {
    if (energy.category === 'high') {
      descriptions.push('Active household with outdoor access and commitment to daily exercise');
    } else if (energy.category === 'low') {
      descriptions.push('Calmer household, apartment-friendly');
    }
  }

  // Handler sensitivity
  const softness = traitMap.get('handler_softness');
  if (softness && softness.category === 'high') {
    descriptions.push('Gentle, patient handler who uses positive methods');
  }

  // Independence
  const independence = traitMap.get('independence');
  if (independence) {
    if (independence.category === 'high') {
      descriptions.push('Owner comfortable with an independent dog');
    } else if (independence.category === 'low') {
      descriptions.push('Owner available frequently, not away for long periods');
    }
  }

  // Social needs
  const humanFocus = traitMap.get('social_attraction_human');
  if (humanFocus && humanFocus.category === 'high') {
    descriptions.push('Family who wants a close companion');
  }

  if (descriptions.length === 0) {
    return 'Adaptable to most family situations with proper training and socialization.';
  }

  return descriptions.join('. ') + '.';
}

/**
 * Build complete APET evaluation from exercise results
 */
export function buildAPETEvaluation(
  base: Omit<APETEvaluation, 'exerciseResults' | 'traitProfile' | 'overallSummary' | 'idealHomeDescription' | 'trainingPriorityAreas'>,
  exerciseResults: APETExerciseResult[]
): APETEvaluation {
  const traitProfile = generateAPETTraitProfile(exerciseResults);

  // Identify training priority areas (low scores on tweakable traits)
  const trainingPriorityAreas = traitProfile
    .filter(t => !t.isStableTrait && (t.category === 'low' || t.category === 'below_average'))
    .map(t => APET_TRAITS[t.trait].name);

  return {
    ...base,
    testType: 'apet',
    exerciseResults,
    traitProfile,
    overallSummary: generateAPETSummary(traitProfile),
    idealHomeDescription: generateIdealHomeDescription(traitProfile),
    trainingPriorityAreas,
  };
}

/**
 * Get color for APET score category
 */
export function getAPETCategoryColor(category: APETScoreCategory): string {
  const colors: Record<APETScoreCategory, string> = {
    low: 'text-red-600',
    below_average: 'text-orange-500',
    average: 'text-gray-600',
    above_average: 'text-blue-500',
    high: 'text-green-500',
  };
  return colors[category];
}

// =============================================================================
// Bernhard Flinks Calculations
// =============================================================================

/**
 * Calculate total score from Flinks test results
 */
export function calculateFlinksTotalScore(results: FlinksTestResult[]): number {
  return results.reduce((sum, r) => sum + r.score, 0);
}

/**
 * Determine overall rating from Flinks results
 */
export function determineOverallFlinksRating(results: FlinksTestResult[]): FlinksRating {
  const avgScore = calculateFlinksTotalScore(results) / results.length;

  if (avgScore >= 4.5) return 'excellent';
  if (avgScore >= 3.5) return 'good';
  if (avgScore >= 2.5) return 'acceptable';
  if (avgScore >= 1.5) return 'poor';
  return 'fail';
}

/**
 * Assess working dog potential based on total score
 */
export function assessWorkingDogPotential(totalScore: number): WorkingDogPotential {
  if (totalScore >= FLINKS_POTENTIAL_THRESHOLDS.high.minScore) return 'high';
  if (totalScore >= FLINKS_POTENTIAL_THRESHOLDS.moderate.minScore) return 'moderate';
  if (totalScore >= FLINKS_POTENTIAL_THRESHOLDS.low.minScore) return 'low';
  return 'not_suitable';
}

/**
 * Determine which working disciplines the puppy is suited for
 */
export function determineRecommendedDisciplines(results: FlinksTestResult[]): WorkingDiscipline[] {
  const resultMap = new Map(results.map(r => [r.category, r]));
  const recommended: WorkingDiscipline[] = [];

  for (const [discipline, requirements] of Object.entries(FLINKS_DISCIPLINE_REQUIREMENTS)) {
    let meetsRequirements = true;

    for (const [category, minRating] of Object.entries(requirements.minRatings)) {
      const result = resultMap.get(category as FlinksTestCategory);
      if (!result) {
        meetsRequirements = false;
        break;
      }

      const resultScore = FLINKS_RATING_SCORES[result.rating];
      const minScore = FLINKS_RATING_SCORES[minRating as FlinksRating];

      if (resultScore < minScore) {
        meetsRequirements = false;
        break;
      }
    }

    if (meetsRequirements) {
      recommended.push(discipline as WorkingDiscipline);
    }
  }

  return recommended;
}

/**
 * Identify strength and improvement areas from Flinks results
 */
export function identifyFlinksAreas(results: FlinksTestResult[]): {
  strengths: FlinksTestCategory[];
  improvements: FlinksTestCategory[];
} {
  const strengths: FlinksTestCategory[] = [];
  const improvements: FlinksTestCategory[] = [];

  for (const result of results) {
    if (result.rating === 'excellent' || result.rating === 'good') {
      strengths.push(result.category);
    } else if (result.rating === 'poor' || result.rating === 'fail') {
      improvements.push(result.category);
    }
  }

  return { strengths, improvements };
}

/**
 * Generate summary for Flinks evaluation
 */
export function generateFlinksSummary(
  results: FlinksTestResult[],
  potential: WorkingDogPotential,
  disciplines: WorkingDiscipline[]
): string {
  const { strengths, improvements } = identifyFlinksAreas(results);

  let summary = `Working Dog Potential: ${potential.replace('_', ' ').toUpperCase()}. `;

  if (disciplines.length > 0) {
    summary += `Suited for: ${disciplines.map(d => FLINKS_DISCIPLINE_REQUIREMENTS[d].name).join(', ')}. `;
  } else {
    summary += 'May not be suited for professional working roles. ';
  }

  if (strengths.length > 0) {
    summary += `Strengths in ${strengths.join(', ')}. `;
  }

  if (improvements.length > 0) {
    summary += `Needs development in ${improvements.join(', ')}.`;
  }

  return summary;
}

/**
 * Build complete Flinks evaluation from test results
 */
export function buildFlinksEvaluation(
  base: Omit<FlinksEvaluation, 'results' | 'overallRating' | 'totalScore' | 'workingDogPotential' | 'recommendedDisciplines' | 'strengthAreas' | 'improvementAreas' | 'summary'>,
  results: FlinksTestResult[]
): FlinksEvaluation {
  const totalScore = calculateFlinksTotalScore(results);
  const potential = assessWorkingDogPotential(totalScore);
  const disciplines = determineRecommendedDisciplines(results);
  const { strengths, improvements } = identifyFlinksAreas(results);

  return {
    ...base,
    testType: 'flinks',
    results,
    overallRating: determineOverallFlinksRating(results),
    totalScore,
    workingDogPotential: potential,
    recommendedDisciplines: disciplines,
    strengthAreas: strengths,
    improvementAreas: improvements,
    summary: generateFlinksSummary(results, potential, disciplines),
  };
}

/**
 * Get color for Flinks rating
 */
export function getFlinksRatingColor(rating: FlinksRating): string {
  const colors: Record<FlinksRating, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-500',
    acceptable: 'text-yellow-500',
    poor: 'text-orange-500',
    fail: 'text-red-600',
  };
  return colors[rating];
}

/**
 * Get badge color for working dog potential
 */
export function getWorkingPotentialColor(potential: WorkingDogPotential): string {
  const colors: Record<WorkingDogPotential, string> = {
    high: 'bg-green-100 text-green-800',
    moderate: 'bg-blue-100 text-blue-800',
    low: 'bg-yellow-100 text-yellow-800',
    not_suitable: 'bg-gray-100 text-gray-800',
  };
  return colors[potential];
}

// =============================================================================
// Litter Comparison Utilities
// =============================================================================

export interface LitterComparisonData {
  puppyId: string;
  puppyName: string;
  volhard?: {
    interpretation: VolhardInterpretation;
    averageScore: number;
  };
  apet?: {
    traitScores: Partial<Record<APETTraitName, APETScore>>;
    summary: string;
  };
  flinks?: {
    potential: WorkingDogPotential;
    totalScore: number;
    disciplines: WorkingDiscipline[];
  };
}

/**
 * Build comparison data for a litter from evaluations
 */
export function buildLitterComparisonData(
  evaluations: PuppyEvaluation[],
  puppyNames: Record<string, string>
): LitterComparisonData[] {
  const puppyData: Record<string, LitterComparisonData> = {};

  for (const eval_ of evaluations) {
    if (!puppyData[eval_.puppyId]) {
      puppyData[eval_.puppyId] = {
        puppyId: eval_.puppyId,
        puppyName: puppyNames[eval_.puppyId] || 'Unknown',
      };
    }

    if (isVolhardEvaluation(eval_)) {
      puppyData[eval_.puppyId].volhard = {
        interpretation: eval_.interpretation,
        averageScore: eval_.averageScore,
      };
    } else if (isAPETEvaluation(eval_)) {
      const traitScores: Partial<Record<APETTraitName, APETScore>> = {};
      for (const profile of eval_.traitProfile) {
        traitScores[profile.trait] = profile.score;
      }
      puppyData[eval_.puppyId].apet = {
        traitScores,
        summary: eval_.overallSummary,
      };
    } else if (isFlinksEvaluation(eval_)) {
      puppyData[eval_.puppyId].flinks = {
        potential: eval_.workingDogPotential,
        totalScore: eval_.totalScore,
        disciplines: eval_.recommendedDisciplines,
      };
    }
  }

  return Object.values(puppyData);
}

/**
 * Rank puppies by Volhard score (lower average = more dominant, higher = more submissive)
 */
export function rankPuppiesByVolhard(comparisons: LitterComparisonData[]): LitterComparisonData[] {
  return [...comparisons]
    .filter(c => c.volhard)
    .sort((a, b) => (a.volhard?.averageScore ?? 0) - (b.volhard?.averageScore ?? 0));
}

/**
 * Rank puppies by Flinks working potential
 */
export function rankPuppiesByFlinks(comparisons: LitterComparisonData[]): LitterComparisonData[] {
  const potentialOrder: Record<WorkingDogPotential, number> = {
    high: 1,
    moderate: 2,
    low: 3,
    not_suitable: 4,
  };

  return [...comparisons]
    .filter(c => c.flinks)
    .sort((a, b) => {
      const orderA = potentialOrder[a.flinks?.potential ?? 'not_suitable'];
      const orderB = potentialOrder[b.flinks?.potential ?? 'not_suitable'];
      return orderA - orderB;
    });
}
