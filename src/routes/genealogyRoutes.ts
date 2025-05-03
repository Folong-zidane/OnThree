// routes/genealogyRoutes.ts
import express from 'express';
import * as GenealogyController from '../controllers/genealogyController';
import {
  validateMember,
  validateId,
  validateRelation,
  validateDepth,
} from '../middleware/validator';

const router = express.Router();

// Routes pour la gestion des familles
router.get('/families', GenealogyController.getAllFamilies);
router.get('/families/:id', GenealogyController.getFamilyById);
router.post('/families', GenealogyController.createFamily);
router.put('/families/:id', GenealogyController.updateFamily);
router.delete('/families/:id', GenealogyController.deleteFamily);

// Routes pour la gestion des membres
router.get('/families/:familyId/members', GenealogyController.getAllMembersOfFamily);
router.get('/families/:familyId/members/:memberId', GenealogyController.getMemberById);
router.post('/families/:familyId/members', validateMember, GenealogyController.addMemberToFamily);
router.put('/families/:familyId/members/:memberId', GenealogyController.updateMember);
router.delete('/families/:familyId/members/:memberId', GenealogyController.removeMember);

// Routes pour les relations familiales
router.post('/families/:familyId/relations', GenealogyController.addRelation);
router.delete('/families/:familyId/relations', GenealogyController.removeRelation);

// Routes pour les algorithmes de graphe
router.get('/families/:familyId/spanning-tree', GenealogyController.findMinimumSpanningTree);
router.get('/families/:familyId/subfamilies', GenealogyController.identifySubfamilies);

export default router;