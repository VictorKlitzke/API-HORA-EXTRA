const mssql = require('mssql');
require('dotenv').config();

const seniorConfig = {
    user: process.env.DB_USER_SENIOR,
    password: process.env.DB_PASSWORD_SENIOR,
    server: process.env.DB_HOST_SENIOR,
    database: process.env.DB_DATABASE_SENIOR,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

const agrimanagerConfig = {
    user: process.env.DB_SIAGRI_USER,
    password: process.env.DB_SIAGRI_PASSWORD,
    server: process.env.DB_SIAGRI_HOST,
    database: process.env.DB_SIAGRI_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

const seniorPool = new mssql.ConnectionPool(seniorConfig);
const agrimanagerPool = new mssql.ConnectionPool(agrimanagerConfig);

seniorPool.connect();
agrimanagerPool.connect();

const connectDB = async () => {
    return seniorPool;
}
const connectDBSiagri = async () => {
    return agrimanagerPool;
}

module.exports = {
    connectDB,
    connectDBSiagri,
};