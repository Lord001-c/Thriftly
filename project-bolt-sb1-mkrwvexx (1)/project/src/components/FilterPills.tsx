import { CATEGORIES, type Category } from '../lib/types';

interface FilterPillsProps {
  selected: Category;
  onSelect: (cat: Category) => void;
}

export default function FilterPills({ selected, onSelect }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-out border ${
            selected === cat
              ? 'bg-black text-white border-black'
              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
