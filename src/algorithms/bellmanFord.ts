// algorithms/bellmanFord.ts

interface Edge {
    from: number;
    to: number;
    weight: number;
  }
  
  interface WeightedGraph {
    matrix: number[][];
    size: number;
  }
  
  /**
   * Convertit une matrice d'adjacence en liste d'arêtes
   */
  function matrixToEdges(matrix: number[][]): Edge[] {
    const edges: Edge[] = [];
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] > 0) {
          edges.push({
            from: i,
            to: j,
            weight: matrix[i][j]
          });
        }
      }
    }
    
    return edges;
  }
  
  /**
   * Implémentation de l'algorithme de Bellman-Ford pour détecter les cycles
   * et les relations indirectes dans l'arbre généalogique
   * 
   * @param graph Matrice d'adjacence pondérée représentant les relations familiales
   * @param source Index du nœud source (personne de départ)
   * @returns Un objet contenant les distances, les prédécesseurs et un indicateur de cycle négatif
   */
  export function bellmanFord(graph: WeightedGraph, source: number) {
    const { matrix, size } = graph;
    const edges = matrixToEdges(matrix);
    
    // Initialisation
    const distance: number[] = Array(size).fill(Infinity);
    const predecessor: number[] = Array(size).fill(-1);
    distance[source] = 0;
    
    // Relaxation des arêtes |V| - 1 fois
    for (let i = 0; i < size - 1; i++) {
      for (const edge of edges) {
        if (distance[edge.from] !== Infinity && 
            distance[edge.from] + edge.weight < distance[edge.to]) {
          distance[edge.to] = distance[edge.from] + edge.weight;
          predecessor[edge.to] = edge.from;
        }
      }
    }
    
    // Vérification des cycles négatifs
    let hasNegativeCycle = false;
    for (const edge of edges) {
      if (distance[edge.from] !== Infinity && 
          distance[edge.from] + edge.weight < distance[edge.to]) {
        hasNegativeCycle = true;
        break;
      }
    }
    
    return {
      distance,
      predecessor,
      hasNegativeCycle
    };
  }
  
  /**
   * Trouve le chemin entre source et target en utilisant Bellman-Ford
   */
  export function findPathBellmanFord(graph: WeightedGraph, source: number, target: number) {
    const result = bellmanFord(graph, source);
    
    if (result.hasNegativeCycle) {
      return { path: [], distance: Infinity, hasNegativeCycle: true };
    }
    
    if (result.distance[target] === Infinity) {
      return { path: [], distance: Infinity, hasNegativeCycle: false };
    }
    
    // Reconstruction du chemin
    const path: number[] = [];
    let current = target;
    
    while (current !== source && current !== -1) {
      path.unshift(current);
      current = result.predecessor[current];
    }
    
    if (current === -1) {
      return { path: [], distance: Infinity, hasNegativeCycle: false };
    }
    
    path.unshift(source);
    
    return {
      path,
      distance: result.distance[target],
      hasNegativeCycle: false
    };
  }