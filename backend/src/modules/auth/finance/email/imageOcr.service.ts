/**
 * Image OCR Service
 * 
 * Extracts text from images embedded in bank transaction emails using Tesseract.js
 * Many Indian banks send transaction details as images to prevent text scraping
 */

import { createWorker } from 'tesseract.js';
import { logger } from '../../../../utils/logger';

/**
 * Extract text from a base64 encoded image using OCR
 * 
 * @param imageData Base64 encoded image data
 * @param mimeType Image MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns Extracted text from the image
 */
export const extractTextFromImage = async (
  imageData: string,
  mimeType: string
): Promise<string> => {
  try {
    logger.info(`Starting OCR for image (${mimeType})`);
    
    // Create Tesseract worker
    const worker = await createWorker('eng');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Perform OCR
    const { data } = await worker.recognize(imageBuffer);
    
    await worker.terminate();
    
    const extractedText = data.text.trim();
    logger.info(`OCR completed, extracted ${extractedText.length} characters (confidence: ${data.confidence.toFixed(2)}%)`);
    
    return extractedText;
  } catch (error: any) {
    logger.error(`OCR failed: ${error.message}`);
    return '';
  }
};

/**
 * Extract text from multiple images
 * 
 * @param images Array of {data: base64, mimeType: string}
 * @returns Combined text from all images
 */
export const extractTextFromImages = async (
  images: Array<{ data: string; mimeType: string }>
): Promise<string> => {
  if (images.length === 0) {
    return '';
  }
  
  logger.info(`Processing ${images.length} image(s) with OCR`);
  
  const results = await Promise.all(
    images.map(img => extractTextFromImage(img.data, img.mimeType))
  );
  
  // Combine all extracted text
  const combinedText = results.join('\n\n').trim();
  logger.info(`Total OCR text extracted: ${combinedText.length} characters`);
  
  return combinedText;
};

/**
 * Check if an email part is an image
 */
export const isImagePart = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};
