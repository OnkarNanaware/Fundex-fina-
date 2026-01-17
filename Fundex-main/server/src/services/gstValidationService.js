import axios from 'axios';

/**
 * GST Validation Service
 * Validates GST numbers using regex and optionally via external API
 */

/**
 * Validates GST number format using regex
 * Flexible validation to accept variations like 24BNKPCO308R1ZH
 */
export const validateGSTFormat = (gstNumber) => {
    if (!gstNumber) return false;

    // Remove spaces and convert to uppercase
    const cleanGST = gstNumber.replace(/\s/g, '').toUpperCase();

    // Must be exactly 15 characters
    if (cleanGST.length !== 15) return false;

    // Flexible pattern: 2 digits + 12 alphanumeric + 1 alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z0-9]{12}[A-Z0-9]{1}$/;

    // Validate state code (01-37)
    const stateCode = parseInt(cleanGST.substring(0, 2));

    // Check for 'Z' at position 13 or 14 (some formats vary)
    const hasZ = cleanGST.includes('Z');

    return gstRegex.test(cleanGST) &&
        stateCode >= 1 && stateCode <= 37 &&
        hasZ;
};

/**
 * Validates GST number using MockAPI endpoint
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

        // Validate using your MockAPI endpoint
        try {
            console.log(`🔍 Validating GST ${cleanGST} with MockAPI...`);

            const response = await axios.get(
                `https://696a9db03a2b2151f8487cef.mockapi.io/gst/gstNumber`,
                {
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Check if the GST number exists in the response
            if (response.data && Array.isArray(response.data)) {
                const gstRecord = response.data.find(
                    record => record.gstNumber && record.gstNumber.toUpperCase() === cleanGST
                );

                if (gstRecord) {
                    console.log(`✅ GST ${cleanGST} found in registry`);
                    return {
                        valid: true,
                        gstNumber: cleanGST,
                        businessName: gstRecord.businessName || gstRecord.name || 'N/A',
                        status: gstRecord.status || 'Active',
                        registrationDate: gstRecord.registrationDate || null,
                        address: gstRecord.address || 'N/A',
                        stateCode: cleanGST.substring(0, 2),
                        apiVerified: true
                    };
                } else {
                    console.log(`⚠️ GST ${cleanGST} not found in registry`);
                    // GST not in registry, but format is valid
                    return {
                        valid: true, // Don't penalize - might be new business
                        gstNumber: cleanGST,
                        error: 'GST number not found in registry (might be new business)',
                        apiVerified: false,
                        formatValid: true
                    };
                }
            } else {
                console.log('⚠️ Invalid API response format');
                return {
                    valid: true,
                    gstNumber: cleanGST,
                    error: 'API verification unavailable - format validated only',
                    apiVerified: false,
                    formatValid: true
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
