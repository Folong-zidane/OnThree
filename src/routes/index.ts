import { Router } from 'express';
import createGenealogyRoutes from './genealogyRoutes';
import GenealogyController from '../controllers/genealogyController';
import GenealogyService from '../services/genealogyServices';
import path from 'path';

const router = Router();

// Création des instances avec dépendances
const genealogyService = new GenealogyService(path.join(__dirname, '../../data/genealogy.json'));
const genealogyController = new GenealogyController(genealogyService);

// Montage des routes
router.use('/api/genealogy', createGenealogyRoutes(genealogyController));

export default router;