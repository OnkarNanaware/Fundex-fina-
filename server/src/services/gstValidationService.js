import axios from 'axios';

/**
 * GST Validation Service
 * Validates GST numbers using regex and optionally via external API
 */

/**
 * Validates GST number format using regex
 * GST format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity number) + 1 letter (Z) + 1 alphanumeric (checksum)
 * Example: 29ABCDE1234F1Z5
 */
export const validateGSTFormat = (gstNumber) => {
    if (!gstNumber) return false;
    
    // Remove spaces and convert to uppercase
    const cleanGST = gstNumber.replace(/\s/g, '').toUpperCase();
    
    // GST regex pattern
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    return gstRegex.test(cleanGST);
};

/**
 * Validates GST number using the GST API
 * Note: This uses a public GST verification API
 * For production, you may need to use official GST portal APIs with proper authentication
 */
export const validateGSTOnline = async (gstNumber) => {
    try {
        if (!gstNumber) {
            return {
                valid: false,
                error: 'GST number is required'
            };
        }

        // Clean and format GST number
        const cleanGST = gstNumber.replace(/\s/g, '').toUpperCase();

        // First check format
        if (!validateGSTFormat(cleanGST)) {
            return {
                valid: false,
                error: 'Invalid GST number format',
                gstNumber: cleanGST
            };
        }

        // Try to validate using public API
        // Note: This is a free API endpoint. For production, use official GST portal API
        try {
            const response = await axios.get(
                `https://sheet.gstincheck.co.in/check/${cleanGST}`,
                {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Fundex-App'
                    }
                }
            );

            if (response.data && response.data.flag) {
                return {
                    valid: true,
                    gstNumber: cleanGST,
                    businessName: response.data.tradeNam || response.data.lgnm || 'N/A',
                    status: response.data.sts || 'Active',
                    registrationDate: response.data.rgdt || null,
                    address: response.data.pradr?.adr || 'N/A',
                    stateCode: cleanGST.substring(0, 2),
                    apiVerified: true
                };
            } else {
                return {
                    valid: false,
                    error: 'GST number not found in registry',
                    gstNumber: cleanGST,
                    apiVerified: false
                };
            }
        } catch (apiError) {
            console.warn('⚠️ GST API verification failed, falling back to format validation:', apiError.message);
            
            // If API fails, fall back to format validation
            return {
                valid: true,
                gstNumber: cleanGST,
                error: 'API verification unavailable - format validated only',
                apiVerified: false,
                formatValid: true
            };
        }
    } catch (error) {
        console.error('❌ GST validation error:', error);
        return {
            valid: false,
            error: error.message,
            gstNumber: gstNumber
        };
    }
};

/**
 * Extract GST number from text using regex
 */
export const extractGSTFromText = (text) => {
    if (!text) return null;

    // GST regex pattern
    const gstRegex = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi;
    
    const matches = text.match(gstRegex);
    
    if (matches && matches.length > 0) {
        // Return the first match, cleaned and uppercased
        return matches[0].toUpperCase();
    }
    
    return null;
};

/**
 * Comprehensive GST validation with extraction
 */
export const validateAndExtractGST = async (text) => {
    try {
        // Extract GST from text
        const extractedGST = extractGSTFromText(text);
        
        if (!extractedGST) {
            return {
                found: false,
                valid: false,
                error: 'No GST number found in the text'
            };
        }

        // Validate the extracted GST
        const validationResult = await validateGSTOnline(extractedGST);
        
        return {
            found: true,
            extracted: extractedGST,
            ...validationResult
        };
    } catch (error) {
        console.error('❌ GST extraction and validation error:', error);
        return {
            found: false,
            valid: false,
            error: error.message
        };
    }
};

export default {
    validateGSTFormat,
    validateGSTOnline,
    extractGSTFromText,
    validateAndExtractGST
};
