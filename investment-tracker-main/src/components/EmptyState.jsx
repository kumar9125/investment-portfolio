import React from "react";

export default function EmptyState({ icon, title, message, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-lg text-center max-w-md mx-auto my-6 animate-fade-in">
      <div className="text-5xl mb-4 select-none">{icon || "📂"}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
