"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
class FileManager {
    constructor(filePath) {
        this.filePath = filePath;
        this.initialize();
    }
    // Initialisation du fichier s'il n'existe pas
    async initialize() {
        try {
            await promises_1.default.access(this.filePath);
        }
        catch (error) {
            logger_1.default.info(`Création du fichier ${this.filePath}`);
            await this.ensureDirectoryExists();
            await promises_1.default.writeFile(this.filePath, JSON.stringify({ members: [] }, null, 2));
        }
    }
    async ensureDirectoryExists() {
        const directory = path_1.default.dirname(this.filePath);
        try {
            await promises_1.default.access(directory);
        }
        catch (error) {
            await promises_1.default.mkdir(directory, { recursive: true });
        }
    }
    async readFile() {
        try {
            const data = await promises_1.default.readFile(this.filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.default.error('Erreur de lecture:', error);
            return { members: [] };
        }
    }
    async writeFile(data) {
        try {
            await promises_1.default.writeFile(this.filePath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            logger_1.default.error('Erreur d\'écriture:', error);
            throw new Error(`Erreur lors de l'écriture du fichier: ${error.message}`);
        }
    }
}
exports.default = FileManager;
