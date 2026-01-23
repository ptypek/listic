import React, { useState, useMemo } from "react";
import { z } from "zod";
import type { AddProductFormData, CategoryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown } from "lucide-react";

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
      setFormData({});
      setErrors(null);
    } else {
      setErrors(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 p-3">
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

      <div className="relative w-full md:w-40">
        <label htmlFor="category" className="sr-only">
          Kategoria
        </label>

        <select
          id="category"
          className="h-10 w-full appearance-none rounded-md border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm text-stone-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.category_id || ""}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="" disabled hidden>
            Kategoria
          </option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
      </div>

      <Button
        type="submit"
        disabled={!isValid || disabled}
        size="icon"
        aria-label="Dodaj produkt"
        className="h-10 w-10 shrink-0 bg-stone-900 hover:bg-stone-800 text-white shadow-sm md:w-10 w-full"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span className="md:hidden ml-2">Dodaj produkt</span>
      </Button>

      {errors && Object.keys(errors.flatten().fieldErrors).length > 0 && (
        <div className="w-full text-xs text-red-500 md:hidden">Błąd: Uzupełnij nazwę produktu.</div>
      )}
    </form>
  );
};

export default AddProductForm;
