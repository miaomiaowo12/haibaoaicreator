const COLOR_SCHEMES = {
  warm: {
    name: '暖色调',
    colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8C42'],
    prompt: '暖色调配色，红橙黄为主',
  },
  cool: {
    name: '冷色调',
    colors: ['#4A90E2', '#7B68EE', '#20B2AA', '#5F9EA0'],
    prompt: '冷色调配色，蓝紫青为主',
  },
  monochrome: {
    name: '单色系',
    colors: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7'],
    prompt: '单色系配色，同色系深浅变化',
  },
  complementary: {
    name: '互补色',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    prompt: '互补色配色，对比色搭配',
  },
  analogous: {
    name: '邻近色',
    colors: ['#FF6B6B', '#FF8E72', '#FFB347', '#FFCC5C'],
    prompt: '邻近色配色，色环相邻色搭配',
  },
  triadic: {
    name: '三色配色',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
    prompt: '三色配色，丰富活泼',
  },
  chinese: {
    name: '中国风',
    colors: ['#C41E3A', '#D4AF37', '#8B4513', '#2F4F4F'],
    prompt: '中国风配色，朱红、金黄、墨色为主',
  },
  luxury: {
    name: '奢华金',
    colors: ['#D4AF37', '#1C1C1C', '#FFFFFF', '#8B7355'],
    prompt: '奢华金配色，金色搭配黑白色',
  },
};

const TYPOGRAPHY_RULES = {
  hierarchy: {
    name: '层级分明',
    prompt: '文字层级分明，标题醒目，字体大小适中清晰',
  },
  contrast: {
    name: '对比突出',
    prompt: '文字与背景高对比度，字体大小适中，确保清晰可读',
  },
  balance: {
    name: '视觉平衡',
    prompt: '文字与图像视觉平衡，字体大小适中',
  },
  emphasis: {
    name: '重点强调',
    prompt: '关键信息重点强调，字体大小适中清晰',
  },
  whitespace: {
    name: '留白呼吸',
    prompt: '文字周围适当留白，字体大小适中',
  },
  alignment: {
    name: '对齐整齐',
    prompt: '文字对齐整齐，字体大小适中清晰',
  },
};

export function getColorSchemePrompt(schemeId: string | null): string {
  if (!schemeId || !COLOR_SCHEMES[schemeId as keyof typeof COLOR_SCHEMES]) {
    return '';
  }
  return COLOR_SCHEMES[schemeId as keyof typeof COLOR_SCHEMES].prompt;
}

export function getTypographyPrompt(typographyId: string | null): string {
  if (!typographyId || !TYPOGRAPHY_RULES[typographyId as keyof typeof TYPOGRAPHY_RULES]) {
    return '';
  }
  return TYPOGRAPHY_RULES[typographyId as keyof typeof TYPOGRAPHY_RULES].prompt;
}

export function recommendColorScheme(posterType: string): string {
  const recommendations: Record<string, string> = {
    promotion: 'warm',
    recruitment: 'cool',
    opening: 'chinese',
    festival: 'chinese',
    event: 'complementary',
    product: 'luxury',
    food: 'warm',
    travel: 'cool',
    wedding: 'analogous',
    education: 'cool',
    other: 'monochrome',
  };
  return recommendations[posterType] || 'warm';
}

export { COLOR_SCHEMES, TYPOGRAPHY_RULES };
