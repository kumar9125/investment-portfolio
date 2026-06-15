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

  const [errors, setErrors] = useState({});

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
    setErrors({});
  }, [asset, selectedPortfolioId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const errors = {};
    const cleanName = form.name.replace(/<[^>]*>/g, "").trim();
    if (!cleanName) {
      errors.name = "Asset name is required";
    } else if (cleanName.length > 100) {
      errors.name = "Asset name cannot exceed 100 characters";
    }

    const qty = Number(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    } else if (qty > 100000000) {
      errors.quantity = "Quantity cannot exceed 100,000,000";
    }

    const pPrice = Number(form.purchasePrice);
    if (isNaN(pPrice) || pPrice < 0) {
      errors.purchasePrice = "Purchase price cannot be negative";
    } else if (pPrice > 10000000000) {
      errors.purchasePrice = "Purchase price cannot exceed 10,000,000,000";
    }

    if (form.currentPrice !== undefined && form.currentPrice !== "") {
      const cPrice = Number(form.currentPrice);
      if (isNaN(cPrice) || cPrice < 0) {
        errors.currentPrice = "Current price cannot be negative";
      } else if (cPrice > 10000000000) {
        errors.currentPrice = "Current price cannot exceed 10,000,000,000";
      }
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.portfolio) {
      alert("Please select or create a portfolio first.");
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Normalize values
    const cleanName = form.name.replace(/<[^>]*>/g, "").trim();
    const qty = parseFloat(Number(form.quantity).toFixed(4));
    const pPrice = parseFloat(Number(form.purchasePrice).toFixed(2));
    const cPrice = form.currentPrice !== "" ? parseFloat(Number(form.currentPrice).toFixed(2)) : undefined;

    const submissionData = {
      ...form,
      name: cleanName,
      quantity: qty,
      purchasePrice: pPrice,
      currentPrice: cPrice
    };

    if (asset) {
      dispatch(updateAsset({ id: asset._id, updatedData: submissionData }));
    } else {
      dispatch(addAsset(submissionData));
    }
    onClose();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">
        {asset ? "Update Asset" : "Add Asset"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
        {/* Type */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-1">Asset Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border p-2 rounded w-full bg-gray-700 text-white border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
            <option value="bond">Bond</option>
            <option value="real_estate">Real Estate</option>
            <option value="other">Other</option>
          </select>
          {errors.type && <span className="text-red-400 text-xs mt-1 block">{errors.type}</span>}
        </div>

        {/* Name */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-1">Asset Name</label>
          <input
            type="text"
            name="name"
            placeholder="Asset Name (e.g. RELIANCE, TCS)"
            value={form.name}
            onChange={handleChange}
            className={`border p-2 rounded w-full bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? "border-red-500" : "border-gray-600"}`}
            required
          />
          {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name}</span>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-1">Quantity / Units</label>
          <input
            type="number"
            step="any"
            min="0.0001"
            name="quantity"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            className={`border p-2 rounded w-full bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.quantity ? "border-red-500" : "border-gray-600"}`}
            required
          />
          {errors.quantity && <span className="text-red-400 text-xs mt-1 block">{errors.quantity}</span>}
        </div>

        {/* Purchase Price */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-1">Purchase Price (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="purchasePrice"
            placeholder="Purchase Price in INR"
            value={form.purchasePrice}
            onChange={handleChange}
            className={`border p-2 rounded w-full bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.purchasePrice ? "border-red-500" : "border-gray-600"}`}
            required
          />
          {errors.purchasePrice && <span className="text-red-400 text-xs mt-1 block">{errors.purchasePrice}</span>}
        </div>

        {/* Current Price */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-1">Current Price (₹ - Optional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="currentPrice"
            placeholder="Current Price in INR"
            value={form.currentPrice}
            onChange={handleChange}
            className={`border p-2 rounded w-full bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.currentPrice ? "border-red-500" : "border-gray-600"}`}
          />
          {errors.currentPrice && <span className="text-red-400 text-xs mt-1 block">{errors.currentPrice}</span>}
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold transition cursor-pointer"
          >
            {asset ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
