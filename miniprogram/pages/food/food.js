/**
 * 辅食助手 — 深度功能页面
 * 从记录页面的辅食Tab点击"去辅食助手"进入
 * 
 * 设计原则：
 * - data 中只放 wxml 能直接绑定的纯数据（无方法调用、无 Object.xxx）
 * - 所有预处理在 JS 中完成
 * - 空值一律兜底，wxml 不做复杂判断
 */

const db = require('../../utils/db')
const { calcBabyAge } = require('../../utils/util')
const foodUtils = require('../../utils/foodUtils')
const { FOOD_CATEGORIES, ALLERGEN_LEVEL, TEXTURE_STAGES, NUTRIENT_TAGS } = require('../../data/foodData')

const TABS = [
  { key: 'calendar', label: '日历' },
  { key: 'encyclopedia', label: '百科' },
  { key: 'allergy', label: '排敏' },
  { key: 'analysis', label: '分析' }
]

/** 预处理好所有常量，以数组形式暴露给 wxml */
const CATEGORY_LIST = Object.entries(FOOD_CATEGORIES).map(([k, v]) => ({ key: k, ...v }))
const TEXTURE_LIST = Object.entries(TEXTURE_STAGES).map(([k, v]) => ({ key: k, ...v }))
const ALLERGEN_LIST = Object.entries(ALLERGEN_LEVEL).map(([k, v]) => ({ key: k, ...v }))
const NUTRIENT_LIST = Object.entries(NUTRIENT_TAGS).map(([k, v]) => ({ key: k, label: v }))

/** 安全的对象取值 */
function safeGet(obj, key, fallback = null) {
  return obj && obj[key] !== undefined ? obj[key] : fallback
}

/** 今天日期字符串 YYYY-MM-DD */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 判断是否为今天 */
function isToday(dateStr) {
  return dateStr === todayStr()
}

/** 获取星期几名称 */
function getDayName(dateStr) {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  const names = ['日', '一', '二', '三', '四', '五', '六']
  return names[day]
}

/** 获取近7天日期 */
function getWeekDates() {
  const dates = []
  const base = new Date()
  const day = base.getDay() || 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - day + 1)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dates.push({
      date: s,
      dayName: getDayName(s),
      dayNum: String(d.getDate()).padStart(2, '0'),
      isToday: isToday(s)
    })
  }
  return dates
}

