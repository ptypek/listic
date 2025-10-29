import React from "react";
import { Trash2 } from "lucide-react";
import type { RecipeInputViewModel } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RecipeInputProps {
  recipe: RecipeInputViewModel;
  onRecipeChange: (id: string, value: string) => void;
  onRemoveRecipe: (id: string) => void;
}

export const RecipeInput = ({ recipe, onRecipeChange, onRemoveRecipe }: RecipeInputProps) => {
  return (
    <div className="relative flex flex-col gap-2">
      <Label htmlFor={recipe.id} className="sr-only">
        Recipe
      </Label>
      <Textarea
        id={recipe.id}
        value={recipe.value}
        onChange={(e) => onRecipeChange(recipe.id, e.target.value)}
        placeholder="Wklej przepis lub listę składników..."
        className="min-h-[120px] resize-y pr-12"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveRecipe(recipe.id)}
        className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
        aria-label="Remove recipe"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
};
