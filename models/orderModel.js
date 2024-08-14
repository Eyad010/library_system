const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  total: {
    type: Number,
    required: [true, 'Total price is required']
  }
});

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
