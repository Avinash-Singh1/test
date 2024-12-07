module.exports = (sequelize, DataTypes) => {
    const DriversMaster = sequelize.define('drivers_master', {
      d_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      phone: DataTypes.STRING,
    });
    return DriversMaster;
  };
  