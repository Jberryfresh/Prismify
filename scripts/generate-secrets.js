#!/usr/bin/env node

/**
 * Generate Secure Secrets for Prismify
 * ====================================
 * 
 * This script generates cryptographically secure random secrets for:
 * - JWT_SECRET (access tokens)
 * - JWT_REFRESH_SECRET (refresh tokens)
 * - SESSION_SECRET (session management)
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 * 
 * SECURITY NOTES:
 * - Secrets are printed to stdout only (never persisted to disk)
 * - Use crypto.randomBytes for cryptographic security
 * - Minimum length: 32 characters (256 bits) for production
 * - Copy these values to your .env file manually
 * - NEVER commit these secrets to version control
 * 
 * @author Prismify Development Team
 * @date November 2025
 */

import crypto from 'crypto';
// Configuration
const SECRET_LENGTH = 64; // 64 bytes = 512 bits (very secure)
const ENCODING = 'base64'; // base64 is URL-safe and compact

/**
 * Generate a cryptographically secure random secret
 * @param {number} length - Length in bytes (not characters)
 * @returns {string} - Base64 encoded secret
 */
function generateSecret(length = SECRET_LENGTH) {
  return crypto.randomBytes(length).toString(ENCODING);
}

/**
 * Generate a hex-encoded secret (alternative format)
 * @param {number} length - Length in bytes
 * @returns {string} - Hex encoded secret
 */
function generateHexSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Main function - generates and displays secrets
 */
function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 PRISMIFY - SECURE SECRET GENERATOR');
  console.log('='.repeat(80) + '\n');

  console.log('⚠️  SECURITY WARNING:');
  console.log('   - Copy these secrets to your .env file immediately');
  console.log('   - NEVER share these secrets or commit them to version control');
  console.log('   - Generate new secrets for each environment (dev, staging, prod)');
  console.log('   - Store production secrets in a secure vault\n');

  console.log('─'.repeat(80));
  console.log('📋 GENERATED SECRETS (Base64-encoded, 512-bit)');
  console.log('─'.repeat(80) + '\n');

  // Generate secrets
  const jwtSecret = generateSecret();
  const jwtRefreshSecret = generateSecret();
  const sessionSecret = generateSecret();

  // Display in .env format for easy copy-paste
  console.log('# Copy these lines to your .env file:\n');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);

  console.log('\n' + '─'.repeat(80));
  console.log('🔢 ALTERNATIVE FORMAT (Hex-encoded, 256-bit)');
  console.log('─'.repeat(80) + '\n');

  console.log('# Use these if you prefer hex format:\n');
  console.log(`JWT_SECRET=${generateHexSecret()}`);
  console.log(`JWT_REFRESH_SECRET=${generateHexSecret()}`);
  console.log(`SESSION_SECRET=${generateHexSecret()}`);

  console.log('\n' + '─'.repeat(80));
  console.log('📊 SECRET STATISTICS');
  console.log('─'.repeat(80) + '\n');

  console.log(`Secret Length (bytes):      ${SECRET_LENGTH}`);
  console.log(`Secret Length (bits):       ${SECRET_LENGTH * 8}`);
  console.log(`Encoded Length (chars):     ${jwtSecret.length}`);
  console.log(`Encoding Format:            ${ENCODING}`);
  console.log(`Cryptographic Function:     crypto.randomBytes()`);
  console.log(`Entropy (estimated):        ~${(SECRET_LENGTH * 8).toFixed(0)} bits`);

  console.log('\n' + '─'.repeat(80));
  console.log('✅ QUICK SETUP INSTRUCTIONS');
  console.log('─'.repeat(80) + '\n');

  console.log('1. Copy the desired secrets from above');
  console.log('2. Open your .env file (or create from .env.example)');
  console.log('3. Replace the placeholder values with generated secrets');
  console.log('4. Verify .env is in .gitignore (it should be)');
  console.log('5. Restart your application to load new secrets');

  console.log('\n' + '─'.repeat(80));
  console.log('🔒 PRODUCTION SECURITY CHECKLIST');
  console.log('─'.repeat(80) + '\n');

  console.log('☐ Generate separate secrets for each environment');
  console.log('☐ Store production secrets in AWS Secrets Manager / Vault');
  console.log('☐ Rotate secrets every 90 days (or per security policy)');
  console.log('☐ Use environment variables in CI/CD (never hardcode)');
  console.log('☐ Limit access to .env files (chmod 600 on servers)');
  console.log('☐ Enable audit logging for secret access');
  console.log('☐ Revoke old secrets after rotation');

  console.log('\n' + '='.repeat(80));
  console.log('✨ Secrets generated successfully!');
  console.log('='.repeat(80) + '\n');
}

// Execute if run directly (not imported)
// Note: Always run main() since this is a utility script
try {
  main();
} catch (error) {
  console.error('\n❌ ERROR: Failed to generate secrets\n');
  console.error(error.message);
  console.error('\nPlease ensure Node.js crypto module is available.');
  process.exit(1);
}

export { generateSecret, generateHexSecret };
