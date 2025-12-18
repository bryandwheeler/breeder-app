import { useParams, Link } from 'react-router-dom';
import { useDogStore } from '@/store/dogStoreFirebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Users, Calendar, DollarSign, FileText, Share2, TrendingUp, TrendingDown, Edit, Trash2, ListChecks, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PuppyCard } from '@/components/PuppyCard';
import { PuppyFormDialog } from '@/components/PuppyFormDialog';
import { BuyerFormDialog } from '@/components/BuyerFormDialog';
import { ExpenseDialog } from '@/components/ExpenseDialog';
import { useState } from 'react';
import { Puppy, Buyer, Expense } from '@/types/dog';
import { format } from 'date-fns';
import { generateLitterRecord } from '@/lib/pdfGenerator';
import { ContractSigningDialog } from '@/components/ContractSigningDialog';
import { LitterMilestones } from '@/components/LitterMilestones';
import { LitterCareTasks } from '@/components/LitterCareTasks';
import { LitterFormDialog } from '@/components/LitterFormDialog';

export function LitterDetails() {
  const { id } = useParams<{ id: string }>();
  const { litters, dogs, updateLitter } = useDogStore();
  const { currentUser } = useAuth();
  const litter = litters.find((l) => l.id === id);
  const [editingPuppy, setEditingPuppy] = useState<Puppy | null>(null);
  const [puppyDialogOpen, setPuppyDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [signingPuppy, setSigningPuppy] = useState<Puppy | null>(null);
  const [signingType, setSigningType] = useState<'contract' | 'health'>('contract');
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [litterEditDialogOpen, setLitterEditDialogOpen] = useState(false);

  if (!litter) {
    return (
      <div className='container mx-auto py-20 text-center'>
        <h1 className='text-3xl font-bold mb-4'>Litter not found</h1>
        <Link to='/litters'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Litters
          </Button>
        </Link>
      </div>
    );
  }

  const dam = dogs.find((d) => d.id === litter.damId);
  const sire = dogs.find((d) => d.id === litter.sireId);

  const getStatusColor = (status: typeof litter.status) => {
    switch (status) {
      case 'planned':
        return 'outline';
      case 'pregnant':
        return 'secondary';
      case 'born':
        return 'default';
      case 'weaning':
        return 'default';
      case 'ready':
        return 'default';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleAddPuppy = () => {
    setEditingPuppy(null);
    setPuppyDialogOpen(true);
  };

  const handleEditPuppy = (puppy: Puppy) => {
    setEditingPuppy(puppy);
    setPuppyDialogOpen(true);
  };

  const handleSavePuppy = async (puppy: Puppy) => {
    let updatedPuppies: Puppy[];

    if (editingPuppy) {
      // Update existing puppy
      updatedPuppies = litter.puppies.map((p) => (p.id === puppy.id ? puppy : p));
    } else {
      // Add new puppy
      updatedPuppies = [...litter.puppies, puppy];
    }

    await updateLitter(litter.id, { puppies: updatedPuppies });
    setPuppyDialogOpen(false);
    setEditingPuppy(null);
  };

  const handleDeletePuppy = async (puppyId: string) => {
    if (!confirm('Are you sure you want to delete this puppy?')) return;

    const updatedPuppies = litter.puppies.filter((p) => p.id !== puppyId);
    await updateLitter(litter.id, { puppies: updatedPuppies });
  };

  const handleAddBuyer = () => {
    setEditingBuyer(null);
    setBuyerDialogOpen(true);
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setBuyerDialogOpen(true);
  };

  const handleSaveBuyer = async (buyer: Buyer) => {
    let updatedBuyers: Buyer[];

    if (editingBuyer) {
      // Update existing buyer
      updatedBuyers = litter.buyers.map((b) => (b.id === buyer.id ? buyer : b));
    } else {
      // Add new buyer
      updatedBuyers = [...litter.buyers, buyer];
    }

    await updateLitter(litter.id, { buyers: updatedBuyers });
    setBuyerDialogOpen(false);
    setEditingBuyer(null);
  };

  const handleDeleteBuyer = async (buyerId: string) => {
    if (!confirm('Are you sure you want to remove this buyer from the waitlist?')) return;

    const updatedBuyers = litter.buyers.filter((b) => b.id !== buyerId);
    await updateLitter(litter.id, { buyers: updatedBuyers });
  };

  const puppies = litter.puppies || [];
  const buyers = litter.buyers || [];

  const handleGenerateLitterRecord = () => {
    if (!dam || !sire) return;
    generateLitterRecord({
      litter,
      dam,
      sire,
      kennelName: dam.kennelName || 'Doodle Bliss Kennel',
    });
  };

  const handleGenerateContract = (puppy: Puppy) => {
    if (!dam || !sire) return;
    const buyer = buyers.find(b => b.id === puppy.buyerId);
    if (!buyer) {
      alert('Please assign a buyer to this puppy first');
      return;
    }
    setSigningPuppy(puppy);
    setSigningType('contract');
    setSigningDialogOpen(true);
  };

  const handleGenerateHealthGuarantee = (puppy: Puppy) => {
    if (!dam || !sire) return;
    setSigningPuppy(puppy);
    setSigningType('health');
    setSigningDialogOpen(true);
  };

  const availablePuppies = puppies.filter((p) => p.status === 'available');
  const reservedPuppies = puppies.filter((p) => p.status === 'reserved');
  const soldPuppies = puppies.filter((p) => p.status === 'sold');
  const keptPuppies = puppies.filter((p) => p.status === 'kept');

  const handleShareLitter = () => {
    if (!currentUser) return;
    const publicUrl = `${window.location.origin}/public/${currentUser.uid}/${litter.id}`;
    navigator.clipboard.writeText(publicUrl);
    alert('Public link copied to clipboard!');
  };

  // Expense handlers
  const expenses = litter.expenses || [];

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async (expense: Expense) => {
    let updatedExpenses: Expense[];
    if (editingExpense) {
      updatedExpenses = expenses.map((e) => (e.id === expense.id ? expense : e));
    } else {
      updatedExpenses = [...expenses, expense];
    }
    await updateLitter(litter.id, { expenses: updatedExpenses });
    setExpenseDialogOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return;
    const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
    await updateLitter(litter.id, { expenses: updatedExpenses });
  };

  // Financial calculations
  const totalRevenue = puppies
    .filter(p => p.status === 'sold' || p.status === 'reserved')
    .reduce((sum, p) => sum + (p.salePrice || 0), 0);
  const totalDeposits = puppies
    .filter(p => p.depositPaid)
    .reduce((sum, p) => sum + (p.depositAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className='space-y-8 pb-20'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link to='/litters'>
            <Button variant='outline'>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Button>
          </Link>
          <div>
            <h1 className='text-4xl font-bold'>
              {litter.litterName || `${dam?.name} x ${sire?.name}`}
            </h1>
            <Badge variant={getStatusColor(litter.status)} className='mt-2'>
              {litter.status.charAt(0).toUpperCase() + litter.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setLitterEditDialogOpen(true)}>
            <Edit className='mr-2 h-4 w-4' /> Edit Litter
          </Button>
          <Button variant='outline' onClick={handleShareLitter}>
            <Share2 className='mr-2 h-4 w-4' /> Share
          </Button>
          <Button variant='outline' onClick={handleGenerateLitterRecord}>
            <FileText className='mr-2 h-4 w-4' /> Export
          </Button>
        </div>
      </div>

      {/* Litter Information */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' /> Litter Info
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {litter.dateOfBirth ? (
              <div>
                <strong>Date of Birth:</strong>{' '}
                {format(new Date(litter.dateOfBirth), 'PPP')}
              </div>
            ) : litter.expectedDateOfBirth ? (
              <div>
                <strong>Expected Due Date:</strong>{' '}
                {format(new Date(litter.expectedDateOfBirth), 'PPP')}
                <Badge variant="secondary" className="ml-2">Pending</Badge>
              </div>
            ) : null}
            {litter.dateOfBirth && litter.expectedDateOfBirth && (
              <div>
                <strong>Expected DOB:</strong>{' '}
                {format(new Date(litter.expectedDateOfBirth), 'PPP')}
              </div>
            )}
            {litter.pickupReadyDate && (
              <div>
                <strong>Pickup Ready:</strong>{' '}
                {format(new Date(litter.pickupReadyDate), 'PPP')}
              </div>
            )}
            <div className='pt-2 border-t'>
              <strong>Dam:</strong>{' '}
              <Link to={`/dogs/${dam?.id}`} className='text-primary hover:underline'>
                {dam?.name}
              </Link>
            </div>
            <div>
              <strong>Sire:</strong>{' '}
              <Link to={`/dogs/${sire?.id}`} className='text-primary hover:underline'>
                {sire?.name}
              </Link>
            </div>

            {/* Pricing Info */}
            <div className='pt-2 border-t'>
              <strong className='block mb-2'>Pricing:</strong>
              {litter.pricing?.petPrice && (
                <div className='flex justify-between text-sm'>
                  <span>Pet Price:</span>
                  <span className='font-semibold'>
                    ${litter.pricing.petPrice.toLocaleString()}
                  </span>
                </div>
              )}
              {litter.pricing?.breedingPrice && (
                <div className='flex justify-between text-sm'>
                  <span>Breeding Rights:</span>
                  <span className='font-semibold'>
                    ${litter.pricing.breedingPrice.toLocaleString()}
                  </span>
                </div>
              )}
              {litter.pricing?.showPrice && (
                <div className='flex justify-between text-sm'>
                  <span>Show Quality:</span>
                  <span className='font-semibold'>
                    ${litter.pricing.showPrice.toLocaleString()}
                  </span>
                </div>
              )}
              {!litter.pricing?.petPrice &&
                !litter.pricing?.breedingPrice &&
                !litter.pricing?.showPrice && (
                  <p className='text-muted-foreground text-sm'>No pricing set</p>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' /> Puppy Count
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <div className='flex justify-between'>
              <span>Total Puppies:</span>
              <Badge>{puppies.length}</Badge>
            </div>
            <div className='flex justify-between'>
              <span>Available:</span>
              <Badge variant='default'>{availablePuppies.length}</Badge>
            </div>
            <div className='flex justify-between'>
              <span>Reserved:</span>
              <Badge variant='secondary'>{reservedPuppies.length}</Badge>
            </div>
            <div className='flex justify-between'>
              <span>Sold:</span>
              <Badge variant='outline'>{soldPuppies.length}</Badge>
            </div>
            <div className='flex justify-between'>
              <span>Kept:</span>
              <Badge variant='destructive'>{keptPuppies.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {litter.litterNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Litter Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{litter.litterNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue='puppies' className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='puppies' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            <span className='hidden sm:inline'>Puppies</span>
          </TabsTrigger>
          {litter.dateOfBirth && (
            <>
              <TabsTrigger value='milestones' className='flex items-center gap-2'>
                <Trophy className='h-4 w-4' />
                <span className='hidden sm:inline'>Milestones</span>
              </TabsTrigger>
              <TabsTrigger value='tasks' className='flex items-center gap-2'>
                <ListChecks className='h-4 w-4' />
                <span className='hidden sm:inline'>Tasks</span>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value='waitlist' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            <span className='hidden sm:inline'>Waitlist</span>
          </TabsTrigger>
          <TabsTrigger value='financials' className='flex items-center gap-2'>
            <DollarSign className='h-4 w-4' />
            <span className='hidden sm:inline'>Financials</span>
          </TabsTrigger>
        </TabsList>

        {/* Puppies Tab */}
        <TabsContent value='puppies'>
      <div>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold'>Puppies</h2>
          <Button onClick={handleAddPuppy}>
            <Plus className='mr-2 h-5 w-5' /> Add Puppy
          </Button>
        </div>

        {puppies.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center text-muted-foreground'>
              No puppies added yet. Click "Add Puppy" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {puppies.map((puppy) => {
              const buyer = buyers.find((b) => b.id === puppy.buyerId);
              return (
                <PuppyCard
                  key={puppy.id}
                  puppy={puppy}
                  buyer={buyer}
                  onEdit={handleEditPuppy}
                  onDelete={handleDeletePuppy}
                  onGenerateContract={handleGenerateContract}
                  onGenerateHealthGuarantee={handleGenerateHealthGuarantee}
                />
              );
            })}
          </div>
        )}
      </div>
        </TabsContent>

        {/* Milestones Tab */}
        {litter.dateOfBirth && (
          <TabsContent value='milestones'>
            <LitterMilestones litter={litter} onUpdate={updateLitter} />
          </TabsContent>
        )}

        {/* Tasks Tab */}
        {litter.dateOfBirth && (
          <TabsContent value='tasks'>
            <LitterCareTasks litter={litter} onUpdate={updateLitter} />
          </TabsContent>
        )}

        {/* Waitlist Tab */}
        <TabsContent value='waitlist'>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' /> Buyer Waitlist ({buyers.length})
            </CardTitle>
            <Button onClick={handleAddBuyer} size='sm'>
              <Plus className='mr-2 h-4 w-4' /> Add Buyer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {buyers.length === 0 ? (
            <p className='text-muted-foreground'>No buyers on waitlist</p>
          ) : (
            <div className='space-y-2'>
              {buyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className='flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50'
                >
                  <div className='flex-1'>
                    <div className='font-medium'>{buyer.name}</div>
                    <div className='text-sm text-muted-foreground'>{buyer.email}</div>
                    {buyer.phone && (
                      <div className='text-sm text-muted-foreground'>{buyer.phone}</div>
                    )}
                    {buyer.preferredSex && (
                      <div className='text-xs text-muted-foreground'>
                        Prefers: {buyer.preferredSex}
                        {buyer.preferredColor && `, ${buyer.preferredColor}`}
                      </div>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline'>{buyer.status}</Badge>
                    <Button variant='outline' size='sm' onClick={() => handleEditBuyer(buyer)}>
                      Edit
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteBuyer(buyer.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value='financials'>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5' /> Financials
            </CardTitle>
            <Button onClick={handleAddExpense} size='sm'>
              <Plus className='mr-2 h-4 w-4' /> Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='p-4 bg-green-100 dark:bg-green-900/30 rounded-lg'>
              <div className='flex items-center gap-2 text-green-700 dark:text-green-400'>
                <TrendingUp className='h-4 w-4' />
                <span className='text-sm'>Revenue</span>
              </div>
              <p className='text-2xl font-bold text-green-700 dark:text-green-400'>
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className='p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
              <div className='flex items-center gap-2 text-blue-700 dark:text-blue-400'>
                <DollarSign className='h-4 w-4' />
                <span className='text-sm'>Deposits Collected</span>
              </div>
              <p className='text-2xl font-bold text-blue-700 dark:text-blue-400'>
                ${totalDeposits.toLocaleString()}
              </p>
            </div>
            <div className='p-4 bg-red-100 dark:bg-red-900/30 rounded-lg'>
              <div className='flex items-center gap-2 text-red-700 dark:text-red-400'>
                <TrendingDown className='h-4 w-4' />
                <span className='text-sm'>Expenses</span>
              </div>
              <p className='text-2xl font-bold text-red-700 dark:text-red-400'>
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <div className={`flex items-center gap-2 ${netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {netProfit >= 0 ? <TrendingUp className='h-4 w-4' /> : <TrendingDown className='h-4 w-4' />}
                <span className='text-sm'>Net Profit</span>
              </div>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                ${netProfit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expense List */}
          <h3 className='font-semibold mb-3'>Expenses</h3>
          {expenses.length === 0 ? (
            <p className='text-muted-foreground'>No expenses recorded</p>
          ) : (
            <div className='space-y-2'>
              {expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => (
                  <div key={expense.id} className='flex justify-between items-center p-3 border rounded-lg'>
                    <div>
                      <div className='font-medium'>{expense.description}</div>
                      <div className='text-sm text-muted-foreground'>
                        {format(new Date(expense.date), 'MMM d, yyyy')} • {expense.category}
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='font-semibold text-red-600'>${expense.amount.toLocaleString()}</span>
                      <Button size='sm' variant='ghost' onClick={() => handleEditExpense(expense)}>
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button size='sm' variant='ghost' onClick={() => handleDeleteExpense(expense.id)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      <PuppyFormDialog
        open={puppyDialogOpen}
        setOpen={setPuppyDialogOpen}
        puppy={editingPuppy}
        litterBuyers={buyers}
        onSave={handleSavePuppy}
      />

      <BuyerFormDialog
        open={buyerDialogOpen}
        setOpen={setBuyerDialogOpen}
        buyer={editingBuyer}
        onSave={handleSaveBuyer}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        setOpen={setExpenseDialogOpen}
        expense={editingExpense}
        onSave={handleSaveExpense}
      />

      {signingPuppy && dam && sire && (
        <ContractSigningDialog
          open={signingDialogOpen}
          setOpen={setSigningDialogOpen}
          type={signingType}
          puppy={signingPuppy}
          litter={litter}
          dam={dam}
          sire={sire}
          buyer={buyers.find(b => b.id === signingPuppy.buyerId)}
          kennelName={dam.kennelName || 'Doodle Bliss Kennel'}
          breederName={dam.breederName || ''}
        />
      )}

      <LitterFormDialog
        open={litterEditDialogOpen}
        setOpen={setLitterEditDialogOpen}
        litter={litter}
      />
    </div>
  );
}
