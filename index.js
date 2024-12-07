const express= require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv= require('dotenv');
const cookieParser= require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const {DriverSchedule, availability } = require('./models');
// const { DriversMaster, sequelize } = require('./models');
// const { DriverSchedule, sequelize } = require('./models');
const { Sequelize } = require('sequelize');
dotenv.config();
const app = express();
app.use(cors());

const userRouter= require("./users/user.router");

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(path.resolve(), "Quickauto")));


// app.use("/api/users",userRouter);
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Directions API Route
const sequelize = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql', // Use 'mysql' for MySQL
});



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
app.post('/api/mark-notavaiable', async (req, res) => {
  try {
    console.log("Received request for mark-notavaiable");
    
    // Destructure data from the request body
    const { selectedDate, d_id } = req.body;
    
    if (!selectedDate || !d_id) {
      return res.status(400).json({ error: "Missing required fields: selectedDate or d_id" });
    }

    console.log("Payload:", { selectedDate, d_id });

    // Call the stored procedure with the parameters
    const results = await sequelize.query(
      "CALL Marknotavaiable(:selectedDate, :d_id);", // SQL for stored procedure
      {
        replacements: { selectedDate, d_id }, // Map payload to procedure parameters
        type: sequelize.QueryTypes.RAW // RAW for raw SQL execution
      }
    );

    console.log("Stored Procedure Results:", results);

    // Send a success response
    res.status(200).json({ message: "Procedure executed successfully", results });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post('/api/Mark_Schedule', async (req, res) => {
  try {
    console.log("Received request for mark-schedule");
    
    // Destructure and validate data
    const { selectedDate, startTime, endTime, d_id } = req.body;
    if (!selectedDate || !d_id) {
      return res.status(400).json({ error: "Missing required fields: selectedDate or d_id" });
    }

    const parsedD_id = parseInt(d_id, 10);
    if (isNaN(parsedD_id)) {
      return res.status(400).json({ error: "Invalid d_id, must be an integer" });
    }

    console.log("Payload:", { selectedDate, startTime, endTime, d_id: parsedD_id });

    // Call stored procedure
    const results = await sequelize.query(
      "CALL MarkSchedule(:selectedDate, :startTime, :endTime, :d_id);",
      {
        replacements: { selectedDate, startTime, endTime, d_id: parsedD_id },
        type: sequelize.QueryTypes.RAW
      }
    );

    console.log("Stored Procedure Results:", results);

    res.status(200).json({ message: "Procedure executed successfully", results });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// calender apis
app.use('/api/unavailable-dates', async (req, res) => {
  try {
    const { month } = req.query;
    console.log("month: ", month);

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    // Query to fetch unavailable dates in the given month
    const unavailableDates = await availability.findAll({
      where: sequelize.where(
        sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'),
        month
      ),
    });

    // Map and return only the dates in a simplified format
    const formattedDates = unavailableDates.map((record) => {
      const date = record.date; // Assuming `date` is the column name in your database
      // Convert the date to a JavaScript Date object if it's not one already
      const jsDate = new Date(date);
      return jsDate.toISOString().split('T')[0]; // Return the date in YYYY-MM-DD format
    });

    res.json(formattedDates); 
  } catch (error) {
    console.error(error); // Log the error for better debugging
    res.status(500).json({ error: 'Failed to fetch unavailable dates' });
  }
});
app.use('/api/driver-schedules', async (req, res) => {
  try {
    const { date, d_id } = req.query;  // Get the date and driver ID from query parameters
      console.log("Date: ",date);
    if (!date || !d_id) {
      return res.status(400).json({ error: 'Date and driver ID are required' });
    }

    // Query the driver_schedule table for schedules that match the selected date and driver ID
    const schedules = await DriverSchedule.findAll({
      where: {
        date: date,  // Match the date
        d_id: d_id,  // Match the driver ID
        available_status: 0 // Ensure the schedule is unavailable (not available)
      },
      order: [['start_time', 'ASC']],  // Order by start time for easy display
    });

    if (schedules.length === 0) {
      return res.json([]);  // Return an empty array if no schedules are found
    }

    // Map the result to include only the necessary fields for the frontend
    const formattedSchedules = schedules.map(schedule => ({
      start_time: schedule.start_time,
      end_time: schedule.end_time
    }));

    // Send the schedules back to the client
    res.json(formattedSchedules);
  } catch (error) {
    console.error('Error fetching driver schedules:', error);
    res.status(500).json({ error: 'Failed to fetch driver schedules' });
  }
});
// calender apis


// Endpoint to get booking data
// app.get('/api/booking', (req, res) => {
//   res.json(data);
// });



app.get('/api/directions', async (req, res) => {
  const { source, destination } = req.query;

  if (!source || !destination) {
    return res.status(400).send('Source and Destination are required');
  }

  try {
    const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?origin=${source}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(directionsUrl);

    const directions = response.data;

    if (directions.status === "ZERO_RESULTS") {
      return res.status(404).send('No route found');
    }

    return res.json(directions);
  } catch (error) {
    return res.status(500).send('Error fetching directions');
  }
});

// Autocomplete API Route
app.get('/api/autocomplete', async (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).send('Input is required');
  }

  try {
    const autocompleteUrl = `https://maps.gomaps.pro/maps/api/place/queryautocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(autocompleteUrl);
    
    // Send the predictions back to the client
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    return res.status(500).send('Error fetching autocomplete suggestions');
  }
});

app.use("/api/users",userRouter);
app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'Quickauto', 'index.html'));
});

app.listen(process.env.APP_PORT,()=>{
    console.log(`Server is running on port  ${process.env.APP_PORT}`);
})