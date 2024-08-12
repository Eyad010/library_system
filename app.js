const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');


const app = express();

// 1) global middlewares......

app.use(cors());
// Set security HTTP headers
app.use(helmet());
// Body parser, reading data from body into req.body
app.use(express.json());
app.use(morgan());

// This is often used to track when a request was received.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});


// 2) ROUTES

// routes her !!!

// catch-all for any routes that haven't been handled by previous route handlers
app.all('*', (req, res, next) => {
  return res.status(404).json({
    status: 'error',
    message: 'Route not found'
    });
})

// global error her !!!

module.exports = app;
