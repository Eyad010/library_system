const Products = require('../models/productsModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

 // create new product
 exports.createProduct = catchAsync(async (req, res, next) => {
  // Destructure properties from req.body
  const { ID, name, quantity, price } = req.body;

  // Ensure all required fields are provided
  if (!ID || !name || quantity === undefined || price === undefined) {
    return next(new AppError("Missing required feild", 400));
  };
  // check for dublicate 
  const product = await Products.findOne({ ID });
  if (product) {
    return next(new AppError("Product already exists", 400));
    }


  // Create a new product
  const newProduct = await Products.create({ ID, name, quantity, price });

  // Respond with success message
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct
    }
  });
});


  // find product by ID
exports.getProductById = catchAsync(async(req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError(`invalid id`, 400));
  };

  const product = await Products.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
    };

    res.status(200).json({
      status: 'success',
      data: {
        product
        }
        });
});

// get all products
exports.getAllProducts = catchAsync(async(req, res, next) => {

  const limit = parseInt(req.query.limit) || 5; // Parse limit to ensure it's a number
  const page = parseInt(req.query.page) || 1; // Parse page to ensure it's a number
  const skip = (page - 1) * limit || 0;
  let query = {};

// Search by productID
if (req.query.ID) {
  query = { ID: req.query.ID };
  };

  // search by name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" }; //
    };

  const products = await Products.find(query).limit(limit).skip(skip);
  res.status(200).json({
    status: 'success',
    results: products.length,
    page: page,
    data: {
      products
      }
  });
});


// update product by id
exports.updateProduct = catchAsync(async(req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError(`invalid id`, 400));
    };
    const product = await Products.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
      });
      if (!product) {
        return next(new AppError('Product not found', 404));
        };
        res.status(200).json({
          status: 'success',
          data: {
            product
            }
        });
  });

  // delete product by ID
  exports.deleteProduct = catchAsync(async(req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(`invalid id`, 400));
      };
      const product = await Products.findById(req.params.id);
      if (!product) {
        return next(new AppError('Product not found', 404));
        };
        await Products.findByIdAndDelete(req.params.id);

        res.status(204).json({
          status: 'success',
          data: null
          });

  });