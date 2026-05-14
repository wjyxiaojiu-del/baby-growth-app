/**
 * 辅食工具函数库
 * 纯函数优先，无副作用，便于测试
 */

const {
  FOODS,
  FOOD_CATEGORIES,
  TEXTURE_STAGES,
  ALLERGEN_LEVEL,
  FEEDING_GOALS,
  INTRO_SCHEDULE_TEMPLATE
} = require('../data/foodData')

const { calcBabyAge } = require('./util')

// ========== 基础查询 ==========

/** 根据ID获取食物 */
function getFoodById(id) {
  return FOODS.find(f => f.id === id) || null
}

/** 获取所有食物 */
function getAllFoods() {
  return FOODS
}

/** 按分类获取食物 */
function getFoodsByCategory(categoryKey) {
  return FOODS.filter(f => f.category === categoryKey)
}

/** 按月龄筛选可添加的食物（含边界判断） */
function getFoodsByMonth(month) {
  if (month == null || month < 0) return []
  return FOODS.filter(f => month >= f.startMonth && month <= f.endMonth)
}

/** 获取指定月龄推荐的新食物（未添加过的） */
function getRecommendedNewFoods(month, addedFoodIds = []) {
  if (month == null || month < 6) return []
  const available = getFoodsByMonth(month)
  const addedSet = new Set(addedFoodIds)
  return available
    .filter(f => !addedSet.has(f.id))
    .sort((a, b) => a.introOrder - b.introOrder)
}

/** 搜索食物（支持名称模糊匹配） */
function searchFoods(keyword) {
  if (!keyword || typeof keyword !== 'string') return []
  const kw = keyword.trim().toLowerCase()
  if (kw.length === 0) return FOODS
  return FOODS.filter(f => f.name.toLowerCase().includes(kw))
}

// ========== 月龄与性状 ==========

/** 获取当前月龄对应的推荐性状 */
function getRecommendedTexture(month) {
  if (month == null) return null
  const stage = Object.values(TEXTURE_STAGES).find(
    s => month >= s.minMonth && month <= s.maxMonth
  )
  return stage || TEXTURE_STAGES.SOLID
}

/** 获取月龄对应的喂养目标 */
function getFeedingGoal(month) {
  if (month == null) return null
  return FEEDING_GOALS.find(g => month >= g.minMonth && month <= g.maxMonth) || null
}

// ========== 排敏追踪 ==========

/**
 * 判断食物当前排敏状态
 * @param {string} foodId - 食物ID
 * @param {Array} logs - 该食物的所有食用记录，按时间升序
 * @returns {Object} { status, daysObserved, canProceed, nextAction }
 * 
 * 排敏规则：
 * - 从未吃过 → 'new'
 * - 吃过1-3次且在观察期内 → 'observing'
 * - 观察满3天无异常 → 'cleared'
 * - 观察期出现症状 → 'reaction'
 */
function getAllergyStatus(foodId, logs = []) {
  const food = getFoodById(foodId)
  if (!food) return { status: 'unknown', daysObserved: 0, canProceed: false, nextAction: '数据异常' }

  if (logs.length === 0) {
    return {
      status: 'new',
      daysObserved: 0,
      canProceed: food.allergen !== 'HIGH',
      nextAction: food.allergen === 'HIGH' ? '首次极少量尝试，白天添加' : '可正常添加'
    }
  }

  // 按天去重，获取有记录的天数
  const uniqueDays = new Set(logs.map(l => l.date)).size

  // 检查是否有不良反应记录
  const hasReaction = logs.some(l => l.hasReaction === true)
  if (hasReaction) {
    return {
      status: 'reaction',
      daysObserved: uniqueDays,
      canProceed: false,
      nextAction: '已出现不良反应，暂停添加，咨询医生'
    }
  }

  // 排敏完成：至少3天有记录且无不良反应
  if (uniqueDays >= 3) {
    return {
      status: 'cleared',
      daysObserved: uniqueDays,
      canProceed: true,
      nextAction: '排敏通过，可正常食用'
    }
  }

  // 观察中
  const daysLeft = 3 - uniqueDays
  return {
    status: 'observing',
    daysObserved: uniqueDays,
    canProceed: false,
    nextAction: `观察中，建议继续吃${daysLeft}天，每日少量`
  }
}

/** 批量获取多种食物的排敏状态 */
function getBatchAllergyStatus(foodLogsMap) {
  const result = {}
  for (const [foodId, logs] of Object.entries(foodLogsMap)) {
    result[foodId] = getAllergyStatus(foodId, logs)
  }
  return result
}

// ========== 营养分析 ==========

/**
 * 统计单日/多日的营养素摄入
 * @param {Array} foodRecords - 食物记录数组 [{ foodId, amount, date }]
 * @returns {Object} 各类营养素计数
 */
function analyzeNutrients(foodRecords) {
  const stats = {}
  for (const record of foodRecords) {
    const food = getFoodById(record.foodId)
    if (!food || !food.nutrients) continue
    for (const nutrient of food.nutrients) {
      stats[nutrient] = (stats[nutrient] || 0) + 1
    }
  }
  return stats
}

/**
 * 计算每日食物多样性评分（0-100）
 * 基于：分类多样性 + 新食物数量 + 营养覆盖度
 */
