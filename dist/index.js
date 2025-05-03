"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config/config"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: config_1.default.corsOrigin
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use(routes_1.default);
// Middleware d'erreur
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Démarrage du serveur
app.listen(config_1.default.port, () => {
    logger_1.default.info(`Serveur en cours d'exécution sur le port ${config_1.default.port} en mode ${config_1.default.env}`);
});
exports.default = app;
