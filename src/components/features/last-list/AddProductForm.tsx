import React, { useState, useMemo } from "react";
import { z } from "zod";
import type { AddProductFormData, CategoryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema for validation
const addProductSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana"),
  quantity: z.coerce.number().positive("Ilość musi być większa od 0"),
  unit: z.string().trim().min(1, "Jednostka jest wymagana"),
  category_id: z.coerce.number(),
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    handleChange("category_id", parseInt(value, 10));
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
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 p-3">
      {/* 1. NAZWA PRODUKTU (Najważniejsza - zajmuje dostępną przestrzeń flex-1) */}
      <div className="flex-1">
        <label htmlFor="name" className="sr-only">
          Nazwa produktu
        </label>
        <Input
          id="name"
          placeholder="Co chcesz dodać?"
          value={formData.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className="h-10 border-stone-200 bg-stone-50/50 focus:bg-white focus:border-stone-400 placeholder:text-stone-400"
          autoComplete="off"
        />
      </div>

      {/* 2. GRUPA ILOŚĆ I JEDNOSTKA (Obok siebie nawet na mobile) */}
      <div className="flex gap-2 md:w-auto">
        <div className="w-20 md:w-24">
          <label htmlFor="quantity" className="sr-only">
            Ilość
          </label>
          <Input
            id="quantity"
            type="number"
            placeholder="Il."
            value={formData.quantity || ""}
            onChange={(e) => handleChange("quantity", e.target.value)}
            className="h-10 border-stone-200 bg-stone-50/50 focus:bg-white focus:border-stone-400 placeholder:text-stone-400 text-center"
          />
        </div>
        <div className="w-20 md:w-24">
          <label htmlFor="unit" className="sr-only">
            Jednostka
          </label>
          <Input
            id="unit"
            placeholder="Jedn."
            value={formData.unit || ""}
            onChange={(e) => handleChange("unit", e.target.value)}
            className="h-10 border-stone-200 bg-stone-50/50 focus:bg-white focus:border-stone-400 placeholder:text-stone-400 text-center"
          />
        </div>
      </div>

      {/* 3. KATEGORIA (Stała szerokość) */}
      <div className="w-full md:w-40">
        <label htmlFor="category" className="sr-only">
          Kategoria
        </label>
        <Select onValueChange={handleCategoryChange} value={formData.category_id?.toString()}>
          <SelectTrigger className="h-10 border-stone-200 bg-stone-50/50 focus:bg-white focus:border-stone-400 text-stone-600">
            <SelectValue placeholder="Kategoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. PRZYCISK (Kwadratowy z ikoną na desktopie, pełny na mobile) */}
      <Button
        type="submit"
        disabled={!isValid || disabled}
        size="icon" // Na desktopie sama ikona
        className="h-10 w-10 shrink-0 bg-stone-900 hover:bg-stone-800 text-white shadow-sm md:w-10 w-full"
      >
        <Plus className="h-5 w-5" />
        <span className="md:hidden ml-2">Dodaj produkt</span>
      </Button>

      {/* Ewentualne błędy wyświetlamy pod spodem, ale dyskretnie */}
      {errors && Object.keys(errors.flatten().fieldErrors).length > 0 && (
        <div className="w-full text-xs text-red-500 md:hidden">Błąd: Uzupełnij nazwę produktu.</div>
      )}
    </form>
  );
};

export default AddProductForm;
