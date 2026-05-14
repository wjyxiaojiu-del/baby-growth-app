/**
 * 辅食食物数据库
 * 数据来源：中国营养学会《7-24月龄婴幼儿喂养指南》、WHO辅食添加指南
 * 
 * 设计原则：
 * - 每种食物独立定义，避免嵌套过深
 * - 营养标签标准化，便于统计
 * - 过敏原明确标记，排敏追踪必备
 * - 性状按月龄递进（泥→末→碎→块）
 */

/** 食物性状阶段 */
const TEXTURE_STAGES = {
  PUREE: { key: 'PUREE', label: '泥糊状', minMonth: 6, maxMonth: 7 },
  MASHED: { key: 'MASHED', label: '末状', minMonth: 7, maxMonth: 9 },
  CHOPPED: { key: 'CHOPPED', label: '碎状', minMonth: 9, maxMonth: 12 },
  FINGER: { key: 'FINGER', label: '手指食物', minMonth: 8, maxMonth: 24 },
  SOLID: { key: 'SOLID', label: '块状', minMonth: 12, maxMonth: 24 }
}

/** 食物分类 */
const FOOD_CATEGORIES = {
  GRAIN: { key: 'GRAIN', label: '谷薯类', icon: '🌾', color: '#F5DEB3' },
  VEGETABLE: { key: 'VEGETABLE', label: '蔬菜类', icon: '🥬', color: '#90EE90' },
  FRUIT: { key: 'FRUIT', label: '水果类', icon: '🍎', color: '#FFB6C1' },
  MEAT: { key: 'MEAT', label: '肉禽鱼', icon: '🥩', color: '#FFA07A' },
  EGG: { key: 'EGG', label: '蛋类', icon: '🥚', color: '#FFE4B5' },
  DAIRY: { key: 'DAIRY', label: '奶制品', icon: '🥛', color: '#F0F8FF' },
  LEGUME: { key: 'LEGUME', label: '豆坚果', icon: '🫘', color: '#D2B48C' },
  OIL: { key: 'OIL', label: '油脂', icon: '🫒', color: '#FFFACD' }
}

/** 过敏原风险等级 */
const ALLERGEN_LEVEL = {
  NONE: { key: 'NONE', label: '无风险', desc: '低敏食材，可放心添加' },
  LOW: { key: 'LOW', label: '低风险', desc: '建议白天添加，便于观察' },
  HIGH: { key: 'HIGH', label: '高风险', desc: '首次少量尝试，密切观察3天' }
}

/** 营养素标签（用于营养分析统计） */
const NUTRIENT_TAGS = {
  IRON: '铁',
  ZINC: '锌',
  CALCIUM: '钙',
  VITAMIN_A: '维生素A',
  VITAMIN_C: '维生素C',
  VITAMIN_D: '维生素D',
  FOLATE: '叶酸',
  FIBER: '膳食纤维',
  PROTEIN: '蛋白质',
  DHA: 'DHA',
  PROBIOTIC: '益生菌',
  POTASSIUM: '钾',
  HEALTHY_FAT: '健康脂肪',
  OMEGA3: 'Omega-3'
}

/**
 * 食物数据库
 * 字段说明：
 * - id: 唯一标识（category_序号）
 * - name: 食物名称
 * - category: 分类key
 * - startMonth: 建议添加起始月龄
 * - endMonth: 建议作为辅食的结束月龄（超出后可作为普通食物）
 * - texture: 推荐性状key
 * - nutrients: 富含的营养素标签数组
 * - allergen: 过敏原风险等级
 * - allergenSource: 具体过敏原（如麸质、乳糖等）
 * - introOrder: 推荐添加顺序（1=第一梯队如米粉，2=第二梯队如根茎菜，3=第三梯队如肉类）
 * - tips: 添加注意事项
 * - serving: 单次建议量（如"10g"、"1勺"）
 * - unit: 计量单位
 */
