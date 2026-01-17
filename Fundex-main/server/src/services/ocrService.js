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
 * Uses advanced document understanding to find the EXACT final amount
 */
export const extractAmountFromBill = (text) => {
  if (!text) return null;

  console.log('💰 Extracting amount from bill with document understanding...');

  // Enhanced keywords for total amount (prioritized by reliability)
  const totalKeywords = [
    // Highest priority - definitive total indicators
    { keyword: 'grand total', priority: 10 },
    { keyword: 'net total', priority: 10 },
    { keyword: 'total amount', priority: 10 },
    { keyword: 'amount payable', priority: 10 },
    { keyword: 'total payable', priority: 10 },
    { keyword: 'final amount', priority: 10 },
    { keyword: 'balance due', priority: 10 },

    // High priority - common total indicators
    { keyword: 'total:', priority: 8 },
    { keyword: 'total =', priority: 8 },
    { keyword: 'total rs', priority: 8 },
    { keyword: 'total inr', priority: 8 },
    { keyword: 'bill amount', priority: 8 },
    { keyword: 'invoice total', priority: 8 },

    // Medium priority - possible total indicators
    { keyword: 'net amount', priority: 6 },
    { keyword: 'payable amount', priority: 6 },
    { keyword: 'amount due', priority: 6 },
    { keyword: 'total', priority: 5 } // Generic "total" has lower priority
  ];

  // Split text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Enhanced amount patterns (ordered by reliability)
  const amountPatterns = [
    // Pattern 1: Currency symbol + amount (most reliable)
    { pattern: /(?:rs\.?|inr|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, priority: 10 },

    // Pattern 2: Amount with decimal (common for bills)
    { pattern: /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/, priority: 8 },

    // Pattern 3: Amount with commas (Indian format)
    { pattern: /\b(\d{1,3}(?:,\d{3})+)\b/, priority: 7 },

    // Pattern 4: Amount after colon or equals
    { pattern: /[:=]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, priority: 6 },

    // Pattern 5: Standalone numbers (least reliable)
    { pattern: /\b(\d{3,})\b/, priority: 3 }
  ];

  let foundAmounts = [];

  // Strategy 1: Look for amounts near total keywords (HIGHEST PRIORITY)
  console.log('🔍 Strategy 1: Looking for amounts near total keywords...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check each keyword
    for (const { keyword, priority: keywordPriority } of totalKeywords) {
      if (line.includes(keyword)) {
        console.log(`📋 Found "${keyword}" in line ${i}: "${lines[i]}"`);

        // Search this line and next 2 lines for amounts
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const searchLine = lines[j];

          // Try each pattern
          for (const { pattern, priority: patternPriority } of amountPatterns) {
            const matches = searchLine.matchAll(new RegExp(pattern.source, 'g'));

            for (const match of matches) {
              const amountStr = match[1].replace(/,/g, ''); // Remove commas
              const amount = parseFloat(amountStr);

              // Validate amount is reasonable
              if (!isNaN(amount) && amount > 0 && amount < 10000000) {
                const confidence = keywordPriority + patternPriority;

                foundAmounts.push({
                  amount: amount,
                  line: searchLine,
                  lineNumber: j,
                  confidence: confidence,
                  source: `keyword-based (${keyword})`,
                  keyword: keyword
                });

                console.log(`✅ Found amount: ₹${amount} (confidence: ${confidence}) in "${searchLine}"`);
              }
            }
          }
        }
      }
    }
  }

  // Strategy 2: Look at bottom section of receipt (last 30% of lines)
  if (foundAmounts.length === 0) {
    console.log('🔍 Strategy 2: Analyzing bottom section of receipt...');

    const bottomStartIndex = Math.floor(lines.length * 0.7); // Last 30% of document
    const bottomLines = lines.slice(bottomStartIndex);

    let bottomAmounts = [];

    for (let i = 0; i < bottomLines.length; i++) {
      const line = bottomLines[i];

      for (const { pattern, priority } of amountPatterns) {
        const matches = line.matchAll(new RegExp(pattern.source, 'g'));

        for (const match of matches) {
          const amountStr = match[1].replace(/,/g, '');
          const amount = parseFloat(amountStr);

          if (!isNaN(amount) && amount > 10 && amount < 10000000) {
            bottomAmounts.push({
              amount: amount,
              line: line,
              lineNumber: bottomStartIndex + i,
              confidence: priority + 3, // Bonus for being at bottom
              source: 'bottom-section'
            });
          }
        }
      }
    }

    // Take the largest amount from bottom section
    if (bottomAmounts.length > 0) {
      bottomAmounts.sort((a, b) => b.amount - a.amount);
      foundAmounts.push(bottomAmounts[0]);
      console.log(`✅ Found largest amount in bottom section: ₹${bottomAmounts[0].amount}`);
    }
  }

  // Strategy 3: Find the largest amount in entire document (FALLBACK)
  if (foundAmounts.length === 0) {
    console.log('🔍 Strategy 3: Finding largest amount in entire document...');

    let allAmounts = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const { pattern } of amountPatterns) {
        const matches = line.matchAll(new RegExp(pattern.source, 'g'));

        for (const match of matches) {
          const amountStr = match[1].replace(/,/g, '');
          const amount = parseFloat(amountStr);

          if (!isNaN(amount) && amount > 50 && amount < 10000000) {
            allAmounts.push({
              amount: amount,
              line: line,
              lineNumber: i,
              confidence: 2,
              source: 'largest-amount'
            });
          }
        }
      }
    }

    if (allAmounts.length > 0) {
      // Sort by amount and take top 3
      allAmounts.sort((a, b) => b.amount - a.amount);

      // Filter out amounts that are too close to each other (likely duplicates)
      const uniqueAmounts = [];
      for (const amt of allAmounts) {
        const isDuplicate = uniqueAmounts.some(
          existing => Math.abs(existing.amount - amt.amount) < 1
        );
        if (!isDuplicate) {
          uniqueAmounts.push(amt);
        }
      }

      // Take the largest unique amount
      if (uniqueAmounts.length > 0) {
        foundAmounts.push(uniqueAmounts[0]);
        console.log(`✅ Found largest amount: ₹${uniqueAmounts[0].amount}`);
      }
    }
  }

  // Return the best match based on confidence
  if (foundAmounts.length > 0) {
    // Sort by confidence (highest first)
    foundAmounts.sort((a, b) => b.confidence - a.confidence);

    const best = foundAmounts[0];
    console.log(`💰 BEST MATCH: ₹${best.amount}`);
    console.log(`   Confidence: ${best.confidence}`);
    console.log(`   Source: ${best.source}`);
    console.log(`   Line: "${best.line}"`);

    return best.amount;
  }

  console.log('❌ No amount found in receipt');
  return null;
};

