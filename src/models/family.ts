// models/family.ts

import { Matrix } from './graph';
import { FamilyMember } from './member';

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: FamilyMember[];
  memberIndexMap: { [memberId: string]: number };
  relationMatrix: Matrix;
}

export interface CreateFamilyDTO {
  name: string;
  description?: string;
  initialMember?: CreateMemberDTO;
}

export interface CreateMemberDTO {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  metadata?: Record<string, any>;
}

export enum RelationType {
  PARENT_CHILD = 1,
  SPOUSE = 2
}

export interface Relation {
  fromId: string;
  toId: string;
  type: RelationType;
}