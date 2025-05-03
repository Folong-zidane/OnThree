// services/relationService.ts

import { v4 as uuidv4 } from 'uuid';
import FileManager from '../utils/fileManager';
import logger from '../utils/logger';
import { Family, RelationType } from '../models/family';
import { addRelationToMatrix } from '../utils/graphUtils';

class RelationService {
  private fileManager: FileManager;

  constructor(dataDir: string) {
    this.fileManager = new FileManager(dataDir);
  }

  /**
   * Ajoute une relation parent-enfant entre deux membres d'une famille
   * 
   * @param familyId ID de la famille
   * @param parentId ID du parent
   * @param childId ID de l'enfant
   * @returns true si la relation est ajoutée avec succès, false sinon
   */
  async addParentChildRelation(familyId: string, parentId: string, childId: string): Promise<boolean> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const parentIndex = family.members.findIndex(m => m.id === parentId);
      const childIndex = family.members.findIndex(m => m.id === childId);
      
      if (parentIndex === -1 || childIndex === -1) {
        return false;
      }
      
      // Vérifier que la relation n'existe pas déjà
      if (family.members[childIndex].parents.includes(parentId) ||
          family.members[parentIndex].children.includes(childId)) {
        return true; // La relation existe déjà
      }
      
      // Mettre à jour les listes de parents et d'enfants
      family.members[childIndex].parents.push(parentId);
      family.members[parentIndex].children.push(childId);
      
      // Mettre à jour la matrice d'adjacence
      const parentMatrixIndex = family.memberIndexMap[parentId];
      const childMatrixIndex = family.memberIndexMap[childId];
      
      family.relationMatrix = addRelationToMatrix(
        family.relationMatrix,
        parentMatrixIndex,
        childMatrixIndex,
        RelationType.PARENT_CHILD
      );
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Relation parent-enfant ajoutée: ${parentId} -> ${childId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout de la relation parent-enfant:`, error);
      return false;
    }
  }

  /**
   * Ajoute une relation de conjoint entre deux membres d'une famille
   * 
   * @param familyId ID de la famille
   * @param member1Id ID du premier conjoint
   * @param member2Id ID du deuxième conjoint
   * @returns true si la relation est ajoutée avec succès, false sinon
   */
  async addSpouseRelation(familyId: string, member1Id: string, member2Id: string): Promise<boolean> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const member1Index = family.members.findIndex(m => m.id === member1Id);
      const member2Index = family.members.findIndex(m => m.id === member2Id);
      
      if (member1Index === -1 || member2Index === -1) {
        return false;
      }
      
      // Vérifier que les membres n'ont pas déjà un conjoint
      if (family.members[member1Index].spouse && family.members[member1Index].spouse !== member2Id) {
        logger.warn(`Le membre ${member1Id} a déjà un conjoint`);
        return false;
      }
      
      if (family.members[member2Index].spouse && family.members[member2Index].spouse !== member1Id) {
        logger.warn(`Le membre ${member2Id} a déjà un conjoint`);
        return false;
      }
      
      // Mettre à jour les conjoints
      family.members[member1Index].spouse = member2Id;
      family.members[member2Index].spouse = member1Id;
      
      // Mettre à jour la matrice d'adjacence (relation bidirectionnelle)
      const member1MatrixIndex = family.memberIndexMap[member1Id];
      const member2MatrixIndex = family.memberIndexMap[member2Id];
      
      family.relationMatrix = addRelationToMatrix(
        family.relationMatrix,
        member1MatrixIndex,
        member2MatrixIndex,
        RelationType.SPOUSE
      );
      
      family.relationMatrix = addRelationToMatrix(
        family.relationMatrix,
        member2MatrixIndex,
        member1MatrixIndex,
        RelationType.SPOUSE
      );
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Relation de conjoint ajoutée: ${member1Id} <-> ${member2Id}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout de la relation de conjoint:`, error);
      return false;
    }
  }

  /**
   * Supprime une relation entre deux membres
   * 
   * @param familyId ID de la famille
   * @param member1Id ID du premier membre
   * @param member2Id ID du deuxième membre
   * @returns true si la relation est supprimée avec succès, false sinon
   */
  async removeRelation(familyId: string, member1Id: string, member2Id: string): Promise<boolean> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const member1Index = family.members.findIndex(m => m.id === member1Id);
      const member2Index = family.members.findIndex(m => m.id === member2Id);
      
      if (member1Index === -1 || member2Index === -1) {
        return false;
      }
      
      let relationFound = false;
      
      // Vérifier et supprimer la relation parent-enfant
      if (family.members[member1Index].children.includes(member2Id)) {
        family.members[member1Index].children = family.members[member1Index].children.filter(id => id !== member2Id);
        family.members[member2Index].parents = family.members[member2Index].parents.filter(id => id !== member1Id);
        relationFound = true;
      } else if (family.members[member1Index].parents.includes(member2Id)) {
        family.members[member1Index].parents = family.members[member1Index].parents.filter(id => id !== member2Id);
        family.members[member2Index].children = family.members[member2Index].children.filter(id => id !== member1Id);
        relationFound = true;
      }
      
      // Vérifier et supprimer la relation de conjoint
      if (family.members[member1Index].spouse === member2Id) {
        family.members[member1Index].spouse = null;
        family.members[member2Index].spouse = null;
        relationFound = true;
      }
      
      if (!relationFound) {
        return false;
      }
      
      // Mettre à jour la matrice d'adjacence
      const member1MatrixIndex = family.memberIndexMap[member1Id];
      const member2MatrixIndex = family.memberIndexMap[member2Id];
      
      family.relationMatrix.values[member1MatrixIndex][member2MatrixIndex] = 0;
      family.relationMatrix.values[member2MatrixIndex][member1MatrixIndex] = 0;
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Relation supprimée: ${member1Id} - ${member2Id}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la relation:`, error);
      return false;
    }
  }
}

export default RelationService;