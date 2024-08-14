const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const productRouter = require('./routes/productsRoutes');
const orderRouter = require('./routes/orderRoutes');

const app = express();

// 1) global middlewares......
// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors());
// Set security HTTP headers
app.use(helmet());

app.use(morgan());

// This is often used to track when a request was received.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});


// 2) ROUTES
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);

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