function calcDiversityScore(dayRecords, totalAddedFoodIds = []) {
  if (!dayRecords || dayRecords.length === 0) return 0

  // 1. 分类多样性（最多4类满分，占40分）
  const categories = new Set(dayRecords.map(r => {
    const f = getFoodById(r.foodId)
    return f ? f.category : null
  }).filter(Boolean))
  const categoryScore = Math.min(categories.size, 4) * 10

  // 2. 营养覆盖度（至少覆盖3种关键营养素，占30分）
  const nutrients = analyzeNutrients(dayRecords)
  const keyNutrients = ['IRON', 'PROTEIN', 'VITAMIN_C', 'CALCIUM', 'ZINC']
  const coveredKey = keyNutrients.filter(n => nutrients[n] > 0).length
  const nutrientScore = Math.min(coveredKey / 3, 1) * 30

  // 3. 新食物鼓励（本月内新添加的食物，占30分）
  const todayFoods = new Set(dayRecords.map(r => r.foodId))
  const newToday = [...todayFoods].filter(id => totalAddedFoodIds.includes(id)).length
  const newFoodScore = Math.min(newToday, 3) * 10

  return Math.round(categoryScore + nutrientScore + newFoodScore)
}

// ========== 智能推荐 ==========

/**
 * 生成今日辅食推荐
 * @param {number} month - 月龄
 * @param {Array} addedFoodIds - 已添加的食物ID列表
 * @param {Array} todayRecords - 今日已吃记录
 * @returns {Object} { main, sides, fruit, tips }
 */
function generateTodaySuggestion(month, addedFoodIds = [], todayRecords = []) {
  if (month == null || month < 6) {
    return { main: null, sides: [], fruit: null, tips: '6月龄后再开始添加辅食' }
  }

  const goal = getFeedingGoal(month)
  if (!goal) return { main: null, sides: [], fruit: null, tips: '暂无可推荐内容' }

  const todayFoodIds = new Set(todayRecords.map(r => r.foodId))
  const available = getFoodsByMonth(month).filter(f => !todayFoodIds.has(f.id))

  // 优先推荐主食
  const grains = available.filter(f => f.category === 'GRAIN' && f.introOrder <= 2)
  const main = grains.length > 0 ? grains[0] : available.find(f => f.category === 'GRAIN')

  // 推荐配菜（蔬菜+肉类，优先未添加的）
  const vegAndMeat = available.filter(
    f => (f.category === 'VEGETABLE' || f.category === 'MEAT') && f.introOrder <= 3
  )
  const sides = vegAndMeat.slice(0, 2)

  // 推荐水果
  const fruits = available.filter(f => f.category === 'FRUIT' && !todayFoodIds.has(f.id))
  const fruit = fruits.length > 0 ? fruits[0] : null

  // 生成提示
  const tips = buildSuggestionTips(month, main, sides, goal)

  return { main, sides, fruit, tips }
}

function buildSuggestionTips(month, main, sides, goal) {
  const parts = []
  parts.push(`当前${month}月龄，建议性状：${goal.texture.label}`)
  if (main) parts.push(`主食可选：${main.name}`)
  if (sides.length > 0) parts.push(`搭配：${sides.map(s => s.name).join('、')}`)
  parts.push(`每日辅食${goal.meals}餐，奶量${goal.milkAmount}`)
  return parts.join('；')
}

// ========== 日历相关 ==========

/**
 * 获取最近7天的日期数组
 * @param {string} anchorDate - 基准日期 YYYY-MM-DD，默认今天
 */
function getRecentWeekDates(anchorDate) {
  const dates = []
  const base = anchorDate ? new Date(anchorDate + 'T00:00:00') : new Date()
  // 调整到本周一
  const day = base.getDay() || 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - day + 1)

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(formatDateStr(d))
  }
  return dates
}

function formatDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 判断日期是否为今天 */
function isToday(dateStr) {
  return dateStr === formatDateStr(new Date())
}

// ========== 添加顺序规划 ==========

/**
 * 生成个性化辅食添加计划
 * @param {number} startMonth - 开始月龄（通常6）
 * @param {Array} alreadyAdded - 已添加的食物ID
 */
function generateIntroPlan(startMonth = 6, alreadyAdded = []) {
  const addedSet = new Set(alreadyAdded)
  const plan = []

  for (const week of INTRO_SCHEDULE_TEMPLATE) {
    const weekFoods = week.foods
      .map(id => getFoodById(id))
      .filter(Boolean)
      .map(f => ({
        ...f,
        isAdded: addedSet.has(f.id),
        canAdd: startMonth >= f.startMonth
      }))

    const allAdded = weekFoods.every(f => f.isAdded)
    plan.push({
      week: week.week,
      note: week.note,
      foods: weekFoods,
      status: allAdded ? 'completed' : weekFoods.some(f => f.isAdded) ? 'inProgress' : 'pending'
    })
  }

  return plan
}

// ========== 导出 ==========

module.exports = {
  // 查询
  getFoodById,
  getAllFoods,
  getFoodsByCategory,
  getFoodsByMonth,
  getRecommendedNewFoods,
  searchFoods,
  // 月龄与性状
  getRecommendedTexture,
  getFeedingGoal,
  // 排敏
  getAllergyStatus,
  getBatchAllergyStatus,
  // 营养
  analyzeNutrients,
  calcDiversityScore,
  // 推荐
  generateTodaySuggestion,
  // 日历
  getRecentWeekDates,
  isToday,
  formatDateStr,
  // 规划
  generateIntroPlan,
  // 常量透传
  FOOD_CATEGORIES,
  TEXTURE_STAGES,
  ALLERGEN_LEVEL
}
