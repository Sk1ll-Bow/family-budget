import Tesseract from 'tesseract.js';
import { analyzeReceiptWithGemini, type IReceiptPosition } from './geminiService';

export interface OcrResult {
  rawText: string;
  detectedAmount: number | null;
  confidence: number; // 0.0 to 1.0
  candidates: number[]; // Alternative amounts if confidence is low
  positions?: IReceiptPosition[]; // New field for Gemini positions
}

/**
 * Uses Gemini AI to analyze a receipt.
 */
export async function processReceiptWithGemini(
  file: File,
  existingCategoryNames: string[] = [],
  existingStoreNames: string[] = []
): Promise<OcrResult> {
  try {
    const positions = await analyzeReceiptWithGemini(file, existingCategoryNames, existingStoreNames);
    
    // Total is usually the first one or the largest one.
    const total = positions.length > 0 ? positions[0].amount : null;

    return {
      rawText: JSON.stringify(positions),
      detectedAmount: total,
      confidence: 0.95,
      candidates: positions.map(p => p.amount),
      positions: positions
    };
  } catch (error: unknown) {
    console.error('[OCR-Gemini] Error:', error);
    // Propagate the specific error instead of a generic empty result
    // This allows UI to show specific quota logic
    throw error;
  }
}
// ... existing code ...

/**
 * Advanced Receipt OCR Service using Tesseract.js
 * Scans Russian receipts and attempts to extract the final total amount.
 */
export async function processReceiptImage(imageFile: File): Promise<OcrResult> {
  let worker: Tesseract.Worker | null = null;
  
  try {
    worker = await Tesseract.createWorker('rus+eng');
    
    // Set parameters to optimize for receipt text (mostly numbers and CAPS)
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });

    const result = await worker.recognize(imageFile);
    const text = result.data.text;
    
    return parseReceiptText(text);
  } catch (error) {
    console.error('[OCR] Error processing image:', error);
    return {
      rawText: '',
      detectedAmount: null,
      confidence: 0,
      candidates: []
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Parses raw OCR text to find the "Total" amount.
 * Looks for keywords like "TOTAL", "AMOUNT", "DUE", "=" near numbers.
 */
function parseReceiptText(text: string): OcrResult {
  const lines = text.split('\n').map(l => l.toUpperCase().trim()).filter(Boolean);
  
  const amountRegex = /(\d{1,3}(?:[ .,]\d{3})*(?:[.,]\d{2}))/; // matches 1,234.56 or 1 234,56
  
  const keywords = ['TOTAL', 'AMOUNT', 'DUE', 'PAY', 'SUM'];
  let bestMatch: number | null = null;
  let highestConfidence = 0;
  const candidates = new Set<number>();

  for (const line of lines) {
    // Collect all numbers in the line as candidates
    const matches = Array.from(line.matchAll(new RegExp(amountRegex, 'g')));
    const numbersInLine = matches.map(m => cleanNumber(m[0])).filter(n => n > 0);
    
    // Add to all candidates pool (we might need these if confidence is low)
    numbersInLine.forEach(n => candidates.add(n));

    // Check if line contains a target keyword
    const hasKeyword = keywords.some(kw => line.includes(kw));
    
    if (hasKeyword && numbersInLine.length > 0) {
      // Keyword and number on the SAME line is a very strong signal
      const amount = Math.max(...numbersInLine); // Usually total is the largest number on the 'Total' line
      
      // Calculate a basic confidence score
      let score = 0.8; // Base high score for same-line match
      if (line.includes('=')) score += 0.1; 
      if (amount > 10) score += 0.05; // Rule out micro-amounts

      if (score > highestConfidence) {
        highestConfidence = score;
        bestMatch = amount;
      }
    }
  }

  // Fallback: If no keywords matched, just take the largest number found overall, but with low confidence
  if (!bestMatch && candidates.size > 0) {
    const sorted = Array.from(candidates).sort((a, b) => b - a);
    bestMatch = sorted[0];
    highestConfidence = 0.4; // Low confidence
  }

  // Remove the chosen best match from the candidates lists
  if (bestMatch) {
    candidates.delete(bestMatch);
  }

  // 3-Tier UX strategy implementation:
  // If confidence is < 0.3, we essentially failed
  if (highestConfidence < 0.3) {
    return {
      rawText: text,
      detectedAmount: null,
      confidence: highestConfidence,
      candidates: Array.from(candidates).slice(0, 3) 
    };
  }

  return {
    rawText: text,
    detectedAmount: bestMatch,
    confidence: highestConfidence,
    candidates: Array.from(candidates).slice(0, 3)
  };
}

/** Parses string like "1 234,56" into float 1234.56 */
function cleanNumber(str: string): number {
  // Replace comma with dot, remove spaces
  const cleaned = str.replace(/\s/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * QR Code extraction for Russian receipts.
 * Russian Federal Tax Service QR format usually looks like:
 * t=20210815T1215&s=1234.56&fn=...&i=...&fp=...&n=1
 * Where `s` is the sum.
 */
export function extractAmountFromQR(qrData: string): number | null {
  try {
    const url = new URL(`http://dummy.com/?${qrData}`);
    const sumString = url.searchParams.get('s');
    
    if (sumString) {
      return cleanNumber(sumString);
    }
    return null;
  } catch {
    // If it's not a valid URL/query string format
    return null;
  }
}
