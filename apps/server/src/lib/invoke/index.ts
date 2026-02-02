/**
 * FastGPT Reverse Invocation Framework
 *
 * This module provides a way for tools running in worker threads to invoke
 * FastGPT API methods through a message-passing mechanism.
 *
 * Usage in tools:
 * ```typescript
 * import { invoke } from '@/invoke';
 *
 * const accessToken = await invoke<string>('getAccessToken', {});
 * ```
 *
 * To add new methods:
 * 1. Create a file in lib/invoke/ (e.g., sendMessage.ts)
 * 2. Implement and register the method using registerInvokeHandler
 * 3. Import it in this file
 */

// Export the invoke function for use in tools
export { invoke } from '../worker/invoke';

// Export registration function for method implementations
export { registerInvokeHandler } from './registry';

// Import all registered methods to ensure they are loaded
import './accessToken';
import './wecom/getAuthToken';

// Future methods can be added here:
// import './sendMessage';
// import './uploadFile';
