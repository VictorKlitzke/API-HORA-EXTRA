const mssql = require('mssql');

require('dotenv').config();

const createConnection = async () => {
    try {
        return await mssql.connect({
            user: config.user,
            password: config.password,
            server: config.server,
            database: config.database,
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        });
    } catch (error) {
        console.error(`Erro ao conectar ao banco de dados ${config.database}`, error);
        throw error;
    }
}

const connectDB = () => createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,

});

const connectDBSiagri = () => createConnection({
    user: process.env.DB_SIAGRI_USER,
    password: process.env.DB_SIAGRI_PASSWORD,
    server: process.env.DB_SIAGRI_HOST,
    database: process.env.DB_SIAGRI_DATABASE,

});

module.exports = { connectDBSiagri, connectDB };