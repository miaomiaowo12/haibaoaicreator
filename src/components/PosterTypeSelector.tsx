'use client';

interface PosterType {
  id: string;
  label: string;
  emoji: string;
}

interface PosterTypeSelectorProps {
  types: PosterType[];
  selectedType: string | null;
  onSelect: (type: string | null) => void;
}

export default function PosterTypeSelector({ types, selectedType, onSelect }: PosterTypeSelectorProps) {
  return (
    <div>
      <p className="text-sm text-purple-600 font-medium mb-3">选择海报类型</p>
      <div className="grid grid-cols-3 gap-2">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(selectedType === type.id ? null : type.id)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
              selectedType === type.id 
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent' 
                : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'
            }`}
          >
            <span className="text-xl">{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
