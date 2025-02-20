const mssql = require('mssql');

require('dotenv').config();

const createConnection = async (dbConfig) => {
    try {
        const database = await mssql.connect({
            user: dbConfig.user,
            password: dbConfig.password,
            server: dbConfig.server,
            database: dbConfig.database,
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        });

        console.log(`Conectado ao banco de dados ${dbConfig.database}`);
        return database;

    } catch (error) {
        console.error(`Erro ao conectar ao banco de dados ${dbConfig.database}:`, error);
        throw error;
    }
};

const connectDBSiagri = async () => createConnection({
    user: process.env.DB_SIAGRI_USER,
    password: process.env.DB_SIAGRI_PASSWORD,
    server: process.env.DB_SIAGRI_HOST,
    database: process.env.DB_SIAGRI_DATABASE,
})

const connectDB = () => createConnection({
    user: process.env.DB_USER_SENIOR,
    password: process.env.DB_PASSWORD_SENIOR,
    server: process.env.DB_HOST_SENIOR,
    database: process.env.DB_DATABASE_SENIOR,
});

module.exports = { connectDB, connectDBSiagri };
