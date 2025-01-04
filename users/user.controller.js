const { 
    create,
    getUserByUserEmail,
    getUserByUserId,
    getUsers,
    updateUser,
    deleteUser } = require("./user.service");
const axios = require('axios');
const { genSaltSync, hashSync,compareSync } = require("bcrypt");
const {sign} =require("jsonwebtoken");
// const { timestamp } = require("rxjs");
const twilio = require('twilio');
const Razorpay = require('razorpay'); 
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
// const { Sequelize } = require('sequelize');
const nodemailer = require('nodemailer');
const {DriverSchedule, availability } = require('../models');
const razorpay = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY
});
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODE_MAIL,
    pass: process.env.NODE_MAIL_KEY
  }
});



const sequelize =require("../DBconnection");
// const sequelize = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
//   host: process.env.DB_HOST,
//   dialect: 'mysql', // Use 'mysql' for MySQL
// });
// Twilio credentials from the Twilio console
const accountSid = process.env.ACCOUNTSID;// Replace with your Account SID
const authToken = process.env.AUTHTOKEN;   // Replace with your Auth Token
// Create a Twilio client
const client = new twilio(accountSid, authToken);
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
// console.log("GOOGLE_MAPS_API_KEY: ",GOOGLE_MAPS_API_KEY);


module.exports = {
    createUser: (req, res) => {
      const body = req.body;
      const salt = genSaltSync(10);
      body.password = hashSync(body.password, salt);
      console.log("Creadtuser: ",body);
      create(body, (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: 0,
            message: "Database connection errror"
          });
        }
        return res.status(200).json({
          success: 1,
          data: results
        });
      });
    },
    login: (req, res) => {
      const body = req.body;
      getUserByUserEmail(body.email, (err, results) => {
        if (err) {
          console.log(err);
        }
        if (!results) {
          return res.json({
            success: 0,
            data: "Invalid email or password"
          });
        }
        const result = compareSync(body.password, results.password);
        if (result) {
          results.password = undefined;
          const jsontoken = sign({ result: results }, process.env.JSON_WEB_KEY, {
            expiresIn: "1h"
          });
          return res.json({
            success: 1,
            message: "login successfully",
            token: jsontoken,
            name:results.firstname,
            email:results.email,
            mobile:results.number,
            role:results.role
          });
        } else {
          return res.json({
            success: 0,
            data: "Invalid email or password"
          });
        }
      });
    },


