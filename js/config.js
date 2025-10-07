// Global configuration for the EduAI-Portal project

/**
 * Retrieves the shared API key from a centralized, obfuscated source.
 * @returns {string} The de-obfuscated API key.
 */
function getSharedApiKey() {
  // To update the key, modify the parts of the array below.
  const keyParts = ["sk-0560c9a8", "49694436a71c", "1ef4c053505a"];
  return keyParts.join('');
}
