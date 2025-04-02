export interface FamilyMember {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: 'MALE' | 'FEMALE';
    parents: string[];
    children: string[];
    spouse: string | null;
    metadata?: Record<string, any>;
}

export interface GenealogyData {
    members: FamilyMember[];
}