import React from 'react';
import { MoreHorizontal, Trash2, Pencil, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListItemViewModel } from '@/types';

interface ItemActionsProps {
  item: ListItemViewModel;
  onDelete: (id: string) => void;
  // onEdit and onReportError will be implemented later
}

const ItemActions: React.FC<ItemActionsProps> = ({ item, onDelete }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Otwórz menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => alert('Edit action not implemented yet')}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edytuj</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-500 focus:text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Usuń</span>
        </DropdownMenuItem>
        {item.source === 'ai' && (
          <DropdownMenuItem onClick={() => alert('Report error action not implemented yet')}>
            <Flag className="mr-2 h-4 w-4" />
            <span>Błędny składnik</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ItemActions;