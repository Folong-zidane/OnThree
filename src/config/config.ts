import path from 'path';

interface Config {
    port: number;
    dataFilePath: string;
    env: string;
    corsOrigin: string;
}

const config: Config = {
    port: parseInt(process.env.PORT || '3000'),
    dataFilePath: process.env.DATA_FILE_PATH || path.join(__dirname, '../../data/genealogy.json'),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
};

export default config;