//  movieRoutes.js

// const router = require("express").Router();
// const movieController = require("../controllers/movieController");


// router.post("/", movieController.addMovie);
// router.get("/", movieController.getMovies);
// router.get("/:id", movieController.getMovie);
// router.put("/:id", movieController.updateMovie);
// router.delete("/:id", movieController.deleteMovie);

// module.exports = router;







const router = require("express").Router();

const movieController = require("../controllers/movieController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminAccess } = require("../middleware/adminMiddleware");


// PUBLIC ROUTES

router.get("/", movieController.getMovies);
router.get("/:id", movieController.getMovie);


// ADMIN / THEATER OWNER ROUTES

router.post("/", authMiddleware, adminAccess, movieController.addMovie);

router.put("/:id", authMiddleware, adminAccess, movieController.updateMovie);

router.delete("/:id", authMiddleware, adminAccess, movieController.deleteMovie);


module.exports = router;