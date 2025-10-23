import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
import { ensureDir } from './fs';

/**
 * Pack a directory into a .pkg file
 * @param dir - Source directory path to pack
 * @param dist - Destination path for the .pkg file
 */
export const pkg = async (dir: string, dist: string) => {
  const zip = new JSZip();

  // Recursively add files to zip
  async function addFilesToZip(currentDir: string, zipFolder: JSZip) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);

      if (entry.isDirectory()) {
        // Create folder and recursively add its contents
        const folder = zipFolder.folder(relativePath);
        if (folder) {
          await addFilesToZip(fullPath, zip);
        }
      } else if (entry.isFile()) {
        // Read file and add to zip
        const fileContent = await fs.readFile(fullPath);
        zip.file(relativePath, new Uint8Array(fileContent));
      }
    }
  }

  await addFilesToZip(dir, zip);

  // Generate zip file with .pkg extension
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // Ensure dist has .pkg extension
  const distPath = dist.endsWith('.pkg') ? dist : `${dist}.pkg`;

  // Write to disk
  await fs.writeFile(distPath, new Uint8Array(content));
  return distPath;
};

/**
 * Unpack a .pkg file to a directory
 * @param pkgPath - Path to the .pkg file to unpack
 * @param dist - Destination directory to extract files to
 */
export const unpkg = async (pkgPath: string, dist: string) => {
  // Read the .pkg file
  const pkgData = await fs.readFile(pkgPath);

  // Load zip data
  const zip = await JSZip.loadAsync(new Uint8Array(pkgData));

  // Ensure output directory exists
  await ensureDir(dist);

  // Extract all files
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    const promise = (async () => {
      const outputPath = path.join(dist, relativePath);

      if (zipEntry.dir) {
        // Create directory
        await fs.mkdir(outputPath, { recursive: true });
      } else {
        // Extract file
        const content = await zipEntry.async('nodebuffer');

        // Ensure parent directory exists
        const parentDir = path.dirname(outputPath);
        await fs.mkdir(parentDir, { recursive: true });

        // Write file
        await fs.writeFile(outputPath, new Uint8Array(content));
      }
    })();

    filePromises.push(promise);
  });

  // Wait for all files to be extracted
  await Promise.all(filePromises);
};
