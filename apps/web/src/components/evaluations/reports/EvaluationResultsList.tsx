// Evaluation Results List Component
// Displays list of completed evaluations with ability to view details

import { useState } from 'react';
import { format } from 'date-fns';
import {
  PuppyEvaluation,
  Puppy,
  isVolhardEvaluation,
  isAPETEvaluation,
  isFlinksEvaluation,
  VOLHARD_INTERPRETATIONS,
  FLINKS_POTENTIAL_THRESHOLDS,
} from '@breeder/types';
import { useEvaluationStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardList,
  BarChart3,
  Shield,
  Trash2,
  Eye,
  Clock,
  User,
  Loader2,
} from 'lucide-react';
import {
  getVolhardInterpretationColor,
  getWorkingPotentialColor,
} from '@/lib/evaluationCalculations';

interface EvaluationResultsListProps {
  evaluations: PuppyEvaluation[];
  puppies: Puppy[];
  litterId: string;
  loading: boolean;
}

export function EvaluationResultsList({
  evaluations,
  puppies,
  litterId,
  loading,
}: EvaluationResultsListProps) {
  const { toast } = useToast();
  const { deleteEvaluation } = useEvaluationStore();
  const [selectedEvaluation, setSelectedEvaluation] = useState<PuppyEvaluation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PuppyEvaluation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getPuppyName = (puppyId: string): string => {
    const puppy = puppies.find(p => p.id === puppyId);
    if (!puppy) return 'Unknown';
    return puppy.name || puppy.tempName || puppy.collar || `${puppy.color} ${puppy.sex}`;
  };

  const getTestTypeIcon = (testType: string) => {
    switch (testType) {
      case 'volhard':
        return <ClipboardList className="h-4 w-4" />;
      case 'apet':
        return <BarChart3 className="h-4 w-4" />;
      case 'flinks':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTestTypeName = (testType: string): string => {
    switch (testType) {
      case 'volhard':
        return 'Volhard PAT';
      case 'apet':
        return 'Avidog APET';
      case 'flinks':
        return 'Flinks Test';
      default:
        return testType;
    }
  };

  const getResultBadge = (evaluation: PuppyEvaluation) => {
    if (isVolhardEvaluation(evaluation)) {
      const interpretation = VOLHARD_INTERPRETATIONS[evaluation.interpretation];
      if (!interpretation) return null;
      return (
        <Badge className={getVolhardInterpretationColor(evaluation.interpretation)}>
          {interpretation.title}
        </Badge>
      );
    }

    if (isAPETEvaluation(evaluation)) {
      return (
        <Badge variant="secondary">
          {evaluation.traitProfile.length} traits evaluated
        </Badge>
      );
    }

    if (isFlinksEvaluation(evaluation)) {
      return (
        <Badge className={getWorkingPotentialColor(evaluation.workingDogPotential)}>
          {evaluation.workingDogPotential.replace('_', ' ')} potential
        </Badge>
      );
    }

    return null;
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteEvaluation(litterId, deleteConfirm.puppyId, deleteConfirm.id);
      toast({ title: 'Evaluation deleted' });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No evaluations yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start a new evaluation from the "New Evaluation" tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group evaluations by puppy
  const groupedByPuppy = evaluations.reduce((acc, eval_) => {
    if (!acc[eval_.puppyId]) {
      acc[eval_.puppyId] = [];
    }
    acc[eval_.puppyId].push(eval_);
    return acc;
  }, {} as Record<string, PuppyEvaluation[]>);

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedByPuppy).map(([puppyId, puppyEvals]) => (
          <Card key={puppyId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{getPuppyName(puppyId)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {puppyEvals.map((eval_) => (
                  <div
                    key={eval_.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        {getTestTypeIcon(eval_.testType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getTestTypeName(eval_.testType)}
                          </span>
                          {getResultBadge(eval_)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {eval_.evaluatorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(eval_.evaluationDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvaluation(eval_)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(eval_)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Evaluation Dialog */}
      <Dialog
        open={!!selectedEvaluation}
        onOpenChange={() => setSelectedEvaluation(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvaluation && getTestTypeName(selectedEvaluation.testType)} Results
            </DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <EvaluationDetailView evaluation={selectedEvaluation} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this evaluation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// Evaluation Detail View
// =============================================================================

function EvaluationDetailView({ evaluation }: { evaluation: PuppyEvaluation }) {
  if (isVolhardEvaluation(evaluation)) {
    const interpretation = VOLHARD_INTERPRETATIONS[evaluation.interpretation];

    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-2">Overall Assessment</h4>
          <Badge className={getVolhardInterpretationColor(evaluation.interpretation)} >
            {interpretation?.title ?? evaluation.interpretation?.replace(/_/g, ' ') ?? 'Unknown'}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">{interpretation?.description ?? 'No description available'}</p>
          <p className="text-sm mt-2">
            <strong>Average Score:</strong> {evaluation.averageScore.toFixed(1)} / 6
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Test Results</h4>
          <div className="space-y-2">
            {evaluation.results.map((result) => (
              <div key={result.testName} className="flex justify-between items-center p-2 border rounded">
                <span className="capitalize">{result.testName.replace(/_/g, ' ')}</span>
                <Badge variant="outline">Score {result.score}</Badge>
              </div>
            ))}
          </div>
        </div>

        {interpretation && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Suitable For</h4>
                <ul className="text-sm space-y-1">
                  {interpretation.suitableFor.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Not Suitable For</h4>
                <ul className="text-sm space-y-1">
                  {interpretation.notSuitableFor.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Training Notes</h4>
              <p className="text-sm text-muted-foreground">{interpretation.trainingNotes}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  if (isAPETEvaluation(evaluation)) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-2">Summary</h4>
          <p className="text-sm">{evaluation.overallSummary}</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Ideal Home</h4>
          <p className="text-sm text-muted-foreground">{evaluation.idealHomeDescription}</p>
        </div>

        {evaluation.trainingPriorityAreas.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Training Priorities</h4>
            <div className="flex flex-wrap gap-2">
              {evaluation.trainingPriorityAreas.map((area, i) => (
                <Badge key={i} variant="secondary">{area}</Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-3">Trait Profile</h4>
          <div className="grid grid-cols-2 gap-2">
            {evaluation.traitProfile.slice(0, 10).map((trait) => (
              <div key={trait.trait} className="flex justify-between items-center p-2 border rounded text-sm">
                <span className="capitalize">{trait.trait.replace(/_/g, ' ')}</span>
                <Badge variant="outline">{trait.score}/10</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isFlinksEvaluation(evaluation)) {
    const potentialInfo = FLINKS_POTENTIAL_THRESHOLDS[evaluation.workingDogPotential];

    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-2">Working Dog Potential</h4>
          <Badge className={getWorkingPotentialColor(evaluation.workingDogPotential)}>
            {evaluation.workingDogPotential?.replace('_', ' ').toUpperCase() ?? 'Unknown'}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">{potentialInfo?.description ?? 'No description available'}</p>
          <p className="text-sm mt-2">
            <strong>Total Score:</strong> {evaluation.totalScore} / 25
          </p>
        </div>

        {evaluation.recommendedDisciplines.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Recommended Disciplines</h4>
            <div className="flex flex-wrap gap-2">
              {evaluation.recommendedDisciplines.map((disc, i) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {disc.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-3">Category Results</h4>
          <div className="space-y-2">
            {evaluation.results.map((result) => (
              <div key={result.category} className="flex justify-between items-center p-2 border rounded">
                <span className="capitalize">{result.category.replace(/_/g, ' ')}</span>
                <Badge variant="outline" className="capitalize">{result.rating}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">{evaluation.summary}</p>
        </div>
      </div>
    );
  }

  return null;
}
