// models/family.ts
export interface Family {
    id: string;
    name: string;
    pseudo: string;
    members: string[]; // IDs des membres de la famille
    adjacencyMatrix: number[][]; // Matrice d'adjacence pondérée
    memberIndices: Record<string, number>; // Mappage des IDs vers les indices de la matrice
    createdAt: string;
    updatedAt: string;
}

// models/familyMember.ts
export interface FamilyMember {
    id: string;
    familyId: string; // ID de la famille
    firstName: string;
    lastName: string;
    birthDate: string;
    deathDate?: string;
    gender: 'M' | 'F';  // Simplifié à M ou F
    parents: string[];
    children: string[];
    spouse: string | null;
    metadata?: Record<string, any>;
}

export interface GenealogyData {
    families: Family[];
    members: FamilyMember[]; // Pour compatibilité avec l'ancienne structure
}

// models/relationTypes.ts
export enum RelationType {
    PARENT_CHILD = 1, // Relation parent-enfant
    SPOUSE = 2        // Relation entre conjoints
}