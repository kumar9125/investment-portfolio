import React, { useEffect, useState, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPortfolio, updatePortfolio } from "../redux/slices/portfolioSlice";

function PortfolioForm({ existingPortfolio = null, onSave }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});


  
  useEffect(() => {
    if (existingPortfolio) {
      setName(existingPortfolio.name);
      setDescription(existingPortfolio.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [existingPortfolio]);

  const handlePasteText = (e) => {
    const text = e.clipboardData.getData("text");
    if (/<[^>]*>/g.test(text)) {
      e.preventDefault();
      alert("HTML tags are not allowed.");
    }
  };

  const validate = () => {
    const errors = {};
    const cleanName = name.replace(/<[^>]*>/g, "").trim();
    if (!cleanName) {
      errors.name = "Name is required";
    } else if (cleanName.length > 100) {
      errors.name = "Portfolio name cannot exceed 100 characters";
    }

    const cleanDescription = description.replace(/<[^>]*>/g, "").trim();
    if (cleanDescription.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const cleanName = name.replace(/<[^>]*>/g, "").trim();
    const cleanDescription = description.replace(/<[^>]*>/g, "").trim();

    const portfolioData = {
      user: user?._id,
      name: cleanName,
      description: cleanDescription || undefined,
    };

    if (existingPortfolio) {
      dispatch(updatePortfolio({ id: existingPortfolio._id, portfolioData }))
        .then(() => onSave && onSave())
        .catch((err) => console.log(err));
    } else {
      dispatch(addPortfolio(portfolioData))
        .then(() => {
          setName("");
          setDescription("");
          setErrors({});
          onSave && onSave();
        })
        .catch((err) => console.log(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-gray-300 font-medium mb-1">Name*</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPaste={handlePasteText}
          maxLength={100}
          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? "border-red-500" : "border-gray-600"}`}
          required
        />
        {errors.name && <div className="text-red-400 text-sm mt-1">{errors.name}</div>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-300 font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onPaste={handlePasteText}
          maxLength={500}
          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] ${errors.description ? "border-red-500" : "border-gray-600"}`}
          placeholder="(Optional)"
        />
        {errors.description && <div className="text-red-400 text-sm mt-1">{errors.description}</div>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white py-2.5 rounded-lg font-semibold shadow-md transition"
      >
        {existingPortfolio ? "Update Portfolio" : "Add Portfolio"}
      </button>
    </form>
  );
}

export default memo(PortfolioForm);
