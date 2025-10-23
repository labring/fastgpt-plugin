import * as fs from 'fs';
import * as path from 'path';

const packagesDirPath = path.join(__dirname, '..', 'modules', 'tool', 'packages');

if (fs.existsSync(packagesDirPath)) {
  const folders = fs
    .readdirSync(packagesDirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  folders.forEach((folder) => {
    const folderPath = path.join(packagesDirPath, folder);
    const indexTsPath = path.join(folderPath, 'index.ts');

    if (!fs.existsSync(indexTsPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`Removed folder: ${folder}`);
    }
  });
}
