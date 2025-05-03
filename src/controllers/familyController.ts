// controllers/familyController.ts

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import FamilyService from '../services/familyService';
import GraphService from '../services/graphService';
import RelationService from '../services/relationService';
import { CreateFamilyDTO, CreateMemberDTO } from '../models/family';
import { FamilyMember } from '../models/member';
import logger from '../utils/logger';

class FamilyController {
  private familyService: FamilyService;
  private graphService: GraphService;
  private relationService: RelationService;
  
  constructor(dataDir: string) {
    this.familyService = new FamilyService(dataDir);
    this.graphService = new GraphService();
    this.relationService = new RelationService(dataDir);
  }
  
  /**
   * Obtenir toutes les familles
   */
  getAllFamilies = async (req: Request, res: Response): Promise<void> => {
    try {
      const families = await this.familyService.getAllFamilies();
      res.status(200).json(families);
    } catch (error) {
      logger.error('Erreur lors de la récupération des familles:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des familles' });
    }
  };
  
  /**
   * Obtenir une famille par son ID
   */
  getFamilyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const family = await this.familyService.getFamilyById(id);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${id} non trouvée` });
        return;
      }
      
      res.status(200).json(family);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la famille ${req.params.id}:`, error);
      res.status(500).json({ message: 'Erreur lors de la récupération de la famille' });
    }
  };
  
  /**
   * Créer une nouvelle famille
   */
  createFamily = async (req: Request, res: Response): Promise<void> => {
    try {
      const familyData: CreateFamilyDTO = req.body;
      
      // Valider les données
      if (!familyData.name) {
        res.status(400).json({ message: 'Le nom de la famille est requis' });
        return;
      }
      
      const newFamily = await this.familyService.createFamily(familyData);
      
      if (!newFamily) {
        res.status(500).json({ message: 'Erreur lors de la création de la famille' });
        return;
      }
      
      res.status(201).json(newFamily);
    } catch (error) {
      logger.error('Erreur lors de la création de la famille:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la famille' });
    }
  };
  
  /**
   * Mettre à jour une famille
   */
  updateFamily = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedFamily = await this.familyService.updateFamily(id, updates);
      
      if (!updatedFamily) {
        res.status(404).json({ message: `Famille avec l'ID ${id} non trouvée` });
        return;
      }
      
      res.status(200).json(updatedFamily);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la famille ${req.params.id}:`, error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour de la famille' });
    }
  };
  
  /**
   * Supprimer une famille
   */
  deleteFamily = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.familyService.deleteFamily(id);
      
      if (!success) {
        res.status(404).json({ message: `Famille avec l'ID ${id} non trouvée` });
        return;
      }
      
      res.status(200).json({ message: 'Famille supprimée avec succès' });
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la famille ${req.params.id}:`, error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la famille' });
    }
  };
  
  /**
   * Ajouter un membre à une famille
   */
  addMemberToFamily = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId } = req.params;
      const memberData: CreateMemberDTO = req.body;
      
      // Valider les données
      if (!memberData.firstName || !memberData.lastName) {
        res.status(400).json({ message: 'Le prénom et le nom sont requis' });
        return;
      }
      
      const newMember = await this.familyService.addMemberToFamily(familyId, memberData);
      
      if (!newMember) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      res.status(201).json(newMember);
    } catch (error) {
      logger.error(`Erreur lors de l'ajout d'un membre à la famille ${req.params.familyId}:`, error);
      res.status(500).json({ message: 'Erreur lors de l\'ajout du membre à la famille' });
    }
  };
  
  /**
   * Rechercher des membres dans une famille
   */
  searchFamilyMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId } = req.params;
      const criteria = req.query;
      
      const members = await this.familyService.searchFamilyMembers(familyId, criteria as any);
      
      res.status(200).json(members);
    } catch (error) {
      logger.error(`Erreur lors de la recherche de membres dans la famille ${req.params.familyId}:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche de membres' });
    }
  };
  
  /**
   * Ajouter une relation parent-enfant
   */
  addParentChildRelation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, parentId, childId } = req.params;
      
      const success = await this.relationService.addParentChildRelation(familyId, parentId, childId);
      
      if (!success) {
        res.status(404).json({ message: 'Membres ou famille non trouvés' });
        return;
      }
      
      res.status(200).json({ message: 'Relation parent-enfant ajoutée avec succès' });
    } catch (error) {
      logger.error(`Erreur lors de l'ajout de la relation parent-enfant:`, error);
      res.status(500).json({ message: 'Erreur lors de l\'ajout de la relation parent-enfant' });
    }
  };
  
  /**
   * Ajouter une relation de conjoint
   */
  addSpouseRelation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, member1Id, member2Id } = req.params;
      
      const success = await this.relationService.addSpouseRelation(familyId, member1Id, member2Id);
      
      if (!success) {
        res.status(404).json({ message: 'Membres ou famille non trouvés, ou un membre a déjà un conjoint' });
        return;
      }
      
      res.status(200).json({ message: 'Relation de conjoint ajoutée avec succès' });
    } catch (error) {
      logger.error(`Erreur lors de l'ajout de la relation de conjoint:`, error);
      res.status(500).json({ message: 'Erreur lors de l\'ajout de la relation de conjoint' });
    }
  };
  
  /**
   * Supprimer une relation
   */
  removeRelation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, member1Id, member2Id } = req.params;
      
      const success = await this.relationService.removeRelation(familyId, member1Id, member2Id);
      
      if (!success) {
        res.status(404).json({ message: 'Membres, famille ou relation non trouvés' });
        return;
      }
      
      res.status(200).json({ message: 'Relation supprimée avec succès' });
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la relation:`, error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la relation' });
    }
  };
  
  /**
   * Trouver le chemin le plus court entre deux membres
   */
  findShortestPath = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, sourceId, targetId } = req.params;
      
      const family = await this.familyService.getFamilyById(familyId);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      const path = this.graphService.findShortestPath(family, sourceId, targetId);
      
      if (!path) {
        res.status(404).json({ message: 'Aucun chemin trouvé entre les membres' });
        return;
      }
      
      res.status(200).json(path);
    } catch (error) {
      logger.error(`Erreur lors de la recherche du chemin le plus court:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche du chemin le plus court' });
    }
  };
  
  /**
   * Détecter les relations indirectes entre deux membres
   */
  findIndirectRelations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, sourceId, targetId } = req.params;
      
      const family = await this.familyService.getFamilyById(familyId);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      const result = this.graphService.findIndirectRelations(family, sourceId, targetId);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Erreur lors de la recherche des relations indirectes:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche des relations indirectes' });
    }
  };
  
  /**
   * Trouver les sous-familles/branches
   */
  findFamilyBranches = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId } = req.params;
      
      const family = await this.familyService.getFamilyById(familyId);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      const branches = this.graphService.identifyFamilyBranches(family);
      
      res.status(200).json(branches);
    } catch (error) {
      logger.error(`Erreur lors de la recherche des branches familiales:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche des branches familiales' });
    }
  };
  
  /**
   * Trouver l'arbre couvrant minimal
   */
  findMinimalConnectionTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId } = req.params;
      
      const family = await this.familyService.getFamilyById(familyId);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      const tree = this.graphService.findMinimalConnectionTree(family);
      
      res.status(200).json(tree);
    } catch (error) {
      logger.error(`Erreur lors de la recherche de l'arbre couvrant minimal:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche de l\'arbre couvrant minimal' });
    }
  };
  
  /**
   * Trouver les oncles et tantes d'un membre
   */
  findUnclesAndAunts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, memberId } = req.params;
      
      const family = await this.familyService.getFamilyById(familyId);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      const unclesAndAunts = this.graphService.findUnclesAndAunts(family, memberId);
      
      // Récupérer les objets membres complets
      const unclesAndAuntsMembers = family.members.filter(member => 
        unclesAndAunts.includes(member.id)
      );
      
      res.status(200).json(unclesAndAuntsMembers);
    } catch (error) {
      logger.error(`Erreur lors de la recherche des oncles et tantes:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche des oncles et tantes' });
    }
  };
  
  /**
   * Trouver les cousins d'un membre
   */
  findCousins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId, memberId } = req.params;
      
      const family = await this.familyService.getFamilyById(familyId);
      
      if (!family) {
        res.status(404).json({ message: `Famille avec l'ID ${familyId} non trouvée` });
        return;
      }
      
      const cousins = this.graphService.findCousins(family, memberId);
      
      // Récupérer les objets membres complets
      const cousinsMembers = family.members.filter(member => 
        cousins.includes(member.id)
      );
      
      res.status(200).json(cousinsMembers);
    } catch (error) {
      logger.error(`Erreur lors de la recherche des cousins:`, error);
      res.status(500).json({ message: 'Erreur lors de la recherche des cousins' });
    }
  };
}

export default FamilyController;