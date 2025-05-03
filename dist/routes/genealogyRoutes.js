"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validator_1 = require("../middleware/validator");
const createGenealogyRoutes = (genealogyController) => {
    const router = (0, express_1.Router)();
    // Routes pour les membres
    router.get('/', genealogyController.getAllMembers);
    router.post('/', validator_1.validateMember, genealogyController.createMember);
    router.get('/search', genealogyController.searchMembers);
    router.post('/relation', validator_1.validateRelation, genealogyController.addRelation);
    router.get('/:id', validator_1.validateId, genealogyController.getMemberById);
    router.put('/:id', validator_1.validateId, validator_1.validateMember, genealogyController.updateMember);
    router.delete('/:id', validator_1.validateId, genealogyController.deleteMember);
    // Routes pour les requêtes généalogiques
    router.get('/:id/ancestors', validator_1.validateId, validator_1.validateDepth, genealogyController.getAncestors);
    router.get('/:id/descendants', validator_1.validateId, validator_1.validateDepth, genealogyController.getDescendants);
    return router;
};
exports.default = createGenealogyRoutes;
