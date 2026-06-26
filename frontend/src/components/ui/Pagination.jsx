export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {Array.from({ length: pages }).map((_, index) => {
        const number = index + 1;
        const active = number === page;
        return (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
              active
                ? "bg-teal-700 text-white"
                : "border border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
          >
            {number}
          </button>
        );
      })}
    </div>
  );
}
