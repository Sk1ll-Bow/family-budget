import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from '../../services/errorService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * A single position extracted from a receipt by Gemini AI.
 */
export interface IReceiptPosition {
  /** Item name */
  name: string;
  /** Final price after any discounts applied */
  amount: number;
  /** ISO 8601 date from the receipt */
  spentAt: string;
  /** AI-suggested category (e.g. "Food", "Transport") */
  categorySuggestion: string;
  /** Store / shop name */
  storeName: string;
  /** Extra details: quantity, weight, unit price, discounts, etc. */
  details: string;
  /** Detected payment method: "Card", "Cash", or "Unknown" */
  paymentMethod: 'Card' | 'Cash' | 'Unknown';
}

/**
 * Converts a File object to a base64 string for Gemini API.
 */
async function fileToGenerativePart(file: File) {
  const base64Promise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64Promise,
      mimeType: file.type,
    },
  };
}

/**
 * Uses Gemini AI to analyze a receipt image and extract structured JSON data.
 */
export async function analyzeReceiptWithGemini(
  imageFile: File,
  existingCategoryNames: string[] = [],
  existingStoreNames: string[] = []
): Promise<IReceiptPosition[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const categoriesContext = existingCategoryNames.length
    ? `\n    EXISTING CATEGORIES (Use these if they match closely): ${existingCategoryNames.join(', ')}`
    : '';

  const storesContext = existingStoreNames.length
    ? `\n    EXISTING STORES (Use these if they match closely): ${existingStoreNames.join(', ')}`
    : '';

  const prompt = `
    You are a receipt analyzer. Analyze this receipt image and extract ONLY individual purchased items/products.
    ALSO, identify the payment method used for the entire receipt (Card or Cash).

    CRITICAL RULES:
    - Do NOT include receipt totals, subtotals, tax lines, or summary lines as separate items.
    - Each item must be a real purchased product or service.
    - If an item has a discount on the receipt, subtract the discount from the item price. The "amount" must be the FINAL price after discount.
    - Use dot (.) as decimal separator.
    - Keep item names in their original language from the receipt.${categoriesContext}${storesContext}

    For each item provide:
    1. "name" — the product/item name as printed on the receipt
    2. "amount" — final price AFTER any discounts applied (number)
    3. "spentAt" — receipt date in ISO 8601, or "${new Date().toISOString()}" if not found
    4. "categorySuggestion" — MUST be an exact match from EXISTING CATEGORIES if appropriate. If no existing category fits well, suggest a new short broad category in Russian (e.g., "Продукты", "Транспорт", "Здоровье").
    5. "storeName" — MUST be an exact match from EXISTING STORES if appropriate. If no existing store fits, extract the store/shop name from the receipt header.
    6. "details" — quantity, weight, unit price, discount info (e.g. "2 x €1.50, discount -€0.30")
    7. "paymentMethod" — analyze signs on the receipt (Auth code, Card number, "CARD", "CASH", "НАЛИЧНЫЕ", "БАНКОВСКАЯ КАРТА", etc.) and return "Card", "Cash", or "Unknown".

    Return ONLY a JSON array, no other text:
    [
      {
        "name": "Milk 3.5%",
        "amount": 1.29,
        "spentAt": "2026-03-26T14:30:00Z",
        "categorySuggestion": "Food",
        "storeName": "Lidl",
        "details": "1 x €1.29",
        "paymentMethod": "Card"
      }
    ]
  `;

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    let result;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        result = await model.generateContent([prompt, imagePart]);
        break; 
      } catch (err: any) {
        attempts++;
        const isTransient = err.message?.includes('503') || err.message?.includes('overloaded');
        if (isTransient && attempts < maxAttempts) {
          console.warn(`[Gemini] Transient error, retrying attempt ${attempts}...`);
          await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
          continue;
        }
        throw err;
      }
    }

    if (!result) throw new Error('No result from Gemini after retries.');

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (sometimes Gemini wraps it in ```json ... ```)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not parse JSON from Gemini response');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gemini Analysis Failed';
    const stack = error instanceof Error ? error.stack : undefined;
    
    const errorId = await logError(message, stack);
    console.error(`[Gemini] Error logging entry: ${errorId}`, error);
    
    // Add custom property to error to identify it as a quota error
    if (message.includes('429') || message.includes('quota')) {
      (error as any).isQuotaExceeded = true;
    }
    
    throw error;
  }
}
