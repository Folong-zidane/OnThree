import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(cors({
    origin: config.corsOrigin
}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// Middleware d'erreur
app.use(notFound);
app.use(errorHandler);

// Démarrage du serveur
app.listen(config.port, () => {
    logger.info(`Serveur en cours d'exécution sur le port ${config.port} en mode ${config.env}`);
});

export default app;