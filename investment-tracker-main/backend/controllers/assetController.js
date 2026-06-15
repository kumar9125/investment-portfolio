const Asset = require("../models/Asset");
const Portfolio = require("../models/Portfolio");
const Transaction = require("../models/Transaction");

// ✅ Add asset to a portfolio
exports.addAsset = async (req, res) => {
  try {
    const { portfolio, type, name, quantity, purchasePrice, currentPrice } = req.body;

    // Check if portfolio exists
    const selectedPortfolio = await Portfolio.findById(portfolio);
    if (!selectedPortfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Ensure user owns this portfolio
    if (selectedPortfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this portfolio" });
    }

    const existingAsset = await Asset.findOne({ portfolio: selectedPortfolio._id, name });
    if (existingAsset) {
      return res.status(400).json({ message: "Asset already exists in this portfolio" });
    }

    const asset = await Asset.create({
      portfolio: selectedPortfolio._id,
      type,
      name,
      quantity,
      purchasePrice,
      currentPrice: currentPrice || 0
    });

    // Auto-create initial buy transaction
    await Transaction.create({
      portfolio: selectedPortfolio._id,
      assetName: name,
      assetType: type,
      type: "buy",
      quantity,
      price: purchasePrice,
      fee: 0,
      notes: "Initial holding purchase entry"
    });

    res.status(201).json({
      message: "Asset added successfully",
      asset
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get assets by portfolio
exports.getAssetsByPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Ensure user owns this portfolio
    if (portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this portfolio" });
    }

    const assets = await Asset.find({ portfolio: portfolioId });
    res.json({
      message: "Assets fetched successfully",
      assets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update asset
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const portfolio = await Portfolio.findById(asset.portfolio);
    if (!portfolio || portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this asset" });
    }

    const updatedAsset = await Asset.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Asset updated successfully",
      asset: updatedAsset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete asset
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const portfolio = await Portfolio.findById(asset.portfolio);
    if (!portfolio || portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this asset" });
    }

    await Asset.findByIdAndDelete(id);
    // Delete all transactions for this asset in this portfolio
    await Transaction.deleteMany({ portfolio: asset.portfolio, assetName: asset.name });

    res.json({ message: "Asset and associated transactions deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get asset history (aggregated from transaction history)
exports.getAssetHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const portfolio = await Portfolio.findById(asset.portfolio);
    if (!portfolio || portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this asset" });
    }

    const transactions = await Transaction.find({
      portfolio: asset.portfolio,
      assetName: asset.name
    }).sort({ date: 1 });

    if (transactions.length === 0) {
      return res.json({
        message: "No historical transaction data found",
        history: []
      });
    }

    // Group transactions by date (YYYY-MM-DD)
    const groups = {};
    for (const tx of transactions) {
      const dateStr = new Date(tx.date).toISOString().split("T")[0];
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    }

    const historyData = [];
    const sortedDates = Object.keys(groups).sort();

    for (const dateStr of sortedDates) {
      const txs = groups[dateStr];
      txs.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const prices = txs.map(t => t.price);
      const open = txs[0].price;
      const close = txs[txs.length - 1].price;
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      
      historyData.push({
        x: new Date(dateStr).getTime(),
        y: [Number(open.toFixed(2)), Number(high.toFixed(2)), Number(low.toFixed(2)), Number(close.toFixed(2))]
      });
    }

    res.json({
      message: "Asset historical data fetched successfully from transaction ledger",
      history: historyData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
