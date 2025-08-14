
import { GoogleGenAI, Type } from "@google/genai";
import { DatamapEntry } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sourceField: {
          type: Type.STRING,
          description: 'The name of the field in the source schema.',
        },
        sourceType: {
          type: Type.STRING,
          description: 'The data type of the source field. Should be one of: string, number, boolean, object, array.',
        },
        targetField: {
          type: Type.STRING,
          description: 'The corresponding field name in the target schema.',
        },
        targetType: {
          type: Type.STRING,
          description: 'The data type of the target field. Should be one of an IANA standard MIME type for the source data. string, number, boolean, object, array.',
        },
      },
      required: ["sourceField", "sourceType", "targetField", "targetType"],
    },
};

export const suggestMappings = async (
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>
): Promise<DatamapEntry[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const sourceKeys = Object.keys(sourceSchema);
  const targetKeys = Object.keys(targetSchema);

  const prompt = `
    You are an expert data mapping assistant. Your task is to analyze a source and a target JSON schema and generate a list of likely data mappings between them.
    
    RULES:
    1.  Map source fields to the most semantically similar target fields.
    2.  Infer the data type for each field. Choose from: string, number, boolean, object, array.
    3.  If no logical mapping exists for a field, do not include it.
    4.  Your response MUST be a valid JSON array of objects that strictly adheres to the provided schema. Do not include any extra text or markdown.
    
    Source Schema Keys: ${JSON.stringify(sourceKeys)}
    Target Schema Keys: ${JSON.stringify(targetKeys)}
    
    Example Response Format:
    [
      { "sourceField": "user_id", "sourceType": "number", "targetField": "userId", "targetType": "number" },
      { "sourceField": "email_address", "sourceType": "string", "targetField": "email", "targetType": "string" }
    ]

    Now, generate the mappings for the provided schemas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    let jsonStr = response.text.trim();
    
    const parsedData = JSON.parse(jsonStr);
    
    if (Array.isArray(parsedData)) {
      // Validate the structure of the returned objects
      return parsedData.filter(item => 
        item && typeof item.sourceField === 'string' && typeof item.targetField === 'string'
      ).map(item => ({
        id: crypto.randomUUID(),
        sourceField: item.sourceField,
        sourceType: item.sourceType || 'string',
        targetField: item.targetField,
        targetType: item.targetType || 'string'
      }));
    }
    
    return [];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get suggestions from AI. Please check the console for details.");
  }
};