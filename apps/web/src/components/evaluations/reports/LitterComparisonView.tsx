// Litter Comparison View Component
// Compares puppies across a litter by evaluation results

import {
  PuppyEvaluation,
  Puppy,
  isVolhardEvaluation,
  isAPETEvaluation,
  isFlinksEvaluation,
  VolhardInterpretation,
  VOLHARD_INTERPRETATIONS,
  WorkingDogPotential,
} from '@breeder/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, BarChart3, Shield, AlertCircle } from 'lucide-react';
import {
  buildLitterComparisonData,
  getVolhardInterpretationColor,
  getWorkingPotentialColor,
} from '@/lib/evaluationCalculations';

interface LitterComparisonViewProps {
  evaluations: PuppyEvaluation[];
  puppies: Puppy[];
  litterId: string;
}

export function LitterComparisonView({
  evaluations,
  puppies,
  litterId,
}: LitterComparisonViewProps) {
  // Build puppy name map
  const puppyNames: Record<string, string> = {};
  for (const puppy of puppies) {
    puppyNames[puppy.id] = puppy.name || puppy.tempName || puppy.collar || `${puppy.color} ${puppy.sex}`;
  }

  // Get evaluations by type
  const volhardEvals = evaluations.filter(isVolhardEvaluation);
  const apetEvals = evaluations.filter(isAPETEvaluation);
  const flinksEvals = evaluations.filter(isFlinksEvaluation);

  const hasVolhard = volhardEvals.length > 0;
  const hasApet = apetEvals.length > 0;
  const hasFlinks = flinksEvals.length > 0;

  if (!hasVolhard && !hasApet && !hasFlinks) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No evaluations to compare yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete evaluations for multiple puppies to see comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={hasVolhard ? 'volhard' : hasApet ? 'apet' : 'flinks'}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="volhard" disabled={!hasVolhard} className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Volhard ({volhardEvals.length})
        </TabsTrigger>
        <TabsTrigger value="apet" disabled={!hasApet} className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          APET ({apetEvals.length})
        </TabsTrigger>
        <TabsTrigger value="flinks" disabled={!hasFlinks} className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Flinks ({flinksEvals.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="volhard">
        <VolhardComparisonTable evaluations={volhardEvals} puppyNames={puppyNames} />
      </TabsContent>

      <TabsContent value="apet">
        <APETComparisonTable evaluations={apetEvals} puppyNames={puppyNames} />
      </TabsContent>

      <TabsContent value="flinks">
        <FlinksComparisonTable evaluations={flinksEvals} puppyNames={puppyNames} />
      </TabsContent>
    </Tabs>
  );
}

// =============================================================================
// Volhard Comparison Table
// =============================================================================

function VolhardComparisonTable({
  evaluations,
  puppyNames,
}: {
  evaluations: PuppyEvaluation[];
  puppyNames: Record<string, string>;
}) {
  // Get most recent evaluation per puppy
  const latestByPuppy = new Map<string, PuppyEvaluation>();
  for (const eval_ of evaluations) {
    if (isVolhardEvaluation(eval_)) {
      const existing = latestByPuppy.get(eval_.puppyId);
      if (!existing || new Date(eval_.evaluationDate) > new Date(existing.evaluationDate)) {
        latestByPuppy.set(eval_.puppyId, eval_);
      }
    }
  }

  const sortedEvals = Array.from(latestByPuppy.values())
    .filter(isVolhardEvaluation)
    .sort((a, b) => a.averageScore - b.averageScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volhard PAT Comparison</CardTitle>
        <CardDescription>
          Sorted by average score (lower = more dominant, higher = more submissive)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Puppy</TableHead>
              <TableHead>Interpretation</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Distribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvals.map((eval_) => {
              const interpretation = VOLHARD_INTERPRETATIONS[eval_.interpretation];
              return (
                <TableRow key={eval_.id}>
                  <TableCell className="font-medium">
                    {puppyNames[eval_.puppyId] || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getVolhardInterpretationColor(eval_.interpretation)}>
                      {interpretation?.title ?? eval_.interpretation?.replace(/_/g, ' ') ?? 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{eval_.averageScore.toFixed(1)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <div
                          key={score}
                          className="w-6 h-6 rounded text-xs flex items-center justify-center bg-gray-100"
                          title={`Score ${score}: ${eval_.scoreDistribution[score as 1|2|3|4|5|6]} times`}
                        >
                          {eval_.scoreDistribution[score as 1|2|3|4|5|6]}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Interpretation Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Interpretation Guide</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {(Object.entries(VOLHARD_INTERPRETATIONS) as [VolhardInterpretation, typeof VOLHARD_INTERPRETATIONS[VolhardInterpretation]][]).map(
              ([key, info]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge className={getVolhardInterpretationColor(key)} variant="outline">
                    {info.title}
                  </Badge>
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// APET Comparison Table
// =============================================================================

function APETComparisonTable({
  evaluations,
  puppyNames,
}: {
  evaluations: PuppyEvaluation[];
  puppyNames: Record<string, string>;
}) {
  // Get most recent evaluation per puppy
  const latestByPuppy = new Map<string, PuppyEvaluation>();
  for (const eval_ of evaluations) {
    if (isAPETEvaluation(eval_)) {
      const existing = latestByPuppy.get(eval_.puppyId);
      if (!existing || new Date(eval_.evaluationDate) > new Date(existing.evaluationDate)) {
        latestByPuppy.set(eval_.puppyId, eval_);
      }
    }
  }

  const evals = Array.from(latestByPuppy.values()).filter(isAPETEvaluation);

  // Get common traits across all evaluations
  const commonTraits = ['energy_level', 'self_confidence', 'biddability', 'play_drive', 'startle_recovery'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>APET Trait Comparison</CardTitle>
        <CardDescription>
          Key traits compared across puppies (1-10 scale)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Puppy</TableHead>
              {commonTraits.map(trait => (
                <TableHead key={trait} className="text-center capitalize">
                  {trait.split('_').join(' ')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {evals.map((eval_) => {
              const traitMap = new Map(eval_.traitProfile.map(t => [t.trait, t.score]));
              return (
                <TableRow key={eval_.id}>
                  <TableCell className="font-medium">
                    {puppyNames[eval_.puppyId] || 'Unknown'}
                  </TableCell>
                  {commonTraits.map(trait => {
                    const score = traitMap.get(trait as any) || '-';
                    return (
                      <TableCell key={trait} className="text-center">
                        {typeof score === 'number' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">{score}</span>
                            <Progress value={score * 10} className="h-1 w-12" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {evals.map((eval_) => (
            <div key={eval_.id} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">{puppyNames[eval_.puppyId]}</h4>
              <p className="text-sm text-muted-foreground">{eval_.idealHomeDescription}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Flinks Comparison Table
// =============================================================================

function FlinksComparisonTable({
  evaluations,
  puppyNames,
}: {
  evaluations: PuppyEvaluation[];
  puppyNames: Record<string, string>;
}) {
  // Get most recent evaluation per puppy
  const latestByPuppy = new Map<string, PuppyEvaluation>();
  for (const eval_ of evaluations) {
    if (isFlinksEvaluation(eval_)) {
      const existing = latestByPuppy.get(eval_.puppyId);
      if (!existing || new Date(eval_.evaluationDate) > new Date(existing.evaluationDate)) {
        latestByPuppy.set(eval_.puppyId, eval_);
      }
    }
  }

  // Sort by total score (highest first for working potential)
  const sortedEvals = Array.from(latestByPuppy.values())
    .filter(isFlinksEvaluation)
    .sort((a, b) => b.totalScore - a.totalScore);

  const categories = [
    'environmental_exploration',
    'social_approach',
    'prey_drive',
    'possession',
    'nerve_stability',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flinks Working Dog Comparison</CardTitle>
        <CardDescription>
          Sorted by total score (highest working potential first)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Puppy</TableHead>
              <TableHead>Potential</TableHead>
              <TableHead>Score</TableHead>
              {categories.map(cat => (
                <TableHead key={cat} className="text-center capitalize">
                  {cat.split('_')[0]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvals.map((eval_) => {
              const resultMap = new Map(eval_.results.map(r => [r.category, r]));
              return (
                <TableRow key={eval_.id}>
                  <TableCell className="font-medium">
                    {puppyNames[eval_.puppyId] || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getWorkingPotentialColor(eval_.workingDogPotential)}>
                      {eval_.workingDogPotential.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{eval_.totalScore}/25</TableCell>
                  {categories.map(cat => {
                    const result = resultMap.get(cat as any);
                    return (
                      <TableCell key={cat} className="text-center">
                        {result ? (
                          <Badge variant="outline" className="capitalize text-xs">
                            {result.rating.charAt(0).toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Recommended disciplines */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Recommended Disciplines by Puppy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedEvals.map((eval_) => (
              <div key={eval_.id} className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium mb-2">{puppyNames[eval_.puppyId]}</h5>
                {eval_.recommendedDisciplines.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {eval_.recommendedDisciplines.map((disc, i) => (
                      <Badge key={i} variant="secondary" className="capitalize text-xs">
                        {disc.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Not suited for professional working roles
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
