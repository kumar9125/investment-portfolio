const express = require("express");
const router = express.Router();
const { addToWatchlist, getWatchlist, removeFromWatchlist } = require("../controllers/watchlistController");
const { protect } = require("../middleware/auth");

router.post("/", protect, addToWatchlist);
router.get("/", protect, getWatchlist);
router.delete("/:id", protect, removeFromWatchlist);

module.exports = router;
