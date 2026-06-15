const express = require("express");
const router = express.Router();
const { addTransaction, getTransactionsByPortfolio, deleteTransaction } = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");

router.post("/", protect, addTransaction);
router.get("/:portfolioId", protect, getTransactionsByPortfolio);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;
