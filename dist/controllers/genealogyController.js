"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GenealogyController {
    constructor(genealogyService) {
        this.getAllMembers = async (req, res, next) => {
            try {
                const members = await this.genealogyService.getAllMembers();
                res.json(members);
            }
            catch (error) {
                next(error);
            }
        };
        this.getMemberById = async (req, res, next) => {
            try {
                const member = await this.genealogyService.getMemberById(req.params.id);
                if (!member) {
                    return res.status(404).json({ message: 'Membre non trouvé' });
                }
                res.json(member);
            }
            catch (error) {
                next(error);
            }
        };
        this.createMember = async (req, res, next) => {
            try {
                const newMember = await this.genealogyService.createMember(req.body);
                res.status(201).json(newMember);
            }
            catch (error) {
                next(error);
            }
        };
        this.updateMember = async (req, res, next) => {
            try {
                const updatedMember = await this.genealogyService.updateMember(req.params.id, req.body);
                if (!updatedMember) {
                    return res.status(404).json({ message: 'Membre non trouvé' });
                }
                res.json(updatedMember);
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteMember = async (req, res, next) => {
            try {
                const success = await this.genealogyService.deleteMember(req.params.id);
                if (!success) {
                    return res.status(404).json({ message: 'Membre non trouvé' });
                }
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        };
        this.addRelation = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.searchMembers = async (req, res, next) => {
            try {
                const criteria = req.query;
                const members = await this.genealogyService.searchMembers(criteria);
                res.json(members);
            }
            catch (error) {
                next(error);
            }
        };
        this.getAncestors = async (req, res, next) => {
            try {
                const { id } = req.params;
                const depth = req.query.depth ? parseInt(req.query.depth) : undefined;
                const ancestors = await this.genealogyService.findAncestors(id, depth);
                res.json(ancestors);
            }
            catch (error) {
                next(error);
            }
        };
        this.getDescendants = async (req, res, next) => {
            try {
                const { id } = req.params;
                const depth = req.query.depth ? parseInt(req.query.depth) : undefined;
                const descendants = await this.genealogyService.findDescendants(id, depth);
                res.json(descendants);
            }
            catch (error) {
                next(error);
            }
        };
        this.genealogyService = genealogyService;
    }
}
exports.default = GenealogyController;
