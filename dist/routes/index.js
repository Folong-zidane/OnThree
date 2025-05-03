"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const genealogyRoutes_1 = __importDefault(require("./genealogyRoutes"));
const genealogyController_1 = __importDefault(require("../controllers/genealogyController"));
const genealogyServices_1 = __importDefault(require("../services/genealogyServices"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Création des instances avec dépendances
const genealogyService = new genealogyServices_1.default(path_1.default.join(__dirname, '../../data/genealogy.json'));
const genealogyController = new genealogyController_1.default(genealogyService);
// Montage des routes
router.use('/api/genealogy', (0, genealogyRoutes_1.default)(genealogyController));
exports.default = router;
