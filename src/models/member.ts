// models/member.ts

export interface FamilyMember {
    id: string;
    familyId: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: 'MALE' | 'FEMALE';
    parents: string[];
    children: string[];
    spouse: string | null;
    metadata?: Record<string, any>;
  }
  
  export interface MemberRelation {
    relationId: string;
    relationType: string;
    memberIdA: string;
    memberIdB: string;
    metadata?: Record<string, any>;
  }