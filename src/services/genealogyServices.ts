// services/genealogyService.ts

import { v4 as uuidv4 } from 'uuid';
import FileManager from '../utils/fileManager';
import logger from '../utils/logger';
import { Family, CreateFamilyDTO, CreateMemberDTO, RelationType, Relation } from '../models/family';
import { FamilyMember } from '../models/member';
import { Matrix, Path } from '../models/graph';
import { createEmptyMatrix, expandMatrix, addRelationToMatrix, prepareGraphForAlgorithms } from '../utils/graphUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { findPathBellmanFord } from '../algorithms/bellmanFord';
import { prim } from '../algorithms/prim';
import { identifySubfamilies } from '../algorithms/kruskal';

export class GenealogyService {
  private fileManager: FileManager;

  constructor(dataDir: string) {
    this.fileManager = new FileManager(dataDir);
  }

  // ---- Gestion des familles ----

  async getAllFamilies(): Promise<Family[]> {
    return this.fileManager.getAllFamilies();
  }

  async getFamilyById(id: string): Promise<Family> {
    return this.fileManager.readFamilyFile(id);
  }

  async getFamilyByMemberId(memberId: string): Promise<Family | null> {
    const families = await this.getAllFamilies();
    for (const family of families) {
      const member = family.members.find(m => m.id === memberId);
      if (member) {
        return family;
      }
    }
    return null;
  }

  async createFamily(data: CreateFamilyDTO): Promise<Family> {
    const familyId = uuidv4();
    const now = new Date().toISOString();
    
    // Créer une nouvelle famille
    const newFamily: Family = {
      id: familyId,
      name: data.name,
      description: data.description || "",
      createdAt: now,
      updatedAt: now,
      members: [],
      memberIndexMap: {},
      relationMatrix: createEmptyMatrix(0)
    };

    // Si un membre initial est fourni, l'ajouter à la famille
    if (data.initialMember) {
      const memberId = uuidv4();
      const newMember: FamilyMember = {
        id: memberId,
        familyId,
        firstName: data.initialMember.firstName,
        lastName: data.initialMember.lastName,
        birthDate: data.initialMember.birthDate,
        gender: data.initialMember.gender,
        parents: [],
        children: [],
        spouse: null,
        metadata: data.initialMember.metadata
      };

      newFamily.members.push(newMember);
      newFamily.memberIndexMap[memberId] = 0;
      newFamily.relationMatrix = expandMatrix(newFamily.relationMatrix);
    }

    await this.fileManager.writeFamilyFile(newFamily);
    logger.info(`Nouvelle famille créée: ${familyId}`);
    
    return newFamily;
  }

