// Evaluation Wizard Component
// Main wizard for conducting puppy evaluations

import { useState } from 'react';
import {
  EvaluationTestType,
  VolhardTestResult,
  VolhardTestName,
  VolhardScore,
  APETExerciseResult,
  APETExerciseName,
  APETScore,
  APETTraitName,
  FlinksTestResult,
  FlinksTestCategory,
  FlinksRating,
  VOLHARD_TESTS,
  VOLHARD_SCORE_DESCRIPTIONS,
  APET_EXERCISES,
  FLINKS_TESTS,
  FLINKS_DESCRIPTORS,
  FLINKS_RATING_SCORES,
} from '@breeder/types';
import { useEvaluationStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { VolhardScoreSelector, FlinksRatingSelector } from './shared/ScoreSelector';
import { ScoreSlider } from './shared/ScoreSlider';
import {
  buildVolhardEvaluation,
  buildAPETEvaluation,
  buildFlinksEvaluation,
} from '@/lib/evaluationCalculations';

interface EvaluationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litterId: string;
  puppyId: string;
  puppyName: string;
  puppyAgeWeeks: number;
  testType: EvaluationTestType;
  onComplete: () => void;
}

export function EvaluationWizard({
  open,
  onOpenChange,
  litterId,
  puppyId,
  puppyName,
  puppyAgeWeeks,
  testType,
  onComplete,
}: EvaluationWizardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { addEvaluation, loading } = useEvaluationStore();

  // Common state
  const [evaluatorName, setEvaluatorName] = useState(currentUser?.displayName || '');
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Volhard state
  const [volhardResults, setVolhardResults] = useState<Partial<Record<VolhardTestName, VolhardTestResult>>>({});

  // APET state
  const [apetResults, setApetResults] = useState<Partial<Record<APETExerciseName, APETExerciseResult>>>({});

  // Flinks state
  const [flinksResults, setFlinksResults] = useState<Partial<Record<FlinksTestCategory, FlinksTestResult>>>({});

  // Get steps based on test type
  const getSteps = () => {
    switch (testType) {
      case 'volhard':
        return Object.keys(VOLHARD_TESTS) as VolhardTestName[];
      case 'apet':
        // Simplified: Use key exercises instead of all 23
        return [
          'novel_environment',
          'social_attraction',
          'following',
          'restraint',
          'tug_game',
          'retrieve_test',
          'auditory_startle',
          'visual_startle',
          'novel_object',
          'problem_solving_box',
        ] as APETExerciseName[];
      case 'flinks':
        return Object.keys(FLINKS_TESTS) as FlinksTestCategory[];
      default:
        return [];
    }
  };

  const steps = getSteps();
  const totalSteps = steps.length + 1; // +1 for summary
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastTestStep = currentStep === steps.length - 1;
  const isSummaryStep = currentStep === steps.length;

  // Handle Volhard score change
  const handleVolhardScore = (testName: VolhardTestName, score: VolhardScore) => {
    setVolhardResults(prev => ({
      ...prev,
      [testName]: {
        testName,
        score,
        behaviorObserved: VOLHARD_SCORE_DESCRIPTIONS[testName][score],
      },
    }));
  };

  // Handle APET trait score change
  const handleApetScore = (exerciseName: APETExerciseName, trait: APETTraitName, score: APETScore) => {
    setApetResults(prev => {
      const existing = prev[exerciseName] || {
        exerciseName,
        traitsEvaluated: APET_EXERCISES[exerciseName].traitsEvaluated,
        scores: {},
      };
      return {
        ...prev,
        [exerciseName]: {
          ...existing,
          scores: {
            ...existing.scores,
            [trait]: score,
          },
        },
      };
    });
  };

  // Handle Flinks rating change
  const handleFlinksRating = (category: FlinksTestCategory, rating: FlinksRating) => {
    setFlinksResults(prev => ({
      ...prev,
      [category]: {
        category,
        rating,
        behaviorDescriptor: FLINKS_DESCRIPTORS[category][rating],
        score: FLINKS_RATING_SCORES[rating],
      },
    }));
  };

  // Check if current step is complete
  const isCurrentStepComplete = () => {
    if (isSummaryStep) return evaluatorName.trim().length > 0;

    const stepKey = steps[currentStep];

    switch (testType) {
      case 'volhard':
        return !!volhardResults[stepKey as VolhardTestName]?.score;
      case 'apet':
        const exercise = APET_EXERCISES[stepKey as APETExerciseName];
        const exerciseResult = apetResults[stepKey as APETExerciseName];
        if (!exerciseResult) return false;
        // At least one trait must be scored
        return Object.keys(exerciseResult.scores || {}).length > 0;
      case 'flinks':
        return !!flinksResults[stepKey as FlinksTestCategory]?.rating;
      default:
        return false;
    }
  };

  // Navigate steps
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit evaluation
  const handleSubmit = async () => {
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const baseData = {
        puppyId,
        litterId,
        userId: currentUser.uid,
        evaluatorName,
        evaluationDate: new Date().toISOString(),
        puppyAgeWeeks,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };

      let evaluation;

      switch (testType) {
        case 'volhard':
          const volhardResultsArray = Object.values(volhardResults).filter(Boolean) as VolhardTestResult[];
          evaluation = buildVolhardEvaluation(
            { ...baseData, testType: 'volhard' },
            volhardResultsArray
          );
          break;

        case 'apet':
          const apetResultsArray = Object.values(apetResults).filter(Boolean) as APETExerciseResult[];
          evaluation = buildAPETEvaluation(
            { ...baseData, testType: 'apet' },
            apetResultsArray
          );
          break;

        case 'flinks':
          const flinksResultsArray = Object.values(flinksResults).filter(Boolean) as FlinksTestResult[];
          evaluation = buildFlinksEvaluation(
            { ...baseData, testType: 'flinks' },
            flinksResultsArray
          );
          break;
      }

      if (evaluation) {
        await addEvaluation(litterId, puppyId, evaluation);
        toast({ title: 'Evaluation saved successfully!' });
        onComplete();
      }
    } catch (error) {
      toast({
        title: 'Failed to save evaluation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    if (isSummaryStep) {
      return renderSummaryStep();
    }

    const stepKey = steps[currentStep];

    switch (testType) {
      case 'volhard':
        return renderVolhardStep(stepKey as VolhardTestName);
      case 'apet':
        return renderApetStep(stepKey as APETExerciseName);
      case 'flinks':
        return renderFlinksStep(stepKey as FlinksTestCategory);
      default:
        return null;
    }
  };

  // Render Volhard test step
  const renderVolhardStep = (testName: VolhardTestName) => {
    const test = VOLHARD_TESTS[testName];
    const currentResult = volhardResults[testName];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{test.name}</h3>
          <p className="text-muted-foreground mt-1">{test.description}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Procedure</h4>
          <p className="text-sm text-blue-800">{test.procedure}</p>
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Select Score</Label>
          <VolhardScoreSelector
            value={currentResult?.score}
            onChange={(score) => handleVolhardScore(testName, score)}
            descriptions={VOLHARD_SCORE_DESCRIPTIONS[testName]}
          />
        </div>
      </div>
    );
  };

  // Render APET exercise step
  const renderApetStep = (exerciseName: APETExerciseName) => {
    const exercise = APET_EXERCISES[exerciseName];
    const currentResult = apetResults[exerciseName];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{exercise.name}</h3>
          <p className="text-muted-foreground mt-1">{exercise.description}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Procedure</h4>
          <p className="text-sm text-blue-800">{exercise.procedure}</p>
        </div>

        <div className="space-y-6">
          <Label className="text-base font-medium">Rate Traits (1-10)</Label>
          {exercise.traitsEvaluated.slice(0, 4).map((trait) => (
            <ScoreSlider
              key={trait}
              value={currentResult?.scores?.[trait]}
              onChange={(score) => handleApetScore(exerciseName, trait, score)}
              label={trait.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render Flinks test step
  const renderFlinksStep = (category: FlinksTestCategory) => {
    const test = FLINKS_TESTS[category];
    const currentResult = flinksResults[category];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{test.name}</h3>
          <p className="text-muted-foreground mt-1">{test.description}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Procedure</h4>
          <p className="text-sm text-blue-800">{test.procedure}</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Why This Matters</h4>
          <p className="text-sm text-amber-800">{test.importance}</p>
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Select Rating</Label>
          <FlinksRatingSelector
            value={currentResult?.rating}
            onChange={(rating) => handleFlinksRating(category, rating)}
            descriptions={FLINKS_DESCRIPTORS[category]}
          />
        </div>
      </div>
    );
  };

  // Render summary step
  const renderSummaryStep = () => {
    const completedCount = steps.filter((step, idx) => {
      switch (testType) {
        case 'volhard':
          return !!volhardResults[step as VolhardTestName]?.score;
        case 'apet':
          const result = apetResults[step as APETExerciseName];
          return result && Object.keys(result.scores || {}).length > 0;
        case 'flinks':
          return !!flinksResults[step as FlinksTestCategory]?.rating;
        default:
          return false;
      }
    }).length;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">Review & Complete</h3>
          <p className="text-muted-foreground mt-1">
            {completedCount} of {steps.length} tests completed
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="evaluator">Evaluator Name *</Label>
            <Input
              id="evaluator"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations about the puppy..."
              rows={4}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {testType === 'volhard' ? 'Volhard PAT' : testType === 'apet' ? 'Avidog APET' : 'Flinks Test'}
            {' '}- {puppyName}
          </DialogTitle>
          <DialogDescription>
            {isSummaryStep
              ? 'Review your evaluation and add any notes'
              : `Step ${currentStep + 1} of ${steps.length}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <Progress value={progress} className="mb-4" />

        {/* Step content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {isSummaryStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!isCurrentStepComplete() || submitting}
            >
              {submitting ? 'Saving...' : 'Save Evaluation'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isCurrentStepComplete()}
            >
              {isLastTestStep ? 'Review' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
