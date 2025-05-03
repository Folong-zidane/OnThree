"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const fileManager_1 = __importDefault(require("../utils/fileManager"));
const logger_1 = __importDefault(require("../utils/logger"));
class GenealogyService {
    constructor(dataFilePath) {
        this.fileManager = new fileManager_1.default(dataFilePath);
    }
    async getAllMembers() {
        const data = await this.fileManager.readFile();
        return data.members;
    }
    async getMemberById(id) {
        const data = await this.fileManager.readFile();
        const member = data.members.find(m => m.id === id);
        return member || null;
    }
    async createMember(memberData) {
        const data = await this.fileManager.readFile();
        const newMember = {
            id: (0, uuid_1.v4)(),
            ...memberData
        };
        data.members.push(newMember);
        await this.fileManager.writeFile(data);
        logger_1.default.info(`Nouveau membre créé: ${newMember.id}`);
        return newMember;
    }
    async updateMember(id, updates) {
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
        logger_1.default.info(`Membre mis à jour: ${id}`);
        return data.members[memberIndex];
    }
    async deleteMember(id) {
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
        logger_1.default.info(`Membre supprimé: ${id}`);
        return true;
    }
    async addRelation(childId, parentId) {
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
        logger_1.default.info(`Relation parent-enfant ajoutée: ${parentId} -> ${childId}`);
        return true;
    }
    async searchMembers(criteria) {
        const data = await this.fileManager.readFile();
        return data.members.filter(member => Object.entries(criteria).every(([key, value]) => {
            if (Array.isArray(member[key]) && Array.isArray(value)) {
                return member[key].some(item => value.includes(item));
            }
            return member[key] === value;
        }));
    }
    async findAncestors(id, depth = Infinity) {
        const data = await this.fileManager.readFile();
        const member = data.members.find(m => m.id === id);
        if (!member) {
            return [];
        }
        const ancestors = [];
        const processed = new Set();
        const findParents = (currentId, currentDepth) => {
            if (currentDepth >= depth || processed.has(currentId))
                return;
            processed.add(currentId);
            const current = data.members.find(m => m.id === currentId);
            if (!current)
                return;
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
    async findDescendants(id, depth = Infinity) {
        const data = await this.fileManager.readFile();
        const member = data.members.find(m => m.id === id);
        if (!member) {
            return [];
        }
        const descendants = [];
        const processed = new Set();
        const findChildren = (currentId, currentDepth) => {
            if (currentDepth >= depth || processed.has(currentId))
                return;
            processed.add(currentId);
            const current = data.members.find(m => m.id === currentId);
            if (!current)
                return;
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
exports.default = GenealogyService;
