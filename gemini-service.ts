import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string[];
}

export async function generateDrinkRecipes(ingredients: string[]): Promise<Recipe[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Act as an expert bartender. Generate 3-4 unique drink recipes using these ingredients: ${ingredients.join(', ')}.
      For each recipe, provide:
      - Unique drink name
      - Complete list of ingredients (include proportions)
      - Detailed step-by-step mixing instructions
      
      Ensure recipes are creative and use the provided ingredients prominently.
      Format the response as a strict JSON array of recipes.
      Example format:
      [
        {
          "name": "Tropical Fusion",
          "ingredients": ["2 oz rum", "4 oz pineapple juice", "1 oz coconut cream"],
          "instructions": [
            "Fill a shaker with ice",
            "Pour all ingredients into the shaker",
            "Shake vigorously for 15 seconds",
            "Strain into a chilled cocktail glass",
            "Garnish with a pineapple wedge"
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the JSON response, handling potential parsing errors
    try {
      // Remove any code block markers and trim whitespace
      const cleanedResponse = response.replace(/```json|```/g, '').trim();
      const recipes: Recipe[] = JSON.parse(cleanedResponse);
      return recipes;
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', parseError, 'Raw response:', response);
      return [];
    }
  } catch (error) {
    console.error('Error generating recipes:', error);
    return [];
  }
}