const mssql = require('mssql');

require('dotenv').config();

const connectDB = async () => {
    try {
        const pool = await mssql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            options: {
                encrypt: true, 
                trustServerCertificate: true
            }
        });
        return pool;
    } catch (error) {
        console.error("Erro ao conectar ao banco de dados", error);
        throw error;
    }
};

module.exports = connectDB;