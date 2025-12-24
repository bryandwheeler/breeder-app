import { useState } from 'react';
import { StudServiceContract, ContractSection } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, FileText, Send, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StudContractEditorProps {
  contract?: StudServiceContract;
  onSave: (contract: StudServiceContract) => void;
  onCancel: () => void;
}

export function StudContractEditor({ contract, onSave, onCancel }: StudContractEditorProps) {
  const [sections, setSections] = useState<ContractSection[]>(contract?.sections || []);
  const [editingSection, setEditingSection] = useState<ContractSection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditSection = (section: ContractSection) => {
    setEditingSection({ ...section });
    setEditDialogOpen(true);
  };

  const handleSaveSection = () => {
    if (!editingSection) return;

    setSections(sections.map(s =>
      s.id === editingSection.id ? editingSection : s
    ));
    setEditDialogOpen(false);
    setEditingSection(null);
  };

  const handleToggleSection = (sectionId: string, included: boolean) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, required: included } : s
    ));
  };

  const handleSaveContract = () => {
    const updatedContract: StudServiceContract = {
      id: contract?.id || crypto.randomUUID(),
      templateId: contract?.templateId,
      status: contract?.status || 'draft',
      sections: sections,
      breederSignature: contract?.breederSignature,
      clientSignature: contract?.clientSignature,
      createdDate: contract?.createdDate || new Date().toISOString(),
      sentDate: contract?.sentDate,
      signedDate: contract?.signedDate,
      expiryDate: contract?.expiryDate,
      pdfUrl: contract?.pdfUrl,
      lastGeneratedAt: contract?.lastGeneratedAt,
    };

    onSave(updatedContract);
    toast({
      title: 'Success',
      description: 'Contract saved successfully',
    });
  };

  const getStatusBadge = (status: StudServiceContract['status']) => {
    const variants: Record<StudServiceContract['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
      draft: 'outline',
      sent: 'default',
      signed: 'secondary',
      completed: 'secondary',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Stud Service Contract</h2>
          {contract && (
            <div className='flex items-center gap-2 mt-2'>
              {getStatusBadge(contract.status)}
              {contract.createdDate && (
                <span className='text-sm text-muted-foreground'>
                  Created: {new Date(contract.createdDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSaveContract}>
            <FileText className='h-4 w-4 mr-2' />
            Save Contract
          </Button>
        </div>
      </div>

      {/* Contract Sections */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Contract Sections</h3>
          <p className='text-sm text-muted-foreground'>
            {sections.filter(s => s.required).length} of {sections.length} sections included
          </p>
        </div>

        {sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <Card key={section.id}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-3 flex-1'>
                  <Checkbox
                    checked={section.required}
                    onCheckedChange={(checked) => handleToggleSection(section.id, checked as boolean)}
                  />
                  <div className='flex-1'>
                    <CardTitle className='text-base'>{section.title}</CardTitle>
                    {!section.required && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        Optional section (unchecked sections won't be included)
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex gap-2'>
                  {section.editable && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                  )}
                  {!section.editable && (
                    <Badge variant='secondary'>Fixed</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-muted-foreground whitespace-pre-wrap'>
                  {section.content.length > 200
                    ? section.content.substring(0, 200) + '...'
                    : section.content}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Section: {editingSection?.title}</DialogTitle>
          </DialogHeader>

          {editingSection && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='section-title'>Section Title</Label>
                <Input
                  id='section-title'
                  value={editingSection.title}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, title: e.target.value })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='section-content'>Content</Label>
                <Textarea
                  id='section-content'
                  value={editingSection.content}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, content: e.target.value })
                  }
                  rows={15}
                  className='font-mono text-sm'
                />
                <p className='text-xs text-muted-foreground'>
                  Use template variables like {'{{studName}}'}, {'{{femaleName}}'}, {'{{studFee}}'}, etc.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSection}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
