import React from 'react';
import type { CategoryViewModel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductListItem from './ProductListItem';

interface CategoryCardProps {
  category: CategoryViewModel;
  onUpdateItem: (id: string, data: any) => void; 
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ListItemViewModel) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onUpdateItem, onDeleteItem, onEditItem }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {category.items.map(item => (
            <ProductListItem 
              key={item.id} 
              item={item} 
              onUpdate={onUpdateItem} 
              onDelete={onDeleteItem} 
              onEdit={onEditItem} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;