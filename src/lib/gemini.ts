import { GoogleGenAI } from "@google/genai";

export async function analyzeProblem(imageBase64: string, language: string = "Bengali") {
  // Access the API key directly from process.env which is defined in vite.config.ts
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("The AI Mentor's connection key is not set. Please ensure you have added your GEMINI_API_KEY in the AI Studio Secrets panel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Using gemini-3-flash-preview as it's the most reliable model for free-tier/injected keys
  const model = "gemini-3-flash-preview";
  
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
        temperature: 0.1, // Very low temperature for maximum accuracy
        topP: 0.8,
        topK: 40,
      }
    });

    if (!response.text) {
      throw new Error("The AI mentor could not read the image. Please try taking a clearer, brighter photo.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("API key not valid") || error.message?.includes("403")) {
      throw new Error("The connection key is invalid. Please update your GEMINI_API_KEY in the Secrets panel.");
    }
    
    if (error.message?.includes("quota") || error.message?.includes("429")) {
      throw new Error("The AI mentor is currently helping many students. Please wait a minute and try again.");
    }

    throw new Error(`Mentor Connection Error: ${error.message || "Please check your internet and try again."}`);
  }
}
