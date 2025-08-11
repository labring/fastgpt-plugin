import type { Request, Response, NextFunction } from 'express';
import { addLog } from '@/utils/log';

// Auth token middleware for all API routes
export const authTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extract token from multiple header formats for compatibility
  let authToken: string | undefined;

  // Priority: authtoken > plugin-token > Bearer token
  if (req.headers.authtoken) {
    authToken = req.headers.authtoken as string;
  } else if (req.headers['plugin-token']) {
    authToken = req.headers['plugin-token'] as string;
  } else if (req.headers.authorization) {
    const authHeader = req.headers.authorization as string;
    // Properly handle Bearer token format
    if (authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim whitespace
    } else {
      // Log malformed authorization header
      addLog.warn('Malformed authorization header received', {
        authHeader: authHeader.substring(0, 20) + '...'
      });
    }
  }

  // Get valid token from environment variables
  const validToken = process.env.PLUGIN_TOKEN || process.env.AUTH_TOKEN;

  if (!validToken) {
    addLog.debug('No authentication token configured, skipping auth middleware');
    return next(); // if no token is set, skip this middleware
  }

  // Validate token presence and correctness
  if (!authToken) {
    addLog.warn('Authentication attempt without token', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path
    });
    return res.status(401).json({
      message: 'Authentication token required'
    });
  }

  if (authToken !== validToken) {
    addLog.warn('Authentication attempt with invalid token', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      tokenLength: authToken.length
    });
    return res.status(401).json({
      message: 'Invalid authentication token'
    });
  }

  // Token is valid, proceed to next middleware/route
  addLog.debug('Authentication successful', { path: req.path });
  next();
};