const FOODS = [
  // ========== 谷薯类 ==========
  {
    id: 'grain_01', name: '婴儿米粉', category: 'GRAIN',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'ZINC'], allergen: 'NONE', allergenSource: null,
    introOrder: 1, tips: '首选强化铁米粉，用母乳/配方奶冲调', serving: '10', unit: 'g'
  },
  {
    id: 'grain_02', name: '小米粥', category: 'GRAIN',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['FOLATE', 'FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '煮至软烂，可搭配南瓜/红薯', serving: '30', unit: 'ml'
  },
  {
    id: 'grain_03', name: '燕麦', category: 'GRAIN',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'FIBER'], allergen: 'LOW', allergenSource: '麸质（少量）',
    introOrder: 2, tips: '选择无添加纯燕麦片', serving: '10', unit: 'g'
  },
  {
    id: 'grain_04', name: '红薯/紫薯', category: 'GRAIN',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_A', 'FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '蒸熟后压泥，软糯香甜宝宝爱吃', serving: '20', unit: 'g'
  },
  {
    id: 'grain_05', name: '南瓜', category: 'GRAIN',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_A', 'FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '去皮去籽蒸熟压泥，可混合米粉', serving: '20', unit: 'g'
  },
  {
    id: 'grain_06', name: '土豆', category: 'GRAIN',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_C', 'POTASSIUM'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '避免绿色发芽土豆', serving: '20', unit: 'g'
  },
  {
    id: 'grain_07', name: '软面条', category: 'GRAIN',
    startMonth: 7, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['IRON'], allergen: 'LOW', allergenSource: '麸质',
    introOrder: 3, tips: '选择无盐婴儿面条，煮软剪碎', serving: '20', unit: 'g'
  },
  {
    id: 'grain_08', name: '馒头/面包', category: 'GRAIN',
    startMonth: 8, endMonth: 24, texture: 'FINGER',
    nutrients: ['IRON'], allergen: 'LOW', allergenSource: '麸质',
    introOrder: 3, tips: '选择无添加糖盐的全麦制品', serving: '15', unit: 'g'
  },
  {
    id: 'grain_09', name: '米饭', category: 'GRAIN',
    startMonth: 9, endMonth: 24, texture: 'CHOPPED',
    nutrients: [], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '煮软一些，可做成软饭团', serving: '30', unit: 'g'
  },
  {
    id: 'grain_10', name: '玉米', category: 'GRAIN',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['FIBER', 'VITAMIN_C'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '剥下玉米粒，注意整粒防噎', serving: '15', unit: 'g'
  },

  // ========== 蔬菜类 ==========
  {
    id: 'veg_01', name: '菠菜', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'FOLATE', 'VITAMIN_A'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '焯水去除草酸，再压泥', serving: '10', unit: 'g'
  },
  {
    id: 'veg_02', name: '西兰花', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_C', 'VITAMIN_A', 'FOLATE'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '蒸软后压泥，保留茎部（膳食纤维）', serving: '15', unit: 'g'
  },
  {
    id: 'veg_03', name: '胡萝卜', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_A'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '蒸软压泥，可加少量植物油促吸收', serving: '15', unit: 'g'
  },
  {
    id: 'veg_04', name: '番茄', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_C', 'VITAMIN_A'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '去皮去籽，酸味可刺激食欲', serving: '15', unit: 'g'
  },
  {
    id: 'veg_05', name: '豌豆', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['PROTEIN', 'FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '煮熟后去皮压泥', serving: '10', unit: 'g'
  },
  {
    id: 'veg_06', name: '冬瓜', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_C'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '水分多，适合夏季', serving: '20', unit: 'g'
  },
  {
    id: 'veg_07', name: '白菜', category: 'VEGETABLE',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_C', 'FOLATE'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '取嫩叶部分，焯水后切碎', serving: '15', unit: 'g'
  },
  {
    id: 'veg_08', name: '芹菜', category: 'VEGETABLE',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '切极碎，纤维较多需煮软', serving: '10', unit: 'g'
  },
  {
    id: 'veg_09', name: '黄瓜', category: 'VEGETABLE',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['VITAMIN_C'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '去皮切小丁，可生吃或稍蒸', serving: '15', unit: 'g'
  },

  // ========== 水果类 ==========
  {
    id: 'fruit_01', name: '苹果', category: 'FRUIT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['FIBER', 'VITAMIN_C'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '蒸熟后压泥（生吃易便秘）', serving: '20', unit: 'g'
  },
  {
    id: 'fruit_02', name: '香蕉', category: 'FRUIT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['POTASSIUM', 'FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '熟透的香蕉直接用勺刮泥', serving: '20', unit: 'g'
  },
  {
    id: 'fruit_03', name: '梨', category: 'FRUIT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['FIBER', 'VITAMIN_C'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '蒸熟后压泥，缓解便秘效果好', serving: '20', unit: 'g'
  },
  {
    id: 'fruit_04', name: '牛油果', category: 'FRUIT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['HEALTHY_FAT'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '直接刮泥，口感顺滑，富含健康脂肪', serving: '15', unit: 'g'
  },
  {
    id: 'fruit_05', name: '蓝莓', category: 'FRUIT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['VITAMIN_C', 'ANTIOXIDANT'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '压碎或切半，注意染色', serving: '10', unit: 'g'
  },
  {
    id: 'fruit_06', name: '草莓', category: 'FRUIT',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['VITAMIN_C'], allergen: 'LOW', allergenSource: '水杨酸（少量）',
    introOrder: 3, tips: '切小丁，首次少量尝试', serving: '15', unit: 'g'
  },
  {
    id: 'fruit_07', name: '橙子/柑橘', category: 'FRUIT',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['VITAMIN_C'], allergen: 'LOW', allergenSource: '柑橘类过敏',
    introOrder: 3, tips: '剥去白色筋膜，切小块', serving: '20', unit: 'g'
  },
  {
    id: 'fruit_08', name: '猕猴桃', category: 'FRUIT',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['VITAMIN_C', 'FIBER'], allergen: 'LOW', allergenSource: '猕猴桃蛋白',
    introOrder: 3, tips: '熟软后刮泥或切小丁', serving: '15', unit: 'g'
  },
  {
    id: 'fruit_09', name: '火龙果', category: 'FRUIT',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['FIBER'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '切小丁，红心火龙果注意染色', serving: '20', unit: 'g'
  },
  {
    id: 'fruit_10', name: '葡萄', category: 'FRUIT',
    startMonth: 10, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['VITAMIN_C'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '去皮切四瓣，严防整颗噎住', serving: '10', unit: 'g'
  },

  // ========== 肉禽鱼 ==========
  {
    id: 'meat_01', name: '猪肉', category: 'MEAT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'ZINC', 'PROTEIN'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '选里脊肉，蒸烂后打成肉泥', serving: '10', unit: 'g'
  },
  {
    id: 'meat_02', name: '牛肉', category: 'MEAT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'ZINC', 'PROTEIN'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '选牛里脊，高压锅炖烂再打泥', serving: '10', unit: 'g'
  },
  {
    id: 'meat_03', name: '鸡肉', category: 'MEAT',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['PROTEIN', 'IRON'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '选鸡胸肉，蒸烂后打泥', serving: '10', unit: 'g'
  },
  {
    id: 'meat_04', name: '猪肝', category: 'MEAT',
    startMonth: 7, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'VITAMIN_A', 'ZINC'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '每周1-2次，浸泡去血水，打泥', serving: '5', unit: 'g'
  },
  {
    id: 'meat_05', name: '鳕鱼', category: 'MEAT',
    startMonth: 7, endMonth: 24, texture: 'PUREE',
    nutrients: ['DHA', 'PROTEIN'], allergen: 'LOW', allergenSource: '鱼类蛋白',
    introOrder: 3, tips: '选真鳕鱼，蒸熟去刺后压泥', serving: '10', unit: 'g'
  },
  {
    id: 'meat_06', name: '三文鱼', category: 'MEAT',
    startMonth: 7, endMonth: 24, texture: 'PUREE',
    nutrients: ['DHA', 'PROTEIN', 'VITAMIN_D'], allergen: 'LOW', allergenSource: '鱼类蛋白',
    introOrder: 3, tips: '蒸熟后压泥，富含DHA', serving: '10', unit: 'g'
  },
  {
    id: 'meat_07', name: '虾', category: 'MEAT',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['PROTEIN', 'ZINC'], allergen: 'HIGH', allergenSource: '虾原肌球蛋白',
    introOrder: 3, tips: '首次极少量，煮熟去壳切极碎', serving: '5', unit: 'g'
  },
  {
    id: 'meat_08', name: '猪肉松', category: 'MEAT',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['IRON', 'PROTEIN'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '选择无添加婴儿肉松', serving: '5', unit: 'g'
  },

  // ========== 蛋类 ==========
  {
    id: 'egg_01', name: '蛋黄', category: 'EGG',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'PROTEIN', 'CHOLINE'], allergen: 'LOW', allergenSource: '蛋黄蛋白',
    introOrder: 2, tips: '从1/4个开始，煮熟压碎', serving: '1/4', unit: '个'
  },
  {
    id: 'egg_02', name: '全蛋', category: 'EGG',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['PROTEIN', 'CHOLINE', 'VITAMIN_D'], allergen: 'HIGH', allergenSource: '卵白蛋白',
    introOrder: 3, tips: '先排敏蛋黄，再尝试蛋白', serving: '1/2', unit: '个'
  },

  // ========== 奶制品 ==========
  {
    id: 'dairy_01', name: '酸奶', category: 'DAIRY',
    startMonth: 6, endMonth: 24, texture: 'PUREE',
    nutrients: ['CALCIUM', 'PROBIOTIC', 'PROTEIN'], allergen: 'LOW', allergenSource: '乳清蛋白',
    introOrder: 3, tips: '选择无糖纯酸奶，室温放置后喂食', serving: '30', unit: 'ml'
  },
  {
    id: 'dairy_02', name: '奶酪', category: 'DAIRY',
    startMonth: 8, endMonth: 24, texture: 'CHOPPED',
    nutrients: ['CALCIUM', 'PROTEIN'], allergen: 'LOW', allergenSource: '酪蛋白',
    introOrder: 3, tips: '选低钠原制奶酪，切小丁', serving: '10', unit: 'g'
  },
  {
    id: 'dairy_03', name: '配方奶', category: 'DAIRY',
    startMonth: 0, endMonth: 24, texture: 'LIQUID',
    nutrients: ['CALCIUM', 'PROTEIN', 'VITAMIN_D'], allergen: 'NONE', allergenSource: null,
    introOrder: 0, tips: '6月龄前为主要营养来源', serving: '按需', unit: 'ml'
  },

  // ========== 豆坚果类 ==========
  {
    id: 'legume_01', name: '豆腐', category: 'LEGUME',
    startMonth: 7, endMonth: 24, texture: 'PUREE',
    nutrients: ['CALCIUM', 'PROTEIN', 'IRON'], allergen: 'LOW', allergenSource: '大豆蛋白',
    introOrder: 3, tips: '选嫩豆腐/内酯豆腐，压泥', serving: '20', unit: 'g'
  },
  {
    id: 'legume_02', name: '红豆/绿豆', category: 'LEGUME',
    startMonth: 8, endMonth: 24, texture: 'PUREE',
    nutrients: ['IRON', 'FIBER', 'PROTEIN'], allergen: 'NONE', allergenSource: null,
    introOrder: 3, tips: '煮至软烂，去皮压泥', serving: '10', unit: 'g'
  },
  {
    id: 'legume_03', name: '花生酱', category: 'LEGUME',
    startMonth: 8, endMonth: 24, texture: 'PUREE',
    nutrients: ['PROTEIN', 'HEALTHY_FAT'], allergen: 'HIGH', allergenSource: '花生蛋白',
    introOrder: 3, tips: '选无添加纯花生酱，薄薄涂抹', serving: '2', unit: 'g'
  },

  // ========== 油脂类 ==========
  {
    id: 'oil_01', name: '核桃油', category: 'OIL',
    startMonth: 6, endMonth: 24, texture: 'LIQUID',
    nutrients: ['HEALTHY_FAT'], allergen: 'LOW', allergenSource: '核桃蛋白（精炼油极少）',
    introOrder: 2, tips: '拌入米粉/菜泥中，促进脂溶性维生素吸收', serving: '2', unit: 'ml'
  },
  {
    id: 'oil_02', name: '亚麻籽油', category: 'OIL',
    startMonth: 6, endMonth: 24, texture: 'LIQUID',
    nutrients: ['HEALTHY_FAT', 'OMEGA3'], allergen: 'NONE', allergenSource: null,
    introOrder: 2, tips: '不耐高温，直接拌入辅食', serving: '2', unit: 'ml'
  }
]

/** 按月龄的喂养目标参考 */
const FEEDING_GOALS = [
  { minMonth: 6, maxMonth: 7, meals: 1, texture: 'PUREE', milkFeedings: 6, milkAmount: '800-1000ml' },
  { minMonth: 7, maxMonth: 9, meals: 2, texture: 'MASHED', milkFeedings: 5, milkAmount: '700-800ml' },
  { minMonth: 9, maxMonth: 12, meals: 3, texture: 'CHOPPED', milkFeedings: 4, milkAmount: '600-800ml' },
  { minMonth: 12, maxMonth: 24, meals: 3, texture: 'SOLID', milkFeedings: 3, milkAmount: '500-600ml' }
]

/** 每日营养目标（简化版，用于分析参考） */
const DAILY_NUTRIENT_TARGETS = {
  6: { iron: 0.3, zinc: 2, calcium: 200, protein: 9 },
  7: { iron: 7, zinc: 3, calcium: 250, protein: 15 },
  8: { iron: 7, zinc: 3, calcium: 250, protein: 15 },
  9: { iron: 7, zinc: 3, calcium: 300, protein: 15 },
  10: { iron: 7, zinc: 3, calcium: 350, protein: 20 },
  11: { iron: 7, zinc: 3, calcium: 350, protein: 20 },
  12: { iron: 7, zinc: 3, calcium: 400, protein: 25 }
}

/** 推荐添加顺序模板（按周规划） */
const INTRO_SCHEDULE_TEMPLATE = [
  { week: 1, foods: ['grain_01'], note: '第一口：强化铁米粉' },
  { week: 2, foods: ['grain_01', 'veg_03'], note: '加入根茎菜：胡萝卜' },
  { week: 3, foods: ['grain_01', 'veg_03', 'veg_01'], note: '加入绿叶菜：菠菜' },
  { week: 4, foods: ['grain_01', 'veg_03', 'veg_01', 'fruit_01'], note: '加入水果：苹果' },
  { week: 5, foods: ['grain_01', 'veg_03', 'veg_01', 'fruit_01', 'egg_01'], note: '加入蛋黄' },
  { week: 6, foods: ['grain_01', 'veg_03', 'veg_01', 'fruit_01', 'egg_01', 'meat_01'], note: '加入红肉：猪肉' },
  { week: 7, foods: ['grain_01', 'veg_03', 'veg_01', 'fruit_01', 'egg_01', 'meat_01', 'meat_05'], note: '加入鱼肉：鳕鱼' },
  { week: 8, foods: ['grain_01', 'veg_03', 'veg_01', 'fruit_01', 'egg_01', 'meat_01', 'meat_05', 'dairy_01'], note: '加入酸奶' }
]

module.exports = {
  TEXTURE_STAGES,
  FOOD_CATEGORIES,
  ALLERGEN_LEVEL,
  NUTRIENT_TAGS,
  FOODS,
  FEEDING_GOALS,
  DAILY_NUTRIENT_TARGETS,
  INTRO_SCHEDULE_TEMPLATE
}
