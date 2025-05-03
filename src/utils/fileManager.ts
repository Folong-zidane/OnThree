// utils/fileManager.ts
import fs from 'fs/promises';
import path from 'path';
import { GenealogyData } from '../models/familyMember';
import { Family } from '../models/family';
import logger from './logger';

class FileManager {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.initialize();
  }

  // Initialisation du répertoire s'il n'existe pas
  private async initialize(): Promise<void> {
    try {
      await fs.access(this.baseDir);
    } catch (error) {
      logger.info(`Création du répertoire ${this.baseDir}`);
      await fs.mkdir(this.baseDir, { recursive: true });
    }
  }

  private getFamilyFilePath(familyId: string): string {
    return path.join(this.baseDir, `${familyId}.json`);
  }

  async familyExists(familyId: string): Promise<boolean> {
    try {
      await fs.access(this.getFamilyFilePath(familyId));
      return true;
    } catch (error) {
      return false;
    }
  }

  async readFamilyFile(familyId: string): Promise<Family> {
    try {
      const filePath = this.getFamilyFilePath(familyId);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Erreur de lecture de la famille ${familyId}:`, error);
      throw new Error(`Famille non trouvée: ${familyId}`);
    }
  }

  async writeFamilyFile(family: Family): Promise<void> {
    try {
      const filePath = this.getFamilyFilePath(family.id);
      await fs.writeFile(filePath, JSON.stringify(family, null, 2));
    } catch (error) {
      logger.error(`Erreur d'écriture pour la famille ${family.id}:`, error);
      throw new Error(`Erreur lors de l'écriture du fichier: ${(error as Error).message}`);
    }
  }

  async getAllFamilies(): Promise<Family[]> {
    try {
      const files = await fs.readdir(this.baseDir);
      const familyFiles = files.filter(file => file.endsWith('.json'));
      
      const families: Family[] = [];
      for (const file of familyFiles) {
        const familyId = path.basename(file, '.json');
        try {
          const family = await this.readFamilyFile(familyId);
          families.push(family);
        } catch (error) {
          logger.error(`Erreur de lecture du fichier ${file}:`, error);
        }
      }
      
      return families;
    } catch (error) {
      logger.error('Erreur de lecture des familles:', error);
      return [];
    }
  }

  async deleteFamilyFile(familyId: string): Promise<boolean> {
    try {
      const filePath = this.getFamilyFilePath(familyId);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      logger.error(`Erreur de suppression de la famille ${familyId}:`, error);
      return false;
    }
  }
}

export default FileManager;
