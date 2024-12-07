const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.DriversMaster = require('./DriversMaster')(sequelize, DataTypes);
db.DriverSchedule = require('./DriverSchedule')(sequelize, DataTypes);
db.availability = require('./availability')(sequelize, DataTypes);

module.exports = db;