  async updateFamily(id: string, updates: Partial<Family>): Promise<Family | null> {
    try {
      const family = await this.fileManager.readFamilyFile(id);
      
      // Empêcher la modification de l'ID et des structures complexes
      const { id: _, members: __, memberIndexMap: ___, relationMatrix: ____, ...updatesWithoutRestricted } = updates;
      
      const updatedFamily = {
        ...family,
        ...updatesWithoutRestricted,
        updatedAt: new Date().toISOString()
      };
      
      await this.fileManager.writeFamilyFile(updatedFamily);
      logger.info(`Famille mise à jour: ${id}`);
      
      return updatedFamily;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la famille ${id}:`, error);
      return null;
    }
  }

  async deleteFamily(id: string): Promise<boolean> {
    return this.fileManager.deleteFamilyFile(id);
  }

  // ---- Gestion des membres ----

  async getAllMembersOfFamily(familyId: string): Promise<FamilyMember[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      return family.members;
    } catch (error) {
      return [];
    }
  }

  async getMemberById(familyId: string, memberId: string): Promise<FamilyMember | null> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      return family.members.find(m => m.id === memberId) || null;
    } catch (error) {
      return null;
    }
  }

  async addMemberToFamily(familyId: string, memberData: CreateMemberDTO): Promise<FamilyMember | null> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      const memberId = uuidv4();
      const newMember: FamilyMember = {
        id: memberId,
        familyId,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        birthDate: memberData.birthDate,
        gender: memberData.gender,
        parents: [],
        children: [],
        spouse: null,
        metadata: memberData.metadata
      };
      
      // Ajouter le membre à la famille
      family.members.push(newMember);
      
      // Mettre à jour la matrice d'adjacence
      family.memberIndexMap[memberId] = family.relationMatrix.size;
      family.relationMatrix = expandMatrix(family.relationMatrix);
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Nouveau membre ajouté à la famille ${familyId}: ${memberId}`);
      return newMember;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout d'un membre à la famille ${familyId}:`, error);
      return null;
    }
  }

  async updateMember(familyId: string, memberId: string, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const memberIndex = family.members.findIndex(m => m.id === memberId);
      
      if (memberIndex === -1) {
        return null;
      }
      
      // Empêcher la modification de l'ID et du familyId
      const { id: _, familyId: __, ...updatesWithoutIds } = updates;
      
      family.members[memberIndex] = {
        ...family.members[memberIndex],
        ...updatesWithoutIds
      };
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Membre mis à jour: ${memberId}`);
      return family.members[memberIndex];
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du membre ${memberId}:`, error);
      return null;
    }
  }

  async removeMember(familyId: string, memberId: string): Promise<boolean> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const memberIndex = family.members.findIndex(m => m.id === memberId);
      
      if (memberIndex === -1) {
        return false;
      }
      
      // Supprimer le membre
      family.members.splice(memberIndex, 1);
      
      // Mettre à jour les références dans les autres membres
      family.members = family.members.map(member => ({
        ...member,
        parents: member.parents.filter(id => id !== memberId),
        children: member.children.filter(id => id !== memberId),
        spouse: member.spouse === memberId ? null : member.spouse
      }));
      
      // TODO: Mettre à jour la matrice d'adjacence (opération complexe)
      // Pour l'instant, on reconstruirait complètement la matrice
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Membre supprimé: ${memberId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du membre ${memberId}:`, error);
      return false;
    }
  }

  // ---- Gestion des relations ----

  async addRelation(familyId: string, fromId: string, toId: string, relationType: RelationType): Promise<boolean> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const fromMember = family.members.find(m => m.id === fromId);
      const toMember = family.members.find(m => m.id === toId);
      
      if (!fromMember || !toMember) {
        return false;
      }
      
      // Obtenir les indices des membres dans la matrice
      const fromIndex = family.memberIndexMap[fromId];
      const toIndex = family.memberIndexMap[toId];
      
      if (fromIndex === undefined || toIndex === undefined) {
        return false;
      }
      
      // Mettre à jour la matrice d'adjacence
      family.relationMatrix.values[fromIndex][toIndex] = relationType;
      
      // Si c'est une relation de conjoint, mettre à jour dans les deux sens
      if (relationType === RelationType.SPOUSE) {
        family.relationMatrix.values[toIndex][fromIndex] = relationType;
        fromMember.spouse = toId;
        toMember.spouse = fromId;
      } else if (relationType === RelationType.PARENT_CHILD) {
        // Mettre à jour les références entre membres
        if (!fromMember.children.includes(toId)) {
          fromMember.children.push(toId);
        }
        if (!toMember.parents.includes(fromId)) {
          toMember.parents.push(fromId);
        }
      }
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Relation ajoutée dans la famille ${familyId}: ${fromId} -> ${toId} (type: ${relationType})`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout de la relation: ${(error as Error).message}`);
      return false;
    }
  }

  async removeRelation(familyId: string, fromId: string, toId: string): Promise<boolean> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const fromMember = family.members.find(m => m.id === fromId);
      const toMember = family.members.find(m => m.id === toId);
      
      if (!fromMember || !toMember) {
        return false;
      }
      
      // Obtenir les indices des membres dans la matrice
      const fromIndex = family.memberIndexMap[fromId];
      const toIndex = family.memberIndexMap[toId];
      
      if (fromIndex === undefined || toIndex === undefined) {
        return false;
      }
      
      // Vérifier le type de relation existante
      const relationType = family.relationMatrix.values[fromIndex][toIndex];
      
      if (relationType === 0) {
        return false; // Pas de relation à supprimer
      }
      
      // Mettre à jour la matrice d'adjacence
      family.relationMatrix.values[fromIndex][toIndex] = 0;
      
      // Si c'était une relation de conjoint, supprimer aussi la relation inverse
      if (relationType === RelationType.SPOUSE) {
        family.relationMatrix.values[toIndex][fromIndex] = 0;
        fromMember.spouse = null;
        toMember.spouse = null;
      } else if (relationType === RelationType.PARENT_CHILD) {
        // Mettre à jour les références entre membres
        fromMember.children = fromMember.children.filter(id => id !== toId);
        toMember.parents = toMember.parents.filter(id => id !== fromId);
      }
      
      // Sauvegarder les modifications
      family.updatedAt = new Date().toISOString();
      await this.fileManager.writeFamilyFile(family);
      
      logger.info(`Relation supprimée dans la famille ${familyId}: ${fromId} -> ${toId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la relation: ${(error as Error).message}`);
      return false;
    }
  }

  // ---- Algorithmes de recherche opérationnelle ----

  async findShortestPath(familyId: string, fromId: string, toId: string): Promise<Path | null> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const fromMember = family.members.find(m => m.id === fromId);
      const toMember = family.members.find(m => m.id === toId);
      
      if (!fromMember || !toMember) {
        return null;
      }
      
      // Obtenir les indices des membres dans la matrice
      const fromIndex = family.memberIndexMap[fromId];
      const toIndex = family.memberIndexMap[toId];
      
      if (fromIndex === undefined || toIndex === undefined) {
        return null;
      }
      
      // Préparer le graphe pour l'algorithme
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      
      // Exécuter l'algorithme de Dijkstra
      const result = dijkstra(graph, fromIndex, toIndex);
      
      if (result.distance === Infinity || result.path.length === 0) {
        return null; // Pas de chemin trouvé
      }
      
      // Convertir les indices en IDs
      const pathIds = result.path.map(index => {
        // Trouver le memberId correspondant à cet index
        for (const [memberId, memberIndex] of Object.entries(family.memberIndexMap)) {
          if (memberIndex === index) {
            return memberId;
          }
        }
        return '';
      }).filter(id => id !== '');
      
      // Créer les descriptions de relations
      const relationPath: string[] = [];
      for (let i = 0; i < pathIds.length - 1; i++) {
        const currentId = pathIds[i];
        const nextId = pathIds[i + 1];
        const currentIndex = family.memberIndexMap[currentId];
        const nextIndex = family.memberIndexMap[nextId];
        
        const relationType = family.relationMatrix.values[currentIndex][nextIndex];
        const currentMember = family.members.find(m => m.id === currentId);
        const nextMember = family.members.find(m => m.id === nextId);
        
        if (!currentMember || !nextMember) continue;
        
        if (relationType === RelationType.PARENT_CHILD) {
          relationPath.push(`${currentMember.firstName} est parent de ${nextMember.firstName}`);
        } else if (relationType === RelationType.SPOUSE) {
          relationPath.push(`${currentMember.firstName} est conjoint de ${nextMember.firstName}`);
        }
      }
      
      return {
        source: fromId,
        target: toId,
        path: pathIds,
        relationPath,
        distance: result.distance
      };
    } catch (error) {
      logger.error(`Erreur lors de la recherche du plus court chemin: ${(error as Error).message}`);
      return null;
    }
  }

  async findRelationsWithCycles(familyId: string, fromId: string, toId: string): Promise<Path | null> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const fromIndex = family.memberIndexMap[fromId];
      const toIndex = family.memberIndexMap[toId];
      
      if (fromIndex === undefined || toIndex === undefined) {
        return null;
      }
      
      // Préparer le graphe pour l'algorithme
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      
      // Exécuter l'algorithme de Bellman-Ford
      const result = findPathBellmanFord(graph, fromIndex, toIndex);
      
      if (result.distance === Infinity || result.path.length === 0) {
        return null; // Pas de chemin trouvé
      }
      
      // Convertir les indices en IDs
      const pathIds = result.path.map(index => {
        for (const [memberId, memberIndex] of Object.entries(family.memberIndexMap)) {
          if (memberIndex === index) {
            return memberId;
          }
        }
        return '';
      }).filter(id => id !== '');
      
      // Créer les descriptions de relations (similaire à findShortestPath)
      const relationPath: string[] = [];
      for (let i = 0; i < pathIds.length - 1; i++) {
        const currentId = pathIds[i];
        const nextId = pathIds[i + 1];
        const currentIndex = family.memberIndexMap[currentId];
        const nextIndex = family.memberIndexMap[nextId];
        
        const relationType = family.relationMatrix.values[currentIndex][nextIndex];
        const currentMember = family.members.find(m => m.id === currentId);
        const nextMember = family.members.find(m => m.id === nextId);
        
        if (!currentMember || !nextMember) continue;
        
        if (relationType === RelationType.PARENT_CHILD) {
          relationPath.push(`${currentMember.firstName} est parent de ${nextMember.firstName}`);
        } else if (relationType === RelationType.SPOUSE) {
          relationPath.push(`${currentMember.firstName} est conjoint de ${nextMember.firstName}`);
        }
      }
      
      return {
        source: fromId,
        target: toId,
        path: pathIds,
        relationPath,
        distance: result.distance,
      };
    } catch (error) {
      logger.error(`Erreur lors de la recherche des relations avec cycles: ${(error as Error).message}`);
      return null;
    }
  }

  async findMinSpanningTree(familyId: string): Promise<Relation[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      if (family.members.length === 0) {
        return [];
      }
      
      // Préparer le graphe pour l'algorithme
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      
      // Exécuter l'algorithme de Prim
      const result = prim(graph);
      
      // Convertir le résultat en relations
      const relations: Relation[] = result.map(edge => {
        // Trouver les memberIds correspondant aux indices
        let fromId = '';
        let toId = '';
        
        for (const [memberId, index] of Object.entries(family.memberIndexMap)) {
          if (index === edge.from) fromId = memberId;
          if (index === edge.to) toId = memberId;
        }
        
        return {
          fromId,
          toId,
          type: edge.weight === 1 ? RelationType.PARENT_CHILD : RelationType.SPOUSE
        };
      });
      
      return relations;
    } catch (error) {
      logger.error(`Erreur lors de la recherche de l'arbre couvrant minimal: ${(error as Error).message}`);
      return [];
    }
  }

  async identifySubfamilies(familyId: string): Promise<string[][]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      if (family.members.length === 0) {
        return [];
      }
      
      // Préparer le graphe pour l'algorithme
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      
      // Exécuter l'algorithme de Kruskal pour identifier les sous-familles
      const subfamilyIndices = identifySubfamilies(graph);
      
      // Convertir les indices en IDs de membres
      const subfamilies: string[][] = subfamilyIndices.map(indices => {
        return indices.map(index => {
          // Trouver le memberId correspondant à cet index
          for (const [memberId, memberIndex] of Object.entries(family.memberIndexMap)) {
            if (memberIndex === index) {
              return memberId;
            }
          }
          return '';
        }).filter(id => id !== '');
      });
      
      return subfamilies;
    } catch (error) {
      logger.error(`Erreur lors de l'identification des sous-familles: ${(error as Error).message}`);
      return [];
    }
  }
  async findRelationPath(familyId: string, fromId: string, toId: string, algorithm: string = 'dijkstra'): Promise<Path | null> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      
      // Vérifier que les membres existent
      const fromMember = family.members.find(m => m.id === fromId);
      const toMember = family.members.find(m => m.id === toId);
      
      if (!fromMember || !toMember) {
        return null;
      }
      
      // Obtenir les indices des membres dans la matrice
      const fromIndex = family.memberIndexMap[fromId];
      const toIndex = family.memberIndexMap[toId];
      
      if (fromIndex === undefined || toIndex === undefined) {
        return null;
      }
      
      // Préparer le graphe pour l'algorithme
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      
      let result;
      
      // Utiliser l'algorithme choisi
      switch (algorithm.toLowerCase()) {
        case 'dijkstra':
          result = dijkstra(graph, fromIndex, toIndex);
          break;
        case 'bellman-ford':
          result = findPathBellmanFord(graph, fromIndex, toIndex);
          break;
        default:
          // Par défaut, utiliser Dijkstra
          result = dijkstra(graph, fromIndex, toIndex);
      }
      
      if (result.distance === Infinity || result.path.length === 0) {
        return null; // Pas de chemin trouvé
      }
      
      // Convertir les indices en IDs
      const pathIds = result.path.map(index => {
        // Trouver le memberId correspondant à cet index
        for (const [memberId, memberIndex] of Object.entries(family.memberIndexMap)) {
          if (memberIndex === index) {
            return memberId;
          }
        }
        return '';
      }).filter(id => id !== '');
      
      // Créer les descriptions de relations
      const relationPath: string[] = [];
      for (let i = 0; i < pathIds.length - 1; i++) {
        const currentId = pathIds[i];
        const nextId = pathIds[i + 1];
        const currentIndex = family.memberIndexMap[currentId];
        const nextIndex = family.memberIndexMap[nextId];
        
        const relationType = family.relationMatrix.values[currentIndex][nextIndex];
        const currentMember = family.members.find(m => m.id === currentId);
        const nextMember = family.members.find(m => m.id === nextId);
        
        if (!currentMember || !nextMember) continue;
        
        if (relationType === RelationType.PARENT_CHILD) {
          relationPath.push(`${currentMember.firstName} est parent de ${nextMember.firstName}`);
        } else if (relationType === RelationType.SPOUSE) {
          relationPath.push(`${currentMember.firstName} est conjoint de ${nextMember.firstName}`);
        }
      }
      
      return {
        source: fromId,
        target: toId,
        path: pathIds,
        relationPath,
        distance: result.distance,
         };
    } catch (error) {
      logger.error(`Erreur lors de la recherche du chemin de relation: ${(error as Error).message}`);
      return null;
    }
  }

  // ---- Recherche et requêtes ----

  async findAncestors(familyId: string, memberId: string, depth: number = Infinity): Promise<FamilyMember[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const member = family.members.find(m => m.id === memberId);
      
      if (!member) {
        return [];
      }
      
      const ancestors: FamilyMember[] = [];
      const processed = new Set<string>();
      
      const findParents = (currentId: string, currentDepth: number) => {
        if (currentDepth >= depth || processed.has(currentId)) return;
        
        processed.add(currentId);
        const current = family.members.find(m => m.id === currentId);
        
        if (!current) return;
        
        current.parents.forEach(parentId => {
          const parent = family.members.find(m => m.id === parentId);
          if (parent) {
            ancestors.push(parent);
            findParents(parentId, currentDepth + 1);
          }
        });
      };
      
      findParents(memberId, 0);
      return ancestors;
    } catch (error) {
      logger.error(`Erreur lors de la recherche des ancêtres: ${(error as Error).message}`);
      return [];
    }
  }

  async findDescendants(familyId: string, memberId: string, depth: number = Infinity): Promise<FamilyMember[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const member = family.members.find(m => m.id === memberId);
      
      if (!member) {
        return [];
      }
      
      const descendants: FamilyMember[] = [];
      const processed = new Set<string>();
      
      const findChildren = (currentId: string, currentDepth: number) => {
        if (currentDepth >= depth || processed.has(currentId)) return;
        
        processed.add(currentId);
        const current = family.members.find(m => m.id === currentId);
        
        if (!current) return;
        
        current.children.forEach(childId => {
          const child = family.members.find(m => m.id === childId);
          if (child) {
            descendants.push(child);
            findChildren(childId, currentDepth + 1);
          }
        });
      };
      
      findChildren(memberId, 0);
      return descendants;
    } catch (error) {
      logger.error(`Erreur lors de la recherche des descendants: ${(error as Error).message}`);
      return [];
    }
  }

  async findSiblings(familyId: string, memberId: string): Promise<FamilyMember[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const member = family.members.find(m => m.id === memberId);
      
      if (!member) {
        return [];
      }
      
      // Trouver tous les frères et sœurs (personnes ayant au moins un parent en commun)
      const siblingIds = new Set<string>();
      
      for (const parentId of member.parents) {
        const parent = family.members.find(m => m.id === parentId);
        if (parent) {
          parent.children.forEach(childId => {
            if (childId !== memberId) {
              siblingIds.add(childId);
            }
          });
        }
      }
      
      const siblings = Array.from(siblingIds)
        .map(id => family.members.find(m => m.id === id))
        .filter((m): m is FamilyMember => m !== undefined);
      
      return siblings;
    } catch (error) {
      logger.error(`Erreur lors de la recherche des frères et sœurs: ${(error as Error).message}`);
      return [];
    }
  }

  async findUnclesAunts(familyId: string, memberId: string): Promise<FamilyMember[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const member = family.members.find(m => m.id === memberId);
      
      if (!member) {
        return [];
      }
      
      const unclesAunts: FamilyMember[] = [];
      
      // Trouver les frères et sœurs des parents
      for (const parentId of member.parents) {
        const parentSiblings = await this.findSiblings(familyId, parentId);
        unclesAunts.push(...parentSiblings);
        
        // Ajouter aussi les conjoints des frères et sœurs des parents
        for (const sibling of parentSiblings) {
          if (sibling.spouse) {
            const spouse = family.members.find(m => m.id === sibling.spouse);
            if (spouse) {
              unclesAunts.push(spouse);
            }
          }
        }
      }
      
      return unclesAunts;
    } catch (error) {
      logger.error(`Erreur lors de la recherche des oncles et tantes: ${(error as Error).message}`);
      return [];
    }
  }

  async findCousins(familyId: string, memberId: string): Promise<FamilyMember[]> {
    try {
      const family = await this.fileManager.readFamilyFile(familyId);
      const member = family.members.find(m => m.id === memberId);
      
      if (!member) {
        return [];
      }
      
      const cousins: FamilyMember[] = [];
      const unclesAunts = await this.findUnclesAunts(familyId, memberId);
      
      // Les cousins sont les enfants des oncles et tantes
      for (const uncleAunt of unclesAunts) {
        for (const cousinId of uncleAunt.children) {
          const cousin = family.members.find(m => m.id === cousinId);
          if (cousin) {
            cousins.push(cousin);
          }
        }
      }
      
      return cousins;
    } catch (error) {
      logger.error(`Erreur lors de la recherche des cousins: ${(error as Error).message}`);
      return [];
    }
  }
}

export default GenealogyService;