/**
 * Intelligently extract GST number from bill/receipt
 * GST Format: 2 digits (state code) + 5 letters (PAN) + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
 * Example: 24AABCU9603R1ZM (Maharashtra), 27AABCU9603R1ZM (Maharashtra), 09AABCU9603R1ZM (Uttar Pradesh)
 */
export const extractGSTFromBill = (text) => {
  if (!text) return null;

  console.log('🏢 Extracting GST number from bill...');

  // Enhanced GST pattern - more flexible
  // Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
  const gstPatterns = [
    // Standard GST pattern (strict)
    /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi,
    // Relaxed pattern (allows lowercase, spaces might be OCR errors)
    /\b[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}\b/gi,
    // Very relaxed (for poor OCR)
    /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]/gi
  ];

  // Common GST keywords (optional, for context)
  const gstKeywords = [
    'gstin',
    'gst no',
    'gst number',
    'gst:',
    'gstin:',
    'tax id',
    'tin',
    'vat',
    'tax no'
  ];

  const lines = text.split('\n').map(line => line.trim());
  let foundGST = null;

  // Strategy 1: Look for GST near keywords (HIGHEST PRIORITY)
  console.log('🔍 Strategy 1: Looking for GST near keywords...');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    const hasKeyword = gstKeywords.some(keyword => line.includes(keyword));

    if (hasKeyword) {
      console.log(`📋 Found GST keyword in line: "${lines[i]}"`);

      // Search this line and next 3 lines
      for (let j = i; j < Math.min(i + 4, lines.length); j++) {
        const searchLine = lines[j];

        // Try all patterns
        for (const pattern of gstPatterns) {
          const match = searchLine.match(pattern);
          if (match) {
            foundGST = match[0].toUpperCase().replace(/\s/g, ''); // Remove spaces, uppercase

            // Validate length (must be exactly 15 characters)
            if (foundGST.length === 15) {
              console.log(`✅ Found GST near keyword: ${foundGST}`);
              return foundGST;
            }
          }
        }
      }
    }
  }

  // Strategy 2: Look for 15-character alphanumeric starting with 2 digits (GST format)
  console.log('🔍 Strategy 2: Looking for GST pattern anywhere in text...');

  // Clean text - remove extra spaces
  const cleanedText = text.replace(/\s+/g, ' ');

  for (const pattern of gstPatterns) {
    const matches = cleanedText.matchAll(pattern);
    for (const match of matches) {
      const candidate = match[0].toUpperCase().replace(/\s/g, '');

      // Validate:
      // 1. Length must be 15
      // 2. Must start with valid state code (01-37)
      // 3. Must have 'Z' at position 13 (14th character)
      if (candidate.length === 15) {
        const stateCode = parseInt(candidate.substring(0, 2));
        const hasZ = candidate.charAt(13) === 'Z';

        if (stateCode >= 1 && stateCode <= 37 && hasZ) {
          foundGST = candidate;
          console.log(`✅ Found valid GST pattern: ${foundGST}`);
          return foundGST;
        }
      }
    }
  }

  // Strategy 3: Look for any 15-character sequence starting with 2 digits
  console.log('🔍 Strategy 3: Looking for 15-char sequences starting with digits...');

  // Remove all spaces and newlines
  const compactText = text.replace(/[\s\n]/g, '');

  // Find all 15-character sequences starting with 2 digits
  const regex = /[0-9]{2}[A-Z0-9]{13}/gi;
  const matches = compactText.matchAll(regex);

  for (const match of matches) {
    const candidate = match[0].toUpperCase();

    // Check if it has 'Z' near the end (position 13)
    if (candidate.charAt(13) === 'Z') {
      const stateCode = parseInt(candidate.substring(0, 2));

      if (stateCode >= 1 && stateCode <= 37) {
        foundGST = candidate;
        console.log(`✅ Found GST by pattern matching: ${foundGST}`);
        return foundGST;
      }
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
