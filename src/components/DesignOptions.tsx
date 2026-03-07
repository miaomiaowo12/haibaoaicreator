'use client';

import { COLOR_SCHEMES, TYPOGRAPHY_RULES } from '@/lib/designTemplates';

interface DesignOptionsProps {
  selectedColorScheme: string | null;
  selectedTypography: string | null;
  onColorSchemeChange: (scheme: string | null) => void;
  onTypographyChange: (typography: string | null) => void;
}

export default function DesignOptions({
  selectedColorScheme,
  selectedTypography,
  onColorSchemeChange,
  onTypographyChange,
}: DesignOptionsProps) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 space-y-4 shadow-soft border border-gray-100">
      <div>
        <p className="text-sm text-gray-500 mb-2">配色方案</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onColorSchemeChange(null)}
            className={`flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
              selectedColorScheme === null 
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent' 
                : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'
            }`}
          >
            自动
          </button>
          {Object.entries(COLOR_SCHEMES).map(([id, scheme]) => (
            <button
              key={id}
              onClick={() => onColorSchemeChange(id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
                selectedColorScheme === id 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent' 
                  : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${scheme.colors[0]}, ${scheme.colors[1]})`,
                }}
              />
              {scheme.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2">排版规则</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTypographyChange(null)}
            className={`flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
              selectedTypography === null 
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent' 
                : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'
            }`}
          >
            自动
          </button>
          {Object.entries(TYPOGRAPHY_RULES).map(([id, rule]) => (
            <button
              key={id}
              onClick={() => onTypographyChange(id)}
              className={`flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
                selectedTypography === id 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent' 
                  : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'
              }`}
            >
              {rule.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
