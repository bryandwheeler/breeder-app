// Evaluation Tab Component
// Main component for managing puppy evaluations within a litter

import { useState, useEffect } from 'react';
import { Litter, Puppy, EvaluationTestType, PuppyEvaluation } from '@breeder/types';
import { useEvaluationStore } from '@breeder/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardList,
  BarChart3,
  Shield,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { EvaluationWizard } from './EvaluationWizard';
import { EvaluationResultsList } from './reports/EvaluationResultsList';
import { LitterComparisonView } from './reports/LitterComparisonView';

interface EvaluationTabProps {
  litter: Litter;
  puppies: Puppy[];
}

export function EvaluationTab({ litter, puppies }: EvaluationTabProps) {
  const [selectedTestType, setSelectedTestType] = useState<EvaluationTestType>('volhard');
  const [selectedPuppyId, setSelectedPuppyId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'results' | 'compare'>('new');

  const {
    evaluations,
    loading,
    fetchLitterEvaluations,
  } = useEvaluationStore();

  // Fetch all evaluations for this litter on mount
  useEffect(() => {
    if (litter.id) {
      fetchLitterEvaluations(litter.id);
    }
  }, [litter.id, fetchLitterEvaluations]);

  // Get puppy name for display
  const getPuppyName = (puppy: Puppy): string => {
    return puppy.name || puppy.tempName || puppy.collar || `${puppy.color} ${puppy.sex}`;
  };

  // Count evaluations by type for a puppy
  const getEvaluationCounts = (puppyId: string) => {
    const puppyEvals = evaluations.filter(e => e.puppyId === puppyId);
    return {
      volhard: puppyEvals.filter(e => e.testType === 'volhard').length,
      apet: puppyEvals.filter(e => e.testType === 'apet').length,
      flinks: puppyEvals.filter(e => e.testType === 'flinks').length,
    };
  };

  // Handle starting a new evaluation
  const handleStartEvaluation = () => {
    if (selectedPuppyId) {
      setWizardOpen(true);
    }
  };

  // Handle evaluation completion
  const handleEvaluationComplete = () => {
    setWizardOpen(false);
    fetchLitterEvaluations(litter.id);
  };

  const testTypeInfo: Record<EvaluationTestType, { name: string; description: string; icon: React.ReactNode }> = {
    volhard: {
      name: 'Volhard PAT',
      description: '10 tests measuring temperament, scored 1-6. Best for general puppy placement.',
      icon: <ClipboardList className="h-5 w-5" />,
    },
    apet: {
      name: 'Avidog APET',
      description: '23 exercises evaluating 33 traits, scored 1-10. Detailed profile for matching homes.',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    flinks: {
      name: 'Flinks Test',
      description: '5 categories for police/sport dog evaluation. Working dog potential assessment.',
      icon: <Shield className="h-5 w-5" />,
    },
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Evaluation
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Results ({evaluations.length})
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        {/* New Evaluation Tab */}
        <TabsContent value="new" className="space-y-6">
          {/* Test Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Test Type</CardTitle>
              <CardDescription>Choose which evaluation test to conduct</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(testTypeInfo) as [EvaluationTestType, typeof testTypeInfo[EvaluationTestType]][]).map(
                  ([type, info]) => (
                    <div
                      key={type}
                      onClick={() => setSelectedTestType(type)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTestType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedTestType === type ? 'bg-primary text-primary-foreground' : 'bg-gray-100'
                          }`}
                        >
                          {info.icon}
                        </div>
                        <h3 className="font-semibold">{info.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Puppy Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Puppy</CardTitle>
              <CardDescription>Choose which puppy to evaluate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {puppies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No puppies in this litter yet.</p>
                  <p className="text-sm">Add puppies to the litter before conducting evaluations.</p>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedPuppyId || ''}
                    onValueChange={setSelectedPuppyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a puppy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {puppies.map((puppy) => {
                        const counts = getEvaluationCounts(puppy.id);
                        const hasEval = counts.volhard > 0 || counts.apet > 0 || counts.flinks > 0;

                        return (
                          <SelectItem key={puppy.id} value={puppy.id}>
                            <div className="flex items-center gap-2">
                              <span>{getPuppyName(puppy)}</span>
                              {hasEval && (
                                <Badge variant="secondary" className="text-xs">
                                  {counts.volhard + counts.apet + counts.flinks} eval(s)
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Show previous evaluations for selected puppy */}
                  {selectedPuppyId && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Previous Evaluations</h4>
                      {(() => {
                        const puppyEvals = evaluations.filter(e => e.puppyId === selectedPuppyId);
                        if (puppyEvals.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground">
                              No previous evaluations for this puppy.
                            </p>
                          );
                        }
                        return (
                          <div className="space-y-2">
                            {puppyEvals.slice(0, 3).map((eval_) => (
                              <div
                                key={eval_.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize">
                                    {eval_.testType === 'volhard'
                                      ? 'Volhard'
                                      : eval_.testType === 'apet'
                                      ? 'APET'
                                      : 'Flinks'}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    by {eval_.evaluatorName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(eval_.evaluationDate), 'MMM d, yyyy')}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <Button
                    onClick={handleStartEvaluation}
                    disabled={!selectedPuppyId}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start {testTypeInfo[selectedTestType].name} Evaluation
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <EvaluationResultsList
            evaluations={evaluations}
            puppies={puppies}
            litterId={litter.id}
            loading={loading}
          />
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare">
          <LitterComparisonView
            evaluations={evaluations}
            puppies={puppies}
            litterId={litter.id}
          />
        </TabsContent>
      </Tabs>

      {/* Evaluation Wizard Modal */}
      {selectedPuppyId && (
        <EvaluationWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          litterId={litter.id}
          puppyId={selectedPuppyId}
          puppyName={getPuppyName(puppies.find(p => p.id === selectedPuppyId)!)}
          puppyAgeWeeks={litter.dateOfBirth
            ? Math.floor((Date.now() - new Date(litter.dateOfBirth).getTime()) / (7 * 24 * 60 * 60 * 1000))
            : 7
          }
          testType={selectedTestType}
          onComplete={handleEvaluationComplete}
        />
      )}
    </div>
  );
}
