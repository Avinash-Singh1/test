const mysql = require("mysql2");

const pool = mysql.createPool({
    port: process.env.DB_PORT,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    connectionLimit: 10
});

console.log("Database pool created.");

module.exports = pool;
