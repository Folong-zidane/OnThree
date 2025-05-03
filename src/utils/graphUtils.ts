// utils/graphUtils.ts

import { Matrix } from '../models/graph';

/**
 * Convertit une matrice d'adjacence pondérée en un format utilisable par les algorithmes
 * 
 * @param matrix Matrice d'adjacence pondérée
 * @returns Un objet contenant la matrice et sa taille
 */
export function prepareGraphForAlgorithms(matrix: Matrix): {
  matrix: number[][];
  size: number;
} {
  return {
    matrix: matrix.values,
    size: matrix.size
  };
}

/**
 * Crée une matrice d'adjacence vide de taille donnée
 * 
 * @param size Taille de la matrice
 * @returns Une nouvelle matrice vide
 */
export function createEmptyMatrix(size: number): Matrix {
  return {
    size,
    values: Array(size).fill(0).map(() => Array(size).fill(0))
  };
}

/**
 * Agrandit une matrice d'adjacence pour ajouter un nouveau sommet
 * 
 * @param matrix Matrice d'adjacence à agrandir
 * @returns Une nouvelle matrice agrandie
 */
export function expandMatrix(matrix: Matrix): Matrix {
  const newSize = matrix.size + 1;
  const newMatrix = createEmptyMatrix(newSize);
  
  // Copier les valeurs existantes
  for (let i = 0; i < matrix.size; i++) {
    for (let j = 0; j < matrix.size; j++) {
      newMatrix.values[i][j] = matrix.values[i][j];
    }
  }
  
  return newMatrix;
}

/**
 * Vérifie si un indice est valide dans la matrice
 * 
 * @param matrix Matrice d'adjacence
 * @param index Indice à vérifier
 * @returns true si l'indice est valide, false sinon
 */
export function isValidIndex(matrix: Matrix, index: number): boolean {
  return index >= 0 && index < matrix.size;
}

/**
 * Ajoute une relation entre deux membres dans la matrice d'adjacence
 * 
 * @param matrix Matrice d'adjacence
 * @param from Indice du membre source
 * @param to Indice du membre cible
 * @param relationWeight Poids de la relation (1 pour parent/enfant, 2 pour conjoint)
 * @returns La matrice mise à jour
 */
export function addRelationToMatrix(
  matrix: Matrix,
  from: number,
  to: number,
  relationWeight: number
): Matrix {
  if (!isValidIndex(matrix, from) || !isValidIndex(matrix, to)) {
    throw new Error("Indices invalides pour la matrice");
  }
  
  const newMatrix = {
    size: matrix.size,
    values: [...matrix.values.map(row => [...row])]
  };
  
  newMatrix.values[from][to] = relationWeight;
  
  return newMatrix;
}