const express = require("express");
const router = express.Router();
const { createPortfolio, getPortfolios, updatePortfolio, deletePortfolio } = require("../controllers/portfolioController");
const { protect } = require("../middleware/auth"); 
const { validatePortfolio } = require("../middleware/validation");

router.post("/", protect, validatePortfolio, createPortfolio);
router.get("/", protect, getPortfolios);
router.put("/:id", protect, validatePortfolio, updatePortfolio);
router.delete("/:id", protect, deletePortfolio);

module.exports = router;
