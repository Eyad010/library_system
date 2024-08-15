const Orders = require('../models/orderModel');
const Products = require('../models/productsModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");



// create order
exports.createOrder = catchAsync(async (req, res, next) => {
  const items = req.body.items; // Expecting an array of { ID, quantity }

  // Validate input
  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('Items must be a non-empty array', 400));
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const { ID, quantity } = item;

    if (typeof ID !== 'number' || isNaN(ID)) {
      return next(new AppError(`Invalid product ID: ${ID}`, 400));
    }
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
      return next(new AppError(`Invalid quantity for product ID: ${ID}`, 400));
    }

    // Fetch the product by ID
    const product = await Products.findOne({ ID: ID });
    if (!product) {
      return next(new AppError(`Product not found for ID: ${ID}`, 404));
    }

    // Validate product quantity
    if (product.quantity < quantity) {
      return next(new AppError(`Not enough quantity available for product ID: ${ID}`, 400));
    }

    // Ensure price is a valid number
    if (typeof product.price !== 'number' || isNaN(product.price)) {
      return next(new AppError('Invalid product price', 500));
    }

    // Calculate the total price for this item
    const total = product.price * quantity;

    // Create the order item
    orderItems.push({
      ID,
      quantity,
      total,
      product: {
        ID: product.ID,
        name: product.name,
        price: product.price
      }
    });

    // Update product quantity
    await Products.findOneAndUpdate(
      { ID: ID },
      { $inc: { quantity: -quantity } }
    );

    totalAmount += total;
  }

  // Create the order
  const order = await Orders.create({
    items: orderItems,
    totalAmount,
  });
  //  console.log (order.totalAmount);

  res.status(201).json({
    status: 'success',
    data: {
      // order,
      items: orderItems,
      id : order.id,
      totalAmount: order.totalAmount
    },
  });
});


// get order by id 

exports.getOrderById = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  // Find the order by its ID
  const order = await Orders.findById(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Fetch product details for each item in the order
  const itemsWithProductDetails = await Promise.all(
    order.items.map(async (item) => {
      const product = await Products.findOne({ ID: item.ID });
      if (!product) {
        return next(new AppError(`Product not found for ID: ${item.ID}`, 404));
      }

      // Return item with product details
      return {
        ID: item.ID,
        quantity: item.quantity,
        total: item.total,
        product: {
          ID: product.ID,
          name: product.name,
          price: product.price,
        },
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      order: {
        ...order._doc, // Spread to get the plain object of order
        items: itemsWithProductDetails,
      },
    },
  });
});

// get all orders

exports.getAllOrders = catchAsync(async (req, res, next) => {

  const limit = parseInt(req.query.limit) || 5; // Parse limit to ensure it's a number
  const page = parseInt(req.query.page) || 1; // Parse page to ensure it's a number
  const skip = (page - 1) * limit || 0;
  let query = {};


  if (page < 1 || limit < 1) {
    return next(new AppError('Invalid page or limit values', 400));
  }

    // search by name
    // if (req.query.search) {
    //   query.name = { $regex: req.query.search, $options: "i" }; // => new feature 
    //   };

  // Query for orders with pagination and ==> new feature (search filter) Not Implemented Yet
  const orders = await Orders.find(query)
    .skip(skip)
    .limit(limit);

  // console.log('Orders:', orders);

  // Get product details for each item in the orders
  const populatedOrders = await Promise.all(orders.map(async order => {
    // console.log ('order eyad', order);
    const itemsWithProductInfo = await Promise.all(order.items.map(async item => {
      // console.log ('item eyad', item);
      
      const productId = item.ID;
      
      if (isNaN(productId)) {
        // console.log(`Invalid product ID: ${item.product}`);
        return {
          ...item._doc,
          product:{
            name: product.name,
            price: product.price,
          } ,
          
        };
      }

      // Debugging logs
      // console.log(`Looking up product with ID: ${productId}`);

      const product = await Products.findOne({ ID: productId });

      
      if (!product) {
        console.log(`Product not found for ID: ${productId}`);
      }

      return {
        ...item._doc,
        product: product ? product.toObject() : null
      };
    }));

    return {
      ...order._doc,
      items: itemsWithProductInfo
    };
  }));

  // Get the total number of orders for pagination info
  const totalOrders = await Orders.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: populatedOrders.length,
    page,
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
    data: {
      orders: populatedOrders,
    },
  });
});




// update order by id

