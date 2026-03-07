const COLOR_SCHEMES = {
  warm: {
    name: '暖色调',
    colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8C42'],
    prompt: '暖色调配色，红橙黄为主',
    skill: '以红、橙、黄、暖粉为主色调，色彩温暖柔和，营造温馨、热情、治愈氛围，光影暖调，视觉亲和舒适',
  },
  cool: {
    name: '冷色调',
    colors: ['#4A90E2', '#7B68EE', '#20B2AA', '#5F9EA0'],
    prompt: '冷色调配色，蓝紫青为主',
    skill: '以蓝、青、绿、紫为主色调，色彩清冷高级，营造冷静、科技、清新、静谧氛围，光影冷调，简约清爽',
  },
  monochrome: {
    name: '单色系',
    colors: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7'],
    prompt: '单色系配色，同色系深浅变化',
    skill: '单一主色搭配深浅渐变，色彩统一和谐，极简高级，靠明暗区分层次，视觉干净整洁',
  },
  complementary: {
    name: '互补色',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    prompt: '互补色配色，对比色搭配',
    skill: '采用色环互补色搭配，色彩对比强烈，视觉冲击力拉满，醒目吸睛，层次鲜明潮流',
  },
  analogous: {
    name: '邻近色',
    colors: ['#FF6B6B', '#FF8E72', '#FFB347', '#FFCC5C'],
    prompt: '邻近色配色，色环相邻色搭配',
    skill: '相邻色系自然过渡搭配，色彩柔和协调，无视觉突兀感，整体氛围顺滑舒适',
  },
  triadic: {
    name: '三色配色',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
    prompt: '三色配色，丰富活泼',
    skill: '三等分色环三色搭配，色彩丰富活泼，均衡有活力，视觉多彩协调、层次亮眼',
  },
  chinese: {
    name: '中国风',
    colors: ['#C41E3A', '#D4AF37', '#8B4513', '#2F4F4F'],
    prompt: '中国风配色，朱红、金黄、墨色为主',
    skill: '以中国红、朱砂、墨黑、青花蓝、琉璃黄为主，融入中式传统色彩，古典雅致，国风韵味浓郁',
  },
  luxury: {
    name: '奢华金',
    colors: ['#D4AF37', '#1C1C1C', '#FFFFFF', '#8B7355'],
    prompt: '奢华金配色，金色搭配黑白色',
    skill: '鎏金、香槟金搭配黑金/白金，金属珠光质感，色彩高贵典雅，凸显轻奢奢华高级感',
  },
};

const TYPOGRAPHY_RULES = {
  hierarchy: {
    name: '层级分明',
    prompt: '文字层级分明，标题醒目，字体大小适中清晰',
    skill: '信息层级清晰有序，标题、副标题、详情文字大小对比合理，视觉流程顺滑，阅读逻辑清晰',
  },
  contrast: {
    name: '对比突出',
    prompt: '文字与背景高对比度，字体大小适中，确保清晰可读',
    skill: '图文、色彩、大小形成强烈对比，核心信息极度突出，视觉冲击力强，一眼抓重点',
  },
  balance: {
    name: '视觉平衡',
    prompt: '文字与图像视觉平衡，字体大小适中',
    skill: '左右/上下视觉重量均衡，元素分布对称协调，无偏重感，构图稳定舒适',
  },
  emphasis: {
    name: '重点强调',
    prompt: '关键信息重点强调，字体大小适中清晰',
    skill: '核心主体/文案居中放大，周围元素辅助衬托，视觉重心聚焦，核心信息一目了然',
  },
  whitespace: {
    name: '留白呼吸',
    prompt: '文字周围适当留白，字体大小适中',
    skill: '保留充足空白区域，元素不拥挤，视觉透气舒适，简约高级，凸显核心内容',
  },
  alignment: {
    name: '对齐整齐',
    prompt: '文字对齐整齐，字体大小适中清晰',
    skill: '文字、元素严格统一对齐，排版规整有序，整洁干净，视觉专业精致',
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
