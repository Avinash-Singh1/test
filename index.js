const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
dotenv.config();

const app = express();
const userRouter = require("./users/user.router");
const userController = require('./users/user.controller');

// Middleware for logging
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(path.resolve(), "Quickauto")));

app.get('/api/booking', async (req, res) => {
    try {
        console.log("Transaction");
        const results = await sequelize.query("CALL GetScheduleData();");
        console.log('Stored Procedure Results:', results);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching booking data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/mark-notavaiable', userController.getMarkUnavialable);
app.post('/api/mark-avaiable', userController.getMarkavialable);
app.post('/api/Mark_Schedule', userController.getMark_Schedule);
app.get('/api/unavailable-dates', userController.getUnavailabledates);
app.get('/api/driver-schedules', userController.getDriverSchedule);
app.post('/api/delete_DriverSchedule', userController.delete_DriverSchedule);
app.get('/api/directions', userController.getDirections);
app.get('/api/autocomplete', userController.getAutocomplete);
app.use("/api/users", userRouter);

app.get('*', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'Quickauto', 'index.html'));
});

app.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on port ${process.env.APP_PORT}`);
});
