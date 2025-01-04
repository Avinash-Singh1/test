const express= require('express');
const cors = require('cors');
const dotenv= require('dotenv');
const cookieParser= require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
dotenv.config();
const app = express();
app.use(cors());
const userRouter= require("./users/user.router");
// const { getMarkUnavialable, getMark_Schedule, getUnavailabledates, getDriverSchedule, getDirections, getAutocomplete, delete_DriverSchedule, getMarkavialable } = require('./users/user.controller');
const userController = require('./users/user.controller');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(path.resolve(), "Quickauto")));
app.get('/api/booking', async (req, res) => {
  try {
    console.log("Transaction");

    // Call the stored procedure
    const results = await sequelize.query("CALL GetScheduleData();");

    // Log the entire results to see the structure
    console.log('Stored Procedure Results:', results);
    res.status(200).json(results);
    
  } catch (error) {
    console.error('Error fetching booking data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/api/mark-notavaiable', userController.getMarkUnavialable);
app.post('/api/mark-avaiable', userController.getMarkavialable);
app.post('/api/Mark_Schedule',userController.getMark_Schedule);
app.post('/api/Mark_Schedule', userController.getMark_Schedule);
app.use('/api/unavailable-dates',userController.getUnavailabledates);
app.use('/api/driver-schedules', userController.getDriverSchedule);
app.use('/api/delete_DriverSchedule', userController.delete_DriverSchedule);
app.get('/api/directions', userController.getDirections);
app.get('/api/autocomplete',userController.getAutocomplete);
app.use("/api/users",userRouter);
app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'Quickauto', 'index.html'));
});

app.listen(process.env.APP_PORT,()=>{
    console.log(`Server is running on port  ${process.env.APP_PORT}`);
})