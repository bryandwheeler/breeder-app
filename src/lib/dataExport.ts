import { Dog, Litter } from '@/types/dog';

export function exportToJSON(dogs: Dog[], litters: Litter[]): void {
  const data = {
    exportDate: new Date().toISOString(),
    dogs,
    litters,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `breeder-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDogsToCSV(dogs: Dog[]): void {
  const headers = [
    'Name', 'Registered Name', 'Call Name', 'Breed', 'Sex', 'Date of Birth',
    'Color', 'Microchip', 'Kennel Name', 'Breeder Name', 'Notes'
  ];

  const rows = dogs.map(dog => [
    dog.name,
    dog.registeredName || '',
    dog.callName || '',
    dog.breed,
    dog.sex,
    dog.dateOfBirth,
    dog.color,
    dog.microchip || '',
    dog.kennelName || '',
    dog.breederName || '',
    dog.notes || '',
  ]);

  downloadCSV(headers, rows, 'dogs-export');
}

export function exportLittersToCSV(litters: Litter[], dogs: Dog[]): void {
  const headers = [
    'Litter Name', 'Dam', 'Sire', 'Date of Birth', 'Status',
    'Total Puppies', 'Available', 'Reserved', 'Sold', 'Total Revenue', 'Total Expenses', 'Net Profit'
  ];

  const rows = litters.map(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    const sire = dogs.find(d => d.id === litter.sireId);
    const puppies = litter.puppies || [];
    const expenses = litter.expenses || [];

    const revenue = puppies
      .filter(p => p.status === 'sold' || p.status === 'reserved')
      .reduce((sum, p) => sum + (p.salePrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return [
      litter.litterName || `${dam?.name} x ${sire?.name}`,
      dam?.name || '',
      sire?.name || '',
      litter.dateOfBirth,
      litter.status,
      puppies.length.toString(),
      puppies.filter(p => p.status === 'available').length.toString(),
      puppies.filter(p => p.status === 'reserved').length.toString(),
      puppies.filter(p => p.status === 'sold').length.toString(),
      revenue.toString(),
      totalExpenses.toString(),
      (revenue - totalExpenses).toString(),
    ];
  });

  downloadCSV(headers, rows, 'litters-export');
}

export function exportPuppiesToCSV(litters: Litter[], dogs: Dog[]): void {
  const headers = [
    'Litter', 'Name', 'Sex', 'Color', 'Status', 'Collar',
    'Microchip', 'Sale Price', 'Deposit', 'Deposit Paid', 'Buyer Name', 'Buyer Email'
  ];

  const rows: string[][] = [];

  litters.forEach(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    const sire = dogs.find(d => d.id === litter.sireId);
    const litterName = litter.litterName || `${dam?.name} x ${sire?.name}`;
    const buyers = litter.buyers || [];

    (litter.puppies || []).forEach(puppy => {
      const buyer = buyers.find(b => b.id === puppy.buyerId);
      rows.push([
        litterName,
        puppy.name || puppy.tempName || '',
        puppy.sex,
        puppy.color,
        puppy.status,
        puppy.collar || '',
        puppy.microchip || '',
        puppy.salePrice?.toString() || '',
        puppy.depositAmount?.toString() || '',
        puppy.depositPaid ? 'Yes' : 'No',
        buyer?.name || '',
        buyer?.email || '',
      ]);
    });
  });

  downloadCSV(headers, rows, 'puppies-export');
}

export function exportExpensesToCSV(litters: Litter[], dogs: Dog[]): void {
  const headers = ['Litter', 'Date', 'Category', 'Description', 'Amount', 'Notes'];

  const rows: string[][] = [];

  litters.forEach(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    const sire = dogs.find(d => d.id === litter.sireId);
    const litterName = litter.litterName || `${dam?.name} x ${sire?.name}`;

    (litter.expenses || []).forEach(expense => {
      rows.push([
        litterName,
        expense.date,
        expense.category,
        expense.description,
        expense.amount.toString(),
        expense.notes || '',
      ]);
    });
  });

  downloadCSV(headers, rows, 'expenses-export');
}

function downloadCSV(headers: string[], rows: string[][], filename: string): void {
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
