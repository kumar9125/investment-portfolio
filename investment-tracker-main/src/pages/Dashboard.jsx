import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolios } from "../redux/slices/portfolioSlice";
import { fetchAssets, deleteAsset, fetchAssetHistory } from "../redux/slices/assetsSlice";
import AssetForm from "../components/AssetForm";
import Chart from "react-apexcharts";
import axiosInstance from "../api/axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const dispatch = useDispatch();

  const { portfolios, loading: portfoliosLoading } = useSelector(
    (state) => state.portfolios
  );
  const { assets, assetHistory, historyLoading, loading: assetsLoading } = useSelector(
    (state) => state.assets
  );

  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null); 
  const [chartType, setChartType] = useState('candlestick');
  const [selectedAssetForChart, setSelectedAssetForChart] = useState(null);

  // New Upgrade State Variables
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "transactions", "analytics", "watchlist"
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Search & Filter state for holdings
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name"); // "name", "value", "profit", "qty"
  const [sortOrder, setSortOrder] = useState("asc");

  // New Transaction Form state
  const [newTxForm, setNewTxForm] = useState({
    assetName: "",
    assetType: "stock",
    type: "buy",
    quantity: "",
    price: "",
    fee: "0",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // New Watchlist Form state
  const [newWatchlistForm, setNewWatchlistForm] = useState({
    symbol: "",
    name: "",
    type: "stock"
  });

  // Fetch portfolios on load
  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  // Handle default selection when portfolios load
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      const latestPortfolio = portfolios[portfolios.length - 1];
      setSelectedPortfolio(latestPortfolio._id);
      dispatch(fetchAssets(latestPortfolio._id));
    }
  }, [portfolios, selectedPortfolio, dispatch]);

  // Default asset selection for chart
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetForChart) {
      setSelectedAssetForChart(assets[0]);
    } else if (assets.length === 0) {
      setSelectedAssetForChart(null);
    }
  }, [assets, selectedAssetForChart]);

  // Fetch transactional ledger and watchlist when active tab or portfolio changes
  useEffect(() => {
    if (selectedPortfolio) {
      if (activeTab === "transactions") {
        fetchTransactionsData();
      } else if (activeTab === "watchlist") {
        fetchWatchlistData();
      }
    }
  }, [selectedPortfolio, activeTab]);

  // Fetch chart data when asset selection changes
  useEffect(() => {
    if (selectedAssetForChart) {
      dispatch(fetchAssetHistory(selectedAssetForChart._id));
    }
  }, [selectedAssetForChart, dispatch]);

  const fetchTransactionsData = async () => {
    if (!selectedPortfolio) return;
    try {
      setTxLoading(true);
      const res = await axiosInstance.get(`/transactions/${selectedPortfolio}`);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchWatchlistData = async () => {
    try {
      setWatchlistLoading(true);
      const res = await axiosInstance.get("/watchlist");
      setWatchlist(res.data.watchlist || []);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handlePortfolioChange = (e) => {
    const portfolioId = e.target.value;
    setSelectedPortfolio(portfolioId);
    setSelectedAssetForChart(null); 
    dispatch(fetchAssets(portfolioId));
  };

  const handleDeleteAsset = (id) => {
    if (window.confirm("Are you sure you want to remove this holding? This will also remove associated transactions.")) {
      dispatch(deleteAsset(id))
        .unwrap()
        .then(() => {
          dispatch(fetchAssets(selectedPortfolio));
          if (selectedAssetForChart && selectedAssetForChart._id === id) {
            setSelectedAssetForChart(null);
          }
          if (activeTab === "transactions") fetchTransactionsData();
        });
    }
  };

  // Safe Metric Computations
  const totalValue = useMemo(() => {
    return assets.reduce((sum, a) => {
      const currentPrice = typeof a.currentPrice === "number" && isFinite(a.currentPrice) ? a.currentPrice : 0;
      const quantity = typeof a.quantity === "number" && isFinite(a.quantity) ? a.quantity : 0;
      return sum + (currentPrice * quantity);
    }, 0);
  }, [assets]);

  const totalCost = useMemo(() => {
    return assets.reduce((sum, a) => {
      const purchasePrice = typeof a.purchasePrice === "number" && isFinite(a.purchasePrice) ? a.purchasePrice : 0;
      const quantity = typeof a.quantity === "number" && isFinite(a.quantity) ? a.quantity : 0;
      return sum + (purchasePrice * quantity);
    }, 0);
  }, [assets]);

  const totalProfit = useMemo(() => totalValue - totalCost, [totalValue, totalCost]);
  const profitPercentage = useMemo(() => totalCost > 0 ? (totalProfit / totalCost) * 100 : 0, [totalProfit, totalCost]);

  // Realized gains computation via transaction list
  const realizedGains = useMemo(() => {
    let realized = 0;
    const symbolBuys = {}; 
    const chronoTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    chronoTxs.forEach(tx => {
      const symbol = tx.assetName.toUpperCase();
      if (!symbolBuys[symbol]) symbolBuys[symbol] = [];

      if (tx.type === 'buy') {
        symbolBuys[symbol].push({ qty: tx.quantity, price: tx.price });
      } else if (tx.type === 'sell') {
        let sellQty = tx.quantity;
        const currentHoldings = symbolBuys[symbol];
        const totalQty = currentHoldings.reduce((sum, h) => sum + h.qty, 0);
        const totalCost = currentHoldings.reduce((sum, h) => sum + (h.qty * h.price), 0);
        const avgPrice = totalQty > 0 ? (totalCost / totalQty) : 0;

        realized += (sellQty * (tx.price - avgPrice)) - (tx.fee || 0);

        let tempSell = sellQty;
        for (let i = 0; i < currentHoldings.length; i++) {
          if (currentHoldings[i].qty >= tempSell) {
            currentHoldings[i].qty -= tempSell;
            break;
          } else {
            tempSell -= currentHoldings[i].qty;
            currentHoldings[i].qty = 0;
          }
        }
      }
    });
    return isFinite(realized) ? realized : 0;
  }, [transactions]);

  // Top Gainer and Performer
  const topGainer = useMemo(() => {
    let topG = null;
    let maxGain = -Infinity;
    assets.forEach((a) => {
      const gain = a.currentPrice - a.purchasePrice;
      if (isFinite(gain) && gain > maxGain) {
        maxGain = gain;
        topG = a;
      }
    });
    return topG;
  }, [assets]);

  // Simulated Day Change (industry standard mock)
  const dayChangeValue = useMemo(() => {
    return assets.reduce((sum, a) => {
      const hash = a.name.charCodeAt(0) % 5;
      const pct = (hash - 2) * 0.005; // -1% to +1% change
      return sum + (a.currentPrice * a.quantity * pct);
    }, 0);
  }, [assets]);
  
  const dayChangePercentage = totalValue > 0 ? (dayChangeValue / totalValue) * 100 : 0;

  // Search, Filter & Sort Holdings
  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || a.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === "value") {
          valA = a.currentPrice * a.quantity;
          valB = b.currentPrice * b.quantity;
        } else if (sortBy === "profit") {
          valA = (a.currentPrice - a.purchasePrice) * a.quantity;
          valB = (b.currentPrice - b.purchasePrice) * b.quantity;
        } else {
          valA = a.quantity;
          valB = b.quantity;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [assets, searchQuery, typeFilter, sortBy, sortOrder]);

  // Risk and asset splits
  const assetClassSplit = useMemo(() => {
    const split = { stock: 0, crypto: 0, bond: 0, real_estate: 0, other: 0 };
    assets.forEach(a => {
      const val = a.currentPrice * a.quantity;
      if (split[a.type] !== undefined) split[a.type] += val;
    });
    return split;
  }, [assets]);

  const concentrationAlerts = useMemo(() => {
    const alerts = [];
    assets.forEach(a => {
      const val = a.currentPrice * a.quantity;
      const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
      if (pct > 25) {
        alerts.push({
          name: a.name,
          pct: pct.toFixed(1),
          message: `⚠️ Overexposure: ${a.name} represents ${pct.toFixed(1)}% of your portfolio. Consider diversifying to mitigate risk.`
        });
      }
    });
    return alerts;
  }, [assets, totalValue]);

  // Chart options/series for Overview Tab
  const apexLineSeries = [{
    name: selectedAssetForChart ? selectedAssetForChart.name : 'Asset',
    data: assetHistory.map(d => ({ x: d.x, y: d.y[3] }))
  }];

  const apexCandleSeries = [{
    name: selectedAssetForChart ? selectedAssetForChart.name : 'Asset',
    data: assetHistory
  }];

  const apexOptions = {
    chart: {
      type: chartType,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    theme: { mode: 'dark' },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#9ca3af' } },
      axisBorder: { color: '#374151' },
      axisTicks: { color: '#374151' }
    },
    yaxis: {
      labels: {
        formatter: (value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        style: { colors: '#9ca3af' }
      }
    },
    grid: { borderColor: '#374151', strokeDashArray: 4 },
    tooltip: { theme: 'dark' },
    plotOptions: {
      candlestick: { colors: { upward: '#10b981', downward: '#ef4444' } }
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' ? 3 : 1,
      colors: chartType === 'line' ? ['#3b82f6'] : []
    }
  };

  // Benchmark return simulation
  const benchmarkChartData = useMemo(() => {
    const portfolioReturnSeries = [];
    const niftySeries = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 30);

    let portfolioCum = 100;
    let niftyCum = 100;

    for (let i = 0; i < 30; i++) {
      const time = currentDate.getTime();
      
      // Seed random walk comparisons
      portfolioCum += (Math.random() - 0.45) * 1.5; 
      niftyCum += (Math.random() - 0.48) * 1.2;

      portfolioReturnSeries.push({ x: time, y: Number(portfolioCum.toFixed(2)) });
      niftySeries.push({ x: time, y: Number(niftyCum.toFixed(2)) });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return [
      { name: "Your Portfolio", data: portfolioReturnSeries },
      { name: "Nifty 50 Index (Bench)", data: niftySeries }
    ];
  }, [assets]);

  // Watchlist handlers
  const handleAddWatchlist = async (e) => {
    e.preventDefault();
    if (!newWatchlistForm.symbol || !newWatchlistForm.name) return;
    try {
      await axiosInstance.post("/watchlist", newWatchlistForm);
      fetchWatchlistData();
      setNewWatchlistForm({ symbol: "", name: "", type: "stock" });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRemoveWatchlist = async (id) => {
    try {
      await axiosInstance.delete(`/watchlist/${id}`);
      fetchWatchlistData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Transaction Ledger handlers
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTxForm.assetName || !newTxForm.quantity || !newTxForm.price) return;
    try {
      await axiosInstance.post("/transactions", {
        portfolioId: selectedPortfolio,
        ...newTxForm
      });
      dispatch(fetchAssets(selectedPortfolio));
      fetchTransactionsData();
      setShowTxModal(false);
      setNewTxForm({
        assetName: "",
        assetType: "stock",
        type: "buy",
        quantity: "",
        price: "",
        fee: "0",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction ledger entry? Holdings will be reverted.")) {
      try {
        await axiosInstance.delete(`/transactions/${id}`);
        dispatch(fetchAssets(selectedPortfolio));
        fetchTransactionsData();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    }
  };

  // Report Export logic
  const handleExport = (format) => {
    const portfolioName = portfolios.find(p => p._id === selectedPortfolio)?.name || "Portfolio";
    setExportLoading(true);
    
    setTimeout(() => {
      try {
        if (format === "pdf") {
          exportToPDF(portfolioName);
        } else if (format === "excel") {
          exportToExcel(portfolioName);
        } else {
          exportToPDF(portfolioName);
          exportToExcel(portfolioName);
        }
        setShowExportModal(false);
      } catch (err) {
        alert("Failed to export report: " + err.message);
      } finally {
        setExportLoading(false);
      }
    }, 1200);
  };

  const exportToPDF = (portfolioName) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-IN');

    // Title / Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(20, 184, 166); 
    doc.text("Investment Portfolio Report", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Portfolio Name: ${portfolioName}`, 14, 28);
    doc.text(`Report Date: ${dateStr}`, 14, 34);
    doc.text(`Valuation Currency: INR (₹)`, 14, 40);

    // Summary Section
    doc.autoTable({
      startY: 46,
      head: [['Key Metrics Summary', 'Amount / Performance']],
      body: [
        ['Total Invested Cost', `INR ${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Total Current Value', `INR ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Absolute Return (P&L)', `INR ${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Percentage Gain / Loss', `${profitPercentage.toFixed(2)}%`],
        ['Realized Profits / Capital Gains', `INR ${realizedGains.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255] }
    });

    // Holdings Grid
    const holdingsBody = assets.map(a => [
      a.name,
      a.type.toUpperCase(),
      a.quantity.toString(),
      `INR ${a.purchasePrice.toLocaleString('en-IN')}`,
      `INR ${a.currentPrice.toLocaleString('en-IN')}`,
      `INR ${(a.currentPrice * a.quantity).toLocaleString('en-IN')}`,
      `${(((a.currentPrice - a.purchasePrice) / (a.purchasePrice || 1)) * 100).toFixed(2)}%`
    ]);

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text("Current Holdings Allocation", 14, doc.lastAutoTable.finalY + 12);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Holding', 'Type', 'Quantity', 'Avg Price', 'Current Price', 'Current Value', 'Gain %']],
      body: holdingsBody,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Transactions Grid
    if (transactions.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text("Transaction History Ledger", 14, 20);

      const txBody = transactions.map(t => [
        t.assetName,
        t.assetType.toUpperCase(),
        t.type.toUpperCase(),
        t.quantity.toString(),
        `INR ${t.price.toLocaleString('en-IN')}`,
        `INR ${t.fee.toLocaleString('en-IN')}`,
        new Date(t.date).toLocaleDateString('en-IN'),
        t.notes || ""
      ]);

      doc.autoTable({
        startY: 26,
        head: [['Asset', 'Type', 'Action', 'Qty', 'Price', 'Fee', 'Date', 'Notes']],
        body: txBody,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [75, 85, 99] }
      });
    }

    doc.save(`Portfolio_Report_${portfolioName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = (portfolioName) => {
    // Summary Tab
    const summaryData = [
      ["PORTFOLIO SUMMARY REPORT"],
      [],
      ["Portfolio Name", portfolioName],
      ["Date Generated", new Date().toLocaleDateString('en-IN')],
      [],
      ["Metric", "Value (INR / %)"],
      ["Total Invested Cost", totalCost],
      ["Total Current Value", totalValue],
      ["Absolute Gain/Loss", totalProfit],
      ["Percentage Return", `${profitPercentage.toFixed(2)}%`],
      ["Realized Gains", realizedGains]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Holdings Tab
    const holdingsData = [
      ["Asset Name", "Asset Type", "Quantity", "Average Purchase Price (INR)", "Current Price (INR)", "Current Value (INR)", "Unrealized P&L (INR)", "Gain %"],
      ...assets.map(a => [
        a.name,
        a.type.toUpperCase(),
        a.quantity,
        a.purchasePrice,
        a.currentPrice,
        a.currentPrice * a.quantity,
        (a.currentPrice - a.purchasePrice) * a.quantity,
        ((a.currentPrice - a.purchasePrice) / (a.purchasePrice || 1)) * 100
      ])
    ];
    const wsHoldings = XLSX.utils.aoa_to_sheet(holdingsData);

    // Transactions Tab
    const txData = [
      ["Asset Name", "Asset Type", "Action Type", "Quantity", "Price (INR)", "Fee (INR)", "Transaction Date", "Notes"],
      ...transactions.map(t => [
        t.assetName,
        t.assetType.toUpperCase(),
        t.type.toUpperCase(),
        t.quantity,
        t.price,
        t.fee,
        new Date(t.date).toLocaleDateString('en-IN'),
        t.notes || ""
      ])
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(txData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    XLSX.utils.book_append_sheet(wb, wsHoldings, "Holdings");
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Transactions Ledger");

    XLSX.writeFile(wb, `Portfolio_Report_${portfolioName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc for numeric, asc for name
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      
      {/* Header & Portfolio Selection */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Portfolio Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track your investments in real-time</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedPortfolio && (
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              📥 Download Report
            </button>
          )}

          <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700 shadow-lg">
            <label className="text-sm font-semibold text-gray-300 ml-2">Portfolio:</label>
            <select
              className="bg-gray-700 text-white border-0 outline-none p-2 rounded-lg cursor-pointer hover:bg-gray-600 transition"
              value={selectedPortfolio || ""}
              onChange={handlePortfolioChange}
              disabled={portfoliosLoading}
            >
              {portfoliosLoading ? (
                <option>Loading...</option>
              ) : (
                portfolios.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Balance */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1 text-sm">Portfolio Net Worth</h3>
          <p className="text-3xl font-bold text-white mb-2">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="text-xs text-gray-400">Total Invested: ₹{totalCost.toLocaleString('en-IN')}</span>
        </div>

        {/* Profit */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1 text-sm">Total Profit / Loss</h3>
          <p className={`text-3xl font-bold mb-2 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : '-'}₹{Math.abs(totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className={`text-xs font-semibold ${profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profitPercentage >= 0 ? '▲' : '▼'} {profitPercentage.toFixed(2)}% Overall
          </span>
        </div>

        {/* Realized Profits */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1 text-sm">Realized Capital Gains</h3>
          <p className={`text-3xl font-bold mb-2 ${realizedGains >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
            ₹{realizedGains.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-gray-400">Net of fees and sell events</span>
        </div>

        {/* Daily Return */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1 text-sm">Day's Return</h3>
          <p className={`text-3xl font-bold mb-2 ${dayChangeValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {dayChangeValue >= 0 ? '+' : '-'}₹{Math.abs(dayChangeValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className={`text-xs font-semibold ${dayChangePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {dayChangePercentage >= 0 ? '▲' : '▼'} {dayChangePercentage.toFixed(2)}% Today
          </span>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-gray-700 mb-6 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 font-semibold transition border-b-2 outline-none whitespace-nowrap cursor-pointer ${activeTab === "overview" ? "border-teal-500 text-teal-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
        >
          📊 Overview & Holdings
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-5 py-3 font-semibold transition border-b-2 outline-none whitespace-nowrap cursor-pointer ${activeTab === "transactions" ? "border-teal-500 text-teal-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
        >
          📜 Transaction Ledger
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-3 font-semibold transition border-b-2 outline-none whitespace-nowrap cursor-pointer ${activeTab === "analytics" ? "border-teal-500 text-teal-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
        >
          ⚖️ Risk & Analytics
        </button>
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`px-5 py-3 font-semibold transition border-b-2 outline-none whitespace-nowrap cursor-pointer ${activeTab === "watchlist" ? "border-teal-500 text-teal-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
        >
          👁️ Watchlist
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          
          {/* Chart Section */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Asset Performance</h2>
                <p className="text-gray-400 text-sm">30-day simulated historical chart</p>
              </div>

              <div className="flex bg-gray-700 rounded-lg p-1">
                <button 
                  className={`px-4 py-2 rounded-md font-medium transition cursor-pointer ${chartType === 'candlestick' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
                  onClick={() => setChartType('candlestick')}
                >
                  Candlestick
                </button>
                <button 
                  className={`px-4 py-2 rounded-md font-medium transition cursor-pointer ${chartType === 'line' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
                  onClick={() => setChartType('line')}
                >
                  Line
                </button>
              </div>
            </div>

            <div className="w-full h-80 relative">
              {assetsLoading ? (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                 </div>
              ) : assets.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                  No assets in this portfolio. Add one below to see the chart!
                </div>
              ) : !selectedAssetForChart ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                  Select an asset from the table below to view its chart.
                </div>
              ) : (
                <Chart 
                  options={apexOptions} 
                  series={chartType === 'candlestick' ? apexCandleSeries : apexLineSeries} 
                  type={chartType} 
                  height="100%" 
                />
              )}
            </div>
          </div>

          {/* Holdings Data Grid */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center bg-gray-800 gap-4">
              <h2 className="text-xl font-bold text-white">Your Holdings</h2>
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none w-full sm:w-48 text-sm focus:ring-2 focus:ring-blue-500"
                />

                {/* Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none text-sm cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="stock">Stocks</option>
                  <option value="crypto">Crypto</option>
                  <option value="bond">Bonds</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Others</option>
                </select>

                <button
                  onClick={() => {
                    setAssetToEdit(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white px-5 py-2 rounded-lg font-semibold shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
                >
                  + Add Asset
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6 font-semibold cursor-pointer select-none" onClick={() => handleSort("name")}>
                      Asset Name {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold text-right cursor-pointer select-none" onClick={() => handleSort("qty")}>
                      Shares {sortBy === "qty" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 font-semibold text-right">Avg Price</th>
                    <th className="p-4 font-semibold text-right">Current Price</th>
                    <th className="p-4 font-semibold text-right cursor-pointer select-none" onClick={() => handleSort("value")}>
                      Net Value {sortBy === "value" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 font-semibold text-right">Allocation %</th>
                    <th className="p-4 font-semibold text-right cursor-pointer select-none" onClick={() => handleSort("profit")}>
                      Gain / Loss {sortBy === "profit" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 font-semibold text-center pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {assetsLoading ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400">Loading holdings...</td>
                    </tr>
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400">No holdings match your search filters.</td>
                    </tr>
                  ) : (
                    filteredAssets.map((a) => {
                      const netVal = a.currentPrice * a.quantity;
                      const profit = (a.currentPrice - a.purchasePrice) * a.quantity;
                      const isPositive = profit >= 0;
                      const isSelected = selectedAssetForChart && selectedAssetForChart._id === a._id;
                      const allocPct = totalValue > 0 ? (netVal / totalValue) * 100 : 0;
                      
                      return (
                        <tr 
                          key={a._id} 
                          onClick={() => setSelectedAssetForChart(a)}
                          className={`hover:bg-gray-700/50 cursor-pointer transition ${isSelected ? 'bg-gray-700/80 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                        >
                          <td className="p-4 pl-6 font-bold text-white">{a.name}</td>
                          <td className="p-4">
                            <span className="bg-gray-700 text-blue-300 text-xs px-2 py-0.5 rounded border border-gray-600">
                              {a.type}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium text-gray-300">{a.quantity}</td>
                          <td className="p-4 text-right text-gray-400">₹{a.purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-medium text-white">₹{a.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-bold text-white">₹{netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right text-teal-400 font-semibold">{allocPct.toFixed(1)}%</td>
                          <td className="p-4 text-right">
                            <span className={`inline-flex items-center gap-1 font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '▲' : '▼'} ₹{Math.abs(profit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-4 text-center pr-6 space-x-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="text-gray-400 hover:text-blue-400 transition cursor-pointer"
                              onClick={() => {
                                setAssetToEdit(a);
                                setShowModal(true);
                              }}
                              title="Edit"
                            >
                               ✏️
                            </button>
                            <button
                              className="text-gray-400 hover:text-red-400 transition cursor-pointer"
                              onClick={() => handleDeleteAsset(a._id)}
                              title="Remove"
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <div>
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
              <p className="text-sm text-gray-400 mt-1">Audit trail of all portfolio buy and sell events</p>
            </div>
            <button
              onClick={() => setShowTxModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition cursor-pointer"
            >
              + Add Transaction
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6 font-semibold">Asset Name</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold text-right">Quantity</th>
                  <th className="p-4 font-semibold text-right">Price</th>
                  <th className="p-4 font-semibold text-right">Tx Fee</th>
                  <th className="p-4 font-semibold text-center">Date</th>
                  <th className="p-4 font-semibold">Notes</th>
                  <th className="p-4 font-semibold text-center pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {txLoading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-400">Loading transaction logs...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-400">No transaction logs available.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-700/30">
                      <td className="p-4 pl-6 font-bold text-white">{tx.assetName}</td>
                      <td className="p-4">
                        <span className="bg-gray-700 text-blue-300 text-xs px-2 py-0.5 rounded border border-gray-600">
                          {tx.assetType}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-xs ${tx.type === "buy" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-300">{tx.quantity}</td>
                      <td className="p-4 text-right text-white">₹{tx.price.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-gray-400">₹{tx.fee.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-center text-gray-400">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-gray-400 truncate max-w-[150px]" title={tx.notes}>{tx.notes || "-"}</td>
                      <td className="p-4 text-center pr-6">
                        <button
                          onClick={() => handleDeleteTransaction(tx._id)}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                          title="Remove Transaction"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Split Donut */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Asset Class Allocation</h3>
            {assets.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">No assets available.</div>
            ) : (
              <Chart
                options={{
                  chart: { background: 'transparent' },
                  theme: { mode: 'dark' },
                  labels: ["Stocks", "Crypto", "Bonds", "Real Estate", "Others"],
                  legend: { position: 'bottom' },
                  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6b7280']
                }}
                series={[
                  assetClassSplit.stock,
                  assetClassSplit.crypto,
                  assetClassSplit.bond,
                  assetClassSplit.real_estate,
                  assetClassSplit.other
                ]}
                type="donut"
                height={300}
              />
            )}
          </div>

          {/* Benchmark Comparison */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold mb-1">Benchmark Comparison</h3>
            <p className="text-xs text-gray-400 mb-6">Normalized performance relative to Nifty 50 Index (Base 100)</p>
            <Chart
              options={{
                chart: { background: 'transparent', toolbar: { show: false } },
                theme: { mode: 'dark' },
                xaxis: { type: 'datetime', labels: { style: { colors: '#9ca3af' } } },
                yaxis: { labels: { formatter: (v) => `${v.toFixed(0)}%` } },
                colors: ['#3b82f6', '#10b981'],
                stroke: { width: 3, curve: 'smooth' }
              }}
              series={benchmarkChartData}
              type="line"
              height={280}
            />
          </div>

          {/* Risk Alerts list */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Risk Audit & Concentration Analysis</h3>
            {concentrationAlerts.length === 0 ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-medium">
                ✅ Your portfolio is well-diversified. No single asset exceeds a 25% allocation risk threshold.
              </div>
            ) : (
              <div className="space-y-3">
                {concentrationAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-xl text-sm font-medium">
                    {alert.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "watchlist" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add form */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl h-fit">
            <h3 className="text-xl font-bold mb-4 text-white">Watch Asset</h3>
            <form onSubmit={handleAddWatchlist} className="space-y-4 text-gray-900">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1">Symbol (e.g. INFY, ETH)</label>
                <input
                  type="text"
                  required
                  placeholder="RELIANCE"
                  value={newWatchlistForm.symbol}
                  onChange={(e) => setNewWatchlistForm({ ...newWatchlistForm, symbol: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="Reliance Industries"
                  value={newWatchlistForm.name}
                  onChange={(e) => setNewWatchlistForm({ ...newWatchlistForm, name: e.target.value })}
                  maxLength={100}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1">Type</label>
                <select
                  value={newWatchlistForm.type}
                  onChange={(e) => setNewWatchlistForm({ ...newWatchlistForm, type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                  <option value="bond">Bond</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold py-2.5 rounded-lg shadow-lg transition cursor-pointer"
              >
                + Add Symbol
              </button>
            </form>
          </div>

          {/* List watchlist */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Tracked Assets</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6 font-semibold">Symbol</th>
                    <th className="p-4 font-semibold">Asset Name</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold text-right">Target Price (Simulated)</th>
                    <th className="p-4 font-semibold text-center pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {watchlistLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">Loading watchlist...</td>
                    </tr>
                  ) : watchlist.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">No assets watched yet.</td>
                    </tr>
                  ) : (
                    watchlist.map((item) => {
                      const mockTargetPrice = (item.symbol.charCodeAt(0) % 10) * 150 + 200;
                      return (
                        <tr key={item._id} className="hover:bg-gray-700/30">
                          <td className="p-4 pl-6 font-bold text-white">{item.symbol}</td>
                          <td className="p-4 text-gray-300">{item.name}</td>
                          <td className="p-4">
                            <span className="bg-gray-700 text-teal-300 text-xs px-2 py-0.5 rounded border border-gray-600">
                              {item.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium text-white">₹{mockTargetPrice.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-center pr-6">
                            <button
                              onClick={() => handleRemoveWatchlist(item._id)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              title="Delete symbol"
                            >
                              ❌ Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              ✖
            </button>
            <AssetForm
              onClose={() => {
                setShowModal(false);
                dispatch(fetchAssets(selectedPortfolio));
                if (activeTab === "transactions") fetchTransactionsData();
              }}
              asset={assetToEdit} 
            />
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <button 
              onClick={() => setShowTxModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer font-bold"
            >
              ✖
            </button>
            <h3 className="text-2xl font-bold mb-6 text-white">Log Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4 text-gray-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INFY, TCS"
                    value={newTxForm.assetName}
                    onChange={(e) => setNewTxForm({ ...newTxForm, assetName: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Asset Type</label>
                  <select
                    value={newTxForm.assetType}
                    onChange={(e) => setNewTxForm({ ...newTxForm, assetType: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white cursor-pointer"
                  >
                    <option value="stock">Stock</option>
                    <option value="crypto">Crypto</option>
                    <option value="bond">Bond</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Type</label>
                  <select
                    value={newTxForm.type}
                    onChange={(e) => setNewTxForm({ ...newTxForm, type: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white cursor-pointer"
                  >
                    <option value="buy">BUY</option>
                    <option value="sell">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newTxForm.date}
                    onChange={(e) => setNewTxForm({ ...newTxForm, date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="10"
                    value={newTxForm.quantity}
                    onChange={(e) => setNewTxForm({ ...newTxForm, quantity: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1200"
                    value={newTxForm.price}
                    onChange={(e) => setNewTxForm({ ...newTxForm, price: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="20"
                    value={newTxForm.fee}
                    onChange={(e) => setNewTxForm({ ...newTxForm, fee: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Brokerage trade ledger notes"
                  value={newTxForm.notes}
                  onChange={(e) => setNewTxForm({ ...newTxForm, notes: e.target.value })}
                  maxLength={200}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold transition cursor-pointer"
                >
                  Log Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              ✖
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Generate Reports</h3>
            <p className="text-gray-400 text-sm mb-6">Choose your preferred format to export holdings and trade histories locally.</p>
            
            <div className="flex flex-col gap-3">
              <button
                disabled={exportLoading}
                onClick={() => handleExport("pdf")}
                className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                📄 Download PDF Report
              </button>
              
              <button
                disabled={exportLoading}
                onClick={() => handleExport("excel")}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                 Excel Document (.xlsx)
              </button>

              <button
                disabled={exportLoading}
                onClick={() => handleExport("both")}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer border border-gray-600"
              >
                📥 Download Both Formats
              </button>
            </div>
            
            {exportLoading && (
              <div className="mt-4 text-center text-teal-400 font-medium text-xs animate-pulse">
                Generating sheets, rendering document tables...
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
