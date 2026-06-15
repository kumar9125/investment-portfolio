const Watchlist = require("../models/Watchlist");

// ✅ Add item to user watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { symbol, name, type } = req.body;
    const userId = req.user._id;

    if (!symbol || !name) {
      return res.status(400).json({ message: "Symbol and Name are required" });
    }

    // Check if symbol is already in watchlist
    const existing = await Watchlist.findOne({ user: userId, symbol: symbol.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Asset is already in your watchlist" });
    }

    const item = await Watchlist.create({
      user: userId,
      symbol: symbol.toUpperCase(),
      name,
      type: type || "stock"
    });

    res.status(201).json({
      message: "Asset added to watchlist",
      watchlist: item
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Asset is already in your watchlist" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get user watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const items = await Watchlist.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      message: "Watchlist fetched successfully",
      watchlist: items
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Remove from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Watchlist.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    // Ensure user owns this item
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this watchlist" });
    }

    await Watchlist.findByIdAndDelete(id);
    res.json({ message: "Asset removed from watchlist successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
