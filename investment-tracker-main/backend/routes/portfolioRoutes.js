const express = require("express");
const router = express.Router();
const { createPortfolio, getPortfolios, updatePortfolio,deletePortfolio } = require("../controllers/portfolioController");
const { protect } = require("../middleware/auth"); 

router.post("/", protect, createPortfolio);
router.get("/", protect, getPortfolios);
router.put("/:id", protect, updatePortfolio);
router.delete("/:id", protect, deletePortfolio);

module.exports = router;
