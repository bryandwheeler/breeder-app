// Puppy Detail Dialog - Shows full puppy details including evaluations
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Puppy,
  Buyer,
  WaitlistEntry,
  PuppyEvaluation,
  isVolhardEvaluation,
  isAPETEvaluation,
  isFlinksEvaluation,
  VOLHARD_INTERPRETATIONS,
  FLINKS_POTENTIAL_THRESHOLDS,
} from '@breeder/types';
import { useEvaluationStore } from '@breeder/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';
import {
  User,
  Users,
  ClipboardList,
  BarChart3,
  Shield,
  Calendar,
  Scale,
  FileText,
  ExternalLink,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  getVolhardInterpretationColor,
  getWorkingPotentialColor,
} from '@/lib/evaluationCalculations';

interface PuppyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puppy: Puppy;
  litterId: string;
  buyer?: Buyer;
  waitlistEntry?: WaitlistEntry;
  onEdit?: (puppy: Puppy) => void;
}

export function PuppyDetailDialog({
  open,
  onOpenChange,
  puppy,
  litterId,
  buyer,
  waitlistEntry,
  onEdit,
}: PuppyDetailDialogProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  const { evaluations, fetchPuppyEvaluations, getEvaluationsForPuppy } = useEvaluationStore();

  // Fetch evaluations when dialog opens
  useEffect(() => {
    if (open && puppy.id && litterId) {
      setLoadingEvaluations(true);
      fetchPuppyEvaluations(litterId, puppy.id)
        .finally(() => setLoadingEvaluations(false));
    }
  }, [open, puppy.id, litterId, fetchPuppyEvaluations]);

  const puppyEvaluations = getEvaluationsForPuppy(puppy.id);

  const getStatusColor = (status: Puppy['status']) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'pending':
      case 'reserved':
        return 'secondary';
      case 'sold':
      case 'unavailable':
        return 'outline';
      case 'kept':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Puppy['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  const renderEvaluationSummary = (evaluation: PuppyEvaluation) => {
    if (isVolhardEvaluation(evaluation)) {
      const interpretation = VOLHARD_INTERPRETATIONS[evaluation.interpretation];
      return (
        <div className="flex items-center gap-2">
          <Badge className={getVolhardInterpretationColor(evaluation.interpretation)}>
            {interpretation?.title ?? evaluation.interpretation?.replace(/_/g, ' ') ?? 'Unknown'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Avg: {evaluation.averageScore.toFixed(1)}/6
          </span>
        </div>
      );
    }

    if (isAPETEvaluation(evaluation)) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {evaluation.traitProfile.length} traits
          </Badge>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {evaluation.idealHomeDescription?.slice(0, 50)}...
          </span>
        </div>
      );
    }

    if (isFlinksEvaluation(evaluation)) {
      const potentialInfo = FLINKS_POTENTIAL_THRESHOLDS[evaluation.workingDogPotential];
      return (
        <div className="flex items-center gap-2">
          <Badge className={getWorkingPotentialColor(evaluation.workingDogPotential)}>
            {evaluation.workingDogPotential?.replace('_', ' ') ?? 'Unknown'} potential
          </Badge>
          <span className="text-sm text-muted-foreground">
            Score: {evaluation.totalScore}/25
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {puppy.name || puppy.tempName || 'Unnamed Puppy'}
                  {puppy.collar && (
                    <Badge variant="outline" className="text-xs">
                      {puppy.collar} Collar
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="flex gap-2 mt-1">
                  <Badge variant={getStatusColor(puppy.status)}>
                    {getStatusLabel(puppy.status)}
                  </Badge>
                  {puppy.isDeceased && (
                    <Badge variant="destructive">Deceased</Badge>
                  )}
                  <Badge variant="outline">
                    {puppy.sex === 'male' ? '♂ Male' : '♀ Female'}
                  </Badge>
                  <Badge variant="outline">{puppy.color}</Badge>
                </DialogDescription>
              </div>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(puppy)}>
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="evaluations" className="flex items-center gap-1">
                Evaluations
                {puppyEvaluations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {puppyEvaluations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Photos */}
              {puppy.photos && puppy.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {puppy.photos.slice(0, 3).map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setGalleryInitialIndex(index);
                        setGalleryOpen(true);
                      }}
                      className="relative group"
                    >
                      <img
                        src={photo}
                        alt={`${puppy.name || 'Puppy'} ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition" />
                    </button>
                  ))}
                  {puppy.photos.length > 3 && (
                    <button
                      onClick={() => {
                        setGalleryInitialIndex(3);
                        setGalleryOpen(true);
                      }}
                      className="flex items-center justify-center bg-gray-100 rounded-lg h-24 text-sm text-muted-foreground hover:bg-gray-200 transition"
                    >
                      +{puppy.photos.length - 3} more
                    </button>
                  )}
                </div>
              )}

              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {puppy.weight && (
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Weight:</strong> {puppy.weight} {puppy.weightUnit || 'lbs'}</span>
                    </div>
                  )}
                  {puppy.microchip && (
                    <div>
                      <strong>Microchip:</strong> {puppy.microchip}
                    </div>
                  )}
                  {puppy.salePrice && (
                    <div>
                      <strong>Sale Price:</strong> ${puppy.salePrice.toLocaleString()}
                    </div>
                  )}
                  {puppy.depositAmount && (
                    <div className="flex items-center gap-2">
                      <strong>Deposit:</strong> ${puppy.depositAmount.toLocaleString()}
                      {puppy.depositPaid && (
                        <Badge variant="default" className="text-xs">Paid</Badge>
                      )}
                    </div>
                  )}
                  {puppy.pickupDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Pickup Date:</strong> {format(new Date(puppy.pickupDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Owner/Buyer Info */}
              {(buyer || waitlistEntry) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {buyer ? 'Buyer Information' : 'Waitlist Assignment'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {buyer && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <User className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{buyer.name}</div>
                          <div className="text-sm text-muted-foreground">{buyer.email}</div>
                          {buyer.phone && (
                            <div className="text-sm text-muted-foreground">{buyer.phone}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {waitlistEntry && !buyer && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-100">{waitlistEntry.name}</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">{waitlistEntry.email}</div>
                          <div className="text-xs text-blue-500">From Waitlist</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {(puppy.contractDocument || puppy.healthGuaranteeDocument) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {puppy.contractDocument && (
                      <a
                        href={puppy.contractDocument.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 transition"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium text-green-900 dark:text-green-100 text-sm">Contract</div>
                          <div className="text-xs text-green-600 truncate">{puppy.contractDocument.name}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-green-600" />
                      </a>
                    )}
                    {puppy.healthGuaranteeDocument && (
                      <a
                        href={puppy.healthGuaranteeDocument.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition"
                      >
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">Health Guarantee</div>
                          <div className="text-xs text-blue-600 truncate">{puppy.healthGuaranteeDocument.name}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {puppy.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{puppy.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Evaluations Tab */}
            <TabsContent value="evaluations" className="mt-4">
              {loadingEvaluations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : puppyEvaluations.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No evaluations yet for this puppy.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start an evaluation from the Evaluations tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {puppyEvaluations.map((evaluation) => (
                    <Card key={evaluation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getTestTypeIcon(evaluation.testType)}
                            </div>
                            <div>
                              <div className="font-medium">
                                {getTestTypeName(evaluation.testType)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(evaluation.evaluationDate), 'MMM d, yyyy')} • by {evaluation.evaluatorName}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          {renderEvaluationSummary(evaluation)}
                        </div>

                        {/* Show key results based on test type */}
                        {isVolhardEvaluation(evaluation) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-2">Score Distribution</div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5, 6].map((score) => (
                                <div
                                  key={score}
                                  className="flex-1 text-center py-1 bg-gray-100 rounded text-xs"
                                  title={`Score ${score}`}
                                >
                                  {evaluation.scoreDistribution[score as 1|2|3|4|5|6]}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isAPETEvaluation(evaluation) && evaluation.trainingPriorityAreas.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-2">Training Priorities</div>
                            <div className="flex flex-wrap gap-1">
                              {evaluation.trainingPriorityAreas.slice(0, 3).map((area, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                              {evaluation.trainingPriorityAreas.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{evaluation.trainingPriorityAreas.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {isFlinksEvaluation(evaluation) && evaluation.recommendedDisciplines.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-2">Recommended Disciplines</div>
                            <div className="flex flex-wrap gap-1">
                              {evaluation.recommendedDisciplines.map((disc, i) => (
                                <Badge key={i} variant="outline" className="text-xs capitalize">
                                  {disc.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {evaluation.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Notes</div>
                            <p className="text-sm">{evaluation.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      {puppy.photos && puppy.photos.length > 0 && (
        <ImageGalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          images={puppy.photos}
          initialIndex={galleryInitialIndex}
          title={`${puppy.name || 'Puppy'}'s Photos`}
        />
      )}
    </>
  );
}
