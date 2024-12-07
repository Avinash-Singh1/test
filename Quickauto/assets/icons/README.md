
# QuickAuto

QuickAuto is a full-stack web application. This README file contains instructions for setting up both the front-end and back-end of the project, along with the deployment process. The front-end is built with Angular, and the back-end uses Node.js with Express, connecting to a MySQL database hosted on AWS RDS.

## Prerequisites

Before you start, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **Angular CLI**
- **MySQL** (or AWS RDS for deployment)
- **Git**

## Getting Started

### 1. Frontend Setup

The front-end of the application is built with Angular. Here's how to build and prepare it for deployment with the back-end.

#### Steps:

1. Open the `angular.json` file in the root of your Angular project. Ensure the following configurations are in place:
   ```json
   "options": {
       "outputPath": "server/Quickauto",
       "index": "src/index.html",
       "main": "src/main.ts",
       "polyfills": [
           "zone.js"
       ]
   }
   ```

2. **Build the Angular Project for Production**:
   Run the following command to create a production build of the Angular project:
   ```bash
   ng build --prod
   ```

   This will generate the production-ready static files and store them in the `server/Quickauto` directory.

### 2. Backend Setup

The back-end is built using Node.js and Express. This section covers setting up the static file serving, API routing, and integrating the front-end build.

#### Backend Code Structure:

1. Open the `index.js` file in the backend (`server/` directory) and ensure the following configuration is present:

   ```javascript
   const express = require('express');
   const cors = require('cors');
   const dotenv = require('dotenv');
   const cookieParser = require('cookie-parser');
   const bodyParser = require('body-parser');
   const path = require('path');
   
   dotenv.config();
   
   const app = express();
   
   // Enable CORS
   app.use(cors());
   
   // Static Files for Frontend
   app.use(express.static(path.join(path.resolve(), 'Quickauto')));
   
   // Middleware
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(cookieParser());
   app.use(bodyParser.json());
   
   // Routers
   const userRouter = require('./users/user.router');
   app.use('/api/users', userRouter);
   
   // Catch-all route to serve the Angular app for any route
   app.get('*', (req, res) => {
     res.sendFile(path.join(path.resolve(), 'Quickauto', 'index.html'));
   });
   
   // Server listening on a port (e.g., 3000)
   const port = process.env.PORT || 3000;
   app.listen(port, () => {
     console.log(`Server is running on port ${port}`);
   });
   ```

2. Make sure you correctly set up the static file serving after defining your API routes.

   The line `app.use(express.static(path.join(path.resolve(), 'Quickauto')));` will serve the front-end build from the `Quickauto` folder.

3. **Environment Variables**:
   Ensure your environment variables (such as database credentials) are set up in a `.env` file.

### 3. AWS RDS Setup

If you're deploying your back-end with AWS RDS as the database:

1. **Create an RDS Instance**:
   - Go to AWS RDS and create a MySQL instance.
   - Make sure the instance is publicly accessible if you are testing/deploying from a remote server.

2. **Security Group Configuration**:
   - Set up a security group for the RDS instance.
   - Add an **inbound rule** to allow connections on port `3306` from your server's IP address.

3. **Connect the Backend to AWS RDS**:
   In your `server` directory, ensure the MySQL connection pool is properly configured to connect to AWS RDS. An example configuration:

   ```javascript
   const mysql = require("mysql2");

   const pool = mysql.createPool({
       host: process.env.HOST,
       user: process.env.USER,
       password: process.env.PASSWORD,
       database: process.env.DATABASE,
       connectionLimit: 10
   });

   console.log("Database pool created.");

   module.exports = pool;
   ```

### 4. Common Issues

- **Live Server Error**: If you're trying to run the front-end using a live server (e.g., `ng serve`), the static file serving might throw errors. Ensure you serve the front-end through the backend using Express as explained above.

- **ETIMEDOUT/ECONNRESET Errors**: These are common errors when connecting to AWS RDS. Check your security group settings and ensure you have added the correct inbound rule to allow your server's IP to connect to the RDS instance.

### 5. API Endpoints

- **User Registration**: `/api/users/register`
- **User Login**: `/api/users/login`
  
Make sure to update the backend API endpoints according to your project requirements.

### 6. Deployment

1. Build the front-end using `ng build --prod`.
2. Set up the back-end to serve static files and handle API requests.
3. Deploy your back-end and database on a service like AWS, Heroku, or Render, and ensure the API and database connections are properly configured.

## License

This project is licensed under the MIT License.

---

*QuickAuto: A streamlined platform for managing automobile-related processes.*
