import fs from 'fs/promises';
import path from 'path';
import { GenealogyData } from '../models/familyMember';
import logger from './logger';

class FileManager {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.initialize();
    }

    // Initialisation du fichier s'il n'existe pas
    private async initialize(): Promise<void> {
        try {
            await fs.access(this.filePath);
        } catch (error) {
            logger.info(`Création du fichier ${this.filePath}`);
            await this.ensureDirectoryExists();
            await fs.writeFile(this.filePath, JSON.stringify({ members: [] }, null, 2));
        }
    }

    private async ensureDirectoryExists(): Promise<void> {
        const directory = path.dirname(this.filePath);
        try {
            await fs.access(directory);
        } catch (error) {
            await fs.mkdir(directory, { recursive: true });
        }
    }

    async readFile(): Promise<GenealogyData> {
        try {
            const data = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Erreur de lecture:', error);
            return { members: [] };
        }
    }

    async writeFile(data: GenealogyData): Promise<void> {
        try {
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error('Erreur d\'écriture:', error);
            throw new Error(`Erreur lors de l'écriture du fichier: ${(error as Error).message}`);
        }
    }
}

export default FileManager;