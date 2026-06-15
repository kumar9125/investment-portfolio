const express = require("express");
const router = express.Router();
const { addTransaction, getTransactionsByPortfolio, deleteTransaction } = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");
const { validateTransaction } = require("../middleware/validation");

router.post("/", protect, validateTransaction, addTransaction);
router.get("/:portfolioId", protect, getTransactionsByPortfolio);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;
