// algorithms/dijkstra.ts

interface WeightedGraph {
    matrix: number[][];
    size: number;
  }
  
  /**
   * Implémentation de l'algorithme de Dijkstra pour trouver le plus court chemin
   * entre deux personnes dans l'arbre généalogique
   * 
   * @param graph Matrice d'adjacence pondérée représentant les relations familiales
   * @param source Index du nœud source (personne de départ)
   * @param target Index du nœud cible (personne d'arrivée)
   * @returns Un objet contenant la distance minimale et le chemin entre les deux personnes
   */
  export function dijkstra(graph: WeightedGraph, source: number, target: number) {
    const { matrix, size } = graph;
    
    // Initialisation
    const distance: number[] = Array(size).fill(Infinity);
    const previous: number[] = Array(size).fill(-1);
    const visited: boolean[] = Array(size).fill(false);
    
    distance[source] = 0;
    
    // Recherche du chemin le plus court
    for (let i = 0; i < size; i++) {
      // Trouver le nœud non visité avec la distance minimale
      let minDistance = Infinity;
      let minIndex = -1;
      
      for (let j = 0; j < size; j++) {
        if (!visited[j] && distance[j] < minDistance) {
          minDistance = distance[j];
          minIndex = j;
        }
      }
      
      // Si nous ne pouvons pas aller plus loin
      if (minIndex === -1) break;
      
      // Marquer le nœud comme visité
      visited[minIndex] = true;
      
      // Si nous avons atteint la cible
      if (minIndex === target) break;
      
      // Mettre à jour les distances des voisins
      for (let j = 0; j < size; j++) {
        if (matrix[minIndex][j] > 0) { // Existence d'une relation
          const newDist = distance[minIndex] + matrix[minIndex][j];
          if (newDist < distance[j]) {
            distance[j] = newDist;
            previous[j] = minIndex;
          }
        }
      }
    }
    
    // Reconstruction du chemin
    const path: number[] = [];
    let current = target;
    
    if (distance[target] === Infinity) {
      return { distance: Infinity, path: [] }; // Pas de chemin trouvé
    }
    
    while (current !== source) {
      path.unshift(current);
      current = previous[current];
    }
    path.unshift(source);
    
    return { 
      distance: distance[target],
      path
    };
  }