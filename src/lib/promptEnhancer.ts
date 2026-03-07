const POSTER_TYPE_SKILLS: Record<string, string> = {
  promotion: '突出促销优惠、活动力度与价格卖点，视觉冲击力强，搭配促销标签、爆炸贴、优惠文案框，构图紧凑吸睛，色彩明快亮眼，高清质感，适配线上线下商业推广',
  recruitment: '职场专业氛围，简洁大气，搭配职场元素、人才剪影、企业理念文案，排版正式舒适，视觉稳重专业，凸显企业招聘诚意与岗位吸引力',
  opening: '喜庆热闹的开业盛典氛围，融入礼花、气球、开业拱门、红毯元素，文字突出开业大吉/盛大开业，色彩鲜亮喜庆，构图饱满有仪式感',
  festival: '贴合节日核心氛围，融入对应节日符号与祝福元素，构图温馨/喜庆，色彩适配节日调性，氛围感拉满，高清精美，节日气息浓郁',
  event: '突出活动主题、时间与核心亮点，视觉活泼吸睛，搭配活动相关创意元素，构图层次清晰，视觉张力足，适配各类线上线下活动推广',
  product: '产品主体居中突出，精准展现产品质感与核心卖点，背景简洁高级，光影精致细腻，凸显产品高级感与实用性，高清写实',
  food: '聚焦美食色泽与质感，突出食材新鲜诱人，搭配精致摆盘、烟火气元素，光影柔和诱人，色彩暖润有食欲，高清写实，视觉垂涎欲滴',
  travel: '展现目的地自然风光/人文特色，构图开阔大气，融入旅行、地标元素，色彩清新治愈，氛围感沉浸式，高清绝美，凸显旅游吸引力',
  wedding: '浪漫唯美婚礼氛围，搭配婚纱、鲜花、钻戒、爱心元素，色彩柔和温馨（粉/白/金为主），构图精致甜蜜，婚庆仪式感拉满',
  education: '简洁专业的学习氛围，融入书本、笔、毕业帽等教育元素，排版规整清晰，色彩沉稳舒适，凸显课程专业度与学习价值',
  other: '通用创意海报，视觉美观协调，元素贴合主题，构图合理，色彩和谐，细节丰富，高清质感，满足多元非特定场景海报需求',
};

const COLOR_SCHEME_SKILLS: Record<string, string> = {
  warm: '以红、橙、黄、暖粉为主色调，色彩温暖柔和，营造温馨、热情、治愈氛围，光影暖调，视觉亲和舒适',
  cool: '以蓝、青、绿、紫为主色调，色彩清冷高级，营造冷静、科技、清新、静谧氛围，光影冷调，简约清爽',
  monochrome: '单一主色搭配深浅渐变，色彩统一和谐，极简高级，靠明暗区分层次，视觉干净整洁',
  complementary: '采用色环互补色搭配，色彩对比强烈，视觉冲击力拉满，醒目吸睛，层次鲜明潮流',
  analogous: '相邻色系自然过渡搭配，色彩柔和协调，无视觉突兀感，整体氛围顺滑舒适',
  triadic: '三等分色环三色搭配，色彩丰富活泼，均衡有活力，视觉多彩协调、层次亮眼',
  chinese: '以中国红、朱砂、墨黑、青花蓝、琉璃黄为主，融入中式传统色彩，古典雅致，国风韵味浓郁',
  luxury: '鎏金、香槟金搭配黑金/白金，金属珠光质感，色彩高贵典雅，凸显轻奢奢华高级感',
};

const TYPOGRAPHY_SKILLS: Record<string, string> = {
  hierarchy: '信息层级清晰有序，标题、副标题、详情文字大小对比合理，视觉流程顺滑，阅读逻辑清晰',
  contrast: '图文、色彩、大小形成强烈对比，核心信息极度突出，视觉冲击力强，一眼抓重点',
  balance: '左右/上下视觉重量均衡，元素分布对称协调，无偏重感，构图稳定舒适',
  emphasis: '核心主体/文案居中放大，周围元素辅助衬托，视觉重心聚焦，核心信息一目了然',
  whitespace: '保留充足空白区域，元素不拥挤，视觉透气舒适，简约高级，凸显核心内容',
  alignment: '文字、元素严格统一对齐，排版规整有序，整洁干净，视觉专业精致',
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

export { POSTER_TYPE_SKILLS, COLOR_SCHEME_SKILLS, TYPOGRAPHY_SKILLS };
