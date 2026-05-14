const { formatDate } = require('../../utils/util')
const db = require('../../utils/db')
const foodUtils = require('../../utils/foodUtils')
const { FOOD_CATEGORIES } = require('../../data/foodData')

Page({
  data: {
    activeTab: 'height',
    records: [],
    loading: false,

    heightForm: { height: '', weight: '', headCircum: '', date: '' },
    sleepForm: { startTime: '', endTime: '', date: '', note: '' },
    feedForm: { type: 'breast', amount: '', duration: '', breastSide: 'left', date: '', note: '', solidType: '', solidAmount: '' },
    poopForm: { color: 'yellow', texture: 'soft', date: '', note: '' },
    foodForm: { foodId: '', foodName: '', amount: '', unit: 'g', date: '', mealTime: '午餐', note: '' },
    foodRecommendations: [],
    mealOptions: ['早餐', '午餐', '加餐', '晚餐'],
    mealIndex: 1,

    // 睡眠计时状态
    sleepTimerRunning: false,
    sleepTimerStart: null,
    sleepTimerDisplay: '00:00:00',
    sleepTimerInterval: null,

    tabs: [
      { key: 'height', label: '身高体重', icon: '📏' },
      { key: 'sleep', label: '睡眠', icon: '😴' },
      { key: 'feed', label: '喂养', icon: '🍼' },
      { key: 'food', label: '辅食', icon: '🍽️' },
      { key: 'poop', label: '便便', icon: '💩' }
    ],

    feedTypes: [
      { key: 'breast', label: '母乳' },
      { key: 'formula', label: '奶粉' },
      { key: 'mixed', label: '混合' },
      { key: 'solid', label: '辅食' }
    ],

    solidTypes: [
      { key: 'rice', label: '米粉' },
      { key: 'fruit', label: '水果' },
      { key: 'veggie', label: '蔬菜' },
      { key: 'meat', label: '肉泥' },
      { key: 'egg', label: '蛋黄' },
      { key: 'noodle', label: '面条' },
      { key: 'porridge', label: '粥' },
      { key: 'other', label: '其他' }
    ],

    poopColors: [
      { key: 'yellow', label: '黄色', color: '#FFD54F' },
      { key: 'green', label: '绿色', color: '#81C784' },
      { key: 'brown', label: '棕色', color: '#A1887F' },
      { key: 'black', label: '黑色', color: '#424242' },
      { key: 'red', label: '红色', color: '#E57373' },
      { key: 'white', label: '白色', color: '#E0E0E0' }
    ],

    poopTextures: [
      { key: 'soft', label: '软糊状' },
      { key: 'mushy', label: '稀糊状' },
      { key: 'hard', label: '偏硬' },
      { key: 'liquid', label: '水样' },
      { key: 'granular', label: '颗粒状' }
    ],

    // 左滑删除
    touchStartX: 0,
    swipedId: null
  },

  onLoad(options) {
    if (options.type) this.setData({ activeTab: options.type })
    const today = formatDate()
    this.setData({
      'heightForm.date': today, 'sleepForm.date': today,
      'feedForm.date': today, 'poopForm.date': today, 'foodForm.date': today
    })
    this.loadFoodRecommendations()
    this.loadRecords()
  },

  onShow() { this.loadRecords() },

  onUnload() {
    if (this.data.sleepTimerInterval) clearInterval(this.data.sleepTimerInterval)
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab, records: [], swipedId: null })
    if (tab === 'food') this.loadFoodRecommendations()
    this.loadRecords()
  },

  // ===== 辅食推荐 =====
  async loadFoodRecommendations() {
    try {
      const baby = await db.getBabyInfo()
      if (!baby || !baby.birthDate) return
      const age = require('../../utils/util').calcBabyAge(baby.birthDate)
      const addedIds = await db.getAddedFoodIds()
      const recs = foodUtils.getRecommendedNewFoods(age.months, addedIds).slice(0, 6).map(f => {
        const cat = FOOD_CATEGORIES[f.category] || {}
        return { ...f, icon: cat.icon || '🍽️' }
      })
      this.setData({ foodRecommendations: recs })
    } catch (e) { console.error('loadFoodRecommendations error', e) }
  },

  // ===== 辅食表单 =====
  onFoodDateChange(e) { this.setData({ 'foodForm.date': e.detail.value }) },
  onFoodMealChange(e) {
    const idx = parseInt(e.detail.value)
    const meals = this.data.mealOptions
    this.setData({ mealIndex: idx, 'foodForm.mealTime': meals[idx] })
  },
  goStats() {
    wx.showToast({ title: '统计功能开发中', icon: 'none' })
  },
  onFoodAmountInput(e) { this.setData({ 'foodForm.amount': e.detail.value }) },
  onFoodNoteInput(e) { this.setData({ 'foodForm.note': e.detail.value }) },
  onSelectFoodChip(e) {
    const food = e.currentTarget.dataset.food
    this.setData({
      'foodForm.foodId': food.id,
      'foodForm.foodName': food.name,
      'foodForm.unit': food.unit || 'g'
    })
  },
  async submitFood() {
    const { foodId, foodName, amount, unit, date, mealTime, note } = this.data.foodForm
    if (!foodId) { wx.showToast({ title: '请选择食物', icon: 'none' }); return }
    wx.showLoading({ title: '保存中...' })
    try {
      await db.addFoodLog({ foodId, foodName, amount: amount ? amount + unit : '', date, mealTime, note, hasReaction: false })
      wx.hideLoading(); wx.showToast({ title: '记录成功' })
      this.setData({ 'foodForm.foodId': '', 'foodForm.foodName': '', 'foodForm.amount': '', 'foodForm.note': '' })
      this.loadRecords()
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) }
  },
  goFoodDetail() {
    wx.navigateTo({ url: '/pages/food/food' })
  },

  // ===== 身高体重 =====
  onHeightInput(e) { this.setData({ 'heightForm.height': e.detail.value }) },
  onWeightInput(e) { this.setData({ 'heightForm.weight': e.detail.value }) },
  onHeadInput(e) { this.setData({ 'heightForm.headCircum': e.detail.value }) },
  onHeightDateChange(e) { this.setData({ 'heightForm.date': e.detail.value }) },

  async submitHeight() {
    const { height, weight, headCircum, date } = this.data.heightForm
    if (!height && !weight && !headCircum) { wx.showToast({ title: '请至少填写一项', icon: 'none' }); return }
    wx.showLoading({ title: '保存中...' })
    try {
      if (height) await db.addRecord({ type: 'height', value: parseFloat(height), unit: 'cm', date, typeLabel: '身高', displayValue: `${height}cm` })
      if (weight) await db.addRecord({ type: 'weight', value: parseFloat(weight), unit: 'kg', date, typeLabel: '体重', displayValue: `${weight}kg` })
      if (headCircum) await db.addRecord({ type: 'headCircum', value: parseFloat(headCircum), unit: 'cm', date, typeLabel: '头围', displayValue: `${headCircum}cm` })
      wx.hideLoading(); wx.showToast({ title: '记录成功' })
      this.setData({ 'heightForm.height': '', 'heightForm.weight': '', 'heightForm.headCircum': '' })
      this.loadRecords()
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) }
  },

  // ===== 睡眠 =====
  onSleepStartChange(e) { this.setData({ 'sleepForm.startTime': e.detail.value }) },
  onSleepEndChange(e) { this.setData({ 'sleepForm.endTime': e.detail.value }) },
  onSleepDateChange(e) { this.setData({ 'sleepForm.date': e.detail.value }) },
  onSleepNoteInput(e) { this.setData({ 'sleepForm.note': e.detail.value }) },

  async submitSleep() {
    const { startTime, endTime, date, note } = this.data.sleepForm
    if (!startTime || !endTime) { wx.showToast({ title: '请选择起止时间', icon: 'none' }); return }
    wx.showLoading({ title: '保存中...' })
    try {
      let dur = (new Date(`${date} ${endTime}`) - new Date(`${date} ${startTime}`)) / 60000
      if (dur < 0) dur += 1440
      const h = Math.floor(dur / 60), m = Math.round(dur % 60)
      await db.addRecord({ type: 'sleep', startTime, endTime, date, note, duration: dur, typeLabel: '睡眠', displayValue: h > 0 ? `${h}小时${m}分钟` : `${m}分钟` })
      wx.hideLoading(); wx.showToast({ title: '记录成功' })
      this.setData({ 'sleepForm.startTime': '', 'sleepForm.endTime': '', 'sleepForm.note': '' })
      this.loadRecords()
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) }
  },

  // ===== 喂养 =====
  onFeedTypeChange(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ 'feedForm.type': this.data.feedTypes[idx].key })
  },
  onFeedAmountInput(e) { this.setData({ 'feedForm.amount': e.detail.value }) },
  onFeedDurationInput(e) { this.setData({ 'feedForm.duration': e.detail.value }) },
  onFeedSideChange(e) { this.setData({ 'feedForm.breastSide': e.currentTarget.dataset.side }) },
  onFeedDateChange(e) { this.setData({ 'feedForm.date': e.detail.value }) },
  onFeedNoteInput(e) { this.setData({ 'feedForm.note': e.detail.value }) },
  onSolidTypeChange(e) { this.setData({ 'feedForm.solidType': e.currentTarget.dataset.key }) },
  onSolidAmountInput(e) { this.setData({ 'feedForm.solidAmount': e.detail.value }) },

  async submitFeed() {
    const { type, amount, duration, breastSide, date, note, solidType, solidAmount } = this.data.feedForm
    wx.showLoading({ title: '保存中...' })
    try {
      let displayValue = ''
      if (type === 'breast' || type === 'mixed') {
        const side = breastSide === 'left' ? '左' : breastSide === 'right' ? '右' : '双侧'
        displayValue = `母乳 ${side}侧 ${duration || '?'}分钟`
      } else if (type === 'formula') {
        displayValue = `奶粉 ${amount || '?'}ml`
      } else if (type === 'solid') {
        const solid = this.data.solidTypes.find(s => s.key === solidType)
        displayValue = `${solid ? solid.label : '辅食'} ${solidAmount || ''}g`
      }
      const feedType = this.data.feedTypes.find(f => f.key === type)
      const extraData = type === 'solid' ? { solidType, solidAmount: solidAmount ? parseFloat(solidAmount) : null } : {}
      await db.addRecord({
        type: 'feed', feedType: type, feedTypeLabel: feedType.label,
        amount: amount ? parseFloat(amount) : null,
        duration: duration ? parseInt(duration) : null,
        breastSide, date, note, typeLabel: '喂养', displayValue, ...extraData
      })
      wx.hideLoading(); wx.showToast({ title: '记录成功' })
      this.setData({ 'feedForm.amount': '', 'feedForm.duration': '', 'feedForm.note': '', 'feedForm.solidType': '', 'feedForm.solidAmount': '' })
      this.loadRecords()
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) }
  },

  // ===== 便便 =====
  onPoopColorChange(e) { this.setData({ 'poopForm.color': e.currentTarget.dataset.key }) },
  onPoopTextureChange(e) { this.setData({ 'poopForm.texture': e.currentTarget.dataset.key }) },
  onPoopDateChange(e) { this.setData({ 'poopForm.date': e.detail.value }) },
  onPoopNoteInput(e) { this.setData({ 'poopForm.note': e.detail.value }) },

  async submitPoop() {
    const { color, texture, date, note } = this.data.poopForm
    wx.showLoading({ title: '保存中...' })
    try {
      const c = this.data.poopColors.find(x => x.key === color)
      const t = this.data.poopTextures.find(x => x.key === texture)
      await db.addRecord({ type: 'poop', color, texture, date, note, typeLabel: '便便', displayValue: `${c.label}${t.label}` })
      wx.hideLoading(); wx.showToast({ title: '记录成功' })
      this.setData({ 'poopForm.note': '' })
      this.loadRecords()
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) }
  },

  // ===== 睡眠计时 =====
  toggleSleepTimer() {
    if (this.data.sleepTimerRunning) {
      // 停止计时
      clearInterval(this.data.sleepTimerInterval)
      const start = this.data.sleepTimerStart
      const end = new Date()
      const dur = Math.round((end - start) / 60000)
      const h = Math.floor(dur / 60), m = dur % 60
      const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      this.setData({
        sleepTimerRunning: false,
        sleepTimerInterval: null,
        'sleepForm.startTime': startTime,
        'sleepForm.endTime': endTime,
        sleepTimerDisplay: '00:00:00'
      })
      wx.showToast({ title: `睡了${h > 0 ? h + '小时' : ''}${m}分钟`, icon: 'none' })
    } else {
      // 开始计时
      const now = new Date()
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - now.getTime()) / 1000)
        const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0')
        const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
        const ss = String(elapsed % 60).padStart(2, '0')
        this.setData({ sleepTimerDisplay: `${hh}:${mm}:${ss}` })
      }, 1000)
      this.setData({
        sleepTimerRunning: true,
        sleepTimerStart: now,
        sleepTimerInterval: interval,
        sleepTimerDisplay: '00:00:00'
      })
    }
  },

  // ===== 左滑删除 =====
  onTouchStart(e) { this.setData({ touchStartX: e.touches[0].clientX }) },
  onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    const id = e.currentTarget.dataset.id
    if (dx < -60) {
      this.setData({ swipedId: id })
    } else if (dx > 30) {
      this.setData({ swipedId: null })
    }
  },
  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      confirmColor: '#FF6B81',
      success: async (res) => {
        if (res.confirm) {
          if (type === 'food') {
            await db.deleteFoodLog(id)
          } else {
            await db.deleteRecord(id)
          }
          wx.showToast({ title: '已删除' })
          this.setData({ swipedId: null })
          this.loadRecords()
        }
      }
    })
  },

  // ===== 列表 =====
  async loadRecords() {
    this.setData({ loading: true })
    try {
      if (this.data.activeTab === 'food') {
        const logs = await db.getFoodLogs({ limit: 50 })
        const enriched = logs.map(l => {
          const food = foodUtils.getFoodById(l.foodId)
          return {
            ...l,
            type: 'food',
            typeLabel: '辅食',
            displayValue: `${l.foodName} ${l.amount || ''}`,
            _categoryIcon: food ? (FOOD_CATEGORIES[food.category] || {}).icon : '🍽️'
          }
        })
        this.setData({ records: enriched, loading: false })
      } else {
        const records = await db.getRecords({ type: this.data.activeTab, limit: 50 })
        this.setData({ records, loading: false })
      }
    } catch (e) { this.setData({ loading: false }) }
  }
})
