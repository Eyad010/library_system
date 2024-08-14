const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: [true, 'id is required'],
    unique: [true, 'id must be unique']
  },
  name: {
    type: String,
    required: [true, 'name is required']
  },
  quantity:{
    type:Number,
    required:[true,"the quantity is required"]
  },
  price:{
    type:Number,
    required:[true,"the price is required"]
    },
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products;