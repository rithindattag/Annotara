import { NextFunction, Request, Response } from 'express';

/**
 * Generic Express error handler that hides stack traces from the client.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
};
