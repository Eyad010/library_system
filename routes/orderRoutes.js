const express = require('express');
const ordersController = require('../controllers/orderController');

const router = express.Router();



// => routes here 
router.route('/createOrder').post(ordersController.createOrder); // => done
router.route('/getOrder/:id').get(ordersController.getOrderById); // => done
router.route('/getAllOrders').get(ordersController.getAllOrders); // => done
router.route('/updateOrder/:id').patch(ordersController.updateOrderById); // => done
router.route('/deleteOrder/:id').delete(ordersController.deleteOrderById); // => done

router.route('/total-amount/:date').get(ordersController.getTotalAmount); // => done
module.exports = router;