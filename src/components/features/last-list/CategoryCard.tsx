import React, { useMemo } from "react";
import type { CategoryViewModel, ListItemViewModel, UpdateListItemCommand } from "@/types";
import ProductListItem from "./ProductListItem";

interface CategoryCardProps {
  category: CategoryViewModel;
  onUpdateItem: (id: string, data: UpdateListItemCommand) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ListItemViewModel) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onUpdateItem, onDeleteItem, onEditItem }) => {
  // Jeśli kategoria jest pusta, nie wyświetlamy jej wcale (opcjonalne, ale czystsze)
  if (!category.items || category.items.length === 0) {
    return null;
  }

  // --- LOGIKA SORTOWANIA ---
  const sortedItems = useMemo(() => {
    // Tworzymy kopię [...category.items], żeby nie mutować propsów
    return [...category.items].sort((a, b) => {
      // 1. Priorytet: Status (Niezrobione wyżej, Zrobione niżej)
      // false < true, więc sortujemy rosnąco po booleanie
      if (a.is_checked !== b.is_checked) {
        return a.is_checked ? 1 : -1;
      }

      // 2. Priorytet: Alfabetycznie (żeby itemsy nie skakały losowo)
      return a.name.localeCompare(b.name);
    });
  }, [category.items]);

  return (
    <section className="mb-6">
      {/* NAGŁÓWEK KATEGORII: 
          Zamiast CardTitle używamy małego, stylowego nagłówka. 
          text-stone-400 sprawia, że kategoria jest tłem dla produktów, a nie głównym bohaterem.
      */}
      <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-stone-400">{category.name}</h3>

      {/* LISTA PRODUKTÓW */}
      <div className="space-y-2">
        {sortedItems.map((item) => (
          <ProductListItem
            key={item.id}
            item={item}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onEdit={onEditItem}
          />
        ))}
      </div>
    </section>
  );
};

export default CategoryCard;