Page({
  data: {
    activeTab: 'calendar',
    tabs: TABS,
    babyMonths: 0,
    canAddFood: false,

    // 常量数组（wxml 直接遍历）
    categoryList: CATEGORY_LIST,
    textureList: TEXTURE_LIST,
    allergenList: ALLERGEN_LIST,
    nutrientList: NUTRIENT_LIST,

    // 日历
    calendarLoading: false,
    weekDates: getWeekDates(),
    selectedDate: todayStr(),
    todayLogs: [],
    todayLogsEmpty: true,
    suggestionMain: null,
    suggestionSides: [],
    suggestionFruit: null,
    suggestionTips: '',
    hasSuggestion: false,
    diversityScore: 0,

    // 百科
    encyclopediaLoading: false,
    searchKeyword: '',
    activeCategory: 'ALL',
    foodList: [],
    filteredFoodList: [],
    selectedFood: null,
    showDetail: false,

    // 排敏
    allergyLoading: false,
    allergyList: [],
    allergyEmpty: true,

    // 分析
    analysisLoading: false,
    analysisRange: 'week',
    analysisNutrients: [],
    analysisNutrientsEmpty: true,
    analysisCategoryStats: [],
    analysisCategoryStatsEmpty: true,
    analysisDiversityTrend: [],
    analysisTrendEmpty: true
  },

  onLoad() {
    const selectedDate = todayStr()
    const weekDates = getWeekDates().map(d => ({ ...d, isSelected: d.date === selectedDate }))
    this.setData({ selectedDate, weekDates })
    this._loadBaby().then(() => this._loadActiveTab())
  },

  onShow() {
    this._loadActiveTab()
  },

  // ==================== Tab 切换 ====================

  onTabChange(e) {
    const tab = e.currentTarget.dataset.key
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab }, () => this._loadActiveTab())
  },

  _loadActiveTab() {
    const { activeTab } = this.data
    if (activeTab === 'calendar') this._loadCalendar()
    else if (activeTab === 'encyclopedia') this._loadEncyclopedia()
    else if (activeTab === 'allergy') this._loadAllergy()
    else if (activeTab === 'analysis') this._loadAnalysis()
  },

  // ==================== 宝宝信息 ====================

  async _loadBaby() {
    try {
      const baby = await db.getBabyInfo()
      if (baby && baby.birthDate) {
        const age = calcBabyAge(baby.birthDate)
        this.setData({ babyMonths: age.months, canAddFood: age.months >= 6 })
      }
    } catch (e) { console.error(e) }
  },

  // ==================== 日历 ====================

  async _loadCalendar() {
    this.setData({ calendarLoading: true })
    try {
      const { babyMonths, selectedDate, canAddFood } = this.data
      const addedIds = await db.getAddedFoodIds()

      // 加载选中日期记录
      const logs = await db.getFoodLogs({ date: selectedDate })
      const todayLogs = logs.map(l => {
        const food = foodUtils.getFoodById(l.foodId)
        const cat = food ? safeGet(FOOD_CATEGORIES, food.category, {}) : {}
        return {
          _id: l._id,
          foodName: l.foodName || safeGet(food, 'name', '未知'),
          amount: l.amount || '',
          mealTime: l.mealTime || '',
          hasReaction: !!l.hasReaction,
          _categoryIcon: cat.icon || '🍽️',
          _categoryColor: cat.color || '#FFB5C2'
        }
      })

      // 生成推荐
      let suggestionMain = null
      let suggestionSides = []
      let suggestionFruit = null
      let suggestionTips = ''
      let hasSuggestion = false

      if (canAddFood) {
        const todayRecords = isToday(selectedDate) ? logs : []
        const suggestion = foodUtils.generateTodaySuggestion(babyMonths, addedIds, todayRecords)
        if (suggestion.main) {
          const mainCat = safeGet(FOOD_CATEGORIES, suggestion.main.category, {})
          suggestionMain = {
            id: suggestion.main.id,
            name: suggestion.main.name,
            icon: mainCat.icon || '🍽️'
          }
        }
        suggestionSides = (suggestion.sides || []).map(f => {
          const cat = safeGet(FOOD_CATEGORIES, f.category, {})
          return { id: f.id, name: f.name, icon: cat.icon || '🍽️' }
        })
        if (suggestion.fruit) {
          const cat = safeGet(FOOD_CATEGORIES, suggestion.fruit.category, {})
          suggestionFruit = {
            id: suggestion.fruit.id,
            name: suggestion.fruit.name,
            icon: cat.icon || '🍽️'
          }
        }
        suggestionTips = suggestion.tips || ''
        hasSuggestion = !!(suggestionMain || suggestionSides.length > 0)
      }

      // 多样性评分
      const dayLogs = await db.getFoodLogs({ startDate: selectedDate, endDate: selectedDate })
      const diversityScore = foodUtils.calcDiversityScore(dayLogs, addedIds)

      this.setData({
        todayLogs,
        todayLogsEmpty: todayLogs.length === 0,
        suggestionMain,
        suggestionSides,
        suggestionFruit,
        suggestionTips,
        hasSuggestion,
        diversityScore,
        calendarLoading: false
      })
    } catch (e) {
      console.error('_loadCalendar error', e)
      this.setData({ calendarLoading: false })
    }
  },

  onSelectDate(e) {
    const date = e.currentTarget.dataset.date
    const weekDates = this.data.weekDates.map(d => ({
      ...d,
      isSelected: d.date === date
    }))
    this.setData({ selectedDate: date, weekDates }, () => this._loadCalendar())
  },

  /** 快速添加：从推荐或百科 */
  onQuickAdd(e) {
    const foodId = e.currentTarget.dataset.id
    const { selectedDate } = this.data
    const food = foodUtils.getFoodById(foodId)
    if (!food || !selectedDate) return

    wx.showModal({
      title: `添加 ${food.name}`,
      content: `确认记录 ${selectedDate} 吃了 ${food.name}？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await db.addFoodLog({
            foodId: food.id,
            foodName: food.name,
            date: selectedDate,
            amount: (food.serving || '') + (food.unit || ''),
            mealTime: this._getMealTime(),
            hasReaction: false
          })
          wx.showToast({ title: '已记录', icon: 'success' })
          this._loadCalendar()
          if (this.data.activeTab === 'allergy') this._loadAllergy()
        } catch (err) {
          wx.showToast({ title: '记录失败', icon: 'none' })
        }
      }
    })
  },

  onDeleteLog(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除这条记录？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await db.deleteFoodLog(id)
          this._loadCalendar()
        } catch (err) {
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },

  onMarkReaction(e) {
    const { logId, foodId } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['皮疹/湿疹', '腹泻', '呕吐', '腹胀', '其他不适'],
      success: async (res) => {
        const symptoms = ['皮疹/湿疹', '腹泻', '呕吐', '腹胀', '其他不适']
        if (res.tapIndex >= symptoms.length) return
        try {
          await db.addFoodReaction({
            foodId,
            logId,
            symptom: symptoms[res.tapIndex],
            date: this.data.selectedDate
          })
          wx.showToast({ title: '已记录症状', icon: 'success' })
          this._loadCalendar()
          if (this.data.activeTab === 'allergy') this._loadAllergy()
        } catch (err) {
          wx.showToast({ title: '记录失败', icon: 'none' })
        }
      }
    })
  },

  _getMealTime() {
    const h = new Date().getHours()
    if (h < 10) return '早餐'
    if (h < 14) return '午餐'
    if (h < 17) return '加餐'
    return '晚餐'
  },

  // ==================== 百科 ====================

  _loadEncyclopedia() {
    const { babyMonths } = this.data
    const list = foodUtils.getAllFoods().map(f => {
      const cat = safeGet(FOOD_CATEGORIES, f.category, {})
      const allergen = safeGet(ALLERGEN_LEVEL, f.allergen, {})
      return {
        id: f.id,
        name: f.name,
        category: f.category,
        startMonth: f.startMonth,
        endMonth: f.endMonth,
        texture: f.texture,
        nutrients: f.nutrients || [],
        allergen: f.allergen,
        allergenSource: f.allergenSource || '',
        tips: f.tips || '',
        serving: f.serving || '',
        unit: f.unit || '',
        _canEat: babyMonths >= f.startMonth && babyMonths <= f.endMonth,
        _categoryIcon: cat.icon || '',
        _categoryColor: cat.color || '#EEE',
        _categoryLabel: cat.label || '',
        _allergenLabel: allergen.label || '',
        _allergenDesc: allergen.desc || ''
      }
    })
    this.setData({ foodList: list, encyclopediaLoading: false }, () => this._filterEncyclopedia())
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || '' }, () => this._filterEncyclopedia())
  },

  onCategoryTap(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.category }, () => this._filterEncyclopedia())
  },

  _filterEncyclopedia() {
    const { foodList, searchKeyword, activeCategory } = this.data
    let filtered = foodList
    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(f => f.category === activeCategory)
    }
    if (searchKeyword) {
      const kw = searchKeyword.trim().toLowerCase()
      filtered = filtered.filter(f => f.name.toLowerCase().includes(kw))
    }
    this.setData({ filteredFoodList: filtered })
  },

  onSelectFood(e) {
    const foodId = e.currentTarget.dataset.id
    const food = this.data.filteredFoodList.find(f => f.id === foodId)
    if (!food) return
    const nutrientLabels = (food.nutrients || []).map(n => {
      const found = NUTRIENT_LIST.find(x => x.key === n)
      return found ? found.label : n
    })
    this.setData({ selectedFood: { ...food, _nutrientLabels: nutrientLabels }, showDetail: true })
  },

  onCloseDetail() {
    this.setData({ showDetail: false, selectedFood: null })
  },

  preventTouchMove() {},

  // ==================== 排敏 ====================

  async _loadAllergy() {
    this.setData({ allergyLoading: true })
    try {
      const [allLogs, allReactions] = await Promise.all([
        db.getFoodLogs({}),
        db.getFoodReactions()
      ])

      // 按食物聚合日志
      const logsByFood = {}
      for (const log of allLogs) {
        if (!logsByFood[log.foodId]) logsByFood[log.foodId] = []
        logsByFood[log.foodId].push(log)
      }

      // 标记有反应的日志
      for (const r of allReactions) {
        const logs = logsByFood[r.foodId]
        if (logs) {
          const target = logs.find(l => l._id === r.logId)
          if (target) target.hasReaction = true
        }
      }

      // 计算状态
      const statusMap = foodUtils.getBatchAllergyStatus(logsByFood)
      const triedIds = Object.keys(logsByFood)

      // 已尝试的食物
      const list = []
      for (const foodId of triedIds) {
        const food = foodUtils.getFoodById(foodId)
        if (!food) continue
        const status = safeGet(statusMap, foodId, { status: 'unknown', daysObserved: 0, canProceed: false, nextAction: '' })
        const logs = logsByFood[foodId] || []
        const reactions = allReactions.filter(r => r.foodId === foodId)
        const cat = safeGet(FOOD_CATEGORIES, food.category, {})
        list.push({
          foodId: food.id,
          foodName: food.name,
          _categoryIcon: cat.icon || '',
          statusKey: status.status,
          statusLabel: this._statusLabel(status.status),
          statusColor: this._statusColor(status.status),
          daysObserved: status.daysObserved,
          nextAction: status.nextAction,
          reactions: reactions.map(r => ({ date: r.date, symptom: r.symptom })),
          hasReactions: reactions.length > 0,
          logs: logs.slice(0, 3).map(l => l.date),
          _sortKey: this._statusSortKey(status.status)
        })
      }

      // 未尝试的高风险食物（提醒）
      const highRiskNew = foodUtils.getAllFoods()
        .filter(f => !triedIds.includes(f.id) && f.allergen === 'HIGH')
        .map(f => {
          const cat = safeGet(FOOD_CATEGORIES, f.category, {})
          return {
            foodId: f.id,
            foodName: f.name,
            _categoryIcon: cat.icon || '',
            statusKey: 'new',
            statusLabel: '未尝试',
            statusColor: '#999',
            daysObserved: 0,
            nextAction: '高风险食物，首次需极少量尝试',
            reactions: [],
            hasReactions: false,
            logs: [],
            _sortKey: 4
          }
        })

      list.push(...highRiskNew)
      list.sort((a, b) => a._sortKey - b._sortKey)

      this.setData({
        allergyList: list,
        allergyEmpty: list.length === 0,
        allergyLoading: false
      })
    } catch (e) {
      console.error('_loadAllergy error', e)
      this.setData({ allergyLoading: false })
    }
  },

  _statusLabel(status) {
    const map = { reaction: '出现反应', observing: '观察中', cleared: '排敏通过', new: '未尝试', unknown: '未知' }
    return map[status] || '未知'
  },

  _statusColor(status) {
    const map = { reaction: '#ff4d4f', observing: '#faad14', cleared: '#52c41a', new: '#999', unknown: '#ccc' }
    return map[status] || '#ccc'
  },

  _statusSortKey(status) {
    const map = { reaction: 0, observing: 1, cleared: 2, new: 3, unknown: 5 }
    return map[status] || 5
  },

  // ==================== 分析 ====================

  async _loadAnalysis() {
    this.setData({ analysisLoading: true })
    try {
      const { analysisRange } = this.data
      const end = todayStr()
      const d = new Date()
      if (analysisRange === 'week') d.setDate(d.getDate() - 6)
      else d.setDate(d.getDate() - 29)
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      const logs = await db.getFoodLogs({ startDate: start, endDate: end })

      // 营养素统计
      const nutrientMap = {}
      for (const log of logs) {
        const food = foodUtils.getFoodById(log.foodId)
        if (!food || !food.nutrients) continue
        for (const n of food.nutrients) {
          nutrientMap[n] = (nutrientMap[n] || 0) + 1
        }
      }
      const analysisNutrients = Object.entries(nutrientMap)
        .map(([key, count]) => {
          const found = NUTRIENT_LIST.find(n => n.key === key)
          return { key, label: found ? found.label : key, count }
        })
        .sort((a, b) => b.count - a.count)

      // 分类统计
      const catCount = {}
      for (const log of logs) {
        const food = foodUtils.getFoodById(log.foodId)
        if (!food) continue
        catCount[food.category] = (catCount[food.category] || 0) + 1
      }
      const maxCount = Math.max(...Object.values(catCount), 1)
      const analysisCategoryStats = CATEGORY_LIST.map(c => ({
        key: c.key,
        label: c.label,
        count: catCount[c.key] || 0,
        color: c.color,
        percent: Math.round(((catCount[c.key] || 0) / maxCount) * 100)
      })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

      // 多样性趋势
      const logsByDate = {}
      for (const log of logs) {
        if (!logsByDate[log.date]) logsByDate[log.date] = []
        logsByDate[log.date].push(log)
      }
      const addedIds = await db.getAddedFoodIds()
      const analysisDiversityTrend = Object.entries(logsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayLogs]) => {
          const score = foodUtils.calcDiversityScore(dayLogs, addedIds)
          return {
            date: date.slice(5),
            score,
            color: score >= 60 ? '#52c41a' : score >= 40 ? '#faad14' : '#ff4d4f'
          }
        })

      this.setData({
        analysisNutrients,
        analysisNutrientsEmpty: analysisNutrients.length === 0,
        analysisCategoryStats,
        analysisCategoryStatsEmpty: analysisCategoryStats.length === 0,
        analysisDiversityTrend,
        analysisTrendEmpty: analysisDiversityTrend.length === 0,
        analysisLoading: false
      })
    } catch (e) {
      console.error('_loadAnalysis error', e)
      this.setData({ analysisLoading: false })
    }
  },

  onRangeChange(e) {
    const range = e.currentTarget.dataset.range
    this.setData({ analysisRange: range }, () => this._loadAnalysis())
  }
})
