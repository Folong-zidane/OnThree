// routes/index.ts
import { Router } from 'express';
import genealogyRoutes from './genealogyRoutes';
import familyRoutes from './familyRoutes';
const router = Router();

// Montage des routes
router.use('/api/genealogy', genealogyRoutes);
router.use('/api/genealogy',familyRoutes);
export default router;