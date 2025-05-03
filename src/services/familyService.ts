// services/familyService.ts

import { v4 as uuidv4 } from 'uuid';
import GenealogyService from './genealogyServices'
import logger from '../utils/logger';
import { CreateFamilyDTO, Family, CreateMemberDTO } from '../models/family';
import { FamilyMember } from '../models/member';

class FamilyService {
  private genealogyService: GenealogyService;
  
  constructor(dataDir: string) {
    this.genealogyService = new GenealogyService(dataDir);
  }
  
  async getAllFamilies(): Promise<Family[]> {
    return this.genealogyService.getAllFamilies();
  }
  
  async getFamilyById(id: string): Promise<Family | null> {
    try {
      return await this.genealogyService.getFamilyById(id);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la famille ${id}:`, error);
      return null;
    }
  }
  
  async getFamilyByIdentifier(identifier: string): Promise<Family | null> {
    // Essayer d'abord par ID
    try {
      const family = await this.genealogyService.getFamilyById(identifier);
      if (family) return family;
    } catch (error) {
      // Continuer à chercher par nom
    }
    
    // Essayer ensuite par nom
    const families = await this.genealogyService.getAllFamilies();
    return families.find(f => f.name.toLowerCase() === identifier.toLowerCase()) || null;
  }
  
  async createFamily(data: CreateFamilyDTO): Promise<Family | null> {
    try {
      return await this.genealogyService.createFamily(data);
    } catch (error) {
      logger.error('Erreur lors de la création d\'une nouvelle famille:', error);
      return null;
    }
  }
  
  async updateFamily(id: string, updates: Partial<Family>): Promise<Family | null> {
    return this.genealogyService.updateFamily(id, updates);
  }
  
  async deleteFamily(id: string): Promise<boolean> {
    return this.genealogyService.deleteFamily(id);
  }
  
  async addMemberToFamily(
    familyIdentifier: string, 
    memberData: CreateMemberDTO
  ): Promise<FamilyMember | null> {
    try {
      // Trouver la famille par ID ou nom
      const family = await this.getFamilyByIdentifier(familyIdentifier);
      
      if (!family) {
        // Si la famille n'existe pas, en créer une nouvelle avec ce membre
        logger.info(`Création d'une nouvelle famille pour le membre`);
        const newFamily = await this.genealogyService.createFamily({
          name: `Famille ${memberData.lastName}`,
          initialMember: memberData
        });
        
        if (!newFamily || newFamily.members.length === 0) {
          return null;
        }
        
        return newFamily.members[0];
      }
      
      // Ajouter le membre à la famille existante
      return this.genealogyService.addMemberToFamily(family.id, memberData);
    } catch (error) {
      logger.error(`Erreur lors de l'ajout d'un membre à la famille ${familyIdentifier}:`, error);
      return null;
    }
  }
  
  async searchFamilyMembers(
    familyId: string, 
    criteria: Partial<FamilyMember>
  ): Promise<FamilyMember[]> {
    try {
      const family = await this.genealogyService.getFamilyById(familyId);
      
      return family.members.filter(member => {
        return Object.entries(criteria).every(([key, value]) => {
          const memberKey = key as keyof FamilyMember;
          
          if (Array.isArray(member[memberKey]) && Array.isArray(value)) {
            return (member[memberKey] as any[]).some(item => 
              (value as any[]).includes(item)
            );
          }
          
          return member[memberKey] === value;
        });
      });
    } catch (error) {
      logger.error(`Erreur lors de la recherche de membres dans la famille ${familyId}:`, error);
      return [];
    }
  }
}

export default FamilyService;