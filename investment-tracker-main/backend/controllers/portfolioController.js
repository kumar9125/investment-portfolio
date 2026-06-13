const Portfolio = require("../models/Portfolio");

// ✅ Create new portfolio
exports.createPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.create({
      user: req.user._id,  
      name: req.body.name,
      description: req.body.description,
    });
    res.status(201).json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all portfolios for logged-in user
exports.getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user._id });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // ensure user owns it
      { name: req.body.name, description: req.body.description },
      { new: true, runValidators: true }
    );

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found or not authorized" });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found or not authorized" });
    }

    res.json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
