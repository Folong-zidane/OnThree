import { Router } from 'express';
import GenealogyController from '../controllers/genealogyController';
import { validateMember, validateId, validateRelation, validateDepth } from '../middleware/validator';

const createGenealogyRoutes = (genealogyController: GenealogyController) => {
    const router = Router();

    // Routes pour les membres
    router.get('/', genealogyController.getAllMembers);
    router.post('/', validateMember, genealogyController.createMember);
    router.get('/search', genealogyController.searchMembers);
    
    router.post('/relation', validateRelation, genealogyController.addRelation);
    
    router.get('/:id', validateId, genealogyController.getMemberById);
    router.put('/:id', validateId, validateMember, genealogyController.updateMember);
    router.delete('/:id', validateId, genealogyController.deleteMember);
    
    // Routes pour les requêtes généalogiques
    router.get('/:id/ancestors', validateId, validateDepth, genealogyController.getAncestors);
    router.get('/:id/descendants', validateId, validateDepth, genealogyController.getDescendants);

    return router;
};

export default createGenealogyRoutes;