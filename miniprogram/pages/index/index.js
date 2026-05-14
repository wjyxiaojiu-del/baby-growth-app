const { calcBabyAge, formatDate } = require('../../utils/util')
const db = require('../../utils/db')
const { checkAndUnlock } = require('../../utils/achievements')
const { getAllReminders } = require('../../utils/reminders')

Page({
  data: {
    babyInfo: null,
    babyAge: null,
    todaySummary: {},
    recentRecords: [],
    vaccineReminder: null,
    aiReady: false,
    loading: true,
    activeReminders: []
  },

  onLoad() { this.initData() },

  onShow() {
    this.loadTodaySummary()
    this.loadRecentRecords()
    this.checkVaccineReminder()
    this.checkAchievements()
  },

  async initData() {
    try {
      const baby = await db.getBabyInfo()
      if (baby) {
        const age = calcBabyAge(baby.birthDate)
        const reminders = getAllReminders(age.months)
        const activeReminders = [
          ...reminders.growthSpurt.map(r => ({ ...r, icon: '📈', type: '猛涨期' })),
          ...reminders.teething.map(r => ({ ...r, icon: '🦷', type: '出牙期' })),
          ...reminders.food.map(r => ({ ...r, icon: r.icon || '🍽️', type: '辅食' })),
          ...reminders.checkup.map(r => ({ ...r, icon: '🏥', type: '体检' }))
        ].slice(0, 3)
        this.setData({ babyInfo: baby, babyAge: age, activeReminders, loading: false })
        this.checkAIDataReady()
      } else {
        this.setData({ loading: false })
        wx.showModal({
          title: '欢迎使用',
          content: '请先完善宝宝信息，开始记录成长',
          confirmText: '去填写',
          success: (res) => {
            if (res.confirm) wx.navigateTo({ url: '/pages/profile/edit-baby' })
          }
        })
      }
    } catch (e) {
      console.error('初始化失败:', e)
      this.setData({ loading: false })
    }
  },

  async loadTodaySummary() {
    const today = formatDate()
    const [records, foodLogs] = await Promise.all([
      db.getRecords({ date: today }),
      db.getFoodLogs({ date: today })
    ])
    const summary = { sleepCount: 0, feedCount: 0, poopCount: 0, height: null, weight: null, foodCount: foodLogs.length }
    records.forEach(r => {
      if (r.type === 'sleep') summary.sleepCount++
      if (r.type === 'feed') summary.feedCount++
      if (r.type === 'poop') summary.poopCount++
      if (r.type === 'height') summary.height = r.value
      if (r.type === 'weight') summary.weight = r.value
    })
    this.setData({ todaySummary: summary })
  },

  async loadRecentRecords() {
    const records = await db.getRecords({ limit: 5 })
    this.setData({ recentRecords: records })
  },

  async checkVaccineReminder() {
    const baby = await db.getBabyInfo()
    if (!baby) return
    const completed = await db.getCompletedVaccines()
    const completedNames = new Set(completed.map(c => c.name))
    const birth = new Date(baby.birthDate)
    const now = new Date()
    const soon = new Date(now.getTime() + 3 * 86400000)

    const schedule = [
      { name: '乙肝疫苗（第2针）', days: 30 },
      { name: '脊灰疫苗（第1针）', days: 60 },
      { name: '百白破疫苗（第1针）', days: 90 },
      { name: '麻风疫苗', days: 240 }
    ]

    const upcoming = schedule.find(v => {
      const due = new Date(birth.getTime() + v.days * 86400000)
      return !completedNames.has(v.name) && due >= now && due <= soon
    })

    if (upcoming) {
      const dueDate = new Date(birth.getTime() + upcoming.days * 86400000)
      this.setData({ vaccineReminder: { name: upcoming.name, dueDate: formatDate(dueDate) } })
    }
  },

  async checkAIDataReady() {
    const count = await db.getRecordCount()
    this.setData({ aiReady: count >= 15 })
  },

  async checkAchievements() {
    const newOnes = await checkAndUnlock(db)
    if (newOnes.length > 0) {
      const first = newOnes[0]
      wx.showToast({ title: `🎉 解锁成就：${first.title}`, icon: 'none', duration: 2000 })
    }
  },

  goRecord() { wx.switchTab({ url: '/pages/record/record' }) },
  goMilestone() { wx.switchTab({ url: '/pages/milestone/milestone' }) },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }) },
  goVaccine() { wx.navigateTo({ url: '/pages/vaccine/vaccine' }) },
  goEditBaby() { wx.navigateTo({ url: '/pages/profile/edit-baby' }) },
  goFood() { wx.navigateTo({ url: '/pages/food/food' }) },
  goAlbum() { wx.navigateTo({ url: '/pages/album/album' }) },
  goRemind() { wx.navigateTo({ url: '/pages/remind/remind' }) },
  goKnowledge() { wx.navigateTo({ url: '/pages/knowledge/knowledge' }) }
})
