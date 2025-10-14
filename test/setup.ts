import { readFileSync } from 'fs';
import { resolve } from 'path';

// 手动加载.env.test文件
function loadEnvFile(filePath: string) {
  try {
    const envFile = readFileSync(filePath, 'utf8');
    const lines = envFile.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not load ${filePath}`);
  }
}

// 加载.env.test文件
loadEnvFile(resolve(process.cwd(), '.env.test'));
loadEnvFile(resolve(process.cwd(), '.env.test.local'));
