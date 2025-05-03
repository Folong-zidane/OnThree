// controllers/genealogyController.ts

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import GenealogyService from '../services/genealogyServices';
import logger from '../utils/logger'; // Importer le logger correctement
import config from '../config/config';
import { CreateFamilyDTO, CreateMemberDTO, RelationType } from '../models/family';

// Création d'une instance du service
const genealogyService = new GenealogyService(config.dataFilePath);

// Contrôleur pour la gestion des familles
export const getAllFamilies = async (req: Request, res: Response) => {
  try {
    const families = await genealogyService.getAllFamilies();
    res.json(families);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des familles: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des familles' });
  }
};

export const getFamilyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const family = await genealogyService.getFamilyById(id);
    
    if (!family) {
      return res.status(404).json({ message: 'Famille non trouvée' });
    }
    
    res.json(family);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la famille: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de la famille' });
  }
};

export const createFamily = async (req: Request, res: Response) => {
  try {
    const familyData: CreateFamilyDTO = req.body;
    const newFamily = await genealogyService.createFamily(familyData);
    
    res.status(201).json(newFamily);
  } catch (error) {
    logger.error(`Erreur lors de la création de la famille: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la famille' });
  }
};

export const updateFamily = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedFamily = await genealogyService.updateFamily(id, updates);
    
    if (!updatedFamily) {
      return res.status(404).json({ message: 'Famille non trouvée' });
    }
    
    res.json(updatedFamily);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la famille: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la famille' });
  }
};

export const deleteFamily = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await genealogyService.deleteFamily(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Famille non trouvée' });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la famille: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la famille' });
  }
};

// Contrôleur pour la gestion des membres
export const getAllMembersOfFamily = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    const members = await genealogyService.getAllMembersOfFamily(familyId);
    res.json(members);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des membres: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des membres' });
  }
};

export const getMemberById = async (req: Request, res: Response) => {
  try {
    const { familyId, memberId } = req.params;
    const member = await genealogyService.getMemberById(familyId, memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    res.json(member);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du membre: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du membre' });
  }
};

export const addMemberToFamily = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    const memberData: CreateMemberDTO = req.body;
    
    const newMember = await genealogyService.addMemberToFamily(familyId, memberData);
    
    if (!newMember) {
      return res.status(404).json({ message: 'Famille non trouvée ou erreur lors de l\'ajout du membre' });
    }
    
    res.status(201).json(newMember);
  } catch (error) {
    logger.error(`Erreur lors de l'ajout du membre: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du membre' });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const { familyId, memberId } = req.params;
    const updates = req.body;
    
    const updatedMember = await genealogyService.updateMember(familyId, memberId, updates);
    
    if (!updatedMember) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    res.json(updatedMember);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du membre: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du membre' });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { familyId, memberId } = req.params;
    const result = await genealogyService.removeMember(familyId, memberId);
    
    if (!result) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Erreur lors de la suppression du membre: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression du membre' });
  }
};

// Contrôleur pour les relations familiales
export const addRelation = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    const { fromId, toId, type } = req.body;
    
    const result = await genealogyService.addRelation(familyId, fromId, toId, type);
    
    if (!result) {
      return res.status(404).json({ message: 'Membres non trouvés ou relation invalide' });
    }
    
    res.status(201).json({ message: 'Relation ajoutée avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de l'ajout de la relation: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout de la relation' });
  }
};

export const removeRelation = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    const { fromId, toId } = req.body;
    
    const result = await genealogyService.removeRelation(familyId, fromId, toId);
    
    if (!result) {
      return res.status(404).json({ message: 'Relation non trouvée' });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la relation: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la relation' });
  }
};

// Contrôleur pour les algorithmes de graphe
export const findRelationPath = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    const { fromId, toId, algorithm = 'dijkstra' } = req.body;
    
    const result = await genealogyService.findRelationPath(familyId, fromId, toId, algorithm);
    
    if (!result) {
      return res.status(404).json({ message: 'Chemin non trouvé ou membres invalides' });
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Erreur lors de la recherche du chemin: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de la recherche du chemin' });
  }
};

export const findMinimumSpanningTree = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    const { algorithm = 'prim' } = req.query;
    
    const result = await genealogyService.findMinSpanningTree(familyId);
    
    if (!result) {
      return res.status(404).json({ message: 'Famille non trouvée' });
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Erreur lors du calcul de l'arbre couvrant: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors du calcul de l\'arbre couvrant' });
  }
};

export const identifySubfamilies = async (req: Request, res: Response) => {
  try {
    const { familyId } = req.params;
    
    const result = await genealogyService.identifySubfamilies(familyId);
    
    if (!result) {
      return res.status(404).json({ message: 'Famille non trouvée' });
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Erreur lors de l'identification des sous-familles: ${(error as Error).message}`);
    res.status(500).json({ message: 'Erreur serveur lors de l\'identification des sous-familles' });
  }
};
