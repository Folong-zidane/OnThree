"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDepth = exports.validateRelation = exports.validateId = exports.validateMember = void 0;
const express_validator_1 = require("express-validator");
exports.validateMember = [
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('Le prénom est requis'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Le nom est requis'),
    (0, express_validator_1.body)('gender').isIn(['MALE', 'FEMALE']).withMessage('Le genre doit être MALE ou FEMALE'),
    (0, express_validator_1.body)('birthDate').isISO8601().withMessage('La date de naissance doit être au format ISO'),
    (0, express_validator_1.body)('parents').isArray().withMessage('Les parents doivent être un tableau'),
    (0, express_validator_1.body)('children').isArray().withMessage('Les enfants doivent être un tableau'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
exports.validateId = [
    (0, express_validator_1.param)('id').notEmpty().withMessage('ID requis'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
exports.validateRelation = [
    (0, express_validator_1.body)('childId').notEmpty().withMessage('ID de l\'enfant requis'),
    (0, express_validator_1.body)('parentId').notEmpty().withMessage('ID du parent requis'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
exports.validateDepth = [
    (0, express_validator_1.query)('depth').optional().isInt({ min: 1 }).withMessage('La profondeur doit être un entier positif'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
