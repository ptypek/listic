
import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import type { ListItemViewModel, UpdateListItemCommand, CategoryDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription
} from '@/components/ui/dialog';

const editProductSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana"),
  quantity: z.coerce.number().positive("Ilość musi być większa od 0"),
  unit: z.string().trim().min(1, "Jednostka jest wymagana"),
  category_id: z.coerce.number(),
});

interface EditProductDialogProps {
  item: ListItemViewModel | null;
  categories: CategoryDto[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateListItemCommand) => void;
  isSaving?: boolean;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({ item, categories, isOpen, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState<Partial<UpdateListItemCommand>>({});

  useEffect(() => {
    if (item) {
      setFormData({ 
        name: item.name, 
        quantity: item.quantity, 
        unit: item.unit, 
        category_id: item.category_id 
      });
    } else {
      setFormData({});
    }
  }, [item]);

  const isValid = useMemo(() => editProductSchema.safeParse(formData).success, [formData]);

  const handleChange = (field: keyof UpdateListItemCommand, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    handleChange('category_id', parseInt(value, 10));
  };

  const handleSubmit = () => {
    if (item && isValid) {
      onSave(item.id, formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj produkt</DialogTitle>
          <DialogDescription>Zmień szczegóły produktu i zapisz zmiany.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nazwa</Label>
            <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Ilość</Label>
            <Input id="quantity" type="number" value={formData.quantity || ''} onChange={e => handleChange('quantity', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">Jednostka</Label>
            <Input id="unit" value={formData.unit || ''} onChange={e => handleChange('unit', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Kategoria</Label>
            <Select onValueChange={handleCategoryChange} value={formData.category_id?.toString()} >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Wybierz..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSaving}>{isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
