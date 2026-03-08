'use client';

interface Style {
  id: string;
  label: string;
}

interface StyleSelectorProps {
  styles: Style[];
  selectedStyle: string | null;
  onSelect: (style: string | null) => void;
}

export default function StyleSelector({ styles, selectedStyle, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(selectedStyle === style.id ? null : style.id)}
            className={`flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
              selectedStyle === style.id 
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent' 
                : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'
            }`}
          >
            <span>{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
