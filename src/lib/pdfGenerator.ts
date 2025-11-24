import { jsPDF } from 'jspdf';
import { Puppy, Litter, Dog, Buyer, BreedingRights, CoOwnership } from '@/types/dog';
import { format } from 'date-fns';

interface ContractData {
  puppy: Puppy;
  litter: Litter;
  dam: Dog;
  sire: Dog;
  buyer: Buyer;
  kennelName: string;
  breederName: string;
  breederEmail?: string;
  breederPhone?: string;
  breederSignature?: string;
  buyerSignature?: string;
}

export function generatePuppyContract(data: ContractData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY SALES CONTRACT', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Kennel info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (data.breederName) {
    doc.text(data.breederName, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  if (data.breederEmail) {
    doc.text(data.breederEmail, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  y += 10;

  // Date
  doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, y);
  y += 15;

  // Parties section
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Seller (Breeder): ${data.breederName || data.kennelName}`, 20, y);
  y += 6;
  doc.text(`Buyer: ${data.buyer.name}`, 20, y);
  y += 6;
  if (data.buyer.address) {
    doc.text(`Address: ${data.buyer.address}`, 20, y);
    y += 6;
  }
  doc.text(`Email: ${data.buyer.email}`, 20, y);
  y += 6;
  if (data.buyer.phone) {
    doc.text(`Phone: ${data.buyer.phone}`, 20, y);
    y += 6;
  }
  y += 10;

  // Puppy details
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'TBD'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Dam (Mother): ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire (Father): ${data.sire.name}`, 20, y);
  y += 15;

  // Purchase details
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE DETAILS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  if (data.puppy.salePrice) {
    doc.text(`Sale Price: $${data.puppy.salePrice.toLocaleString()}`, 20, y);
    y += 6;
  }
  if (data.puppy.depositAmount) {
    doc.text(`Deposit: $${data.puppy.depositAmount.toLocaleString()} (${data.puppy.depositPaid ? 'PAID' : 'Pending'})`, 20, y);
    y += 6;
  }
  if (data.puppy.salePrice && data.puppy.depositAmount) {
    const balance = data.puppy.salePrice - data.puppy.depositAmount;
    doc.text(`Balance Due: $${balance.toLocaleString()}`, 20, y);
    y += 6;
  }
  y += 10;

  // Terms and conditions
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS AND CONDITIONS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const terms = [
    '1. The Buyer agrees to provide proper care, nutrition, shelter, and veterinary care for the puppy.',
    '2. The Buyer agrees to keep the puppy as a household pet and not use it for fighting or any illegal purposes.',
    '3. The Buyer agrees to have the puppy examined by a licensed veterinarian within 72 hours of pickup.',
    '4. The deposit is non-refundable unless the Seller is unable to provide the puppy.',
    '5. The Buyer agrees not to resell, transfer, or surrender the puppy without first contacting the Breeder.',
    '6. If for any reason the Buyer cannot keep the puppy, the Breeder must be given first right of refusal.',
  ];

  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 3;
  });

  y += 15;

  // Signature lines
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES:', 20, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.line(20, y, 90, y);
  doc.text('Seller Signature', 20, y + 6);
  doc.line(110, y, 180, y);
  doc.text('Date', 110, y + 6);
  y += 20;

  doc.line(20, y, 90, y);
  doc.text('Buyer Signature', 20, y + 6);
  doc.line(110, y, 180, y);
  doc.text('Date', 110, y + 6);

  // Save
  const filename = `Contract_${data.puppy.name || data.puppy.tempName || 'Puppy'}_${data.buyer.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

interface HealthGuaranteeData {
  puppy: Puppy;
  litter: Litter;
  dam: Dog;
  sire: Dog;
  buyer?: Buyer;
  kennelName: string;
  breederName: string;
  guaranteePeriod?: number; // in years
  breederSignature?: string;
  buyerSignature?: string;
}

export function generateHealthGuarantee(data: HealthGuaranteeData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const guaranteePeriod = data.guaranteePeriod || 2;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTH GUARANTEE', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Kennel info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (data.breederName) {
    doc.text(data.breederName, pageWidth / 2, y, { align: 'center' });
  }
  y += 15;

  // Date
  doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, y);
  y += 15;

  // Puppy details
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'TBD'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Dam (Mother): ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire (Father): ${data.sire.name}`, 20, y);
  y += 15;

  // Health tests of parents
  doc.setFont('helvetica', 'bold');
  doc.text('PARENT HEALTH TESTING:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (data.dam.healthTests && data.dam.healthTests.length > 0) {
    doc.text(`Dam (${data.dam.name}):`, 20, y);
    y += 5;
    data.dam.healthTests.forEach(test => {
      doc.text(`  • ${test.test}: ${test.result}`, 25, y);
      y += 5;
    });
    y += 3;
  }

  if (data.sire.healthTests && data.sire.healthTests.length > 0) {
    doc.text(`Sire (${data.sire.name}):`, 20, y);
    y += 5;
    data.sire.healthTests.forEach(test => {
      doc.text(`  • ${test.test}: ${test.result}`, 25, y);
      y += 5;
    });
  }
  y += 10;

  // Guarantee terms
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTH GUARANTEE TERMS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const guaranteeTerms = [
    `1. This health guarantee is valid for ${guaranteePeriod} year(s) from the date of purchase.`,
    '2. The puppy is guaranteed to be free from life-threatening genetic defects that would prevent it from living a normal life.',
    '3. The Buyer must have the puppy examined by a licensed veterinarian within 72 hours of pickup. If a serious health issue is found, the Buyer must notify the Breeder immediately.',
    '4. If a genetic condition is discovered within the guarantee period, the Buyer must provide veterinary documentation from a licensed veterinarian.',
    '5. At the Breeder\'s discretion, options may include: partial refund, replacement puppy, or assistance with veterinary costs.',
    '6. This guarantee does not cover: injuries, illnesses due to neglect, improper care, parasites, infections, or conditions resulting from lack of proper veterinary care.',
    '7. The Buyer must maintain regular veterinary care and follow recommended vaccination and deworming schedules.',
    '8. The Buyer must feed a high-quality diet appropriate for the breed and life stage.',
    '9. This guarantee is void if the puppy is bred before the age of 2 years or without appropriate health testing.',
  ];

  guaranteeTerms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 3;
  });

  y += 15;

  // Signature lines
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ACKNOWLEDGEMENT:', 20, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.line(20, y, 90, y);
  doc.text('Breeder Signature', 20, y + 6);
  doc.line(110, y, 180, y);
  doc.text('Date', 110, y + 6);
  y += 20;

  doc.line(20, y, 90, y);
  doc.text('Buyer Signature', 20, y + 6);
  doc.line(110, y, 180, y);
  doc.text('Date', 110, y + 6);

  // Save
  const filename = `HealthGuarantee_${data.puppy.name || data.puppy.tempName || 'Puppy'}.pdf`;
  doc.save(filename);
}

