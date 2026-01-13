/* eslint-disable react/prop-types */
import React from "react";

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateListView } from "./GenerateListView";
import { useGenerateList } from "@/hooks/useGenerateList";

// Mock Astro modules
vi.mock("astro:transitions/client", () => ({
  navigate: vi.fn(),
}));

// Mock the custom hook
vi.mock("@/hooks/useGenerateList", () => ({
  useGenerateList: vi.fn(),
}));

// Mock the child component to simplify testing
vi.mock("./RecipeInputList", () => ({
  RecipeInputList: ({ recipes, onRecipeChange, onRemoveRecipe }) => (
    <div data-testid="recipe-input-list">
      {recipes.map((recipe, index) => (
        <div key={recipe.id}>
          <input
            aria-label={`recipe-input-${index}`}
            value={recipe.text}
            onChange={(e) => onRecipeChange(recipe.id, e.target.value)}
          />
          <button aria-label={`remove-recipe-${index}`} onClick={() => onRemoveRecipe(recipe.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

describe("GenerateListView", () => {
  const mockUseGenerateList = useGenerateList as vi.Mock;

  const mockAddRecipe = vi.fn();
  const mockRemoveRecipe = vi.fn();
  const mockUpdateRecipe = vi.fn();
  const mockHandleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (props = {}) => {
    const defaultProps = {
      recipes: [{ id: "1", text: "" }],
      isLoading: false,
      error: null,
      addRecipe: mockAddRecipe,
      removeRecipe: mockRemoveRecipe,
      updateRecipe: mockUpdateRecipe,
      handleSubmit: mockHandleSubmit,
    };
    mockUseGenerateList.mockReturnValue({ ...defaultProps, ...props });
    return render(<GenerateListView />);
  };

  it("should render the initial view correctly", () => {
    setup();
    expect(screen.getByText("Wygeneruj listę z przepisów")).toBeInTheDocument();
    expect(
      screen.getByText("Wklej jeden lub więcej przepisów, a my wyczarujemy z nich listę zakupów.")
    ).toBeInTheDocument();
    expect(screen.getByTestId("recipe-input-list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dodaj kolejny przepis/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generuj listę/i })).toBeEnabled();
  });

  it('should call addRecipe when the "Add another recipe" button is clicked', () => {
    setup();
    const addButton = screen.getByRole("button", { name: /Dodaj kolejny przepis/i });
    fireEvent.click(addButton);
    expect(mockAddRecipe).toHaveBeenCalledTimes(1);
  });

  it('should disable "Add another recipe" button when recipe limit is reached', () => {
    const recipes = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, text: "" }));
    setup({ recipes });
    const addButton = screen.getByRole("button", { name: /Dodaj kolejny przepis/i });
    expect(addButton).toBeDisabled();
  });

  it("should call updateRecipe when a recipe text is changed", () => {
    setup();
    const recipeInput = screen.getByLabelText("recipe-input-0");
    fireEvent.change(recipeInput, { target: { value: "New recipe text" } });
    expect(mockUpdateRecipe).toHaveBeenCalledWith("1", "New recipe text");
  });

  it("should call removeRecipe when the remove button is clicked", () => {
    setup({ recipes: [{ id: "1", text: "test" }] });
    const removeButton = screen.getByLabelText("remove-recipe-0");
    fireEvent.click(removeButton);
    expect(mockRemoveRecipe).toHaveBeenCalledWith("1");
  });

  it("should call handleSubmit when the form is submitted", () => {
    setup();
    const generateButton = screen.getByRole("button", { name: /Generuj listę/i });
    fireEvent.click(generateButton);
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it("should show loading spinner and disable submit button when isLoading is true", () => {
    setup({ isLoading: true });
    const generateButton = screen.getByRole("button", { name: /Generuj listę/i });
    expect(generateButton).toBeDisabled();
    expect(generateButton.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("should display an error message when error state is not null", () => {
    const errorMessage = "Wystąpił błąd podczas generowania listy.";
    setup({ error: errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should not display an error message when error is null", () => {
    setup({ error: null });
    const errorElement = screen.getByTestId("error-message");
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent.trim()).toBe("");
  });
});
