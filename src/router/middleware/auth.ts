import type { Request, Response, NextFunction } from 'express';

// Auth token middleware for all API routes
export const authTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authToken = req.headers.authtoken as string;
  console.log(req.headers);
  // Check if Authorization header exists
  if (!authToken) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  // Validate token (customize this logic based on your requirements)
  const validToken = process.env.AUTH_TOKEN!;

  if (authToken !== validToken) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  // Token is valid, proceed to next middleware/route
  next();
};
