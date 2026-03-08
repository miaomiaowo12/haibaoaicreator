const SYSTEM_SKILL = `你是豆包 SeeDream 4.5 专属海报生成专家，深度理解用户对海报的用途、样式风格、配色、排版、元素、文案内容、发布平台所有需求，精准提取信息并生成专业绘图指令，严格遵从用户要求，保证海报高清精致、文字清晰、构图合理、风格统一，完全贴合用户诉求。`;

const POSTER_TYPE_SKILLS: Record<string, string> = {
  opening: '开业庆典海报，喜庆热闹的开业盛典氛围，融入礼花 / 气球 / 开业拱门 / 红毯元素，文字突出开业大吉 / 盛大开业',
  festival: '节日祝福海报，贴合节日核心氛围，融入对应节日符号与祝福元素，氛围感拉满',
  event: '活动宣传海报，突出活动主题、时间与核心亮点，视觉活泼吸睛，搭配活动相关创意元素',
  product: '产品推广海报，产品主体居中突出，精准展现产品质感与核心卖点，背景简洁高级，光影精致细腻',
  food: '餐饮美食海报，聚焦美食色泽与质感，突出食材新鲜诱人，搭配精致摆盘 / 烟火气元素，光影柔和诱人有食欲',
  travel: '旅游出行海报，展现目的地自然风光 / 人文特色，构图开阔大气，融入旅行、地标元素，氛围感沉浸式',
  wedding: '婚庆喜事海报，浪漫唯美婚礼氛围，搭配婚纱 / 鲜花 / 钻戒 / 爱心元素，粉 / 白 / 金为主色调，仪式感拉满',
  education: '教育培训海报，简洁专业的学习氛围，融入书本 / 笔 / 毕业帽等教育元素，排版规整清晰',
  other: '通用创意海报，视觉美观协调，元素贴合主题，构图合理，色彩和谐，细节丰富',
};

const COLOR_SCHEME_SKILLS: Record<string, string> = {
  warm: '暖色调（红 / 橙 / 黄 / 暖粉为主），温暖柔和，温馨热情',
  cool: '冷色调（蓝 / 青 / 绿 / 紫为主），清冷高级，冷静科技',
  monochrome: '单色系（单一主色搭配深浅渐变），极简高级，干净整洁',
  complementary: '互补色（色环互补色搭配），对比强烈，视觉冲击',
  analogous: '邻近色（相邻色系自然过渡），柔和协调，顺滑舒适',
  triadic: '三色配色（三等分色环三色搭配），丰富活泼，均衡有活力',
  chinese: '中国风（中国红 / 朱砂 / 墨黑 / 青花蓝 / 琉璃黄），古典雅致，国风韵味',
  luxury: '奢华金（鎏金 / 香槟金搭配黑金 / 白金），金属珠光质感，高贵典雅',
};

const TYPOGRAPHY_SKILLS: Record<string, string> = {
  hierarchy: '排版层级分明，标题 / 副标题 / 详情文字大小对比合理，视觉流程顺滑',
  contrast: '排版对比突出，图文 / 色彩 / 大小形成强烈对比，核心信息极度突出',
  balance: '排版视觉平衡，左右 / 上下视觉重量均衡，元素分布对称协调',
  emphasis: '排版重点强调，核心主体 / 文案居中放大，视觉重心聚焦',
  whitespace: '排版留白呼吸，保留充足空白区域，视觉透气舒适，简约高级',
  alignment: '排版对齐整齐，文字 / 元素严格统一对齐，规整有序',
};

const STYLE_KEYWORDS: Record<string, string> = {
  '现代': '现代简约风格',
  '简约': '现代简约风格',
  '极简': '极简主义风格',
  '复古': '复古怀旧风格',
  '怀旧': '复古怀旧风格',
  '奢华': '高端奢华风格',
  '高端': '高端奢华风格',
  '趣味': '活泼趣味风格',
  '活泼': '活泼趣味风格',
  '优雅': '优雅精致风格',
  '精致': '优雅精致风格',
  '科技': '科技未来风格',
  '未来': '科技未来风格',
  '中国风': '中国风风格',
  '国风': '中国风风格',
  '古典': '古典雅致风格',
  '清新': '清新治愈风格',
  '治愈': '清新治愈风格',
  '可爱': '可爱萌趣风格',
  '萌': '可爱萌趣风格',
};

const PLATFORM_KEYWORDS: Record<string, string> = {
  '小红书': 'xiaohongshu',
  '红书': 'xiaohongshu',
  '抖音': 'douyin',
  '朋友圈': 'pengyouquan',
  '视频号': 'shipinhao',
  '微博': 'weibo',
  '印刷': 'poster',
  '打印': 'poster',
  '网页': 'web',
  '网站': 'web',
  '横幅': 'web',
};

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

  if (posterType && POSTER_TYPE_SKILLS[posterType]) {
    parts.push(POSTER_TYPE_SKILLS[posterType]);
  }

  if (platform && platformSkills[platform]) {
    parts.push(platformSkills[platform]);
  } else {
    parts.push(generalSkill);
  }

  if (style) {
    parts.push(style);
  }

  parts.push(userInput);

  return parts.join('，');
}

export function extractStyleFromInput(input: string): string | null {
  for (const [keyword, style] of Object.entries(STYLE_KEYWORDS)) {
    if (input.includes(keyword)) {
      return style;
    }
  }
  return null;
}

export function extractPlatformFromInput(input: string): string | null {
  for (const [keyword, platform] of Object.entries(PLATFORM_KEYWORDS)) {
    if (input.includes(keyword)) {
      return platform;
    }
  }
  return null;
}

export function getPosterTypeSkill(posterType: string | null): string {
  if (!posterType) return '';
  return POSTER_TYPE_SKILLS[posterType] || '';
}

export function getColorSchemeSkill(colorScheme: string | null): string {
  if (!colorScheme) return '';
  return COLOR_SCHEME_SKILLS[colorScheme] || '';
}

export function getTypographySkill(typography: string | null): string {
  if (!typography) return '';
  return TYPOGRAPHY_SKILLS[typography] || '';
}

export function getSystemSkill(): string {
  return SYSTEM_SKILL;
}

export { POSTER_TYPE_SKILLS, COLOR_SCHEME_SKILLS, TYPOGRAPHY_SKILLS };
