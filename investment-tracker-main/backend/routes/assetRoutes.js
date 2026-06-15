const express = require("express");
const router = express.Router();
const { addAsset, getAssetsByPortfolio, updateAsset, deleteAsset, getAssetHistory } = require("../controllers/assetController");
const { protect } = require("../middleware/auth");
const { validateAsset } = require("../middleware/validation");

router.post("/", protect, validateAsset, addAsset);                  
router.get("/:portfolioId", protect, getAssetsByPortfolio); 
router.put("/:id", protect, validateAsset, updateAsset);             
router.delete("/:id", protect, deleteAsset);         
router.get("/:id/history", protect, getAssetHistory);

module.exports = router;
