import { v4 as uuidv4 } from 'uuid';
import { FamilyMember, GenealogyData } from '../models/familyMember';
import FileManager from '../utils/fileManager';
import logger from '../utils/logger';
import path from 'path';

class GenealogyService {
    private fileManager: FileManager;

    constructor(dataFilePath: string) {
        this.fileManager = new FileManager(dataFilePath);
    }

    async getAllMembers(): Promise<FamilyMember[]> {
        const data = await this.fileManager.readFile();
        return data.members;
    }

    async getMemberById(id: string): Promise<FamilyMember | null> {
        const data = await this.fileManager.readFile();
        const member = data.members.find(m => m.id === id);
        return member || null;
    }

    async createMember(memberData: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
        const data = await this.fileManager.readFile();
        
        const newMember: FamilyMember = {
            id: uuidv4(),
            ...memberData
        };

        data.members.push(newMember);
        await this.fileManager.writeFile(data);
        logger.info(`Nouveau membre créé: ${newMember.id}`);
        
        return newMember;
    }

    async updateMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
        const data = await this.fileManager.readFile();
        const memberIndex = data.members.findIndex(m => m.id === id);

        if (memberIndex === -1) {
            return null;
        }

        // Empêcher la modification de l'ID
        const { id: _, ...updatesWithoutId } = updates;
        
        data.members[memberIndex] = {
            ...data.members[memberIndex],
            ...updatesWithoutId
        };

        await this.fileManager.writeFile(data);
        logger.info(`Membre mis à jour: ${id}`);
        
        return data.members[memberIndex];
    }

    async deleteMember(id: string): Promise<boolean> {
        const data = await this.fileManager.readFile();
        const initialLength = data.members.length;
        
        // Supprimer le membre
        data.members = data.members.filter(m => m.id !== id);
        
        if (data.members.length === initialLength) {
            return false;
        }

        // Mettre à jour les références
        data.members = data.members.map(member => ({
            ...member,
            parents: member.parents.filter(parentId => parentId !== id),
            children: member.children.filter(childId => childId !== id),
            spouse: member.spouse === id ? null : member.spouse
        }));

        await this.fileManager.writeFile(data);
        logger.info(`Membre supprimé: ${id}`);
        
        return true;
    }

    async addRelation(childId: string, parentId: string): Promise<boolean> {
        const data = await this.fileManager.readFile();
        
        const childIndex = data.members.findIndex(m => m.id === childId);
        const parentIndex = data.members.findIndex(m => m.id === parentId);
        
        if (childIndex === -1 || parentIndex === -1) {
            return false;
        }

        // Vérifier que la relation n'existe pas déjà
        if (!data.members[childIndex].parents.includes(parentId)) {
            data.members[childIndex].parents.push(parentId);
        }
        
        if (!data.members[parentIndex].children.includes(childId)) {
            data.members[parentIndex].children.push(childId);
        }

        await this.fileManager.writeFile(data);
        logger.info(`Relation parent-enfant ajoutée: ${parentId} -> ${childId}`);
        
        return true;
    }

    async searchMembers(criteria: Partial<FamilyMember>): Promise<FamilyMember[]> {
        const data = await this.fileManager.readFile();
        
        return data.members.filter(member => 
            Object.entries(criteria).every(([key, value]) => {
                if (Array.isArray(member[key as keyof FamilyMember]) && Array.isArray(value)) {
                    return (member[key as keyof FamilyMember] as any[]).some(item => 
                        value.includes(item)
                    );
                }
                return member[key as keyof FamilyMember] === value;
            })
        );
    }

    async findAncestors(id: string, depth: number = Infinity): Promise<FamilyMember[]> {
        const data = await this.fileManager.readFile();
        const member = data.members.find(m => m.id === id);
        
        if (!member) {
            return [];
        }
        
        const ancestors: FamilyMember[] = [];
        const processed = new Set<string>();
        
        const findParents = (currentId: string, currentDepth: number) => {
            if (currentDepth >= depth || processed.has(currentId)) return;
            
            processed.add(currentId);
            const current = data.members.find(m => m.id === currentId);
            
            if (!current) return;
            
            current.parents.forEach(parentId => {
                const parent = data.members.find(m => m.id === parentId);
                if (parent) {
                    ancestors.push(parent);
                    findParents(parentId, currentDepth + 1);
                }
            });
        };
        
        findParents(id, 0);
        return ancestors;
    }

    async findDescendants(id: string, depth: number = Infinity): Promise<FamilyMember[]> {
        const data = await this.fileManager.readFile();
        const member = data.members.find(m => m.id === id);
        
        if (!member) {
            return [];
        }
        
        const descendants: FamilyMember[] = [];
        const processed = new Set<string>();
        
        const findChildren = (currentId: string, currentDepth: number) => {
            if (currentDepth >= depth || processed.has(currentId)) return;
            
            processed.add(currentId);
            const current = data.members.find(m => m.id === currentId);
            
            if (!current) return;
            
            current.children.forEach(childId => {
                const child = data.members.find(m => m.id === childId);
                if (child) {
                    descendants.push(child);
                    findChildren(childId, currentDepth + 1);
                }
            });
        };
        
        findChildren(id, 0);
        return descendants;
    }
}

export default GenealogyService;