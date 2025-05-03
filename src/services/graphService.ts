// services/graphService.ts

import { Family } from '../models/family';
import { Matrix, Path, RelationshipDescription, RelationshipTypes } from '../models/graph';
import { prepareGraphForAlgorithms } from '../utils/graphUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { findPathBellmanFord } from '../algorithms/bellmanFord';
import { prim } from '../algorithms/prim';
import { identifySubfamilies, kruskal } from '../algorithms/kruskal';
import logger from '../utils/logger';

class GraphService {
  /**
   * Trouve le chemin le plus court entre deux membres d'une famille
   * 
   * @param family Famille contenant les membres
   * @param sourceId ID du membre source
   * @param targetId ID du membre cible
   * @returns Chemin le plus court entre les deux membres
   */
  findShortestPath(family: Family, sourceId: string, targetId: string): Path | null {
    try {
      // Vérifier que les membres existent
      const sourceIndex = family.memberIndexMap[sourceId];
      const targetIndex = family.memberIndexMap[targetId];
      
      if (sourceIndex === undefined || targetIndex === undefined) {
        return null;
      }
      
      // Préparer le graphe pour l'algorithme
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      
      // Exécuter l'algorithme de Dijkstra
      const result = dijkstra(graph, sourceIndex, targetIndex);
      
      if (result.distance === Infinity) {
        return null; // Pas de chemin trouvé
      }
      
      // Convertir les indices en IDs de membres
      const memberIds = Object.entries(family.memberIndexMap)
        .reduce((acc, [id, index]) => {
          acc[index] = id;
          return acc;
        }, {} as Record<number, string>);
      
      const path = result.path.map(index => memberIds[index]);
      
      // Déterminer les relations entre chaque pair de membres sur le chemin
      const relationPath = this.getRelationshipPath(family, path);
      
      return {
        source: sourceId,
        target: targetId,
        path,
        relationPath,
        distance: result.distance
      };
    } catch (error) {
      logger.error('Erreur lors de la recherche du chemin le plus court:', error);
      return null;
    }
  }

  /**
   * Détecte les relations indirectes entre deux membres en utilisant Bellman-Ford
   * 
   * @param family Famille contenant les membres
   * @param sourceId ID du membre source
   * @param targetId ID du membre cible
   * @returns Chemin le plus court avec détection de cycles
   */
  findIndirectRelations(family: Family, sourceId: string, targetId: string): {
    path: Path | null;
    hasCycle: boolean;
  } {
    try {
      const sourceIndex = family.memberIndexMap[sourceId];
      const targetIndex = family.memberIndexMap[targetId];
      
      if (sourceIndex === undefined || targetIndex === undefined) {
        return { path: null, hasCycle: false };
      }
      
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      const result = findPathBellmanFord(graph, sourceIndex, targetIndex);
      
      if (result.path.length === 0) {
        return { path: null, hasCycle: result.hasNegativeCycle };
      }
      
      // Convertir les indices en IDs de membres
      const memberIds = Object.entries(family.memberIndexMap)
        .reduce((acc, [id, index]) => {
          acc[index] = id;
          return acc;
        }, {} as Record<number, string>);
      
      const path = result.path.map(index => memberIds[index]);
      const relationPath = this.getRelationshipPath(family, path);
      
      return {
        path: {
          source: sourceId,
          target: targetId,
          path,
          relationPath,
          distance: result.distance
        },
        hasCycle: result.hasNegativeCycle
      };
    } catch (error) {
      logger.error('Erreur lors de la recherche des relations indirectes:', error);
      return { path: null, hasCycle: false };
    }
  }

  /**
   * Construit un arbre couvrant minimal de la famille en utilisant l'algorithme de Prim
   * 
   * @param family Famille à analyser
   * @returns Liste des relations formant l'arbre couvrant minimal
   */
  findMinimalConnectionTree(family: Family): { from: string; to: string; weight: number }[] {
    try {
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      const mst = prim(graph);
      
      // Convertir les indices en IDs de membres
      const memberIds = Object.entries(family.memberIndexMap)
        .reduce((acc, [id, index]) => {
          acc[index] = id;
          return acc;
        }, {} as Record<number, string>);
      
      return mst.map(edge => ({
        from: memberIds[edge.from],
        to: memberIds[edge.to],
        weight: edge.weight
      }));
    } catch (error) {
      logger.error('Erreur lors de la construction de l\'arbre couvrant minimal:', error);
      return [];
    }
  }

  /**
   * Identifie les sous-familles en utilisant l'algorithme de Kruskal
   * 
   * @param family Famille à analyser
   * @returns Liste des sous-familles, chaque sous-famille étant une liste d'IDs de membres
   */
  identifyFamilyBranches(family: Family): string[][] {
    try {
      const graph = prepareGraphForAlgorithms(family.relationMatrix);
      const subfamilies = identifySubfamilies(graph);
      
      // Convertir les indices en IDs de membres
      const memberIds = Object.entries(family.memberIndexMap)
        .reduce((acc, [id, index]) => {
          acc[index] = id;
          return acc;
        }, {} as Record<number, string>);
      
      return subfamilies.map(subfamily => 
        subfamily.map(index => memberIds[index])
      );
    } catch (error) {
      logger.error('Erreur lors de l\'identification des branches familiales:', error);
      return [];
    }
  }

