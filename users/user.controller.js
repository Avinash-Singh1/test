const { 
    create,
    getUserByUserEmail,
    getUserByUserId,
    getUsers,
    updateUser,
    deleteUser } = require("./user.service");
const { genSaltSync, hashSync,compareSync } = require("bcrypt");
const {sign} =require("jsonwebtoken");
const { timestamp } = require("rxjs");
const twilio = require('twilio');
const Razorpay = require('razorpay'); 
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpay = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY
});



// Twilio credentials from the Twilio console
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
      const { destination, source, travelDate, travelTime } = req.body;
    
      try {
        // Properly format the message body for WhatsApp
        const messageBody = `
    🚗 *Travel Auto Booking Confirmation*
    
    Hello! 🎉 
    
    Your appointment has been successfully booked!
    
    🔹 *Source:* ${source}
    🔹 *Destination:* ${destination}
    📅 *Travel Date:* ${travelDate}
    ⏰ *Travel Time:* ${travelTime}
    
    Thank you for choosing our service! Have a safe and pleasant journey! 😊
    
    To manage your booking, visit our website or contact our support.
    
    Best regards,
    *Travel Auto Booking Team*
        `;
    
        // Send the WhatsApp message via Twilio
        const message = await client.messages.create({
          from: 'whatsapp:+14155238886',  // Twilio Sandbox WhatsApp number
          to: 'whatsapp:+917011167639',    // WhatsApp recipient's phone number with country code
          body: messageBody                // The properly formatted message body
        });
    
        // Send a success response back to the client
        return res.json({
          success: 1,
          message: "Message sent successfully"
        });
    
        console.log('Message sent:', message.sid);  // Log message SID for reference
    
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
    }
  ,
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
    }

    
  };
