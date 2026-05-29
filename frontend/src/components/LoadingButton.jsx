export default function LoadingButton({
  onClick,
  isLoading = false,
  children,
  loadingText = "Memproses...",
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}) {
  const variants = {
    primary:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/30",
    secondary:
      "bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border border-slate-600/50",
  };

  const isDisabled = isLoading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-xl font-semibold text-sm
        transition-all duration-200 ease-out
        ${isDisabled ? "opacity-60 cursor-not-allowed scale-[0.98]" : "hover:scale-[1.02] active:scale-[0.98]"}
        ${variants[variant] || variants.primary}
        ${className}
      `}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
}
