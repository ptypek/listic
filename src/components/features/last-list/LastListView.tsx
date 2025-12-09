import React, { useState } from "react";
import { useLastList } from "@/hooks/useLastList";
import { Button } from "@/components/ui/button";
import AddProductForm from "./AddProductForm";
import CategoryList from "./CategoryList";
import EditProductDialog from "./EditProductDialog";
import type { AddProductFormData, ListItemViewModel, UpdateListItemCommand } from "@/types";

const LastListView = () => {
  const {
    listViewModel,
    categories,
    isLoading,
    error,
    noListsFound,
    updateListItem,
    addListItem,
    isAddingItem,
    deleteListItem,
    isUpdatingItem,
  } = useLastList();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemViewModel | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Ładowanie Twojej listy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        <p>Wystąpił błąd podczas pobierania listy.</p>
        <p>Odśwież stronę, aby spróbować ponownie.</p>
      </div>
    );
  }

  if (noListsFound) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Nie masz jeszcze żadnej listy</h2>
        <p className="mb-6">Wygląda na to, że nie wygenerowałeś jeszcze żadnej listy zakupów.</p>
        <Button asChild>
          <a href="/">Stwórz swoją pierwszą listę</a>
        </Button>
      </div>
    );
  }

  if (!listViewModel || !categories) {
    return null; // Safeguard
  }

  const handleUpdateItem = (itemId: string, data: UpdateListItemCommand) => {
    updateListItem({ itemId, data });
  };

  const handleAddItem = (formData: AddProductFormData) => {
    addListItem({ ...formData, list_id: listViewModel.id });
  };

  const handleDeleteItem = (itemId: string) => {
    deleteListItem(itemId);
  };

  const handleEditItem = (item: ListItemViewModel) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleSaveEditedItem = (itemId: string, data: UpdateListItemCommand) => {
    updateListItem({ itemId, data });
    handleCloseEditDialog();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{listViewModel.name}</h1>
      <AddProductForm categories={categories} onSubmit={handleAddItem} disabled={isAddingItem} />
      <CategoryList
        groupedItems={listViewModel.groupedItems}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
      />
      <EditProductDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEditedItem}
        item={editingItem}
        categories={categories}
        isSaving={isUpdatingItem}
      />
    </div>
  );
};

export default LastListView;
