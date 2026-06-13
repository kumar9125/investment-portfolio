const Asset = require("../models/Asset");
const Portfolio = require("../models/Portfolio");

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
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get asset history (Simulated OHLC)
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

    const days = 30; // Return a default 30-day timeframe
    const historyData = [];
    let currentPrice = asset.purchasePrice > 0 ? asset.purchasePrice : 100;
    
    // Start timestamp calculation (30 days ago)
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - days);

    // Seed the algorithmic random walk
    for (let i = 0; i < days; i++) {
      const volatility = currentPrice * 0.03; // Real-world standard deviation parameter assumption 
      const open = currentPrice + (Math.random() - 0.5) * volatility;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      
      historyData.push({
        x: new Date(currentDate).getTime(),
        y: [Number(open.toFixed(2)), Number(high.toFixed(2)), Number(low.toFixed(2)), Number(close.toFixed(2))]
      });

      currentPrice = close;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      message: "Asset historical data generated successfully",
      history: historyData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
