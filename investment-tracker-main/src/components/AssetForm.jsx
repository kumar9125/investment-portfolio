import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addAsset, updateAsset } from "../redux/slices/assetsSlice";

export default function AssetForm({ onClose, asset }) {
  console.log("asset", asset);
  const dispatch = useDispatch();
  const selectedPortfolioId = useSelector(
    (state) => state.portfolios.selectedPortfolioId
  );

  const [form, setForm] = useState({
    portfolio: selectedPortfolioId || "",
    type: "stock",
    name: "",
    quantity: "",
    purchasePrice: "",
    currentPrice: "",
  });

  // Prefill if editing
  useEffect(() => {
    if (asset) {
      setForm({
        portfolio: asset.portfolio,
        type: asset.type,
        name: asset.name,
        quantity: asset.quantity,
        purchasePrice: asset.purchasePrice,
        currentPrice: asset.currentPrice || "",
      });

      
    } else {
      setForm((prev) => ({ ...prev, portfolio: selectedPortfolioId }));
    }
  }, [asset, selectedPortfolioId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.portfolio) {
      alert("Please select or create a portfolio first.");
      return;
    }

    if (asset) {
      // ✅ Update existing asset
      dispatch(updateAsset({ id: asset._id, updatedData: form }));
    } else {
      // ✅ Add new asset
      dispatch(addAsset(form));
    }
    onClose();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {asset ? "Update Asset" : "Add Asset"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="stock">Stock</option>
          <option value="crypto">Crypto</option>
          <option value="bond">Bond</option>
          <option value="real_estate">Real Estate</option>
          <option value="other">Other</option>
        </select>

        {/* Name */}
        <input
          type="text"
          name="name"
          placeholder="Asset Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />

        {/* Quantity */}
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />

        {/* Purchase Price */}
        <input
          type="number"
          name="purchasePrice"
          placeholder="Purchase Price"
          value={form.purchasePrice}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />

        
        <input
          type="number"
          name="currentPrice"
          placeholder="Current Price (optional)"
          value={form.currentPrice}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

    
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {asset ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
