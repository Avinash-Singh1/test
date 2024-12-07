const mysql = require("mysql2");

const pool = mysql.createPool({
    port: process.env.DB_PORT,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    connectionLimit: 10,
    connectTimeout: 10000,
    // acquireTimeout: 10000,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    // reconnect: true,  // Automatically try to reconnect
});

pool.on('error', (err) => {
    console.error("Database error: ", err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error("Attempting to reconnect...");
        // Optionally trigger reconnection logic here
    }
});


console.log("Database pool created.");

module.exports = pool;
