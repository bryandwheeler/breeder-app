import { Puppy, Litter, Dog } from '@/types/dog';
import { format } from 'date-fns';

interface RegistrationExportData {
  litter: Litter;
  dam: Dog;
  sire: Dog;
  puppies: Puppy[];
}

/**
 * Export registration data to CSV format for bulk registration submissions
 */
export function exportRegistrationToCSV(data: RegistrationExportData): void {
  const { litter, dam, sire, puppies } = data;

  // Filter puppies that need registration
  const puppiesForRegistration = puppies.filter(
    (p) => p.registration && p.registration.registrationType !== 'none'
  );

  if (puppiesForRegistration.length === 0) {
    alert('No puppies with active registration found in this litter');
    return;
  }

  // CSV Headers - Common fields for AKC litter registration
  const headers = [
    'Puppy Name',
    'Registered Name',
    'Sex',
    'Color',
    'Microchip',
    'Date of Birth',
    'Dam Name',
    'Dam Registration #',
    'Sire Name',
    'Sire Registration #',
    'Registry',
    'Registration Type',
    'Status',
    'Registration Number',
    'Buyer Name',
    'Buyer Email',
    'Buyer Phone',
    'Application Date',
    'Submission Date',
    'Deadline',
  ];

  // Build CSV rows
  const rows = puppiesForRegistration.map((puppy) => {
    const reg = puppy.registration!;

    return [
      puppy.name || puppy.tempName || '',
      reg.registeredName || '',
      puppy.sex === 'male' ? 'Male' : 'Female',
      puppy.color,
      puppy.microchip || '',
      format(new Date(litter.dateOfBirth), 'MM/dd/yyyy'),
      dam.name,
      dam.registration?.registrationNumber || '',
      sire.name,
      sire.registration?.registrationNumber || '',
      reg.registry,
      reg.registrationType === 'limited' ? 'Limited' : 'Full',
      reg.status,
      reg.registrationNumber || '',
      '', // Buyer name - would need to be fetched from litter.buyers
      '', // Buyer email
      '', // Buyer phone
      reg.applicationDate || '',
      reg.submissionDate || '',
      reg.registrationDeadline || '',
    ];
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `registration_export_${litter.litterName || 'litter'}_${format(new Date(), 'yyyyMMdd')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export registration summary report
 */
export function exportRegistrationSummary(data: RegistrationExportData): void {
  const { litter, dam, sire, puppies } = data;

  let reportContent = `REGISTRATION SUMMARY REPORT\n`;
  reportContent += `Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}\n`;
  reportContent += `\n`;
  reportContent += `LITTER INFORMATION\n`;
  reportContent += `==================\n`;
  reportContent += `Litter Name: ${litter.litterName || 'N/A'}\n`;
  reportContent += `Date of Birth: ${format(new Date(litter.dateOfBirth), 'MMMM d, yyyy')}\n`;
  reportContent += `Dam: ${dam.name}${dam.registration?.registrationNumber ? ` (${dam.registration.registrationNumber})` : ''}\n`;
  reportContent += `Sire: ${sire.name}${sire.registration?.registrationNumber ? ` (${sire.registration.registrationNumber})` : ''}\n`;
  reportContent += `\n`;

  if (litter.litterRegistration) {
    reportContent += `LITTER REGISTRATION\n`;
    reportContent += `===================\n`;
    reportContent += `Registry: ${litter.litterRegistration.registry}\n`;
    reportContent += `Litter Number: ${litter.litterRegistration.litterNumber || 'Pending'}\n`;
    reportContent += `Status: ${litter.litterRegistration.status}\n`;
    reportContent += `\n`;
  }

  reportContent += `PUPPY REGISTRATIONS\n`;
  reportContent += `===================\n`;
  reportContent += `Total Puppies: ${puppies.length}\n`;
  reportContent += `\n`;

  // Group by status
  const statusGroups = {
    'Not Started': puppies.filter((p) => !p.registration || p.registration.status === 'not_started'),
    'Pending': puppies.filter((p) => p.registration?.status === 'pending'),
    'Submitted': puppies.filter((p) => p.registration?.status === 'submitted'),
    'Approved': puppies.filter((p) => p.registration?.status === 'approved'),
    'Issued': puppies.filter((p) => p.registration?.status === 'issued'),
  };

  Object.entries(statusGroups).forEach(([status, puppyList]) => {
    if (puppyList.length > 0) {
      reportContent += `${status} (${puppyList.length})\n`;
      reportContent += `-`.repeat(status.length + 5) + `\n`;

      puppyList.forEach((puppy) => {
        const reg = puppy.registration;
        reportContent += `  • ${puppy.name || puppy.tempName}\n`;
        reportContent += `    Sex: ${puppy.sex === 'male' ? 'Male' : 'Female'}, Color: ${puppy.color}\n`;

        if (reg && reg.registrationType !== 'none') {
          reportContent += `    Registry: ${reg.registry} (${reg.registrationType})\n`;
          if (reg.registeredName) {
            reportContent += `    Registered Name: ${reg.registeredName}\n`;
          }
          if (reg.registrationNumber) {
            reportContent += `    Registration #: ${reg.registrationNumber}\n`;
          }
          if (reg.registrationDeadline) {
            reportContent += `    Deadline: ${format(new Date(reg.registrationDeadline), 'MM/dd/yyyy')}\n`;
          }
        } else {
          reportContent += `    No Registration Required\n`;
        }
        reportContent += `\n`;
      });
    }
  });

  // Check for upcoming deadlines
  const now = new Date();
  const upcomingDeadlines = puppies
    .filter((p) => {
      if (!p.registration?.registrationDeadline) return false;
      const deadline = new Date(p.registration.registrationDeadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => {
      const dateA = new Date(a.registration!.registrationDeadline!);
      const dateB = new Date(b.registration!.registrationDeadline!);
      return dateA.getTime() - dateB.getTime();
    });

  if (upcomingDeadlines.length > 0) {
    reportContent += `\n`;
    reportContent += `UPCOMING DEADLINES (Next 30 Days)\n`;
    reportContent += `=================================\n`;
    upcomingDeadlines.forEach((puppy) => {
      const deadline = new Date(puppy.registration!.registrationDeadline!);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      reportContent += `  • ${puppy.name || puppy.tempName}: ${format(deadline, 'MM/dd/yyyy')}`;
      if (daysUntil === 0) {
        reportContent += ` (TODAY!)\n`;
      } else if (daysUntil === 1) {
        reportContent += ` (TOMORROW)\n`;
      } else {
        reportContent += ` (${daysUntil} days)\n`;
      }
    });
  }

  // Download the report
  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `registration_summary_${litter.litterName || 'litter'}_${format(new Date(), 'yyyyMMdd')}.txt`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export AKC Online Registration Format (if applicable)
 */
export function exportAKCFormat(data: RegistrationExportData): void {
  const { litter, dam, sire, puppies } = data;

  const akcPuppies = puppies.filter(
    (p) => p.registration?.registry === 'AKC' && p.registration.registrationType !== 'none'
  );

  if (akcPuppies.length === 0) {
    alert('No puppies registered with AKC found in this litter');
    return;
  }

  // AKC-specific format headers
  const headers = [
    'Puppy Call Name',
    'Registered Name',
    'Sex',
    'Color',
    'Markings',
    'Microchip Number',
    'Registration Type',
    'Owner Name',
    'Owner Email',
    'Owner Street Address',
    'Owner City',
    'Owner State',
    'Owner ZIP',
  ];

  const rows = akcPuppies.map((puppy) => {
    const reg = puppy.registration!;

    return [
      puppy.name || '',
      reg.registeredName || '',
      puppy.sex === 'male' ? 'M' : 'F',
      puppy.color,
      '', // Markings - would need additional field
      puppy.microchip || '',
      reg.registrationType === 'limited' ? 'L' : 'F',
      '', // Owner name - would need buyer info
      '', // Owner email
      '', // Owner address
      '', // Owner city
      '', // Owner state
      '', // Owner ZIP
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `AKC_litter_registration_${format(new Date(), 'yyyyMMdd')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
