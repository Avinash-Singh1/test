module.exports = (sequelize, DataTypes) => {
    const DriverSchedule = sequelize.define('driver_schedule', {
      sid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      d_id: DataTypes.INTEGER,
      date: DataTypes.DATEONLY,
      start_time: DataTypes.TIME,
      end_time: DataTypes.TIME,
      available_status: DataTypes.BOOLEAN,
    });
    return DriverSchedule;
  };
  