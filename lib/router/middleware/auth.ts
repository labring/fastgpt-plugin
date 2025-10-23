import type { Request, Response, NextFunction } from 'express';

// Auth token middleware for all API routes
export const authTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authToken = req.headers.authtoken as string;
  // Validate token (customize this logic based on your requirements)
  const validToken = process.env.AUTH_TOKEN!;
  if (!validToken) {
    return next(); // if no token is set, skip this middleware
  }

  // Check if Authorization header exists
  if (!authToken || authToken !== validToken) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  // Token is valid, proceed to next middleware/route
  next();
};
