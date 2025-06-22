import { readdirSync } from 'fs';
import { join, extname, basename } from 'path';

/**
 * Dynamically scan and load API handlers from the api directory (synchronous)
 * @param apiDir - The directory containing API files
 * @returns Object containing contracts and handlers
 */
export function loadApiHandlers(fullApiDir: string) {
  const contracts: Record<string, any> = {};
  const handlers: Record<string, any> = {};

  try {
    // Read all files in the directory
    const files = readdirSync(fullApiDir);

    // Filter for TypeScript/JavaScript files
    const moduleFiles = files.filter((file) => ['.ts', '.js'].includes(extname(file)));

    // Dynamically require each API file
    for (const file of moduleFiles) {
      const fileName = basename(file, extname(file));
      const filePath = join(fullApiDir, file);

      try {
        // Clear require cache to ensure fresh import
        delete require.cache[require.resolve(filePath)];

        // Use require for synchronous loading
        const module = require(filePath);
        const exportedModule = module.default || module;

        if (exportedModule?.contract && exportedModule?.handler) {
          contracts[fileName] = exportedModule.contract;
          handlers[fileName] = exportedModule.handler;
          console.log(`✓ Loaded API: ${fileName}`);
        } else {
          console.warn(`⚠ Skipped ${fileName}: Missing contract or handler`);
        }
      } catch (error) {
        console.error(`✗ Failed to load ${fileName}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error reading API directory ${fullApiDir}:`, error);
  }

  return { contracts, handlers };
}
