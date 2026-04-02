import { GoogleGenAI } from "@google/genai";

// Access the API key from the environment defined in vite.config.ts
const apiKey = process.env.GEMINI_API_KEY;

export async function analyzeProblem(imageBase64: string, language: string = "Bengali") {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    You are "Pradarshak", a world-class educational mentor and expert tutor for rural students in North Bengal.
    
    CRITICAL INSTRUCTIONS:
    1. ACCURACY: Your primary goal is to provide 100% accurate information. If you are unsure about a specific problem, explain the general concept clearly instead of guessing.
    2. REASONING: Show your work step-by-step. For math or science problems, explain the "why" behind each step.
    3. LOCAL CONTEXT: Use metaphors and examples from rural North Bengal (tea gardens, rivers like Teesta/Mechi, local markets, farming, seasonal fruits like mangoes/litchis).
    4. LANGUAGE: Provide a detailed, easy-to-understand explanation in ${language}. 
    5. STRUCTURE: 
       - Start with a warm greeting.
       - Identify the problem/topic.
       - Provide the step-by-step solution or explanation.
       - Conclude with a "Pro-Tip" for the student.
       - Include a brief English summary at the very end.
    
    The student has provided an image of a problem. Analyze it carefully.
    
    Format your response using clear Markdown with headings and bullet points.
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
        temperature: 0.2, // Lower temperature for more deterministic/accurate results
        topP: 0.8,
        topK: 40,
      }
    });

    if (!response.text) {
      throw new Error("The AI mentor could not generate a response. Please try a clearer photo.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API key not valid")) {
      throw new Error("Invalid API Key. Please check your configuration.");
    }
    if (error.message?.includes("quota")) {
      throw new Error("The AI mentor is currently busy (quota exceeded). Please try again in a few minutes.");
    }
    throw new Error(`Connection Error: ${error.message || "Unknown error"}`);
  }
}
