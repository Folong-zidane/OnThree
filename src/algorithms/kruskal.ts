// algorithms/kruskal.ts

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
   * Implémentation de l'algorithme de Kruskal pour partitionner l'arbre généalogique
   * en différentes branches familiales
   * 
   * @param graph Matrice d'adjacence pondérée représentant les relations familiales
   * @returns Un ensemble d'arêtes représentant l'arbre couvrant minimal
   */
  export function kruskal(graph: WeightedGraph): Edge[] {
    const { matrix, size } = graph;
    const result: Edge[] = [];
    
    // Extraire toutes les arêtes du graphe
    const edges: Edge[] = [];
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) { // Éviter les doublons en commençant à i+1
        if (matrix[i][j] > 0) {
          edges.push({
            from: i,
            to: j,
            weight: matrix[i][j]
          });
        }
      }
    }
    
    // Trier les arêtes par poids croissant
    edges.sort((a, b) => a.weight - b.weight);
    
    // Structure Union-Find pour détecter les cycles
    const parent: number[] = Array(size).fill(0).map((_, i) => i);
    
    // Fonction pour trouver le parent d'un sommet
    function find(i: number): number {
      if (parent[i] !== i) {
        parent[i] = find(parent[i]); // Compression de chemin
      }
      return parent[i];
    }
    
    // Fonction pour unir deux ensembles
    function union(x: number, y: number): void {
      parent[find(x)] = find(y);
    }
    
    // Parcourir toutes les arêtes triées
    for (const edge of edges) {
      const rootFrom = find(edge.from);
      const rootTo = find(edge.to);
      
      // Si l'inclusion de cette arête ne forme pas de cycle
      if (rootFrom !== rootTo) {
        result.push(edge);
        union(rootFrom, rootTo);
      }
    }
    
    return result;
  }
  
  /**
   * Identifie les sous-familles dans l'arbre généalogique
   * 
   * @param graph Matrice d'adjacence pondérée représentant les relations familiales
   * @returns Un tableau de tableaux, chaque sous-tableau contenant les indices des membres d'une sous-famille
   */
  export function identifySubfamilies(graph: WeightedGraph): number[][] {
    const { size } = graph;
    const mst = kruskal(graph);
    
    // Structure Union-Find pour regrouper les membres
    const parent: number[] = Array(size).fill(0).map((_, i) => i);
    
    // Fonction pour trouver le parent d'un sommet
    function find(i: number): number {
      if (parent[i] !== i) {
        parent[i] = find(parent[i]); // Compression de chemin
      }
      return parent[i];
    }
    
    // Fonction pour unir deux ensembles
    function union(x: number, y: number): void {
      parent[find(x)] = find(y);
    }
    
    // Unir les membres selon l'arbre couvrant minimal
    for (const edge of mst) {
      union(edge.from, edge.to);
    }
    
    // Identifier les sous-familles
    const subfamilies: Map<number, number[]> = new Map();
    
    for (let i = 0; i < size; i++) {
      const root = find(i);
      if (!subfamilies.has(root)) {
        subfamilies.set(root, []);
      }
      subfamilies.get(root)!.push(i);
    }
    
    return Array.from(subfamilies.values());
  }
  