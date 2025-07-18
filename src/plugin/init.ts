import { MongoFastGPTPlugin } from './schema';
import { addLog } from '../utils/log';

export async function initPluginSystem() {
  try {
    // Initialize the plugin system
    await MongoFastGPTPlugin.connect();
    addLog.info('Plugin system initialized successfully');
  } catch (error) {
    addLog.error('Failed to initialize plugin system:', error);
    throw error;
  }
}
