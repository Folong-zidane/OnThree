import { Request, Response, NextFunction } from 'express';
import GenealogyService from '../services/genealogyServices';
import { FamilyMember } from '../models/familyMember';
import logger from '../utils/logger';

class GenealogyController {
    private genealogyService: GenealogyService;

    constructor(genealogyService: GenealogyService) {
        this.genealogyService = genealogyService;
    }

    getAllMembers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const members = await this.genealogyService.getAllMembers();
            res.json(members);
        } catch (error) {
            next(error);
        }
    };

    getMemberById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const member = await this.genealogyService.getMemberById(req.params.id);
            
            if (!member) {
                return res.status(404).json({ message: 'Membre non trouvé' });
            }
            
            res.json(member);
        } catch (error) {
            next(error);
        }
    };

    createMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const newMember = await this.genealogyService.createMember(req.body);
            res.status(201).json(newMember);
        } catch (error) {
            next(error);
        }
    };

    updateMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updatedMember = await this.genealogyService.updateMember(req.params.id, req.body);
            
            if (!updatedMember) {
                return res.status(404).json({ message: 'Membre non trouvé' });
            }
            
            res.json(updatedMember);
        } catch (error) {
            next(error);
        }
    };

    deleteMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const success = await this.genealogyService.deleteMember(req.params.id);
            
            if (!success) {
                return res.status(404).json({ message: 'Membre non trouvé' });
            }
            
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    addRelation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { childId, parentId } = req.body;
            
            if (!childId || !parentId) {
                return res.status(400).json({ message: 'childId et parentId sont requis' });
            }
            
            const success = await this.genealogyService.addRelation(childId, parentId);
            
            if (!success) {
                return res.status(404).json({ message: 'Enfant ou parent non trouvé' });
            }
            
            res.status(201).json({ message: 'Relation ajoutée avec succès' });
        } catch (error) {
            next(error);
        }
    };

    searchMembers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const criteria = req.query as unknown as Partial<FamilyMember>;
            const members = await this.genealogyService.searchMembers(criteria);
            res.json(members);
        } catch (error) {
            next(error);
        }
    };

    getAncestors = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const depth = req.query.depth ? parseInt(req.query.depth as string) : undefined;
            
            const ancestors = await this.genealogyService.findAncestors(id, depth);
            res.json(ancestors);
        } catch (error) {
            next(error);
        }
    };

    getDescendants = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const depth = req.query.depth ? parseInt(req.query.depth as string) : undefined;
            
            const descendants = await this.genealogyService.findDescendants(id, depth);
            res.json(descendants);
        } catch (error) {
            next(error);
        }
    };
}

export default GenealogyController;