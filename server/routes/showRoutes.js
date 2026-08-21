const router = require("express").Router();
const showController = require("../controllers/showController");

router.post("/", showController.addShow);

router.get("/", showController.getAllShows);

router.get("/single/:showId", showController.getShowById);

router.get("/movie/:movieId", showController.getShowsByMovie);

router.put("/:id", showController.updateShow);

router.delete("/:id", showController.deleteShow);

module.exports = router;
