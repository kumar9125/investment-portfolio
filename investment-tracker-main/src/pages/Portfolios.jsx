import React, { useEffect, useState, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolios, deletePortfolio } from "../redux/slices/portfolioSlice";
import PortfolioForm from "../components/PortfolioForm";

function Portfolios() {
  const dispatch = useDispatch();
  const { portfolios, loading } = useSelector((state) => state.portfolios);
  const user = useSelector((state) => state.auth.user);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchPortfolios(user._id));
    }
  }, [dispatch, user]);

  const openAddModal = () => {
    setEditingPortfolio(null);
    setModalOpen(true);
  };

  const startEdit = (portfolio) => {
    setEditingPortfolio(portfolio);
    setModalOpen(true);
  };

  const deleteHandler = (id) => {
    if (window.confirm("Are you sure you want to delete this portfolio?")) {
      dispatch(deletePortfolio(id));
      // Re-fetch handled automatically if delete is optimistic, but safe to fetch after if needed.
    }
  };

  const onSave = () => {
    setEditingPortfolio(null);
    setModalOpen(false);
    if (user?._id) {
      dispatch(fetchPortfolios(user._id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
              Your Portfolios
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage and track your distinct investment strategies</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>➕</span> Add Portfolio
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-48">
            <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        )}

        {/* Portfolio Cards Grid */}
        {!loading && portfolios.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portfolios.map((p) => (
              <div
                key={p._id}
                className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 transition transform hover:-translate-y-1 hover:shadow-2xl hover:border-gray-600 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-teal-400 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 truncate">
                    {p.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {p.description || "No description provided."}
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => startEdit(p)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg text-sm font-medium transition duration-200 border border-transparent hover:border-gray-500"
                  >
                     Edit
                  </button>
                  <button
                    onClick={() => deleteHandler(p._id)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-2 rounded-lg text-sm font-medium transition duration-200 border border-red-500/30"
                  >
                     Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && portfolios.length === 0 && (
          <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 rounded-2xl p-10 mt-6 shadow-lg text-center">
            <div className="text-6xl mb-4 opacity-50">📂</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Portfolios Found</h3>
            <p className="text-gray-400 mb-6 font-medium">Create your first portfolio to start tracking your assets!</p>
            <button
               onClick={openAddModal}
               className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition"
            >
              Create Now
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Portfolio Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6 pr-6">
              {editingPortfolio ? "Update Portfolio" : "Create New Portfolio"}
            </h2>

            <PortfolioForm existingPortfolio={editingPortfolio} onSave={onSave} />
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default memo(Portfolios);
