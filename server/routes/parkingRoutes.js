const router = require("express").Router();
const parkingController = require("../controllers/parkingController");

router.get("/all", parkingController.getAllParking);

// ✅ use theatre route prefix
router.get("/theatre/:theatre", parkingController.getParkingByTheatre);

router.post("/", parkingController.addParking);
router.put("/:id", parkingController.updateParking);
router.delete("/:id", parkingController.deleteParking);

module.exports = router;
