import { useState } from 'react';
import { Dog } from '@breeder/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BreedingDecisionSupport } from '@/components/BreedingDecisionSupport';
import { Calculator, Heart, Dna, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function BreedingPlanner() {
  const [selectedSire, setSelectedSire] = useState<Dog | undefined>();
  const [selectedDam, setSelectedDam] = useState<Dog | undefined>();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Breeding Decision Support</h1>
        <p className="text-muted-foreground">
          Make informed breeding decisions with genetic diversity analysis, health test compliance checking,
          and litter characteristic predictions.
        </p>
      </div>

      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planner">
            <Calculator className="h-4 w-4 mr-2" />
            Breeding Planner
          </TabsTrigger>
          <TabsTrigger value="coi-info">
            <Dna className="h-4 w-4 mr-2" />
            COI Guide
          </TabsTrigger>
          <TabsTrigger value="health-tests">
            <Heart className="h-4 w-4 mr-2" />
            Health Tests
          </TabsTrigger>
          <TabsTrigger value="resources">
            <BookOpen className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planner">
          <BreedingDecisionSupport
            sire={selectedSire}
            dam={selectedDam}
            onSelectSire={setSelectedSire}
            onSelectDam={setSelectedDam}
          />
        </TabsContent>

        <TabsContent value="coi-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Coefficient of Inbreeding (COI)</CardTitle>
              <CardDescription>
                What it means and why it matters for your breeding program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What is COI?</h3>
                <p className="text-sm text-muted-foreground">
                  The Coefficient of Inbreeding (COI) is a measure of genetic similarity between
                  two dogs based on their pedigrees. It estimates the probability that a puppy
                  will inherit two identical copies of the same gene from both parents because
                  they share common ancestors.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Why Does COI Matter?</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Higher COI increases risk of inherited genetic disorders</li>
                  <li>Reduces overall genetic diversity in your breeding program</li>
                  <li>Can lead to reduced litter sizes and puppy vitality</li>
                  <li>May impact immune system function and general health</li>
                  <li>Affects long-term sustainability of breed health</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">COI Guidelines</h3>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                    <p className="font-medium text-green-900 text-sm">0-5%: Excellent</p>
                    <p className="text-xs text-green-700">
                      Minimal inbreeding. Ideal for most breeding programs. Maintains genetic diversity.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                    <p className="font-medium text-blue-900 text-sm">5-10%: Good</p>
                    <p className="text-xs text-blue-700">
                      Acceptable level of inbreeding for most programs. Monitor health and diversity.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                    <p className="font-medium text-yellow-900 text-sm">10-15%: Moderate</p>
                    <p className="text-xs text-yellow-700">
                      Requires careful consideration. Ensure both parents are health tested and genetically sound.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                    <p className="font-medium text-red-900 text-sm">15%+: High</p>
                    <p className="text-xs text-red-700">
                      Generally not recommended. Significantly increased risk of genetic problems.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> The COI calculator in this app uses pedigree data to estimate
                  inbreeding. For the most accurate results, consider DNA-based COI testing from services
                  like Embark or Wisdom Panel, which can detect genetic relationships not visible in pedigrees.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Testing Requirements by Breed</CardTitle>
              <CardDescription>
                Recommended and required health tests for responsible breeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Why Health Test?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Health testing allows you to identify carriers of genetic diseases and make informed
                  breeding decisions to reduce the prevalence of inherited disorders in your lines.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Types of Health Testing</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">Orthopedic Testing</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Hip and elbow dysplasia evaluations (OFA, PennHIP)
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Required for most medium to large breeds</li>
                      <li>Minimum age: 24 months for final certification</li>
                      <li>Results rated: Excellent, Good, Fair, Borderline, Mild, Moderate, Severe</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">Eye Testing (CERF/OFA)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Annual eye examinations by board-certified ophthalmologists
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Screens for hereditary eye diseases</li>
                      <li>Should be done annually as some conditions develop over time</li>
                      <li>Important for breeds prone to PRA, cataracts, glaucoma</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">Cardiac Testing</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Heart examinations for congenital and hereditary conditions
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Advanced cardiac exam by board-certified cardiologist</li>
                      <li>Recommended for breeds prone to heart disease</li>
                      <li>Minimum age varies by breed</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">DNA Testing</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Genetic tests for breed-specific inherited diseases
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>One-time test (results valid for life)</li>
                      <li>Identifies carriers and affected dogs</li>
                      <li>Allows strategic breeding to eliminate diseases</li>
                      <li>Examples: PRA, DM, vWD, EIC, MDR1, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Testing Organizations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">OFA (Orthopedic Foundation for Animals)</p>
                    <p className="text-xs text-muted-foreground">
                      Hip/elbow dysplasia, eye, cardiac, and disease database
                    </p>
                    <a
                      href="https://www.ofa.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      www.ofa.org
                    </a>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">PennHIP</p>
                    <p className="text-xs text-muted-foreground">
                      Alternative hip dysplasia evaluation method
                    </p>
                    <a
                      href="https://www.pennhip.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      www.pennhip.org
                    </a>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">Embark</p>
                    <p className="text-xs text-muted-foreground">
                      Comprehensive DNA testing for 200+ genetic conditions
                    </p>
                    <a
                      href="https://www.embarkvet.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      www.embarkvet.com
                    </a>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">Paw Print Genetics</p>
                    <p className="text-xs text-muted-foreground">
                      Breed-specific disease panels and genetic testing
                    </p>
                    <a
                      href="https://www.pawprintgenetics.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      www.pawprintgenetics.com
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breeding Resources & Education</CardTitle>
              <CardDescription>
                Additional resources for responsible dog breeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Breed Clubs & Organizations</h3>
                <div className="space-y-2">
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">American Kennel Club (AKC)</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Registry, breed standards, and breeder education
                    </p>
                    <a
                      href="https://www.akc.org/breeder-programs/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      AKC Breeder Education
                    </a>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">Canine Health Information Center (CHIC)</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Consolidated health testing database
                    </p>
                    <a
                      href="https://www.caninehealthinfo.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      www.caninehealthinfo.org
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Genetics & Breeding Science</h3>
                <div className="space-y-2">
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">Institute of Canine Biology</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Science-based canine genetics education
                    </p>
                    <a
                      href="https://www.instituteofcaninebiology.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      www.instituteofcaninebiology.org
                    </a>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">Dog Genetics 4.0 (Online Course)</p>
                    <p className="text-xs text-muted-foreground">
                      Comprehensive genetics course for dog breeders
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Recommended Reading</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Control of Canine Genetic Diseases</p>
                      <p className="text-xs text-muted-foreground">by George A. Padgett, DVM</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">The Dog Breeder's Guide to Successful Breeding and Health Management</p>
                      <p className="text-xs text-muted-foreground">by Margaret Root Kustritz, DVM, PhD</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Genetics of the Dog</p>
                      <p className="text-xs text-muted-foreground">by Anatoly Ruvinsky and Jeff Sampson</p>
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
