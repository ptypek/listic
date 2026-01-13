import React from 'react';
import type { CategoryViewModel, ListItemViewModel, UpdateListItemCommand } from '@/types';
import CategoryCard from './CategoryCard';

interface CategoryListProps {
  groupedItems: CategoryViewModel[];
  onUpdateItem: (id: string, data: UpdateListItemCommand) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ListItemViewModel) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ groupedItems, onUpdateItem, onDeleteItem, onEditItem }) => {
  if (!groupedItems || groupedItems.length === 0) {
    return <p className="text-center text-gray-500">Ta lista jest pusta.</p>;
  }

  return (
    <div className="space-y-6">
      {groupedItems.map((category) => (
        <CategoryCard 
          key={category.id} 
          category={category} 
          onUpdateItem={onUpdateItem} 
          onDeleteItem={onDeleteItem} 
          onEditItem={onEditItem}
        />
      ))}
    </div>
  );
};

export default CategoryList;