import React from 'react';
import type { CategoryViewModel } from '@/types';
import CategoryCard from './CategoryCard';

interface CategoryListProps {
  groupedItems: CategoryViewModel[];
  onUpdateItem: (id: string, data: any) => void;
  onDeleteItem: (id: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ groupedItems, onUpdateItem, onDeleteItem }) => {
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
        />
      ))}
    </div>
  );
};

export default CategoryList;