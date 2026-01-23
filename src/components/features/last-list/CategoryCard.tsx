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
  if (!category.items || category.items.length === 0) {
    return null;
  }

  const sortedItems = useMemo(() => {
    return [...category.items].sort((a, b) => {
      if (a.is_checked !== b.is_checked) {
        return a.is_checked ? 1 : -1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [category.items]);

  return (
    <section className="mb-6">
      <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-stone-400">{category.name}</h3>

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