interface LitterRecordData {
  litter: Litter;
  dam: Dog;
  sire: Dog;
  kennelName: string;
}

export function generateLitterRecord(data: LitterRecordData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LITTER RECORD', pageWidth / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Litter info
  doc.setFont('helvetica', 'bold');
  doc.text('LITTER INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Litter Name: ${data.litter.litterName || 'N/A'}`, 20, y);
  y += 6;
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Status: ${data.litter.status}`, 20, y);
  y += 6;
  doc.text(`Total Puppies: ${data.litter.puppies?.length || 0}`, 20, y);
  y += 15;

  // Parents
  doc.setFont('helvetica', 'bold');
  doc.text('PARENTS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Dam: ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire: ${data.sire.name}`, 20, y);
  y += 15;

  // Puppies table
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPIES:', 20, y);
  y += 8;

  if (data.litter.puppies && data.litter.puppies.length > 0) {
    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Name', 20, y);
    doc.text('Sex', 60, y);
    doc.text('Color', 85, y);
    doc.text('Status', 120, y);
    doc.text('Microchip', 150, y);
    y += 6;
    doc.line(20, y - 2, 190, y - 2);

    doc.setFont('helvetica', 'normal');
    data.litter.puppies.forEach(puppy => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(puppy.name || puppy.tempName || '-', 20, y);
      doc.text(puppy.sex === 'male' ? 'M' : 'F', 60, y);
      doc.text(puppy.color || '-', 85, y);
      doc.text(puppy.status, 120, y);
      doc.text(puppy.microchip || '-', 150, y);
      y += 6;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('No puppies recorded', 20, y);
  }

  // Save
  const filename = `LitterRecord_${data.litter.litterName || data.litter.id}.pdf`;
  doc.save(filename);
}

// Signed versions with embedded signatures
export function generateSignedContract(data: ContractData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY SALES CONTRACT', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Kennel info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (data.breederName) {
    doc.text(data.breederName, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  y += 10;

  // Date
  doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, y);
  y += 15;

  // Parties section
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Seller (Breeder): ${data.breederName || data.kennelName}`, 20, y);
  y += 6;
  doc.text(`Buyer: ${data.buyer.name}`, 20, y);
  y += 6;
  if (data.buyer.address) {
    doc.text(`Address: ${data.buyer.address}`, 20, y);
    y += 6;
  }
  doc.text(`Email: ${data.buyer.email}`, 20, y);
  y += 6;
  if (data.buyer.phone) {
    doc.text(`Phone: ${data.buyer.phone}`, 20, y);
    y += 6;
  }
  y += 10;

  // Puppy details
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'TBD'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Dam (Mother): ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire (Father): ${data.sire.name}`, 20, y);
  y += 15;

  // Purchase details
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE DETAILS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  if (data.puppy.salePrice) {
    doc.text(`Sale Price: $${data.puppy.salePrice.toLocaleString()}`, 20, y);
    y += 6;
  }
  if (data.puppy.depositAmount) {
    doc.text(`Deposit: $${data.puppy.depositAmount.toLocaleString()} (${data.puppy.depositPaid ? 'PAID' : 'Pending'})`, 20, y);
    y += 6;
  }
  if (data.puppy.salePrice && data.puppy.depositAmount) {
    const balance = data.puppy.salePrice - data.puppy.depositAmount;
    doc.text(`Balance Due: $${balance.toLocaleString()}`, 20, y);
    y += 6;
  }
  y += 10;

  // Terms and conditions
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS AND CONDITIONS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const terms = [
    '1. The Buyer agrees to provide proper care, nutrition, shelter, and veterinary care for the puppy.',
    '2. The Buyer agrees to keep the puppy as a household pet and not use it for fighting or any illegal purposes.',
    '3. The Buyer agrees to have the puppy examined by a licensed veterinarian within 72 hours of pickup.',
    '4. The deposit is non-refundable unless the Seller is unable to provide the puppy.',
    '5. The Buyer agrees not to resell, transfer, or surrender the puppy without first contacting the Breeder.',
    '6. If for any reason the Buyer cannot keep the puppy, the Breeder must be given first right of refusal.',
  ];

  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 3;
  });

  y += 15;

  // Signature section with embedded signatures
  if (y > 200) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES:', 20, y);
  y += 10;

  const sigHeight = 30;
  const sigWidth = 70;

  // Breeder signature
  doc.setFont('helvetica', 'normal');
  doc.text('Seller:', 20, y);
  if (data.breederSignature) {
    try {
      doc.addImage(data.breederSignature, 'PNG', 20, y + 2, sigWidth, sigHeight);
    } catch {
      doc.line(20, y + sigHeight, 90, y + sigHeight);
    }
  } else {
    doc.line(20, y + sigHeight, 90, y + sigHeight);
  }
  doc.text(data.breederName || '', 20, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, y + sigHeight + 14);

  // Buyer signature
  doc.text('Buyer:', 110, y);
  if (data.buyerSignature) {
    try {
      doc.addImage(data.buyerSignature, 'PNG', 110, y + 2, sigWidth, sigHeight);
    } catch {
      doc.line(110, y + sigHeight, 180, y + sigHeight);
    }
  } else {
    doc.line(110, y + sigHeight, 180, y + sigHeight);
  }
  doc.text(data.buyer.name, 110, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 110, y + sigHeight + 14);

  // Digital signature notice
  y += sigHeight + 25;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('This document has been digitally signed.', pageWidth / 2, y, { align: 'center' });

  // Save
  const filename = `Contract_Signed_${data.puppy.name || data.puppy.tempName || 'Puppy'}_${data.buyer.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

// Puppy health record for buyers
interface PuppyHealthRecordData {
  puppy: Puppy;
  litter: Litter;
  dam: Dog;
  sire: Dog;
  kennelName: string;
}

export function generatePuppyHealthRecord(data: PuppyHealthRecordData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY HEALTH RECORD', pageWidth / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Puppy info
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'N/A'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Dam: ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire: ${data.sire.name}`, 20, y);
  y += 15;

  // Vaccinations
  doc.setFont('helvetica', 'bold');
  doc.text('VACCINATION RECORD:', 20, y);
  y += 8;

  if (data.puppy.shotRecords && data.puppy.shotRecords.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Vaccine', 20, y);
    doc.text('Date Given', 80, y);
    doc.text('Next Due', 130, y);
    y += 6;
    doc.line(20, y - 2, 180, y - 2);

    doc.setFont('helvetica', 'normal');
    data.puppy.shotRecords.forEach(shot => {
      doc.text(shot.vaccine, 20, y);
      doc.text(format(new Date(shot.dateGiven), 'MM/dd/yyyy'), 80, y);
      doc.text(shot.dueDate ? format(new Date(shot.dueDate), 'MM/dd/yyyy') : '-', 130, y);
      y += 6;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('No vaccinations recorded', 20, y);
    y += 6;
  }
  y += 10;

  // Weight History
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('WEIGHT HISTORY:', 20, y);
  y += 8;

  if (data.puppy.weightHistory && data.puppy.weightHistory.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 20, y);
    doc.text('Weight', 80, y);
    y += 6;
    doc.line(20, y - 2, 120, y - 2);

    doc.setFont('helvetica', 'normal');
    const sortedWeights = [...data.puppy.weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    sortedWeights.forEach(entry => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(format(new Date(entry.date), 'MM/dd/yyyy'), 20, y);
      doc.text(`${entry.weight} ${entry.unit}`, 80, y);
      y += 6;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('No weight records', 20, y);
    y += 6;
  }
  y += 10;

  // Parent Health Tests
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PARENT HEALTH CLEARANCES:', 20, y);
  y += 8;
  doc.setFontSize(10);

  if (data.dam.healthTests && data.dam.healthTests.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Dam (${data.dam.name}):`, 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    data.dam.healthTests.forEach(test => {
      doc.text(`  • ${test.test}: ${test.result}`, 25, y);
      y += 5;
    });
    y += 5;
  }

  if (data.sire.healthTests && data.sire.healthTests.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Sire (${data.sire.name}):`, 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    data.sire.healthTests.forEach(test => {
      doc.text(`  • ${test.test}: ${test.result}`, 25, y);
      y += 5;
    });
  }

  // Footer
  y = 280;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')} by ${data.kennelName}`, pageWidth / 2, y, { align: 'center' });

  const filename = `HealthRecord_${data.puppy.name || data.puppy.tempName || 'Puppy'}.pdf`;
  doc.save(filename);
}

export function generateSignedHealthGuarantee(data: HealthGuaranteeData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const guaranteePeriod = data.guaranteePeriod || 2;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTH GUARANTEE', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Kennel info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (data.breederName) {
    doc.text(data.breederName, pageWidth / 2, y, { align: 'center' });
  }
  y += 15;

  // Date
  doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, y);
  y += 15;

  // Puppy details
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'TBD'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Dam (Mother): ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire (Father): ${data.sire.name}`, 20, y);
  y += 15;

  // Guarantee terms (abbreviated for space)
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTH GUARANTEE TERMS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const guaranteeTerms = [
    `1. This health guarantee is valid for ${guaranteePeriod} year(s) from the date of purchase.`,
    '2. The puppy is guaranteed to be free from life-threatening genetic defects.',
    '3. The Buyer must have the puppy examined by a veterinarian within 72 hours of pickup.',
    '4. If a genetic condition is discovered, the Buyer must provide veterinary documentation.',
    '5. This guarantee does not cover injuries, illnesses due to neglect, or improper care.',
    '6. The Buyer must maintain regular veterinary care and proper nutrition.',
  ];

  guaranteeTerms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 3;
  });

  y += 15;

  // Signature section
  if (y > 200) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ACKNOWLEDGEMENT:', 20, y);
  y += 10;

  const sigHeight = 30;
  const sigWidth = 70;

  // Breeder signature
  doc.setFont('helvetica', 'normal');
  doc.text('Breeder:', 20, y);
  if (data.breederSignature) {
    try {
      doc.addImage(data.breederSignature, 'PNG', 20, y + 2, sigWidth, sigHeight);
    } catch {
      doc.line(20, y + sigHeight, 90, y + sigHeight);
    }
  } else {
    doc.line(20, y + sigHeight, 90, y + sigHeight);
  }
  doc.text(data.breederName || '', 20, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, y + sigHeight + 14);

  // Buyer signature
  doc.text('Buyer:', 110, y);
  if (data.buyerSignature) {
    try {
      doc.addImage(data.buyerSignature, 'PNG', 110, y + 2, sigWidth, sigHeight);
    } catch {
      doc.line(110, y + sigHeight, 180, y + sigHeight);
    }
  } else {
    doc.line(110, y + sigHeight, 180, y + sigHeight);
  }
  if (data.buyer) {
    doc.text(data.buyer.name, 110, y + sigHeight + 8);
  }
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 110, y + sigHeight + 14);

  // Digital signature notice
  y += sigHeight + 25;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('This document has been digitally signed.', pageWidth / 2, y, { align: 'center' });

  // Save
  const filename = `HealthGuarantee_Signed_${data.puppy.name || data.puppy.tempName || 'Puppy'}.pdf`;
  doc.save(filename);
}

// Breeding Rights Contract
export function generateBreedingRightsContract(data: ContractData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const breedingRights = data.puppy.breedingRights;

  if (!breedingRights) {
    console.error('No breeding rights data provided');
    return;
  }

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BREEDING RIGHTS CONTRACT', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Kennel info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (data.breederName) {
    doc.text(data.breederName, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  y += 10;

  // Date
  doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, y);
  y += 15;

  // Parties
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Breeder (Seller): ${data.breederName || data.kennelName}`, 20, y);
  y += 6;
  doc.text(`Buyer: ${data.buyer.name}`, 20, y);
  y += 6;
  if (data.buyer.address) {
    doc.text(`Address: ${data.buyer.address}`, 20, y);
    y += 6;
  }
  doc.text(`Email: ${data.buyer.email}`, 20, y);
  y += 6;
  if (data.buyer.phone) {
    doc.text(`Phone: ${data.buyer.phone}`, 20, y);
    y += 6;
  }
  y += 10;

  // Puppy details
  doc.setFont('helvetica', 'bold');
  doc.text('PUPPY INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'TBD'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Dam: ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire: ${data.sire.name}`, 20, y);
  y += 15;

  // Purchase details
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE DETAILS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  if (data.puppy.salePrice) {
    doc.text(`Sale Price (with Breeding Rights): $${data.puppy.salePrice.toLocaleString()}`, 20, y);
    y += 6;
  }
  y += 10;

  // Breeding rights terms
  doc.setFont('helvetica', 'bold');
  doc.text('BREEDING RIGHTS AND CONDITIONS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const breedingTerms: string[] = [];

  // Minimum breeding age
  if (breedingRights.minimumBreedingAge) {
    breedingTerms.push(
      `1. MINIMUM BREEDING AGE: The puppy may not be bred until it reaches ${breedingRights.minimumBreedingAge} months of age.`
    );
  } else {
    breedingTerms.push(
      '1. MINIMUM BREEDING AGE: The puppy may not be bred until it reaches 24 months of age.'
    );
  }

  // Required health tests
  if (breedingRights.requiredHealthTests && breedingRights.requiredHealthTests.length > 0) {
    breedingTerms.push(
      `2. REQUIRED HEALTH TESTING: Before breeding, the following health clearances must be obtained: ${breedingRights.requiredHealthTests.join(', ')}. Copies of all clearances must be provided to the Breeder.`
    );
  } else {
    breedingTerms.push(
      '2. REQUIRED HEALTH TESTING: The dog must receive appropriate breed-specific health testing and clearances before being bred.'
    );
  }

  // Breeder approval
  if (breedingRights.requiresBreederApproval) {
    breedingTerms.push(
      '3. BREEDING APPROVAL: The Buyer must obtain written approval from the Breeder before breeding. This includes approval of the proposed mate.'
    );
  }

  // Litter return agreement
  if (breedingRights.litterReturnAgreement) {
    const pickText = breedingRights.pickOfLitter === 'first'
      ? 'first pick'
      : breedingRights.pickOfLitter === 'second'
      ? 'second pick'
      : 'pick';
    breedingTerms.push(
      `4. LITTER AGREEMENT: The Breeder shall receive ${pickText} of any litter produced by this dog. The Breeder's pick must be provided at no cost to the Breeder.`
    );
  }

  // Max litters
  if (breedingRights.maxLitters) {
    breedingTerms.push(
      `5. MAXIMUM LITTERS: This dog may produce a maximum of ${breedingRights.maxLitters} litter(s). After the final litter, the dog must be spayed/neutered.`
    );
  }

  // Spay/neuter age
  if (breedingRights.spayNeuterByAge) {
    breedingTerms.push(
      `6. SPAY/NEUTER REQUIREMENT: If the dog is not bred, or after completing the allowed litters, the dog must be spayed/neutered by ${breedingRights.spayNeuterByAge} months of age.`
    );
  }

  // Restrictions
  if (breedingRights.restrictions && breedingRights.restrictions.length > 0) {
    breedingTerms.push('7. ADDITIONAL RESTRICTIONS:');
    breedingRights.restrictions.forEach((restriction, index) => {
      breedingTerms.push(`   ${String.fromCharCode(97 + index)}. ${restriction}`);
    });
  }

  // General terms
  breedingTerms.push(
    '8. REGISTRATION: The Buyer agrees to register all litters with the appropriate registry and to provide the Breeder with copies of registration papers.',
    '9. RECORD KEEPING: The Buyer agrees to maintain accurate records of all breedings, including dates, mates, and litter outcomes.',
    '10. QUALITY STANDARD: The Buyer agrees to only breed to mates that meet or exceed the breed standard and have appropriate health clearances.',
    '11. RESPONSIBLE PLACEMENT: The Buyer agrees to screen all puppy buyers carefully and to provide the Breeder with information about puppy placements upon request.',
    '12. RIGHT OF REFUSAL: If the Buyer can no longer keep or breed this dog, the Breeder must be given first right of refusal to take the dog back.',
    '13. VIOLATION: Failure to comply with any terms of this breeding rights agreement may result in legal action and/or revocation of breeding rights.'
  );

  // Additional terms
  if (breedingRights.additionalTerms) {
    breedingTerms.push(`14. ADDITIONAL TERMS: ${breedingRights.additionalTerms}`);
  }

  breedingTerms.forEach((term) => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 3;
  });

  y += 15;

  // Signature section
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES:', 20, y);
  y += 10;

  const sigHeight = 30;

  doc.setFont('helvetica', 'normal');
  doc.text('Breeder:', 20, y);
  if (data.breederSignature) {
    try {
      doc.addImage(data.breederSignature, 'PNG', 20, y + 2, 70, sigHeight);
    } catch {
      doc.line(20, y + sigHeight, 90, y + sigHeight);
    }
  } else {
    doc.line(20, y + sigHeight, 90, y + sigHeight);
  }
  doc.text(data.breederName || '', 20, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, y + sigHeight + 14);

  doc.text('Buyer:', 110, y);
  if (data.buyerSignature) {
    try {
      doc.addImage(data.buyerSignature, 'PNG', 110, y + 2, 70, sigHeight);
    } catch {
      doc.line(110, y + sigHeight, 180, y + sigHeight);
    }
  } else {
    doc.line(110, y + sigHeight, 180, y + sigHeight);
  }
  doc.text(data.buyer.name, 110, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 110, y + sigHeight + 14);

  y += sigHeight + 25;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('This document has been digitally signed.', pageWidth / 2, y, { align: 'center' });

  const filename = `BreedingRights_${data.puppy.name || data.puppy.tempName || 'Puppy'}_${data.buyer.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

// Co-Ownership Contract
export function generateCoOwnershipContract(data: ContractData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const coOwnership = data.puppy.coOwnership;

  if (!coOwnership) {
    console.error('No co-ownership data provided');
    return;
  }

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CO-OWNERSHIP AGREEMENT', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Kennel info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kennelName, pageWidth / 2, y, { align: 'center' });
  y += 6;
  if (data.breederName) {
    doc.text(data.breederName, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  y += 10;

  // Date
  doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, y);
  y += 15;

  // Parties
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Owner 1 (Breeder): ${data.breederName || data.kennelName}`, 20, y);
  y += 6;
  doc.text(`Owner 2 (Co-Owner): ${coOwnership.coOwnerName}`, 20, y);
  y += 6;
  if (coOwnership.coOwnerAddress) {
    doc.text(`Address: ${coOwnership.coOwnerAddress}`, 20, y);
    y += 6;
  }
  if (coOwnership.coOwnerEmail) {
    doc.text(`Email: ${coOwnership.coOwnerEmail}`, 20, y);
    y += 6;
  }
  if (coOwnership.coOwnerPhone) {
    doc.text(`Phone: ${coOwnership.coOwnerPhone}`, 20, y);
    y += 6;
  }
  y += 10;

  // Puppy details
  doc.setFont('helvetica', 'bold');
  doc.text('DOG INFORMATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.puppy.name || data.puppy.tempName || 'TBD'}`, 20, y);
  y += 6;
  doc.text(`Sex: ${data.puppy.sex === 'male' ? 'Male' : 'Female'}`, 20, y);
  y += 6;
  doc.text(`Color: ${data.puppy.color}`, 20, y);
  y += 6;
  if (data.puppy.microchip) {
    doc.text(`Microchip: ${data.puppy.microchip}`, 20, y);
    y += 6;
  }
  doc.text(`Date of Birth: ${format(new Date(data.litter.dateOfBirth), 'MMMM d, yyyy')}`, 20, y);
  y += 6;
  doc.text(`Dam: ${data.dam.name}`, 20, y);
  y += 6;
  doc.text(`Sire: ${data.sire.name}`, 20, y);
  y += 15;

  // Ownership structure
  doc.setFont('helvetica', 'bold');
  doc.text('OWNERSHIP STRUCTURE:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const ownershipPercentage = coOwnership.ownershipPercentage || 50;
  doc.text(`Breeder Ownership: ${ownershipPercentage}%`, 20, y);
  y += 6;
  doc.text(`Co-Owner Ownership: ${100 - ownershipPercentage}%`, 20, y);
  y += 6;
  const residence = coOwnership.primaryResidence === 'breeder' ? 'Breeder' : 'Co-Owner';
  doc.text(`Primary Residence: With ${residence}`, 20, y);
  y += 15;

  // Co-ownership terms
  doc.setFont('helvetica', 'bold');
  doc.text('CO-OWNERSHIP TERMS AND CONDITIONS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const coOwnershipTerms: string[] = [];

  // Breeding rights
  const breedingRights = coOwnership.breedingRights === 'breeder'
    ? 'Breeder only'
    : coOwnership.breedingRights === 'co_owner'
    ? 'Co-Owner only'
    : 'Shared between both parties';
  coOwnershipTerms.push(`1. BREEDING RIGHTS: ${breedingRights}.`);

  // Litter arrangement
  if (coOwnership.litterArrangement) {
    coOwnershipTerms.push(`2. LITTER ARRANGEMENT: ${coOwnership.litterArrangement}`);
  }

  // Max litters
  if (coOwnership.maxLitters) {
    coOwnershipTerms.push(
      `3. MAXIMUM LITTERS: This dog may produce a maximum of ${coOwnership.maxLitters} litter(s) during the term of this co-ownership.`
    );
  }

  // Show rights
  if (coOwnership.showRights) {
    const showRightsText = coOwnership.showRights === 'breeder'
      ? 'Breeder only'
      : coOwnership.showRights === 'co_owner'
      ? 'Co-Owner only'
      : 'Shared between both parties';
    coOwnershipTerms.push(`4. SHOW/COMPETITION RIGHTS: ${showRightsText}.`);
  }

  // Expense sharing
  if (coOwnership.expenseSharing) {
    coOwnershipTerms.push('5. EXPENSE SHARING:');
    if (coOwnership.expenseSharing.veterinary) {
      coOwnershipTerms.push(`   a. Veterinary: Breeder ${coOwnership.expenseSharing.veterinary}%, Co-Owner ${100 - coOwnership.expenseSharing.veterinary}%`);
    }
    if (coOwnership.expenseSharing.food) {
      coOwnershipTerms.push(`   b. Food: Breeder ${coOwnership.expenseSharing.food}%, Co-Owner ${100 - coOwnership.expenseSharing.food}%`);
    }
    if (coOwnership.expenseSharing.showing) {
      coOwnershipTerms.push(`   c. Showing: Breeder ${coOwnership.expenseSharing.showing}%, Co-Owner ${100 - coOwnership.expenseSharing.showing}%`);
    }
    if (coOwnership.expenseSharing.breeding) {
      coOwnershipTerms.push(`   d. Breeding: Breeder ${coOwnership.expenseSharing.breeding}%, Co-Owner ${100 - coOwnership.expenseSharing.breeding}%`);
    }
  }

  // Termination conditions
  coOwnershipTerms.push('6. TERMINATION CONDITIONS:');
  if (coOwnership.terminationAge) {
    coOwnershipTerms.push(
      `   a. This co-ownership agreement will automatically terminate when the dog reaches ${coOwnership.terminationAge} months of age.`
    );
  }
  if (coOwnership.buyoutOption && coOwnership.buyoutAmount) {
    coOwnershipTerms.push(
      `   b. Either party may buy out the other party's ownership for $${coOwnership.buyoutAmount.toLocaleString()}.`
    );
  }
  if (coOwnership.terminationConditions) {
    coOwnershipTerms.push(`   c. ${coOwnership.terminationConditions}`);
  }

  // General terms
  coOwnershipTerms.push(
    '7. DECISION MAKING: Major decisions regarding the dog\'s care, breeding, and showing must be made jointly by both parties.',
    '8. REGISTRATION: The dog will be registered with both parties listed as co-owners.',
    '9. VETERINARY CARE: Both parties agree to maintain regular veterinary care and to inform each other of any health issues.',
    '10. RELOCATION: The primary residence location cannot be changed without written consent from both parties.',
    '11. RIGHT OF FIRST REFUSAL: If either party wishes to transfer their ownership, the other party must be given first right of refusal.',
    '12. DISPUTE RESOLUTION: Any disputes will be resolved through mediation before pursuing legal action.'
  );

  // Additional terms
  if (coOwnership.additionalTerms) {
    coOwnershipTerms.push(`13. ADDITIONAL TERMS: ${coOwnership.additionalTerms}`);
  }

  coOwnershipTerms.forEach((term) => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 3;
  });

  y += 15;

  // Signature section
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES:', 20, y);
  y += 10;

  const sigHeight = 30;

  doc.setFont('helvetica', 'normal');
  doc.text('Breeder (Owner 1):', 20, y);
  if (data.breederSignature) {
    try {
      doc.addImage(data.breederSignature, 'PNG', 20, y + 2, 70, sigHeight);
    } catch {
      doc.line(20, y + sigHeight, 90, y + sigHeight);
    }
  } else {
    doc.line(20, y + sigHeight, 90, y + sigHeight);
  }
  doc.text(data.breederName || '', 20, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, y + sigHeight + 14);

  doc.text('Co-Owner (Owner 2):', 110, y);
  if (data.buyerSignature) {
    try {
      doc.addImage(data.buyerSignature, 'PNG', 110, y + 2, 70, sigHeight);
    } catch {
      doc.line(110, y + sigHeight, 180, y + sigHeight);
    }
  } else {
    doc.line(110, y + sigHeight, 180, y + sigHeight);
  }
  doc.text(coOwnership.coOwnerName, 110, y + sigHeight + 8);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 110, y + sigHeight + 14);

  y += sigHeight + 25;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('This document has been digitally signed.', pageWidth / 2, y, { align: 'center' });

  const filename = `CoOwnership_${data.puppy.name || data.puppy.tempName || 'Puppy'}_${coOwnership.coOwnerName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
