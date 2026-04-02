import { GoogleGenAI } from "@google/genai";

export async function analyzeProblem(imageBase64: string, language: string = "Bengali") {
  // Access the API key from process.env (defined in vite.config.ts)
  const apiKey = process.env.GEMINI_API_KEY;

  // We've removed the explicit check as requested. 
  // The SDK will attempt to use the key provided in the environment.
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are "Pradarshak", a world-class educational mentor and expert tutor for rural students in North Bengal.
    
    CRITICAL INSTRUCTIONS:
    1. ACCURACY: Your primary goal is to provide 100% accurate information.
    2. REASONING: Show your work step-by-step.
    3. LOCAL CONTEXT: Use metaphors from rural North Bengal (tea gardens, rivers, farming).
    4. LANGUAGE: Provide a detailed explanation in ${language}. 
    5. STRUCTURE: Warm greeting, problem identification, step-by-step solution, Pro-Tip, and English summary.
    
    The student has provided an image of a problem. Analyze it carefully.
    Format your response using clear Markdown.
  `;

  const imagePart = {
    inlineData: {
      data: imageBase64.split(",")[1],
      mimeType: "image/jpeg",
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [imagePart, { text: prompt }] }],
      config: {
        temperature: 0.1,
      }
    });

    if (!response.text) {
      throw new Error("The AI mentor could not read the image. Please try a clearer photo.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle specific API errors gracefully
    if (error.message?.includes("API key not valid") || error.message?.includes("403") || error.message?.includes("401")) {
      throw new Error("The AI Mentor is having trouble connecting. Please ensure your GEMINI_API_KEY is set in the Secrets panel and the app is re-deployed.");
    }
    
    if (error.message?.includes("quota") || error.message?.includes("429")) {
      throw new Error("The AI mentor is busy. Please wait a minute and try again.");
    }

    throw new Error(`Mentor Connection Error: ${error.message || "Please check your internet and try again."}`);
  }
}
