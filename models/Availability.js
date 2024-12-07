module.exports = (sequelize, DataTypes) => {
    const availability = sequelize.define('availability', {
      a_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      d_id: DataTypes.INTEGER,
      date: DataTypes.DATEONLY,
    });
    return availability;
  };
  