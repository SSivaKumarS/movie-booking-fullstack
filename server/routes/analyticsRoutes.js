const router = require("express").Router();
const controller = require("../controllers/analyticsController");

router.get("/", controller.getAnalytics);

module.exports = router;
