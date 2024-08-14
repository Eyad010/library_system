const express = require('express');
const productsController = require('../controllers/productsController');

const router = express.Router();

router.route('/createProduct').post(productsController.createProduct); // => done
router.route('/getAllProducts').get(productsController.getAllProducts); // => done
router.route('/getProduct/:id').get(productsController.getProductById); // => done
router.route('/updateProduct/:id').patch(productsController.updateProduct); // => done
router.route('/deleteProduct/:id').delete(productsController.deleteProduct); // => done

module.exports = router;