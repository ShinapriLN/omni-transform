import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Transforms a raster image into an SVG code string using Gemini 2.5 Flash.
 */
export const transformImageToSvg = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  
  // Remove data URL prefix if present for the API call data
  const base64Clean = base64Data.split(',')[1] || base64Data;

  const prompt = `
    You are an expert vector graphics artist and technical implementation specialist.
    Task: Convert the visual content of the attached image into a high-quality, clean, and simplified SVG (Scalable Vector Graphics) code.
    
    Requirements:
    1. Output ONLY the raw <svg>...</svg> code. Do not wrap it in markdown code blocks like \`\`\`xml.
    2. Do not include any conversational text.
    3. Ensure the SVG has a 'viewBox' attribute matching the aspect ratio.
    4. Optimize for clean paths and minimal code. Use semantic grouping <g> where appropriate.
    5. If the image is a photograph, create a stylized vector illustration or line-art representation of it.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Clean,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Cleanup: sometimes models still add markdown formatting despite instructions
    let cleanSvg = text.trim();
    if (cleanSvg.startsWith('```xml')) cleanSvg = cleanSvg.replace(/^```xml/, '');
    if (cleanSvg.startsWith('```svg')) cleanSvg = cleanSvg.replace(/^```svg/, '');
    if (cleanSvg.startsWith('```')) cleanSvg = cleanSvg.replace(/^```/, '');
    if (cleanSvg.endsWith('```')) cleanSvg = cleanSvg.replace(/```$/, '');
    
    return cleanSvg.trim();

  } catch (error) {
    console.error("Gemini SVG Transformation failed:", error);
    throw error;
  }
};
