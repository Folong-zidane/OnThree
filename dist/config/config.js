"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const config = {
    port: parseInt(process.env.PORT || '3000'),
    dataFilePath: process.env.DATA_FILE_PATH || path_1.default.join(__dirname, '../../data/genealogy.json'),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
};
exports.default = config;
