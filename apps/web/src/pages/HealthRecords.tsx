import { useDogStore } from '@breeder/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Syringe,
  FileText,
  ArrowRight
} from 'lucide-react';

interface DogHealthStatus {
  dogId: string;
  dogName: string;
  lastVaccination?: string;
  nextVaccinationDue?: string;
  lastVetVisit?: string;
  vaccinationStatus: 'up-to-date' | 'due-soon' | 'overdue' | 'none';
  vetVisitStatus: 'recent' | 'due-soon' | 'overdue' | 'none';
  totalVaccinations: number;
  totalVetVisits: number;
  daysUntilNextVaccination?: number;
  daysSinceLastVetVisit?: number;
}

export function HealthRecords() {
  const { dogs } = useDogStore();
  const navigate = useNavigate();

  const calculateHealthStatus = (): DogHealthStatus[] => {
    const today = new Date();

    return dogs.map((dog) => {
      const status: DogHealthStatus = {
        dogId: dog.id,
        dogName: dog.name,
        vaccinationStatus: 'none',
        vetVisitStatus: 'none',
        totalVaccinations: dog.shotRecords?.length || 0,
        totalVetVisits: dog.vetVisits?.length || 0,
      };

      // Check vaccinations
      if (dog.shotRecords && dog.shotRecords.length > 0) {
        const sortedShots = [...dog.shotRecords].sort(
          (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
        );

        status.lastVaccination = sortedShots[0].dateGiven;

        // Find next due vaccination
        const shotsWithDueDate = dog.shotRecords
          .filter((shot) => shot.dueDate)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

        if (shotsWithDueDate.length > 0) {
          const nextDue = new Date(shotsWithDueDate[0].dueDate!);
          status.nextVaccinationDue = shotsWithDueDate[0].dueDate;

          const daysUntil = Math.floor((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          status.daysUntilNextVaccination = daysUntil;

          if (daysUntil < 0) {
            status.vaccinationStatus = 'overdue';
          } else if (daysUntil <= 30) {
            status.vaccinationStatus = 'due-soon';
          } else {
            status.vaccinationStatus = 'up-to-date';
          }
        } else {
          status.vaccinationStatus = 'up-to-date';
        }
      }

      // Check vet visits
      if (dog.vetVisits && dog.vetVisits.length > 0) {
        const sortedVisits = [...dog.vetVisits].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        status.lastVetVisit = sortedVisits[0].date;
        const lastVisitDate = new Date(sortedVisits[0].date);
        const daysSince = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        status.daysSinceLastVetVisit = daysSince;

        // Vet visit every 12 months recommended
        if (daysSince > 365) {
          status.vetVisitStatus = 'overdue';
        } else if (daysSince > 335) { // 30 days before 1 year
          status.vetVisitStatus = 'due-soon';
        } else {
          status.vetVisitStatus = 'recent';
        }
      }

      return status;
    });
  };

  const healthStatuses = calculateHealthStatus();

  // Summary stats
  const totalDogs = healthStatuses.length;
  const upToDate = healthStatuses.filter(
    (s) => s.vaccinationStatus === 'up-to-date' && s.vetVisitStatus === 'recent'
  ).length;
  const dueSoon = healthStatuses.filter(
    (s) => s.vaccinationStatus === 'due-soon' || s.vetVisitStatus === 'due-soon'
  ).length;
  const overdue = healthStatuses.filter(
    (s) => s.vaccinationStatus === 'overdue' || s.vetVisitStatus === 'overdue'
  ).length;

  const getVaccinationBadge = (status: string) => {
    switch (status) {
      case 'up-to-date':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Up to Date
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Due Soon
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            No Records
          </Badge>
        );
    }
  };

  const getVetVisitBadge = (status: string) => {
    switch (status) {
      case 'recent':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Recent
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Due Soon
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            No Visits
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health Records</h1>
        <p className="text-muted-foreground">
          Track vaccination and health check status for all dogs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dogs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Up to Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {upToDate}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {dueSoon}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dog Health Status List */}
      <div className="space-y-4">
        {healthStatuses.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No dogs in your program yet.</p>
                <Button
                  variant="default"
                  className="mt-4"
                  onClick={() => navigate('/dogs')}
                >
                  Add Your First Dog
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          healthStatuses.map((status) => (
            <Card
              key={status.dogId}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/dogs/${status.dogId}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{status.dogName}</CardTitle>
                    <CardDescription className="mt-1">
                      {status.totalVaccinations} vaccination{status.totalVaccinations !== 1 ? 's' : ''} • {status.totalVetVisits} vet visit{status.totalVetVisits !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vaccination Status */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Syringe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Vaccinations</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getVaccinationBadge(status.vaccinationStatus)}
                    </div>
                    {status.lastVaccination && (
                      <p className="text-sm text-muted-foreground">
                        Last: {new Date(status.lastVaccination).toLocaleDateString()}
                      </p>
                    )}
                    {status.nextVaccinationDue && (
                      <p className="text-sm text-muted-foreground">
                        Next due: {new Date(status.nextVaccinationDue).toLocaleDateString()}
                        {status.daysUntilNextVaccination !== undefined && (
                          <span className={
                            status.daysUntilNextVaccination < 0
                              ? 'text-red-600 dark:text-red-400 font-medium ml-2'
                              : status.daysUntilNextVaccination <= 30
                              ? 'text-yellow-600 dark:text-yellow-400 font-medium ml-2'
                              : 'ml-2'
                          }>
                            ({status.daysUntilNextVaccination < 0
                              ? `${Math.abs(status.daysUntilNextVaccination)} days overdue`
                              : `in ${status.daysUntilNextVaccination} days`})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Vet Visit Status */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Vet Checkup</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getVetVisitBadge(status.vetVisitStatus)}
                    </div>
                    {status.lastVetVisit && (
                      <p className="text-sm text-muted-foreground">
                        Last visit: {new Date(status.lastVetVisit).toLocaleDateString()}
                        {status.daysSinceLastVetVisit !== undefined && (
                          <span className={
                            status.daysSinceLastVetVisit > 365
                              ? 'text-red-600 dark:text-red-400 font-medium ml-2'
                              : status.daysSinceLastVetVisit > 335
                              ? 'text-yellow-600 dark:text-yellow-400 font-medium ml-2'
                              : 'ml-2'
                          }>
                            ({status.daysSinceLastVetVisit} days ago)
                          </span>
                        )}
                      </p>
                    )}
                    {!status.lastVetVisit && (
                      <p className="text-sm text-muted-foreground">
                        No vet visits recorded
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
