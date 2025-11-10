import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import type { AddProductFormData, CategoryDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schema for validation
const addProductSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana"),
  quantity: z.coerce.number().positive("Ilość musi być większa od 0"),
  unit: z.string().trim().min(1, "Jednostka jest wymagana"),
  categoryId: z.coerce.number(),
});

interface AddProductFormProps {
  categories: CategoryDto[];
  onSubmit: (data: AddProductFormData) => void;
  disabled?: boolean;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ categories, onSubmit, disabled }) => {
  const [formData, setFormData] = useState<Partial<AddProductFormData>>({});
  const [errors, setErrors] = useState<z.ZodError | null>(null);

  const isValid = useMemo(() => addProductSchema.safeParse(formData).success, [formData]);

  const handleChange = (field: keyof AddProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    handleChange('categoryId', parseInt(value, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addProductSchema.safeParse(formData);
    if (result.success) {
      onSubmit(result.data);
      setFormData({}); // Reset form
      setErrors(null);
    } else {
      setErrors(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 mb-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nazwa produktu</Label>
          <Input 
            id="name" 
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="quantity">Ilość</Label>
          <Input 
            id="quantity" 
            type="number"
            value={formData.quantity || ''}
            onChange={(e) => handleChange('quantity', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="unit">Jednostka</Label>
          <Input 
            id="unit" 
            value={formData.unit || ''}
            onChange={(e) => handleChange('unit', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="category">Kategoria</Label>
          <Select onValueChange={handleCategoryChange} value={formData.categoryId?.toString()}>
            <SelectTrigger>
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
      {errors && (
        <div className="mt-2 text-xs text-red-500">
          {Object.values(errors.flatten().fieldErrors).map(err => err.join(', ')).join('; ')}
        </div>
      )}
      <Button type="submit" disabled={!isValid || disabled} className="mt-4 w-full md:w-auto">
        Dodaj produkt
      </Button>
    </form>
  );
};

export default AddProductForm;