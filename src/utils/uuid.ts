/**
 * Generate random hex characters using Math.random
 * This is a React Native compatible approach that doesn't require crypto
 */
function getRandomHex(): string {
  const hex = '0123456789abcdef';
  // Use a combination of Math.random and Date.now() for better randomness
  const random = Math.random() * 16;
  const timestamp = Date.now() % 16;
  const combined = (random + timestamp) % 16;
  return hex[Math.floor(combined)];
}

/**
 * Generate a UUID v4 compatible string
 * Works in React Native environment without requiring crypto.getRandomValues()
 */
export function generateUUID(): string {
  // Generate random hex values
  const hexChars: string[] = [];
  
  // Generate 32 random hex characters
  for (let i = 0; i < 32; i++) {
    hexChars.push(getRandomHex());
  }
  
  // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // Set version (4) in position 13
  hexChars[12] = '4';
  // Set variant bits (8, 9, a, or b) in position 17
  const variantChars = ['8', '9', 'a', 'b'];
  hexChars[16] = variantChars[Math.floor(Math.random() * 4)];
  
  const uuid = [
    hexChars.slice(0, 8).join(''),
    hexChars.slice(8, 12).join(''),
    hexChars.slice(12, 16).join(''),
    hexChars.slice(16, 20).join(''),
    hexChars.slice(20, 32).join(''),
  ].join('-');
  
  return uuid;
}

// Cache expo-crypto module to avoid repeated requires
let expoCrypto: any = null;
let cryptoChecked = false;

function getExpoCrypto() {
  if (!cryptoChecked) {
    try {
      expoCrypto = require('expo-crypto');
      cryptoChecked = true;
    } catch (error) {
      cryptoChecked = true;
      expoCrypto = null;
    }
  }
  return expoCrypto;
}

/**
 * Generate UUID using expo-crypto if available, otherwise fallback to Math.random
 * This is the recommended function to use for generating UUIDs in React Native
 * This function will NEVER throw an error - it always returns a valid UUID
 */
export function generateUUIDSecure(): string {
  try {
    const crypto = getExpoCrypto();
    
    if (crypto && typeof crypto.getRandomValues === 'function') {
      try {
        // Use expo-crypto for better randomness
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        
        // Set version (4) and variant bits
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant bits
        
        // Convert to hex string
        const hex = Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32),
        ].join('-');
      } catch (error) {
        // If expo-crypto fails, silently fall back to Math.random
        return generateUUID();
      }
    }
    
    // Fall back to Math.random implementation (guaranteed to work)
    return generateUUID();
  } catch (error) {
    // Ultimate fallback - if everything fails, use Math.random
    // This should never happen, but ensures we always return a UUID
    return generateUUID();
  }
}

// Export default as generateUUID for backwards compatibility
export default generateUUID;

