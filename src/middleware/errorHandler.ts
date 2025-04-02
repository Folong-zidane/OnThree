import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(`${err.message} - ${req.originalUrl} - ${req.method}`);
    
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        message: err.message || 'Une erreur est survenue',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`) as AppError;
    error.statusCode = 404;
    next(error);
};