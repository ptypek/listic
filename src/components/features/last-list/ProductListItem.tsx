import React from 'react';
import { cn } from '@/lib/utils';
import type { ListItemViewModel, UpdateListItemCommand } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import ItemActions from './ItemActions';

interface ProductListItemProps {
  item: ListItemViewModel;
  onUpdate: (id: string, data: UpdateListItemCommand) => void;
  onDelete: (id: string) => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ item, onUpdate, onDelete }) => {
  const handleCheckedChange = (isChecked: boolean) => {
    onUpdate(item.id, { is_checked: isChecked });
  };

  return (
    <div className="flex items-center space-x-4">
      <Checkbox 
        id={`item-${item.id}`}
        checked={item.is_checked}
        onCheckedChange={handleCheckedChange}
        className="h-6 w-6"
      />
      <label 
        htmlFor={`item-${item.id}`}
        className={cn(
          "flex-grow text-lg",
          item.is_checked && "line-through text-gray-500"
        )}
      >
        {item.name} <span className="text-sm text-gray-400">({item.quantity} {item.unit})</span>
      </label>
      <ItemActions item={item} onDelete={onDelete} />
    </div>
  );
};

export default ProductListItem;