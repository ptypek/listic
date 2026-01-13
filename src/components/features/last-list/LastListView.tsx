import React, { useState, useMemo } from "react";
import { useLastList } from "@/hooks/useLastList";
import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";
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

  const progressStats = useMemo(() => {
    if (!listViewModel?.groupedItems) return { total: 0, completed: 0, percent: 0 };

    const categories = Object.values(listViewModel.groupedItems);
    const allProducts = categories.flatMap((category) => category.items);
    const total = allProducts.length;
    const completed = allProducts.filter((product) => product.is_checked).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, percent };
  }, [listViewModel]);

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 space-y-6 animate-pulse">
        <div className="h-12 w-3/4 bg-stone-200 rounded-lg mx-auto mb-8" />
        <div className="h-32 w-full bg-stone-100 rounded-xl" />
        <div className="space-y-4">
          <div className="h-16 w-full bg-stone-50 rounded-lg" />
          <div className="h-16 w-full bg-stone-50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
          <ShoppingBasket className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Coś poszło nie tak</h2>
        <p className="text-stone-500 mt-2 mb-6">Nie udało się pobrać Twojej listy.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (noListsFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-md mx-auto">
        <div className="bg-stone-100 p-6 rounded-full mb-6 rotate-3">
          <ShoppingBasket className="h-12 w-12 text-stone-400" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Pusto w lodówce?</h2>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Nie masz jeszcze aktywnej listy zakupów. Wygeneruj ją z przepisów lub stwórz ręcznie.
        </p>
        <Button asChild size="lg" className="rounded-full font-semibold shadow-lg">
          <a href="/">Stwórz pierwszą listę</a>
        </Button>
      </div>
    );
  }

  if (!listViewModel || !categories) return null;

  const handleUpdateItem = (itemId: string, data: UpdateListItemCommand) => updateListItem({ itemId, data });
  const handleAddItem = (formData: AddProductFormData) => addListItem({ ...formData, list_id: listViewModel.id });
  const handleDeleteItem = (itemId: string) => deleteListItem(itemId);
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
    <div className="min-h-screen bg-stone-50 pb-20">
      {" "}
      <div className="sticky top-12 z-30 bg-stone-50/80 backdrop-blur-md border-b border-stone-200">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-stone-900 truncate pr-4">{listViewModel.name}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-stone-500 mb-1">
            <span className={progressStats.percent === 100 ? "text-green-600" : ""}>
              {progressStats.completed} z {progressStats.total} kupione
            </span>
            <span className="ml-auto">{progressStats.percent}%</span>
          </div>
          <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${progressStats.percent === 100 ? "bg-green-500" : "bg-stone-900"}`}
              style={{ width: `${progressStats.percent}%` }}
            />
          </div>
        </div>
      </div>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-stone-100 p-1 overflow-hidden">
          <AddProductForm categories={categories} onSubmit={handleAddItem} disabled={isAddingItem} />
        </section>

        <div className="space-y-6">
          <CategoryList
            groupedItems={listViewModel.groupedItems}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
          />
        </div>
      </div>
      {/* DIALOG EDYCJI */}
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
