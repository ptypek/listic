
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { navigate } from 'astro:transitions/client';
import type {
  GenerateListFromRecipesCommand,
  RecipeInputViewModel,
  ShoppingListDto,
} from '@/types';

const createNewRecipe = (): RecipeInputViewModel => ({
  id: crypto.randomUUID(),
  value: '',
});

const generateListApiCall = async (
  command: GenerateListFromRecipesCommand
): Promise<ShoppingListDto> => {
  const response = await fetch('/api/v1/lists/generate-from-recipes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw new Error('Sesja wygasła. Proszę zalogować się ponownie.');
      case 502:
        throw new Error('Zewnętrzna usługa AI nie odpowiada. Spróbuj ponownie za chwilę.');
      default:
        throw new Error('Wystąpił nieoczekiwany błąd. Prosimy spróbować ponownie.');
    }
  }

  return response.json();
};

export const useGenerateList = () => {
  const [recipes, setRecipes] = useState<RecipeInputViewModel[]>([createNewRecipe()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: generateListApiCall,
    onSuccess: (data) => {
      navigate('/list');
    },
  });

  const addRecipe = () => {
    setRecipes((prevRecipes) => {
      if (prevRecipes.length >= 10) return prevRecipes;
      return [...prevRecipes, createNewRecipe()];
    });
  };

  const removeRecipe = (id: string) => {
    setRecipes((prevRecipes) => {
      if (prevRecipes.length <= 1) return prevRecipes;
      return prevRecipes.filter((recipe) => recipe.id !== id);
    });
  };

  const updateRecipe = (id: string, value: string) => {
    if (validationError) {
      setValidationError(null);
    }
    setRecipes((prevRecipes) =>
      prevRecipes.map((recipe) => (recipe.id === id ? { ...recipe, value } : recipe))
    );
  };

  const handleSubmit = () => {
    const validRecipes = recipes.map((r) => r.value.trim()).filter(Boolean);

    if (validRecipes.length === 0) {
      setValidationError('Proszę dodać przynajmniej jeden przepis.');
      return;
    }

    setValidationError(null);
    const command: GenerateListFromRecipesCommand = {
      list_name: 'Nowa lista z przepisów',
      recipes: validRecipes,
    };

    mutation.mutate(command);
  };

  const error = validationError || mutation.error?.message || null;

  return {
    recipes,
    isLoading: mutation.isPending,
    error,
    addRecipe,
    removeRecipe,
    updateRecipe,
    handleSubmit,
  };
};
