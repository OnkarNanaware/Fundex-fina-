import Tesseract from "tesseract.js";

/**
 * Enhanced OCR Service for Bill/Receipt Processing
 * Intelligently extracts amounts and GST numbers from receipts
 */

/**
 * Extract text from image using Tesseract OCR
 */
export const extractTextFromImage = async (imageUrl) => {
  try {
    console.log('🔍 Starting OCR extraction...');
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
        }
      },
    });

    console.log('✅ OCR extraction completed');
    return result.data.text;
  } catch (err) {
    console.error("❌ OCR Error:", err);
    return null;
  }
};

/**
 * Intelligently extract the total amount from a bill/receipt
 * Looks for common patterns like "Total", "Grand Total", "Amount Payable", etc.
 */
export const extractAmountFromBill = (text) => {
  if (!text) return null;

  console.log('💰 Extracting amount from bill...');

  // Common keywords that indicate total amount
  const totalKeywords = [
    'total amount',
    'grand total',
    'net total',
    'amount payable',
    'total payable',
    'bill amount',
    'invoice total',
    'final amount',
    'amount due',
    'total:',
    'total =',
    'total rs',
    'total inr',
    'net amount',
    'payable amount',
    'balance due'
  ];

  // Split text into lines
  const lines = text.split('\n').map(line => line.trim());

  // Amount patterns
  const amountPatterns = [
    // Rs 1,234.56 or Rs 1234.56 or Rs 1234
    /(?:rs\.?|inr|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    // 1,234.56 or 1234.56 or 1234 (standalone numbers)
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    // 1234.56 without commas
    /(\d+\.\d{2})/,
    // Plain numbers
    /(\d+)/
  ];

  let foundAmounts = [];

  // Strategy 1: Look for amounts near total keywords
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check if line contains any total keyword
    const hasKeyword = totalKeywords.some(keyword => line.includes(keyword));

    if (hasKeyword) {
      console.log(`📋 Found total keyword in line: "${lines[i]}"`);

      // Try to extract amount from this line and next 2 lines
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const searchLine = lines[j];

        // Try each pattern
        for (const pattern of amountPatterns) {
          const match = searchLine.match(pattern);
          if (match) {
            const amountStr = match[1].replace(/,/g, ''); // Remove commas
            const amount = parseFloat(amountStr);

            if (!isNaN(amount) && amount > 0 && amount < 10000000) { // Reasonable range
              foundAmounts.push({
                amount: amount,
                line: searchLine,
                confidence: 'high',
                source: 'keyword-based'
              });
              console.log(`✅ Found amount near keyword: ₹${amount} in "${searchLine}"`);
              break;
            }
          }
        }
      }
    }
  }

  // Strategy 2: Look for the largest amount (often the total)
  if (foundAmounts.length === 0) {
    console.log('⚠️ No keyword-based amounts found, looking for largest amount...');

    let allAmounts = [];
    for (const line of lines) {
      for (const pattern of amountPatterns) {
        const matches = line.matchAll(new RegExp(pattern, 'g'));
        for (const match of matches) {
          const amountStr = match[1].replace(/,/g, '');
          const amount = parseFloat(amountStr);

          if (!isNaN(amount) && amount > 10 && amount < 10000000) {
            allAmounts.push({
              amount: amount,
              line: line,
              confidence: 'medium',
              source: 'largest-amount'
            });
          }
        }
      }
    }

    // Sort by amount descending and take the largest
    if (allAmounts.length > 0) {
      allAmounts.sort((a, b) => b.amount - a.amount);
      foundAmounts.push(allAmounts[0]);
      console.log(`✅ Found largest amount: ₹${allAmounts[0].amount}`);
    }
  }

  // Strategy 3: Look for amounts at the bottom of the receipt (last 5 lines)
  if (foundAmounts.length === 0) {
    console.log('⚠️ Looking in last 5 lines of receipt...');

    const lastLines = lines.slice(-5);
    for (const line of lastLines) {
      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amountStr = match[1].replace(/,/g, '');
          const amount = parseFloat(amountStr);

          if (!isNaN(amount) && amount > 10 && amount < 10000000) {
            foundAmounts.push({
              amount: amount,
              line: line,
              confidence: 'low',
              source: 'bottom-of-receipt'
            });
            console.log(`✅ Found amount at bottom: ₹${amount}`);
            break;
          }
        }
      }
    }
  }

  // Return the best match
  if (foundAmounts.length > 0) {
    // Prefer high confidence matches
    foundAmounts.sort((a, b) => {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });

    const best = foundAmounts[0];
    console.log(`💰 Best match: ₹${best.amount} (${best.confidence} confidence, ${best.source})`);
    return best.amount;
  }

  console.log('❌ No amount found in receipt');
  return null;
};

/**
 * Intelligently extract GST number from bill/receipt
 * Looks for GSTIN patterns and validates format
 */
export const extractGSTFromBill = (text) => {
  if (!text) return null;

  console.log('🏢 Extracting GST number from bill...');

  // GST number pattern: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
  const gstPattern = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi;

  // Common GST keywords
  const gstKeywords = [
    'gstin',
    'gst no',
    'gst number',
    'gst:',
    'gstin:',
    'tax id',
    'tin'
  ];

  const lines = text.split('\n').map(line => line.trim());
  let foundGST = null;

  // Strategy 1: Look for GST near keywords
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    const hasKeyword = gstKeywords.some(keyword => line.includes(keyword));

    if (hasKeyword) {
      console.log(`📋 Found GST keyword in line: "${lines[i]}"`);

      // Search this line and next 2 lines
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const match = lines[j].match(gstPattern);
        if (match) {
          foundGST = match[0].toUpperCase();
          console.log(`✅ Found GST near keyword: ${foundGST}`);
          return foundGST;
        }
      }
    }
  }

  // Strategy 2: Look for GST pattern anywhere in text
  if (!foundGST) {
    console.log('⚠️ No keyword-based GST found, searching entire text...');

    const match = text.match(gstPattern);
    if (match) {
      foundGST = match[0].toUpperCase();
      console.log(`✅ Found GST in text: ${foundGST}`);
      return foundGST;
    }
  }

  console.log('❌ No GST number found in receipt');
  return null;
};

/**
 * Comprehensive bill analysis
 * Extracts all relevant information from a bill/receipt
 */
export const analyzeBill = async (imageUrl) => {
  try {
    console.log('📄 Starting comprehensive bill analysis...');

    // Extract text
    const text = await extractTextFromImage(imageUrl);

    if (!text) {
      console.log('❌ No text extracted from image');
      return {
        success: false,
        text: null,
        amount: null,
        gstNumber: null
      };
    }

    console.log(`📝 Extracted ${text.length} characters of text`);

    // Extract amount
    const amount = extractAmountFromBill(text);

    // Extract GST
    const gstNumber = extractGSTFromBill(text);

    console.log('✅ Bill analysis complete');
    console.log(`   Amount: ${amount ? '₹' + amount : 'Not found'}`);
    console.log(`   GST: ${gstNumber || 'Not found'}`);

    return {
      success: true,
      text: text,
      amount: amount,
      gstNumber: gstNumber,
      textLength: text.length
    };
  } catch (error) {
    console.error('❌ Error analyzing bill:', error);
    return {
      success: false,
      text: null,
      amount: null,
      gstNumber: null,
      error: error.message
    };
  }
};

export default {
  extractTextFromImage,
  extractAmountFromBill,
  extractGSTFromBill,
  analyzeBill
};
