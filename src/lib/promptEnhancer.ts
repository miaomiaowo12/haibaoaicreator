export function enhancePrompt(
  userInput: string,
  posterType: string | null,
  style: string | null = null,
  platform: string | null = null
): string {
  const parts: string[] = [];

  const platformSkills: Record<string, string> = {
    xiaohongshu: '清新治愈温柔氛围感，浅色系高级配色，柔和柔光，极简ins风，干净通透，居中构图，舒适留白，精致排版，文字大小适中清晰，8K超高清，极致细节，画质细腻，无噪点无瑕疵，masterpiece, best quality, ultra-detailed',
    douyin: '高对比强冲击力，潮流时尚年轻活力，动感光影，鲜明高级配色，居中紧凑构图，主体突出，文字大小适中清晰，8K超高清，极致细节，画质清晰，无噪点无瑕疵，masterpiece, best quality, ultra-detailed',
    shipinhao: '简约大气，视觉舒适耐看，居中构图，干净留白，柔和光影，配色高级协调，文字大小适中清晰醒目，氛围感强，8K超高清，极致细节，画质细腻，无噪点无瑕疵，masterpiece, best quality, ultra-detailed',
    pengyouquan: '简约大气低调质感，中性柔和色调，干净整洁，舒适氛围感，居中对称构图，精致不花哨，文字大小适中清晰，8K超高清，极致细节，画质细腻，无噪点无瑕疵，masterpiece, best quality, ultra-detailed',
  };

  const generalSkill = '极简大气，居中对称构图，干净舒适留白，精致排版布局，文字大小适中清晰醒目、字体高级、排版工整，光影柔和通透，配色高级协调，整体干净整洁，细节精致，无噪点无瑕疵，8K超高清，masterpiece, best quality, ultra-detailed';

  if (posterType) {
    const typeNames: Record<string, string> = {
      promotion: '商业促销',
      recruitment: '招聘求职',
      opening: '开业庆典',
      festival: '节日祝福',
      event: '活动宣传',
      product: '产品推广',
      food: '餐饮美食',
      travel: '旅游出行',
      wedding: '婚庆喜事',
      education: '教育培训',
      other: '创意',
    };
    parts.push(`${typeNames[posterType] || '创意'}海报`);
  }

  if (platform && platformSkills[platform]) {
    parts.push(platformSkills[platform]);
  } else {
    parts.push(generalSkill);
  }

  if (style) {
    const styleNames: Record<string, string> = {
      modern: '现代简约风格',
      vintage: '复古怀旧风格',
      minimalist: '极简主义风格',
      luxury: '高端奢华风格',
      playful: '活泼趣味风格',
      elegant: '优雅精致风格',
      tech: '科技未来风格',
      chinese: '中国风风格',
    };
    if (styleNames[style]) {
      parts.push(styleNames[style]);
    }
  }

  parts.push(userInput);

  return parts.join('，');
}

export function extractStyleFromInput(input: string): string | null {
  const styleKeywords = ['现代', '简约', '复古', '怀旧', '极简', '奢华', '趣味', '优雅', '科技', '中国风'];
  for (const style of styleKeywords) {
    if (input.includes(style)) {
      return style;
    }
  }
  return null;
}

export function extractPlatformFromInput(input: string): string | null {
  const platformKeywords = {
    xiaohongshu: ['小红书', '红书'],
    douyin: ['抖音'],
    shipinhao: ['视频号'],
    pengyouquan: ['朋友圈'],
    weibo: ['微博'],
    poster: ['印刷', '打印'],
    web: ['网页', '网站', '横幅'],
  };

  for (const [platform, keywords] of Object.entries(platformKeywords)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        return platform;
      }
    }
  }
  return null;
}