  /**
   * Détermine la relation entre deux membres adjacents
   * 
   * @param family Famille contenant les membres
   * @param member1Id ID du premier membre
   * @param member2Id ID du deuxième membre
   * @returns Description de la relation
   */
  getRelationshipType(family: Family, member1Id: string, member2Id: string): RelationshipDescription | null {
    const member1 = family.members.find(m => m.id === member1Id);
    const member2 = family.members.find(m => m.id === member2Id);
    
    if (!member1 || !member2) {
      return null;
    }
    
    // Vérifier la relation parent-enfant
    if (member1.children.includes(member2Id)) {
      return {
        type: RelationshipTypes.PARENT,
        description: `${member1.firstName} est parent de ${member2.firstName}`
      };
    }
    
    if (member1.parents.includes(member2Id)) {
      return {
        type: RelationshipTypes.CHILD,
        description: `${member1.firstName} est enfant de ${member2.firstName}`
      };
    }
    
    // Vérifier la relation de conjoint
    if (member1.spouse === member2Id) {
      return {
        type: RelationshipTypes.SPOUSE,
        description: `${member1.firstName} est conjoint de ${member2.firstName}`
      };
    }
    
    // Vérifier si ce sont des frères/sœurs (mêmes parents)
    const commonParents = member1.parents.filter(parentId => 
      member2.parents.includes(parentId)
    );
    
    if (commonParents.length > 0) {
      return {
        type: RelationshipTypes.SIBLING,
        description: `${member1.firstName} est frère/sœur de ${member2.firstName}`
      };
    }
    
    return null;
  }

  /**
   * Détermine les relations complexes entre deux membres (grands-parents, oncles/tantes, cousins)
   * 
   * @param family Famille contenant les membres
   * @param path Chemin entre les membres
   * @returns Liste des descriptions des relations sur le chemin
   */
  getRelationshipPath(family: Family, path: string[]): string[] {
    const relationPath: string[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const currentId = path[i];
      const nextId = path[i + 1];
      
      const relationship = this.getRelationshipType(family, currentId, nextId);
      
      if (relationship) {
        relationPath.push(relationship.description);
      } else {
        // Relation indirecte, on ajoute une description générique
        const current = family.members.find(m => m.id === currentId);
        const next = family.members.find(m => m.id === nextId);
        
        if (current && next) {
          relationPath.push(`${current.firstName} est lié à ${next.firstName}`);
        }
      }
    }
    
    return relationPath;
  }

  /**
   * Trouve tous les membres qui sont des oncles ou tantes d'un membre donné
   * 
   * @param family Famille contenant les membres
   * @param memberId ID du membre pour lequel chercher les oncles/tantes
   * @returns Liste des IDs des oncles et tantes
   */
  findUnclesAndAunts(family: Family, memberId: string): string[] {
    try {
      const member = family.members.find(m => m.id === memberId);
      
      if (!member) {
        return [];
      }
      
      const unclesAndAunts: Set<string> = new Set();
      
      // Pour chaque parent, trouver ses frères et sœurs
      for (const parentId of member.parents) {
        const parent = family.members.find(m => m.id === parentId);
        
        if (parent) {
          // Trouver les parents des parents (grands-parents)
          for (const grandparentId of parent.parents) {
            const grandparent = family.members.find(m => m.id === grandparentId);
            
            if (grandparent) {
              // Les enfants des grands-parents qui ne sont pas les parents sont des oncles/tantes
              grandparent.children
                .filter(childId => childId !== parentId) // Exclure le parent
                .forEach(uncleAuntId => unclesAndAunts.add(uncleAuntId));
            }
          }
        }
      }
      
      return Array.from(unclesAndAunts);
    } catch (error) {
      logger.error('Erreur lors de la recherche des oncles et tantes:', error);
      return [];
    }
  }

  /**
   * Trouve tous les membres qui sont des cousins d'un membre donné
   * 
   * @param family Famille contenant les membres
   * @param memberId ID du membre pour lequel chercher les cousins
   * @returns Liste des IDs des cousins
   */
  findCousins(family: Family, memberId: string): string[] {
    try {
      const unclesAndAunts = this.findUnclesAndAunts(family, memberId);
      const cousins: Set<string> = new Set();
      
      // Les enfants des oncles et tantes sont des cousins
      for (const uncleAuntId of unclesAndAunts) {
        const uncleAunt = family.members.find(m => m.id === uncleAuntId);
        
        if (uncleAunt) {
          uncleAunt.children.forEach(cousinId => cousins.add(cousinId));
        }
      }
      
      return Array.from(cousins);
    } catch (error) {
      logger.error('Erreur lors de la recherche des cousins:', error);
      return [];
    }
  }
}

export default GraphService;