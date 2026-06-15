const Transaction = require("../models/Transaction");
const Asset = require("../models/Asset");
const Portfolio = require("../models/Portfolio");

// ✅ Add buy/sell transaction
exports.addTransaction = async (req, res) => {
  try {
    const { portfolioId, assetName, assetType, type, quantity, price, fee, date, notes } = req.body;

    // Verify portfolio ownership
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio || portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this portfolio" });
    }

    const qty = Number(quantity);
    const prc = Number(price);
    const txFee = Number(fee || 0);

    if (qty <= 0 || prc < 0 || txFee < 0) {
      return res.status(400).json({ message: "Invalid quantity, price, or fee value" });
    }

    // Find if asset already exists in this portfolio
    let asset = await Asset.findOne({ portfolio: portfolioId, name: assetName });

    if (type === "sell") {
      if (!asset || asset.quantity < qty) {
        return res.status(400).json({
          message: `Insufficient asset quantity to sell. Available: ${asset ? asset.quantity : 0}`
        });
      }
    }

    // Create the transaction record
    const transaction = await Transaction.create({
      portfolio: portfolioId,
      assetName,
      assetType,
      type,
      quantity: qty,
      price: prc,
      fee: txFee,
      date: date || new Date(),
      notes
    });

    if (type === "buy") {
      if (asset) {
        // Recalculate average purchase price
        const existingCost = asset.purchasePrice * asset.quantity;
        const newCost = prc * qty;
        const totalQty = asset.quantity + qty;
        const avgPrice = totalQty > 0 ? (existingCost + newCost) / totalQty : 0;

        asset.quantity = totalQty;
        asset.purchasePrice = parseFloat(avgPrice.toFixed(8));
        await asset.save();
      } else {
        // Create new asset in portfolio
        asset = await Asset.create({
          portfolio: portfolioId,
          type: assetType,
          name: assetName,
          quantity: qty,
          purchasePrice: prc,
          currentPrice: prc
        });
      }
    } else if (type === "sell") {
      // Deduct quantity
      asset.quantity = Math.max(0, asset.quantity - qty);
      await asset.save();
    }

    res.status(201).json({
      message: "Transaction added successfully",
      transaction,
      asset
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get transactions by portfolio (with automatic backfill of older assets)
exports.getTransactionsByPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    // Verify portfolio ownership
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio || portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this portfolio" });
    }

    // Fetch existing assets and transactions
    const assets = await Asset.find({ portfolio: portfolioId });
    let transactions = await Transaction.find({ portfolio: portfolioId }).sort({ date: -1 });

    // Backfill logic for legacy assets that don't have transaction records
    const backfillsToCreate = [];
    for (const asset of assets) {
      const hasTx = transactions.some(t => t.assetName.toLowerCase() === asset.name.toLowerCase());
      if (!hasTx && asset.quantity > 0) {
        backfillsToCreate.push({
          portfolio: portfolioId,
          assetName: asset.name,
          assetType: asset.type,
          type: "buy",
          quantity: asset.quantity,
          price: asset.purchasePrice,
          fee: 0,
          date: asset.createdAt || new Date(),
          notes: "Initial Asset Backfill Ledger Entry"
        });
      }
    }

    if (backfillsToCreate.length > 0) {
      console.log(`[Backfill] Synthesizing ${backfillsToCreate.length} transactions for legacy assets.`);
      const createdTxs = await Transaction.insertMany(backfillsToCreate);
      // Merge and re-sort
      transactions = [...transactions, ...createdTxs].sort((a, b) => b.date - a.date);
    }

    res.json({
      message: "Transactions fetched successfully",
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete transaction (revert holdings change)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Verify portfolio ownership
    const portfolio = await Portfolio.findById(transaction.portfolio);
    if (!portfolio || portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this transaction" });
    }

    // Revert holding modifications
    const asset = await Asset.findOne({ portfolio: transaction.portfolio, name: transaction.assetName });
    if (asset) {
      if (transaction.type === "buy") {
        // Deduct quantity
        if (asset.quantity >= transaction.quantity) {
          const remainingQty = asset.quantity - transaction.quantity;
          if (remainingQty > 0) {
            // Re-calculate previous average purchase price
            // cost = (avgPrice * totalQty - txPrice * txQty) / remainingQty
            const totalCost = asset.purchasePrice * asset.quantity;
            const txCost = transaction.price * transaction.quantity;
            const originalPrice = (totalCost - txCost) / remainingQty;
            asset.purchasePrice = parseFloat(Math.max(0, originalPrice).toFixed(8));
          }
          asset.quantity = remainingQty;
          await asset.save();
        }
      } else if (transaction.type === "sell") {
        // Add quantity back
        asset.quantity = asset.quantity + transaction.quantity;
        await asset.save();
      }
    }

    await Transaction.findByIdAndDelete(id);
    res.json({ message: "Transaction deleted and holdings reverted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
