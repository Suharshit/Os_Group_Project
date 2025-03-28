'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateDrinkRecipes, Recipe } from "@/lib/gemini-service";

export default function Home() {
  const [ingredients, setIngredients] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Split ingredients by comma and trim whitespace
    const ingredientList = ingredients.split(',').map(ing => ing.trim()).filter(Boolean);
    
    if (ingredientList.length === 0) {
      setError('Please enter at least one ingredient');
      setIsLoading(false);
      return;
    }
    
    try {
      const generatedRecipes = await generateDrinkRecipes(ingredientList);
      
      if (generatedRecipes.length === 0) {
        setError('No recipes could be generated. Please try different ingredients.');
      } else {
        setRecipes(generatedRecipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to generate recipes. Please try again.');
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-4xl font-bold mb-6 text-center text-primary">
        AI Bartender
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Enter ingredients (comma-separated)"
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Mixing...' : 'Get Recipes'}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Example: vodka, orange juice, lime
        </p>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <p className="text-primary">Shaking up some creative cocktails...</p>
        </div>
      )}

      {recipes.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recipes</h2>
          {recipes.map((recipe, index) => (
            <div 
              key={index} 
              className="bg-white shadow-md rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2 text-primary">{recipe.name}</h3>
              
              <div className="mb-2">
                <strong>Ingredients:</strong>
                <ul className="list-disc list-inside text-gray-700">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <strong>Instructions:</strong>
                <ol className="list-decimal list-inside text-gray-700">
                  {recipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}