
import { useGenerateList } from '@/hooks/useGenerateList';
import { RecipeInputList } from './RecipeInputList';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';

export const GenerateListView = () => {
  const {
    recipes,
    isLoading,
    error,
    addRecipe,
    removeRecipe,
    updateRecipe,
    handleSubmit,
  } = useGenerateList();

  const canAddRecipe = recipes.length < 10;

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Wygeneruj listę z przepisów
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Wklej jeden lub więcej przepisów, a my wyczarujemy z nich listę zakupów.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mt-8 flex flex-col gap-4"
        >
          <RecipeInputList
            recipes={recipes}
            onRecipeChange={updateRecipe}
            onRemoveRecipe={removeRecipe}
          />

          <div className="flex justify-start">
            <Button type="button" variant="ghost" onClick={addRecipe} disabled={!canAddRecipe}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Dodaj kolejny przepis
            </Button>
          </div>

          <footer className="mt-4 flex flex-col items-center gap-4">
            <Button type="submit" size="lg" className="w-full max-w-xs" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generuj listę
            </Button>
            <p className="min-h-[24px] text-sm text-destructive">{error || ' '}</p>
          </footer>
        </form>
      </div>
    </div>
  );
};
