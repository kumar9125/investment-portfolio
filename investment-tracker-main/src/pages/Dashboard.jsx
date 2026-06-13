import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolios } from "../redux/slices/portfolioSlice";
import { fetchAssets, deleteAsset, fetchAssetHistory } from "../redux/slices/assetsSlice";
import AssetForm from "../components/AssetForm";
import Chart from "react-apexcharts";

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

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      const latestPortfolio = portfolios[portfolios.length - 1];
      setSelectedPortfolio(latestPortfolio._id);
      dispatch(fetchAssets(latestPortfolio._id));
    }
  }, [portfolios, selectedPortfolio, dispatch]);

  // Set the first asset as the default selected asset for chart when assets load
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetForChart) {
      setSelectedAssetForChart(assets[0]);
    } else if (assets.length === 0) {
      setSelectedAssetForChart(null);
    }
  }, [assets, selectedAssetForChart]);

  const handlePortfolioChange = (e) => {
    const portfolioId = e.target.value;
    setSelectedPortfolio(portfolioId);
    setSelectedAssetForChart(null); // reset selected asset
    dispatch(fetchAssets(portfolioId));
  };

  const handleDeleteAsset = (id) => {
    dispatch(deleteAsset(id))
      .unwrap()
      .then(() => {
        dispatch(fetchAssets(selectedPortfolio));
        if (selectedAssetForChart && selectedAssetForChart._id === id) {
          setSelectedAssetForChart(null);
        }
      });
  };

  // Derived Metrics
  const totalValue = assets.reduce((sum, a) => sum + (a.currentPrice * a.quantity), 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.purchasePrice * a.quantity), 0);
  const totalProfit = totalValue - totalCost;
  const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  
  // Find top gainer
  let topGainer = null;
  let maxGain = -Infinity;
  assets.forEach(a => {
    const gain = a.currentPrice - a.purchasePrice;
    if (gain > maxGain) {
      maxGain = gain;
      topGainer = a;
    }
  });

  // Fetch chart data when asset selection changes
  useEffect(() => {
    if (selectedAssetForChart) {
      dispatch(fetchAssetHistory(selectedAssetForChart._id));
    }
  }, [selectedAssetForChart, dispatch]);

  const apexLineSeries = [{
    name: selectedAssetForChart ? selectedAssetForChart.name : 'Asset',
    data: assetHistory.map(d => ({ x: d.x, y: d.y[3] })) // Use Close price for Line Chart
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
        formatter: (value) => `$${value.toFixed(2)}`,
        style: { colors: '#9ca3af' }
      }
    },
    grid: { 
      borderColor: '#374151',
      strokeDashArray: 4
    },
    tooltip: { theme: 'dark' },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981', // green
          downward: '#ef4444' // red
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' ? 3 : 1,
      colors: chartType === 'line' ? ['#3b82f6'] : [] // blue line
    },
    fill: {
      type: chartType === 'line' ? 'gradient' : 'solid',
      gradient: {
        shade: 'dark',
        gradientToColors: ['#60a5fa'],
        shadeIntensity: 1,
        type: 'horizontal',
        opacityFrom: 1,
        opacityTo: 1,
      }
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

        <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-xl border border-gray-700 shadow-lg">
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

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
          </div>
          <h3 className="text-gray-400 font-semibold mb-1">Total Balance</h3>
          <p className="text-4xl font-bold text-white mb-2">${totalValue.toFixed(2)}</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1">Total Profit / Loss</h3>
          <div className="flex items-end gap-3 mb-2">
            <p className={`text-[20px] font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </p><br/>
            {/* <span className={`text-lg font-medium mb-1 ${profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%)
            </span> */}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1">Top Gainer</h3>
          {topGainer ? (
            <div>
              <p className="text-2xl font-bold text-blue-400 mb-1">{topGainer.name}</p>
              <p className="text-green-400 font-medium">
                +${(topGainer.currentPrice - topGainer.purchasePrice).toFixed(2)} per share
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic mt-2">No assets yet</p>
          )}
        </div>

        {/* <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-gray-400 font-semibold mb-1">Fake Card</h3>
          <div className="flex items-end gap-3 mb-2">
            <p className="text-4xl font-bold text-white">N/A</p>
          </div>
        </div> */}
      </div>

      {/* Chart Section */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Asset Performance</h2>
            <p className="text-gray-400 text-sm">30-day simulated historical chart</p>
          </div>

          <div className="flex bg-gray-700 rounded-lg p-1">
            <button 
              className={`px-4 py-2 rounded-md font-medium transition ${chartType === 'candlestick' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
              onClick={() => setChartType('candlestick')}
            >
              Candlestick
            </button>
            <button 
              className={`px-4 py-2 rounded-md font-medium transition ${chartType === 'line' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
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

      {/* Assets Data Grid */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h2 className="text-xl font-bold text-white">Your Holdings</h2>
          <button
            onClick={() => {
              setAssetToEdit(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg transition transform hover:-translate-y-0.5"
          >
            + Add Asset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium pl-6">Asset Name</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium text-right">Shares</th>
                <th className="p-4 font-medium text-right">Avg Price</th>
                <th className="p-4 font-medium text-right">Current Price</th>
                <th className="p-4 font-medium text-right">Gain / Loss</th>
                <th className="p-4 font-medium text-center pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {assetsLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">Loading holdings...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">No holdings found. Time to invest!</td>
                </tr>
              ) : (
                assets.map((a) => {
                  const profit = (a.currentPrice - a.purchasePrice) * a.quantity;
                  const isPositive = profit >= 0;
                  const isSelected = selectedAssetForChart && selectedAssetForChart._id === a._id;
                  
                  return (
                    <tr 
                      key={a._id} 
                      onClick={() => setSelectedAssetForChart(a)}
                      className={`hover:bg-gray-700/50 cursor-pointer transition ${isSelected ? 'bg-gray-700/80 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white">{a.name}</div>
                        <div className="text-xs text-gray-500 mt-1">Select to chart</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-700 text-blue-300 text-xs px-2 py-1 rounded border border-gray-600">
                          {a.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-300">{a.quantity}</td>
                      <td className="p-4 text-right text-gray-400">${a.purchasePrice.toFixed(2)}</td>
                      <td className="p-4 text-right font-medium text-white">${a.currentPrice.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '▲' : '▼'} ${Math.abs(profit).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6 space-x-3">
                        <button
                          className="text-gray-400 hover:text-blue-400 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetToEdit(a);
                            setShowModal(true);
                          }}
                          title="Edit"
                        >
                           ✏️
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-400 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(a._id);
                          }}
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

      {/* Add / Edit Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✖
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">
              {assetToEdit ? 'Update Asset' : 'Add New Asset'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter the stock details. Use Indian stock names like INFY, RELIANCE, TCS.
            </p>
            <AssetForm
              onClose={() => setShowModal(false)}
              asset={assetToEdit} 
            />
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
