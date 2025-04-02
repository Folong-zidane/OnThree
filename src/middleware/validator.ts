import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateMember = [
    body('firstName').notEmpty().withMessage('Le prénom est requis'),
    body('lastName').notEmpty().withMessage('Le nom est requis'),
    body('gender').isIn(['MALE', 'FEMALE']).withMessage('Le genre doit être MALE ou FEMALE'),
    body('birthDate').isISO8601().withMessage('La date de naissance doit être au format ISO'),
    body('parents').isArray().withMessage('Les parents doivent être un tableau'),
    body('children').isArray().withMessage('Les enfants doivent être un tableau'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateId = [
    param('id').notEmpty().withMessage('ID requis'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateRelation = [
    body('childId').notEmpty().withMessage('ID de l\'enfant requis'),
    body('parentId').notEmpty().withMessage('ID du parent requis'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateDepth = [
    query('depth').optional().isInt({ min: 1 }).withMessage('La profondeur doit être un entier positif'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];