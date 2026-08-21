const router = require("express").Router();
const snackController = require("../controllers/snackController");

// ✅ Specific routes first
router.get("/all", snackController.getAllSnacks);

// ✅ Get by theatre
router.get("/theatre/:theatre", snackController.getSnacksByTheatre);

// ✅ CRUD
router.post("/", snackController.addSnack);
router.put("/:id", snackController.updateSnack);
router.delete("/:id", snackController.deleteSnack);

module.exports = router;
