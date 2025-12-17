import { useState } from 'react';
import { Dog } from '@/types/dog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Info,
  Heart,
  Activity,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  calculateCOI,
  getHealthTestRequirements,
  checkHealthTestCompliance,
  predictLitterSize,
  calculateBreedingScore,
  predictCoatColor,
} from '@/lib/breedingCalculations';
import { useDogStore } from '@/store/dogStoreFirebase';

interface BreedingDecisionSupportProps {
  sire?: Dog;
  dam?: Dog;
  onSelectSire?: (sire: Dog) => void;
  onSelectDam?: (dam: Dog) => void;
}

export function BreedingDecisionSupport({
  sire: initialSire,
  dam: initialDam,
  onSelectSire,
  onSelectDam,
}: BreedingDecisionSupportProps) {
  const { dogs } = useDogStore();
  const [sire, setSire] = useState<Dog | undefined>(initialSire);
  const [dam, setDam] = useState<Dog | undefined>(initialDam);

  const males = dogs.filter(d => d.sex === 'male' && d.breedingStatus !== 'retired');
  const females = dogs.filter(d => d.sex === 'female' && d.breedingStatus !== 'retired');

  const handleSireChange = (dogId: string) => {
    const selected = dogs.find(d => d.id === dogId);
    setSire(selected);
    onSelectSire?.(selected!);
  };

  const handleDamChange = (dogId: string) => {
    const selected = dogs.find(d => d.id === dogId);
    setDam(selected);
    onSelectDam?.(selected!);
  };

  if (!sire || !dam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Breeding Decision Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Sire (Male)</label>
              <Select onValueChange={handleSireChange} value={sire?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a male dog..." />
                </SelectTrigger>
                <SelectContent>
                  {males.map(dog => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name} - {dog.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Dam (Female)</label>
              <Select onValueChange={handleDamChange} value={dam?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a female dog..." />
                </SelectTrigger>
                <SelectContent>
                  {females.map(dog => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name} - {dog.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(sire || dam) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select both a sire and dam to view breeding analysis and recommendations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Calculate breeding metrics
  const coi = calculateCOI(sire, dam);
  const breedingScore = calculateBreedingScore(sire, dam, sire.breed);
  const healthCompliance = checkHealthTestCompliance(sire, dam, sire.breed);
  const litterPrediction = predictLitterSize(dam, dam.breed);
  const healthRequirements = getHealthTestRequirements(sire.breed);

  // Predict coat colors if DNA data available
  let coatColorPrediction;
  if (sire.dnaProfile && dam.dnaProfile) {
    coatColorPrediction = predictCoatColor(sire.dnaProfile, dam.dnaProfile);
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'Excellent': 'default',
      'Good': 'secondary',
      'Fair': 'secondary',
      'Not Recommended': 'destructive',
    };
    return variants[recommendation] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Dog Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Breeding Pair</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sire (Male)</label>
              <Select onValueChange={handleSireChange} value={sire.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {males.map(dog => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name} - {dog.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {sire.breed} • {sire.registrationNumber || 'Not registered'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dam (Female)</label>
              <Select onValueChange={handleDamChange} value={dam.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {females.map(dog => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name} - {dog.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {dam.breed} • {dam.registrationNumber || 'Not registered'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Breeding Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Breeding Recommendation</span>
            <Badge variant={getRecommendationBadge(breedingScore.recommendation)}>
              {breedingScore.recommendation}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Breeding Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(breedingScore.score)}`}>
                {breedingScore.score}/100
              </span>
            </div>
            <Progress value={breedingScore.score} className="h-3" />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Score Breakdown</h4>
            {breedingScore.factors.map((factor, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>{factor.name}</span>
                  <span className="font-medium">{Math.round(factor.score)}/100</span>
                </div>
                <Progress value={factor.score} className="h-2" />
                <p className="text-xs text-muted-foreground">{factor.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Genetic Diversity (COI) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Genetic Diversity (COI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coefficient of Inbreeding</p>
              <p className="text-3xl font-bold">{coi.toFixed(2)}%</p>
            </div>
            {coi < 5 ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : coi < 10 ? (
              <Info className="h-12 w-12 text-blue-500" />
            ) : coi < 15 ? (
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>

          <Alert variant={coi >= 15 ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {coi < 5 && 'Excellent genetic diversity. Low risk of inherited disorders.'}
              {coi >= 5 && coi < 10 && 'Good genetic diversity. Acceptable for most breeding programs.'}
              {coi >= 10 && coi < 15 && 'Moderate inbreeding. Consider the benefits and risks carefully.'}
              {coi >= 15 && 'High inbreeding coefficient. Increased risk of genetic disorders. Not recommended unless for specific genetic preservation.'}
            </AlertDescription>
          </Alert>

          <div className="text-sm space-y-2">
            <p className="font-medium">Recommended COI Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>0-5%: Excellent - Minimal inbreeding</li>
              <li>5-10%: Good - Acceptable for most programs</li>
              <li>10-15%: Moderate - Careful consideration needed</li>
              <li>15%+: High - Generally not recommended</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Health Test Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Health Test Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthCompliance.compliant ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                All required health tests completed for both parents!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Missing {healthCompliance.missingTests.length} required health test(s).
              </AlertDescription>
            </Alert>
          )}

          {healthCompliance.missingTests.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Missing Tests:</h4>
              <ul className="space-y-1">
                {healthCompliance.missingTests.map((test, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {test}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Required Health Tests for {sire.breed}:</h4>
            <div className="space-y-2">
              {healthRequirements.map((req, index) => {
                const sireHasTest = sire.healthTests?.some(t =>
                  t.testType.toLowerCase().includes(req.testName.toLowerCase())
                );
                const damHasTest = dam.healthTests?.some(t =>
                  t.testType.toLowerCase().includes(req.testName.toLowerCase())
                );

                return (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{req.testName}</p>
                        <p className="text-xs text-muted-foreground">{req.description}</p>
                        {req.minimumAge && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum age: {req.minimumAge}
                          </p>
                        )}
                      </div>
                      <Badge variant={req.required ? 'default' : 'outline'}>
                        {req.required ? 'Required' : 'Recommended'}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {sireHasTest ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Sire: {sireHasTest ? 'Complete' : 'Missing'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {damHasTest ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Dam: {damHasTest ? 'Complete' : 'Missing'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Litter Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predicted Litter Characteristics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-3">Expected Litter Size</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{litterPrediction.min}</p>
                <p className="text-xs text-muted-foreground">Minimum</p>
              </div>
              <div className="text-center p-3 border rounded-lg bg-primary/5">
                <p className="text-2xl font-bold text-primary">{litterPrediction.average}</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{litterPrediction.max}</p>
                <p className="text-xs text-muted-foreground">Maximum</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {litterPrediction.confidence}
            </p>
          </div>

          {coatColorPrediction && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-3">Coat Color Predictions</h4>
                <div className="space-y-2">
                  {coatColorPrediction.possibleColors.map((color, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{color}</span>
                      {coatColorPrediction.probabilities[color] && (
                        <Badge variant="outline">
                          {coatColorPrediction.probabilities[color]}% chance
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs whitespace-pre-line">
                    {coatColorPrediction.explanation}
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {!coatColorPrediction && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                DNA profiles needed for coat color predictions. Add DNA test results to enable this feature.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button className="flex-1" disabled={!healthCompliance.compliant}>
              <Award className="h-4 w-4 mr-2" />
              Create Breeding Record
            </Button>
            <Button variant="outline" className="flex-1">
              Export Report
            </Button>
          </div>
          {!healthCompliance.compliant && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Complete all required health tests to create a breeding record
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
