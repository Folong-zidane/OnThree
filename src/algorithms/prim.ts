// algorithms/prim.ts

interface WeightedGraph {
    matrix: number[][];
    size: number;
  }
  
  interface Edge {
    from: number;
    to: number;
    weight: number;
  }
  
  /**
   * Implémentation de l'algorithme de Prim pour construire l'arbre couvrant minimal
   * d'un arbre généalogique
   * 
   * @param graph Matrice d'adjacence pondérée représentant les relations familiales
   * @returns Un ensemble d'arêtes représentant l'arbre couvrant minimal
   */
  export function prim(graph: WeightedGraph): Edge[] {
    const { matrix, size } = graph;
    const result: Edge[] = [];
    
    // Verifier si le graphe est vide
    if (size === 0) return [];
    
    // Tableau pour tracker les sommets inclus dans l'ACM
    const included: boolean[] = Array(size).fill(false);
    
    // Commencer par le premier sommet
    included[0] = true;
    
    // L'ACM aura (n-1) arêtes
    for (let e = 0; e < size - 1; e++) {
      let minWeight = Infinity;
      let minFrom = -1;
      let minTo = -1;
      
      // Trouver l'arête de poids minimum qui connecte un sommet inclus
      // à un sommet non inclus
      for (let i = 0; i < size; i++) {
        if (included[i]) {
          for (let j = 0; j < size; j++) {
            if (!included[j] && matrix[i][j] > 0 && matrix[i][j] < minWeight) {
              minWeight = matrix[i][j];
              minFrom = i;
              minTo = j;
            }
          }
        }
      }
      
      // Si aucune arête n'est trouvée, le graphe n'est pas connecté
      if (minFrom === -1 || minTo === -1) break;
      
      // Ajouter l'arête à l'ACM
      result.push({
        from: minFrom,
        to: minTo,
        weight: minWeight
      });
      
      // Ajouter le nouveau sommet à l'ensemble des sommets inclus
      included[minTo] = true;
    }
    
    return result;
  }