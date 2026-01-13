import * as React from "react";
import { useGenerateList } from "@/hooks/useGenerateList";
import { RecipeInputList } from "./RecipeInputList";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Wand2, ChefHat } from "lucide-react"; // Upewnij się, że masz te ikony

export const GenerateListView = () => {
  const { recipes, isLoading, error, addRecipe, removeRecipe, updateRecipe, handleSubmit } = useGenerateList();

  const canAddRecipe = recipes.length < 10;

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:py-16">
      <div className="flex flex-col gap-10">
        {/* 1. SEKCJA NAGŁÓWKA: Dodajemy ikonę i lepsze odstępy */}
        <header className="text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 rotate-3 shadow-sm text-primary">
            <ChefHat className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-foreground">Co dziś kupujemy?</h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed">
              Wklejaj całe przepisy, a my wyczarujemy z nich idealną listę zakupów.
            </p>
          </div>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-8"
        >
          <RecipeInputList recipes={recipes} onRecipeChange={updateRecipe} onRemoveRecipe={removeRecipe} />
          {canAddRecipe && (
            <button
              type="button"
              onClick={addRecipe}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 transition-all hover:border-primary/50 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm transition-transform group-hover:scale-110">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-lg font-medium text-muted-foreground group-hover:text-foreground">
                Dodaj kolejny przepis
              </span>
            </button>
          )}
          <footer className="mt-6 flex flex-col items-center gap-6">
            <Button
              type="submit"
              size="lg"
              className="w-full max-w-xs rounded-full py-7 text-lg shadow-lg transition-transform hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
              {isLoading ? "Czarowanie..." : "Generuj listę"}
            </Button>
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
};
