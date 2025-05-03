// routes/familyRoutes.ts

import express from 'express';
import FamilyController from '../controllers/familyController';

const router = express.Router();
const familyController = new FamilyController(process.env.DATA_DIR || './data');


// Routes pour les membres
router.post('/families/:familyId/members', familyController.addMemberToFamily);
router.get('/families/:familyId/members/search', familyController.searchFamilyMembers);


// Routes pour l'analyse graphique
router.get('/families/:familyId/shortest-path/:sourceId/:targetId', familyController.findShortestPath);
router.get('/families/:familyId/indirect-relations/:sourceId/:targetId', familyController.findIndirectRelations);
router.get('/families/:familyId/branches', familyController.findFamilyBranches);
router.get('/families/:familyId/minimal-tree', familyController.findMinimalConnectionTree);
router.get('/families/:familyId/members/:memberId/uncles-aunts', familyController.findUnclesAndAunts);
router.get('/families/:familyId/members/:memberId/cousins', familyController.findCousins);

export default router;