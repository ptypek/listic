import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCategories } from "@/services/category.service.ts";
import { listService } from "@/services/list.service.ts";
import { AiFeedbackService } from "@/services/ai-feedback.service.ts";
import type { AddListItemCommand, CategoryDto, CreateAiFeedbackCommand, ListViewModel, ListItemDto, ShoppingListWithItemsDto, UpdateListItemCommand } from "@/types";
import { supabaseClient } from "@/db/supabase.client";

const aiFeedbackService = new AiFeedbackService(supabaseClient);

// Helper function to transform API data into the required ViewModel
const transformToListViewModel = (list: ShoppingListWithItemsDto, categories: CategoryDto[]): ListViewModel => {
  const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, items: [] }]));

  for (const item of list.items) {
    const category = categoryMap.get(item.category_id);
    if (category) {
      // @ts-ignore
      category.items.push(item);
    }
  }

  return {
    id: list.id,
    name: list.name,
    groupedItems: Array.from(categoryMap.values()).filter(cat => cat.items.length > 0),
  };
};

export const useLastList = () => {
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isLoadingCategories } = useQuery({ 
    queryKey: ["categories"], 
    queryFn: getCategories 
  });

  const { data: user } = useQuery({ 
    queryKey: ["user"], 
    queryFn: async () => {
      const { data } = await supabaseClient.auth.getUser();
      return data.user;
    } 
  });

  
  const listQueryKey = ['list', 'last', user?.id];

  const { data: listViewModel, isLoading: isLoadingList, error } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      if (!user) return null;
      // Zmieniono na getLists, aby pobierać wszystkie listy, ale na razie zostawiamy getLastList, aby nie psuć logiki
      const data = await listService.getLastList(supabaseClient, user.id);
      console.log('Raw data from getLastList:', JSON.stringify(data, null, 2));
      return data;
    },
    enabled: !!user && !!categories,
    select: (data) => {
      if (!data || !categories) return null;
      const transformedData = transformToListViewModel(data, categories);
      console.log('Transformed listViewModel:', JSON.stringify(transformedData, null, 2));
      return transformedData;
    },
  });

  const { mutate: updateListItem, isPending: isUpdatingItem } = useMutation({
    mutationFn: ({ itemId, data }: { itemId:string; data:UpdateListItemCommand }) => {
      if (!user) {
        toast.error("Musisz być zalogowany, aby zaktualizować produkt.");
        return Promise.reject(new Error("User not authenticated"));
      }
      return listService.updateListItem(supabaseClient, itemId, data, user.id);
    },
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousList = queryClient.getQueryData<ShoppingListWithItemsDto>(listQueryKey);
      queryClient.setQueryData<ShoppingListWithItemsDto | null>(listQueryKey, (old) => 
        old ? { ...old, items: old.items.map(item => item.id === itemId ? { ...item, ...data } : item) } : null
      );
      return { previousList };
    },
    onSuccess: () => toast.success("Produkt zaktualizowany!"),
    onError: (err: Error, variables, context) => {
      if (context?.previousList) queryClient.setQueryData(listQueryKey, context.previousList);
      if (err.message !== "User not authenticated") {
        toast.error("Nie udało się zaktualizować produktu.");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listQueryKey }),
  });

  const { mutate: addListItem, isPending: isAddingItem } = useMutation({
    mutationFn: (data: AddListItemCommand) => {
      if (!user) {
        toast.error("Musisz być zalogowany, aby dodać produkt.");
        return Promise.reject(new Error("User not authenticated"));
      }
      return listService.addListItem(supabaseClient, data, user.id);
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousList = queryClient.getQueryData<ShoppingListWithItemsDto>(listQueryKey);
      queryClient.setQueryData<ShoppingListWithItemsDto | null>(listQueryKey, (old) => {
        if (!old) return null;
        const optimisticItem: ListItemDto = {
          ...newItem,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_checked: false,
          source: "manual",
          list_id: old.id,
        };
        return { ...old, items: [...old.items, optimisticItem] };
      });
      return { previousList };
    },
    onSuccess: () => toast.success("Produkt dodany!"),
    onError: (err: Error, variables, context) => {
      if (context?.previousList) queryClient.setQueryData(listQueryKey, context.previousList);
      if (err.message !== "User not authenticated") {
        toast.error("Nie udało się dodać produktu.");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listQueryKey }),
  });

  const { mutate: deleteListItem, isPending: isDeletingItem } = useMutation({
    mutationFn: (itemId: string) => {
      if (!user) {
        toast.error("Musisz być zalogowany, aby usunąć produkt.");
        return Promise.reject(new Error("User not authenticated"));
      }
      return listService.deleteListItem(supabaseClient, itemId, user.id);
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousList = queryClient.getQueryData<ShoppingListWithItemsDto>(listQueryKey);
      queryClient.setQueryData<ShoppingListWithItemsDto | null>(listQueryKey, (old) => 
        old ? { ...old, items: old.items.filter(item => item.id !== itemId) } : null
      );
      return { previousList };
    },
    onSuccess: () => toast.success("Produkt usunięty!"),
    onError: (err: Error, variables, context) => {
      if (context?.previousList) queryClient.setQueryData(listQueryKey, context.previousList);
      if (err.message !== "User not authenticated") {
        toast.error("Nie udało się usunąć produktu.");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listQueryKey }),
  });

  const { mutate: reportAiFeedback, isPending: isReportingFeedback } = useMutation({
    mutationFn: (data: CreateAiFeedbackCommand) => {
      if (!user) {
        toast.error("Musisz być zalogowany, aby wysłać opinię.");
        return Promise.reject(new Error("User not authenticated"));
      }
      return aiFeedbackService.logFeedback(data, user.id);
    },
    onSuccess: () => toast.success("Dziękujemy za Twoją opinię!"),
    onError: (err: Error) => {
      if (err.message !== "User not authenticated") {
        toast.error("Nie udało się wysłać opinii.");
      }
    },
  });
  
  const noListsFound = !isLoadingList && !listViewModel;

  const isLoading = isLoadingCategories || isLoadingList;

  return {
    listViewModel, categories, isLoading, error, noListsFound,
    updateListItem, isUpdatingItem,
    addListItem, isAddingItem,
    deleteListItem, isDeletingItem,
    reportAiFeedback, isReportingFeedback,
  };
};