exports.updateOrderById = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const newItems = req.body.items; // Expecting an array of { ID, quantity }

  // Validate input
  if (!Array.isArray(newItems) || newItems.length === 0) {
    return next(new AppError('Items must be a non-empty array', 400));
  }

  // Find the existing order
  const order = await Orders.findById(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Create a map of current items in the order for quick lookup
  const currentItemsMap = new Map();
  order.items.forEach(item => {
    currentItemsMap.set(item.ID, item.quantity);
  });

  // Create a map of new items
  const newItemsMap = new Map();
  newItems.forEach(item => {
    newItemsMap.set(item.ID, item.quantity);
  });

  // Track product quantity changes
  const productUpdates = [];

  // Handle updated or removed items
  for (const [ID, currentQuantity] of currentItemsMap.entries()) {
    if (!newItemsMap.has(ID)) {
      // Item was removed from the order
      const product = await Products.findOne({ ID: ID });
      if (!product) {
        return next(new AppError(`Product not found for ID: ${ID}`, 404));
      }
      productUpdates.push(
        Products.findOneAndUpdate(
          { ID: ID },
          { $inc: { quantity: currentQuantity } }
        )
      );
    } else {
      // Item is updated or remains in the order
      const newQuantity = newItemsMap.get(ID);
      if (newQuantity !== currentQuantity) {
        const product = await Products.findOne({ ID: ID });
        if (!product) {
          return next(new AppError(`Product not found for ID: ${ID}`, 404));
        }
        if (product.quantity + currentQuantity < newQuantity) {
          return next(new AppError(`Not enough quantity available for product ID: ${ID}`, 400));
        }
        // Update stock by restoring the old quantity and deducting the new quantity
        productUpdates.push(
          Products.findOneAndUpdate(
            { ID: ID },
            { $inc: { quantity: currentQuantity - newQuantity } }
          )
        );
      }
    }
  }

  // Handle new items added to the order
  for (const [ID, newQuantity] of newItemsMap.entries()) {
    if (!currentItemsMap.has(ID)) {
      const product = await Products.findOne({ ID: ID });
      if (!product) {
        return next(new AppError(`Product not found for ID: ${ID}`, 404));
      }
      if (product.quantity < newQuantity) {
        return next(new AppError(`Not enough quantity available for product ID: ${ID}`, 400));
      }
      // Deduct stock for new items
      productUpdates.push(
        Products.findOneAndUpdate(
          { ID: ID },
          { $inc: { quantity: -newQuantity } }
        )
      );
    }
  }

  // Wait for all product updates to complete
  await Promise.all(productUpdates);

  // Calculate the new total amount for the order
  const updatedItems = await Promise.all(
    newItems.map(async (item) => {
      const { ID, quantity } = item;

      // Fetch the product by ID
      const product = await Products.findOne({ ID: ID });
      if (!product) {
        return next(new AppError(`Product not found for ID: ${ID}`, 404));
      }

      // Calculate the total price for this item
      const total = product.price * quantity;

      return {
        ID,
        quantity,
        total,
        product: {
          ID: product.ID,
          name: product.name,
          price: product.price,
        },
      };
    })
  );

  // Calculate the new total amount for the order
  const totalAmount = updatedItems.reduce((acc, item) => acc + item.total, 0);

  // Update the order with new items and total amount
  const updatedOrder = await Orders.findByIdAndUpdate(
    id,
    {
      items: updatedItems,
      totalAmount,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: updatedOrder,
  });
});

// delete order by id 

exports.deleteOrderById = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  // Find the order to delete
  const order = await Orders.findById(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Track product quantity updates
  const productUpdates = [];

  // Return quantities of each item in the order to stock
  for (const item of order.items) {
    const { ID, quantity } = item;

    // Find the product by ID
    const product = await Products.findOne({ ID: ID });
    if (!product) {
      return next(new AppError(`Product not found for ID: ${ID}`, 404));
    }

    // Increment the product quantity by the quantity of the item in the order
    productUpdates.push(
      Products.findOneAndUpdate(
        { ID: ID },
        { $inc: { quantity: quantity } }
      )
    );
  }

  // Wait for all product updates to complete
  await Promise.all(productUpdates);

  // Delete the order
  await Orders.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    message: 'Order deleted successfully',
  });
});


// get the total amount of the day from order that are sold 

exports.getTotalAmount = catchAsync(async (req, res, next) => {
  const date = new Date(req.params.date);
  const now = new Date();

  // Check if the entered date is in the future
  if (date > now) {
    return next(new AppError('The entered date is in the future. Please provide a valid date.', 400))
  };

  // Set the start and end of the day for the specified date
  const startOfDay = new Date(date.setHours(7, 0, 0, 0));
  const endOfDay = new Date(date.setHours(22, 0, 0, 0));

  // Aggregate orders within the specified time range
  const totalAmount = await Orders.aggregate([
    {
      $match: {
        orderDate: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  // Respond with the total amount
  res.status(200).json({
    date: req.params.date,
    totalAmountOfDay: totalAmount.length > 0 ? totalAmount[0].totalAmount : 0
  });
});