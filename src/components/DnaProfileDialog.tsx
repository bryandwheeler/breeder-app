import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DnaProfile, COMMON_HEALTH_CONDITIONS } from '@/types/dog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus } from 'lucide-react';

interface DnaProfileDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dnaProfile?: DnaProfile;
  onSave: (profile: DnaProfile) => void;
}

const PROVIDERS = ['Embark Vet', 'Wisdom Panel', 'UC Davis VGL', 'Paw Print Genetics', 'Orivet', 'Other'];

export function DnaProfileDialog({ open, setOpen, dnaProfile, onSave }: DnaProfileDialogProps) {
  const [profile, setProfile] = useState<DnaProfile>(dnaProfile || {});

  const handleSave = () => {
    onSave(profile);
  };

  const updateCoatColor = (locus: string, value: string) => {
    setProfile({
      ...profile,
      coatColor: { ...profile.coatColor, [locus]: value || undefined }
    });
  };

  const updateCoatType = (locus: string, value: string) => {
    setProfile({
      ...profile,
      coatType: { ...profile.coatType, [locus]: value || undefined }
    });
  };

  const updateBodyFeature = (feature: string, value: string) => {
    setProfile({
      ...profile,
      bodyFeatures: { ...profile.bodyFeatures, [feature]: value || undefined }
    });
  };

  const updateHealthCondition = (condition: string, result: 'clear' | 'carrier' | 'at_risk' | 'not_tested') => {
    setProfile({
      ...profile,
      healthConditions: { ...profile.healthConditions, [condition]: result }
    });
  };

  const updatePerformanceTrait = (trait: string, value: string) => {
    setProfile({
      ...profile,
      performanceTraits: { ...profile.performanceTraits, [trait]: value || undefined }
    });
  };

  const updateMedical = (field: string, value: string) => {
    setProfile({
      ...profile,
      medical: { ...profile.medical, [field]: value || undefined }
    });
  };

  const addBreed = () => {
    setProfile({
      ...profile,
      breedComposition: [...(profile.breedComposition || []), { breed: '', percentage: 0 }]
    });
  };

  const updateBreed = (index: number, field: 'breed' | 'percentage', value: string | number) => {
    const updated = [...(profile.breedComposition || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, breedComposition: updated });
  };

  const removeBreed = (index: number) => {
    setProfile({
      ...profile,
      breedComposition: profile.breedComposition?.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DNA Profile & Genetic Testing</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Testing Provider</Label>
              <Select value={profile.provider} onValueChange={(v) => setProfile({ ...profile, provider: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Date</Label>
              <Input
                type="date"
                value={profile.testDate || ''}
                onChange={(e) => setProfile({ ...profile, testDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Profile ID</Label>
              <Input
                placeholder="ABC123456"
                value={profile.profileId || ''}
                onChange={(e) => setProfile({ ...profile, profileId: e.target.value })}
              />
            </div>
          </div>

          <Tabs defaultValue="coat-color" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="coat-color">Coat Color</TabsTrigger>
              <TabsTrigger value="coat-type">Coat Type</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="traits">Traits</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            {/* Coat Color Loci */}
            <TabsContent value="coat-color" className="space-y-4 mt-4">
              <h3 className="font-semibold">Coat Color Genetics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E Locus (Extension)</Label>
                  <Input
                    placeholder="e.g., E/E, E/e, e/e"
                    value={profile.coatColor?.E || ''}
                    onChange={(e) => updateCoatColor('E', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">e/e = recessive red</p>
                </div>
                <div>
                  <Label>K Locus (Dominant Black)</Label>
                  <Input
                    placeholder="e.g., KB/KB, KB/ky, ky/ky"
                    value={profile.coatColor?.K || ''}
                    onChange={(e) => updateCoatColor('K', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">KB = dominant black</p>
                </div>
                <div>
                  <Label>A Locus (Agouti)</Label>
                  <Input
                    placeholder="e.g., ay/ay, aw/aw, at/at, a/a"
                    value={profile.coatColor?.A || ''}
                    onChange={(e) => updateCoatColor('A', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Controls pattern</p>
                </div>
                <div>
                  <Label>B Locus (Brown)</Label>
                  <Input
                    placeholder="e.g., B/B, B/b, b/b"
                    value={profile.coatColor?.B || ''}
                    onChange={(e) => updateCoatColor('B', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">b/b = brown/liver</p>
                </div>
                <div>
                  <Label>D Locus (Dilution)</Label>
                  <Input
                    placeholder="e.g., D/D, D/d, d/d"
                    value={profile.coatColor?.D || ''}
                    onChange={(e) => updateCoatColor('D', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">d/d = dilute color</p>
                </div>
                <div>
                  <Label>Em Locus (Melanistic Mask)</Label>
                  <Input
                    placeholder="e.g., Em/Em, Em/e"
                    value={profile.coatColor?.Em || ''}
                    onChange={(e) => updateCoatColor('Em', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Dark facial mask</p>
                </div>
                <div>
                  <Label>S Locus (Spotting/Piebald)</Label>
                  <Input
                    placeholder="e.g., S/S, S/sp, sp/sp"
                    value={profile.coatColor?.S || ''}
                    onChange={(e) => updateCoatColor('S', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">White markings</p>
                </div>
                <div>
                  <Label>M Locus (Merle)</Label>
                  <Input
                    placeholder="e.g., M/m, m/m"
                    value={profile.coatColor?.M || ''}
                    onChange={(e) => updateCoatColor('M', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Merle pattern</p>
                </div>
                <div>
                  <Label>H Locus (Harlequin)</Label>
                  <Input
                    placeholder="e.g., H/h, h/h"
                    value={profile.coatColor?.H || ''}
                    onChange={(e) => updateCoatColor('H', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Modifies merle</p>
                </div>
                <div>
                  <Label>T Locus (Ticking)</Label>
                  <Input
                    placeholder="e.g., T/T, T/t"
                    value={profile.coatColor?.T || ''}
                    onChange={(e) => updateCoatColor('T', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Spots in white areas</p>
                </div>
              </div>
            </TabsContent>

            {/* Coat Type */}
            <TabsContent value="coat-type" className="space-y-4 mt-4">
              <h3 className="font-semibold">Coat Type & Texture</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>L Locus (Coat Length)</Label>
                  <Input
                    placeholder="e.g., L/L, L/l, l/l"
                    value={profile.coatType?.L || ''}
                    onChange={(e) => updateCoatType('L', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">l/l = long coat</p>
                </div>
                <div>
                  <Label>R Locus (Curl/Wave)</Label>
                  <Input
                    placeholder="e.g., R/R, R/r"
                    value={profile.coatType?.R || ''}
                    onChange={(e) => updateCoatType('R', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Curly coat</p>
                </div>
                <div>
                  <Label>I Locus (Furnishings)</Label>
                  <Input
                    placeholder="e.g., I/I, I/i, i/i"
                    value={profile.coatType?.I || ''}
                    onChange={(e) => updateCoatType('I', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Wire/beard</p>
                </div>
                <div>
                  <Label>SD (Shedding)</Label>
                  <Input
                    placeholder="e.g., SD/SD, SD/sd"
                    value={profile.coatType?.SD || ''}
                    onChange={(e) => updateCoatType('SD', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Shedding level</p>
                </div>
                <div>
                  <Label>IC (Improper Coat)</Label>
                  <Input
                    placeholder="e.g., IC/IC, IC/N"
                    value={profile.coatType?.IC || ''}
                    onChange={(e) => updateCoatType('IC', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Coat quality</p>
                </div>
              </div>
            </TabsContent>

            {/* Health Conditions */}
            <TabsContent value="health" className="space-y-4 mt-4">
              <h3 className="font-semibold">Genetic Health Conditions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {COMMON_HEALTH_CONDITIONS.map((condition) => (
                  <div key={condition} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{condition}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={profile.healthConditions?.[condition] === 'clear' ? 'default' : 'outline'}
                        onClick={() => updateHealthCondition(condition, 'clear')}
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant={profile.healthConditions?.[condition] === 'carrier' ? 'default' : 'outline'}
                        onClick={() => updateHealthCondition(condition, 'carrier')}
                        className="h-7 text-xs"
                      >
                        Carrier
                      </Button>
                      <Button
                        size="sm"
                        variant={profile.healthConditions?.[condition] === 'at_risk' ? 'default' : 'outline'}
                        onClick={() => updateHealthCondition(condition, 'at_risk')}
                        className="h-7 text-xs"
                      >
                        At Risk
                      </Button>
                      <Button
                        size="sm"
                        variant={!profile.healthConditions?.[condition] || profile.healthConditions[condition] === 'not_tested' ? 'default' : 'outline'}
                        onClick={() => updateHealthCondition(condition, 'not_tested')}
                        className="h-7 text-xs"
                      >
                        N/A
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Performance & Behavior Traits */}
            <TabsContent value="traits" className="space-y-4 mt-4">
              <h3 className="font-semibold">Performance & Behavior Traits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Athleticism</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.athleticism || ''}
                    onChange={(e) => updatePerformanceTrait('athleticism', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Appetite</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.appetite || ''}
                    onChange={(e) => updatePerformanceTrait('appetite', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Biddability (Trainability)</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.biddability || ''}
                    onChange={(e) => updatePerformanceTrait('biddability', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Boldness</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.boldness || ''}
                    onChange={(e) => updatePerformanceTrait('boldness', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Calmness</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.calmness || ''}
                    onChange={(e) => updatePerformanceTrait('calmness', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Dog Sociability</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.dogSociability || ''}
                    onChange={(e) => updatePerformanceTrait('dogSociability', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Human Sociability</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.humanSociability || ''}
                    onChange={(e) => updatePerformanceTrait('humanSociability', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Predatory Behavior</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.predatoryBehavior || ''}
                    onChange={(e) => updatePerformanceTrait('predatoryBehavior', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Wanderlust</Label>
                  <Input
                    placeholder="e.g., High, Moderate, Low"
                    value={profile.performanceTraits?.wanderlust || ''}
                    onChange={(e) => updatePerformanceTrait('wanderlust', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Body Features */}
            <TabsContent value="body" className="space-y-4 mt-4">
              <h3 className="font-semibold">Body Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tail Length</Label>
                  <Input
                    placeholder="e.g., Natural Bobtail, Full"
                    value={profile.bodyFeatures?.tailLength || ''}
                    onChange={(e) => updateBodyFeature('tailLength', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ear Type</Label>
                  <Input
                    placeholder="e.g., Prick, Drop, Rose"
                    value={profile.bodyFeatures?.earType || ''}
                    onChange={(e) => updateBodyFeature('earType', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Muzzle Length</Label>
                  <Input
                    placeholder="e.g., Long, Short, Moderate"
                    value={profile.bodyFeatures?.muzzleLength || ''}
                    onChange={(e) => updateBodyFeature('muzzleLength', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Leg Length</Label>
                  <Input
                    placeholder="e.g., Short, Normal"
                    value={profile.bodyFeatures?.legLength || ''}
                    onChange={(e) => updateBodyFeature('legLength', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Body Size</Label>
                  <Input
                    placeholder="e.g., Small, Medium, Large"
                    value={profile.bodyFeatures?.bodySize || ''}
                    onChange={(e) => updateBodyFeature('bodySize', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Back Type</Label>
                  <Input
                    placeholder="e.g., Level, Sloped"
                    value={profile.bodyFeatures?.backType || ''}
                    onChange={(e) => updateBodyFeature('backType', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Other */}
            <TabsContent value="other" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Breed Composition */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Breed Composition</h3>
                    <Button size="sm" variant="outline" onClick={addBreed}>
                      <Plus className="h-4 w-4 mr-1" /> Add Breed
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(profile.breedComposition || []).map((breed, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Breed name"
                          value={breed.breed}
                          onChange={(e) => updateBreed(index, 'breed', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="%"
                          value={breed.percentage}
                          onChange={(e) => updateBreed(index, 'percentage', parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <Button size="sm" variant="ghost" onClick={() => removeBreed(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical */}
                <div>
                  <h3 className="font-semibold mb-2">Medical Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Blood Type</Label>
                      <Input
                        placeholder="e.g., DEA 1.1 Positive"
                        value={profile.medical?.bloodType || ''}
                        onChange={(e) => updateMedical('bloodType', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>MDR1 (Drug Sensitivity)</Label>
                      <Select
                        value={profile.medical?.mdr1 || 'not_tested'}
                        onValueChange={(v) => updateMedical('mdr1', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="carrier">Carrier</SelectItem>
                          <SelectItem value="affected">Affected</SelectItem>
                          <SelectItem value="not_tested">Not Tested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>DM Genotype</Label>
                      <Input
                        placeholder="e.g., N/N, N/DM, DM/DM"
                        value={profile.medical?.dmGenotype || ''}
                        onChange={(e) => updateMedical('dmGenotype', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* COI */}
                <div>
                  <Label>COI (Coefficient of Inbreeding) %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5.2"
                    value={profile.coi || ''}
                    onChange={(e) => setProfile({ ...profile, coi: parseFloat(e.target.value) || undefined })}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional DNA testing notes..."
                    value={profile.notes || ''}
                    onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save DNA Profile</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Display component for showing DNA profile data
export function DnaProfileDisplay({ profile }: { profile: DnaProfile }) {
  const getResultBadge = (result?: string) => {
    if (!result || result === 'not_tested') return null;
    switch (result) {
      case 'clear':
        return <Badge className="bg-green-500">Clear</Badge>;
      case 'carrier':
        return <Badge className="bg-yellow-500">Carrier</Badge>;
      case 'at_risk':
      case 'affected':
        return <Badge className="bg-red-500">At Risk</Badge>;
      case 'normal':
        return <Badge className="bg-green-500">Normal</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const hasCoatColorData = profile.coatColor && Object.values(profile.coatColor).some(v => v);
  const hasCoatTypeData = profile.coatType && Object.values(profile.coatType).some(v => v);
  const hasHealthData = profile.healthConditions && Object.keys(profile.healthConditions).length > 0;
  const hasTraitData = profile.performanceTraits && Object.values(profile.performanceTraits).some(v => v);
  const hasBodyData = profile.bodyFeatures && Object.values(profile.bodyFeatures).some(v => v);

  return (
    <div className="space-y-6">
      {/* Provider Info */}
      {(profile.provider || profile.testDate || profile.profileId) && (
        <div className="flex gap-4 text-sm">
          {profile.provider && <div><strong>Provider:</strong> {profile.provider}</div>}
          {profile.testDate && <div><strong>Test Date:</strong> {profile.testDate}</div>}
          {profile.profileId && <div><strong>Profile ID:</strong> {profile.profileId}</div>}
        </div>
      )}

      {/* Breed Composition */}
      {profile.breedComposition && profile.breedComposition.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Breed Composition</h4>
          <div className="space-y-1">
            {profile.breedComposition.map((breed, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{breed.breed}</span>
                <Badge variant="outline">{breed.percentage}%</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coat Color Genetics */}
      {hasCoatColorData && (
        <div>
          <h4 className="font-semibold mb-2">Coat Color Genetics</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {profile.coatColor?.E && <div><strong>E Locus:</strong> {profile.coatColor.E}</div>}
            {profile.coatColor?.K && <div><strong>K Locus:</strong> {profile.coatColor.K}</div>}
            {profile.coatColor?.A && <div><strong>A Locus:</strong> {profile.coatColor.A}</div>}
            {profile.coatColor?.B && <div><strong>B Locus:</strong> {profile.coatColor.B}</div>}
            {profile.coatColor?.D && <div><strong>D Locus:</strong> {profile.coatColor.D}</div>}
            {profile.coatColor?.Em && <div><strong>Em Locus:</strong> {profile.coatColor.Em}</div>}
            {profile.coatColor?.S && <div><strong>S Locus:</strong> {profile.coatColor.S}</div>}
            {profile.coatColor?.M && <div><strong>M Locus:</strong> {profile.coatColor.M}</div>}
            {profile.coatColor?.H && <div><strong>H Locus:</strong> {profile.coatColor.H}</div>}
            {profile.coatColor?.T && <div><strong>T Locus:</strong> {profile.coatColor.T}</div>}
          </div>
        </div>
      )}

      {/* Coat Type */}
      {hasCoatTypeData && (
        <div>
          <h4 className="font-semibold mb-2">Coat Type & Texture</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {profile.coatType?.L && <div><strong>Length:</strong> {profile.coatType.L}</div>}
            {profile.coatType?.R && <div><strong>Curl:</strong> {profile.coatType.R}</div>}
            {profile.coatType?.I && <div><strong>Furnishings:</strong> {profile.coatType.I}</div>}
            {profile.coatType?.SD && <div><strong>Shedding:</strong> {profile.coatType.SD}</div>}
            {profile.coatType?.IC && <div><strong>Improper Coat:</strong> {profile.coatType.IC}</div>}
          </div>
        </div>
      )}

      {/* Health Conditions */}
      {hasHealthData && (
        <div>
          <h4 className="font-semibold mb-2">Genetic Health Conditions</h4>
          <div className="space-y-1">
            {Object.entries(profile.healthConditions || {}).map(([condition, result]) => (
              result !== 'not_tested' && (
                <div key={condition} className="flex justify-between items-center text-sm">
                  <span>{condition}</span>
                  {getResultBadge(result)}
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Performance Traits */}
      {hasTraitData && (
        <div>
          <h4 className="font-semibold mb-2">Performance & Behavior Traits</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {profile.performanceTraits?.athleticism && <div><strong>Athleticism:</strong> {profile.performanceTraits.athleticism}</div>}
            {profile.performanceTraits?.appetite && <div><strong>Appetite:</strong> {profile.performanceTraits.appetite}</div>}
            {profile.performanceTraits?.biddability && <div><strong>Biddability:</strong> {profile.performanceTraits.biddability}</div>}
            {profile.performanceTraits?.boldness && <div><strong>Boldness:</strong> {profile.performanceTraits.boldness}</div>}
            {profile.performanceTraits?.calmness && <div><strong>Calmness:</strong> {profile.performanceTraits.calmness}</div>}
            {profile.performanceTraits?.dogSociability && <div><strong>Dog Sociability:</strong> {profile.performanceTraits.dogSociability}</div>}
            {profile.performanceTraits?.humanSociability && <div><strong>Human Sociability:</strong> {profile.performanceTraits.humanSociability}</div>}
            {profile.performanceTraits?.predatoryBehavior && <div><strong>Predatory:</strong> {profile.performanceTraits.predatoryBehavior}</div>}
            {profile.performanceTraits?.wanderlust && <div><strong>Wanderlust:</strong> {profile.performanceTraits.wanderlust}</div>}
          </div>
        </div>
      )}

      {/* Body Features */}
      {hasBodyData && (
        <div>
          <h4 className="font-semibold mb-2">Body Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {profile.bodyFeatures?.tailLength && <div><strong>Tail:</strong> {profile.bodyFeatures.tailLength}</div>}
            {profile.bodyFeatures?.earType && <div><strong>Ears:</strong> {profile.bodyFeatures.earType}</div>}
            {profile.bodyFeatures?.muzzleLength && <div><strong>Muzzle:</strong> {profile.bodyFeatures.muzzleLength}</div>}
            {profile.bodyFeatures?.legLength && <div><strong>Legs:</strong> {profile.bodyFeatures.legLength}</div>}
            {profile.bodyFeatures?.bodySize && <div><strong>Size:</strong> {profile.bodyFeatures.bodySize}</div>}
            {profile.bodyFeatures?.backType && <div><strong>Back:</strong> {profile.bodyFeatures.backType}</div>}
          </div>
        </div>
      )}

      {/* Medical */}
      {profile.medical && (
        <div>
          <h4 className="font-semibold mb-2">Medical Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {profile.medical.bloodType && <div><strong>Blood Type:</strong> {profile.medical.bloodType}</div>}
            {profile.medical.mdr1 && profile.medical.mdr1 !== 'not_tested' && (
              <div className="flex gap-2 items-center">
                <strong>MDR1:</strong> {getResultBadge(profile.medical.mdr1)}
              </div>
            )}
            {profile.medical.dmGenotype && <div><strong>DM Genotype:</strong> {profile.medical.dmGenotype}</div>}
          </div>
        </div>
      )}

      {/* COI */}
      {profile.coi && (
        <div>
          <h4 className="font-semibold mb-2">Coefficient of Inbreeding</h4>
          <div className="text-sm">
            <strong>{profile.coi}%</strong>
          </div>
        </div>
      )}

      {/* Notes */}
      {profile.notes && (
        <div>
          <h4 className="font-semibold mb-2">Notes</h4>
          <p className="text-sm text-muted-foreground">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}
