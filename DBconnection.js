const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql', // Use 'mysql' for MySQL
  });

  module.exports= sequelize;