sendinfo: async (req, res) => {
      const {DRIVER_MOBILE,TWILLIO_MOBILE}= process.env;
      const { destination, source, travelDate, travelTime, fare, distance,user_email,user_name,user_mobile } = req.body;
      const userPhoneNumber = `whatsapp:+91${user_mobile}`; // Replace with the user's WhatsApp number
      const driverPhoneNumber = `whatsapp:${DRIVER_MOBILE}`; // Replace with the driver's WhatsApp number
      const twilioPhoneNumber = `whatsapp:${TWILLIO_MOBILE}`; // Twilio's WhatsApp sandbox number
      try {
          // Properly format the message body for WhatsApp with better mobile optimization
          const messageBody = `
  🚗 *Travel Auto Booking Confirmation*
  
  Hello ${user_name}! 🎉
  
  Your appointment has been successfully booked! 🥳
  
  🔹 *Source:* ${source}
  🔹 *Destination:* ${destination}
  📅 *Travel Date:* ${travelDate}
  ⏰ *Travel Time:* ${travelTime}
  💰 *Fare:* ${fare}
  🚴 *Distance:* ${distance}
  
  Thank you for choosing our service! Have a safe and pleasant journey! 😊
  
  To manage your booking, visit our website or contact our support.
  
  Best regards,  
  *Travel Auto Booking Team*
          `;
          const driverMessageBody = `
🚗 *New Travel Auto Booking Assignment*

Hello! 🛻

You have been assigned a new booking! 🚀

🔹 *Source:* ${source}  
🔹 *Destination:* ${destination}  
📅 *Travel Date:* ${travelDate}  
⏰ *Travel Time:* ${travelTime}  
🚴 *Distance:* ${distance}  

🔔 *Passenger Name:* ${user_name}  
📞 *Passenger Contact:* ${user_mobile}  

Please be on time and ensure a safe and pleasant journey for the passenger. Thank you for being part of the *Travel Auto Booking Team*! 😊  

Safe travels,  
*Travel Auto Booking Team*
`;

          const sendUserMessage = async () => {
            try {
                const message = await client.messages.create({
                    from: twilioPhoneNumber,
                    to: userPhoneNumber,
                    body: messageBody
                });
                console.log('User message sent:', message.sid);
            } catch (error) {
                console.error('Error sending user message:', error);
            }
        };

        const sendDriverMessage = async () => {
          try {
              const message = await client.messages.create({
                  from: twilioPhoneNumber,
                  to: driverPhoneNumber,
                  body:driverMessageBody,
              });
              console.log('Driver message sent:', message.sid);
          } catch (error) {
              console.error('Error sending driver message:', error);
          }
      };

      await sendUserMessage();
      await sendDriverMessage();

      var mailOptions = {
            from: 'avinash202002@gmail.com',
            to: `${user_email}`,
            subject: 'Test Mail',
            html: messageBody
          };

     transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
  
          // Send a success response back to the client
          return res.json({
              success: 1,
              message: "Message sent successfully"
          });

      } catch (error) {
          // Handle any errors during the message send process
          console.error('Error sending message:', error);
          return res.json({
              success: 0,
              message: "Message sending failed"
          });
      }
  },
    appointmentpay: async(req,res)=> {
      const { amount, currency, receipt, bookingData } = req.body;
    
      const options = {
        amount: amount, // Amount in paise (₹50 * 100)
        currency: currency,
        receipt: receipt
      };
    
      try {
        const order = await razorpay.orders.create(options);
        res.json({
          success: true,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          bookingData
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    },
    getUserByUserId: (req, res) => {
      const id = req.params.id;
      getUserByUserId(id, (err, results) => {
        if (err) {
          console.log(err);
          return;
        }
        if (!results) {
          return res.json({
            success: 0,
            message: "Record not Found"
          });
        }
        results.password = undefined;
        return res.json({
          success: 1,
          data: results
        });
      });
    },
    getUsers: (req, res) => {
      getUsers((err, results) => {
        if (err) {
          console.log(err);
          return;
        }
        return res.json({
          success: 1,
          data: results
        });
      });
    },
    updateUsers: (req, res) => {
      const body = req.body;
      const salt = genSaltSync(10);
      body.password = hashSync(body.password, salt);
      updateUser(body, (err, results) => {
        if (err) {
          console.log(err);
          return;
        }
        return res.json({
          success: 1,
          message: "updated successfully"
        });
      });
    },
    deleteUser: (req, res) => {
      const data = req.body;
      deleteUser(data, (err, results) => {
        if (err) {
          console.log(err);
          return;
        }
        if (!results) {
          return res.json({
            success: 0,
            message: "Record Not Found"
          });
        }
        return res.json({
          success: 1,
          message: "user deleted successfully"
        });
      });
    },
    getAutocomplete:async (req, res) => {
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
    },
    getDirections:async (req, res) => {
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
    },
    getMarkUnavialable:async (req, res) => {
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
    },
    getMarkavialable:async (req, res) => {
      const { d_id,selectedDate } = req.body; 
      try {
        // Delete the row with matching conditions
        const deletedRowCount = await availability.destroy({
          where: {
           // Match the schedule ID (sid)
            date:selectedDate,
            d_id: d_id,  // Match the driver ID
          },
        });
    
        if (deletedRowCount > 0) {
          console.log(`Successfully deleted ${deletedRowCount} schedule(s).`);
          res.json({ message: `Schedule deleted successfully` });
        } else {
          console.log("No schedules found to delete.");
          res.json({ message: `No schedules found to delete.` });
        }

      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    },
    getMark_Schedule:async (req, res) => {
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
    },
    getUnavailabledates:async (req, res) => {
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
    },
    getDriverSchedule:async (req, res) => {
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
        console.log("schedules: ",schedules);
    
        if (schedules.length === 0) {
          return res.json([]);  // Return an empty array if no schedules are found
        }
    
        // Map the result to include only the necessary fields for the frontend
        const formattedSchedules = schedules.map(schedule => ({
          sid:schedule.sid,
          d_id:schedule.d_id,
          start_time: schedule.start_time,
          end_time: schedule.end_time
        }));
    
        // Send the schedules back to the client
        res.json(formattedSchedules);
      } catch (error) {
        console.error('Error fetching driver schedules:', error);
        res.status(500).json({ error: 'Failed to fetch driver schedules' });
      }
    },
    delete_DriverSchedule:async (req,res)=>{
      const { d_id,sid } = req.body; 
      try {
        // Delete the row with matching conditions
        const deletedRowCount = await DriverSchedule.destroy({
          where: {
            sid: sid,  // Match the schedule ID (sid)
            d_id: d_id,  // Match the driver ID
          },
        });
    
        if (deletedRowCount > 0) {
          console.log(`Successfully deleted ${deletedRowCount} schedule(s).`);
          res.json({ message: `Schedule deleted successfully` });
        } else {
          console.log("No schedules found to delete.");
          res.json({ message: `No schedules found to delete.` });
        }

      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    },
    savebookingdata:async (req,res)=>{
      let finalRes = [];
      try {
        // Convert request body to JSON string and format for stored procedure
        let queryData = '"'.replace(/"/g, "'") + JSON.stringify(req.body) + '"'.replace(/"/g, "'");  
        // Call the stored procedure with the formatted JSON payload
        const result = await sequelize.query('CALL insert_booking(' + queryData + ')');
        let msg = 'Record inserted successfully';
        finalRes.push({ status: 'success', message: msg, result: result });
        return res.status(200).json(finalRes[0]);
        
      } catch (error) {
        console.error('Error inserting booking:', error);
        finalRes.push({ status: 'failure', message: 'Error inserting booking', error: error.message });
        return res.status(500).json(finalRes[0]);
      }
    },
    

  };
