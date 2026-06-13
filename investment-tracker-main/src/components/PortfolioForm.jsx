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

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required";
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const portfolioData = {
      user: user?._id,
      name,
      description: description.trim() || undefined,
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
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
          placeholder="(Optional)"
        />
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
