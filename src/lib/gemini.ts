import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function analyzeProblem(imageBase64: string, language: string = "Bengali") {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are "Pradarshak", a friendly and wise rural tutor from North Bengal. 
    A student has shared an image of a problem from their textbook or a handwritten note.
    
    Your task:
    1. Identify the problem in the image (it could be math, science, or any subject).
    2. Explain the concept in very simple terms.
    3. Use local metaphors relevant to rural North Bengal (e.g., tea gardens, mangoes, rivers, farming) to explain complex ideas.
    4. Provide the explanation in ${language} and also a brief summary in English.
    5. If it's a math problem, don't just give the answer; explain the steps like a mentor.
    
    Format your response using Markdown.
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
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
