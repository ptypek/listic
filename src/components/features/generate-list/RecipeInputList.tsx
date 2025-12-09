
import React from 'react';
import type { RecipeInputViewModel } from '@/types';
import { RecipeInput } from './RecipeInput';

interface RecipeInputListProps {
  recipes: RecipeInputViewModel[];
  onRecipeChange: (id: string, value: string) => void;
  onRemoveRecipe: (id: string) => void;
}

export const RecipeInputList = ({
  recipes,
  onRecipeChange,
  onRemoveRecipe,
}: RecipeInputListProps) => {
  return (
    <div className="grid gap-4">
      {recipes.map((recipe) => (
        <RecipeInput
          key={recipe.id}
          recipe={recipe}
          onRecipeChange={onRecipeChange}
          onRemoveRecipe={onRemoveRecipe}
        />
      ))}
    </div>
  );
};
