// snackOrderRoutes.js

const router = require("express").Router();
const snackOrderController = require("../controllers/snackOrderController");

// Metadata for theater/movie options
router.get("/meta/theatres-movies", snackOrderController.getTheatresAndMovies);

// All orders (Admin)
router.get("/all", snackOrderController.getAllSnackOrders);

// User orders
router.get("/user/:userId", snackOrderController.getUserSnackOrders);

// Single order details
router.get("/:orderId", snackOrderController.getSnackOrderById);

// Create order
router.post("/", snackOrderController.createSnackOrder);

// Update status
router.put("/:orderId/status", snackOrderController.updateSnackOrderStatus);

module.exports = router;
