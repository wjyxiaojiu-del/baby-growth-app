const { calcBabyAge } = require('../../utils/util')
const db = require('../../utils/db')
const { getAllReminders } = require('../../utils/reminders')

Page({
  data: {
    babyInfo: null,
    babyAge: null,
    reminders: { growthSpurt: [], teething: [], food: [], checkup: [] },
    loading: true,
    activeCategory: 'all'
  },

  onLoad() { this.initData() },

  async initData() {
    const baby = await db.getBabyInfo()
    if (baby) {
      const age = calcBabyAge(baby.birthDate)
      const reminders = getAllReminders(age.months)
      this.setData({ babyInfo: baby, babyAge: age, reminders, loading: false })
    } else {
      this.setData({ loading: false })
    }
  },

  switchCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat })
  },

  getDisplayReminders() {
    const { reminders, activeCategory } = this.data
    if (activeCategory === 'all') {
      return [
        ...reminders.growthSpurt.map(r => ({ ...r, category: '猛涨期', icon: '📈', type: 'growthSpurt' })),
        ...reminders.teething.map(r => ({ ...r, category: '出牙期', icon: '🦷', type: 'teething' })),
        ...reminders.food.map(r => ({ ...r, category: '辅食', icon: r.icon || '🍽️', type: 'food' })),
        ...reminders.checkup.map(r => ({ ...r, category: '体检', icon: '🏥', type: 'checkup' }))
      ]
    }
    const map = {
      growthSpurt: reminders.growthSpurt.map(r => ({ ...r, category: '猛涨期', icon: '📈', type: 'growthSpurt' })),
      teething: reminders.teething.map(r => ({ ...r, category: '出牙期', icon: '🦷', type: 'teething' })),
      food: reminders.food.map(r => ({ ...r, category: '辅食', icon: r.icon || '🍽️', type: 'food' })),
      checkup: reminders.checkup.map(r => ({ ...r, category: '体检', icon: '🏥', type: 'checkup' }))
    }
    return map[activeCategory] || []
  },

  onShareAppMessage() {
    return { title: `${this.data.babyInfo?.nickname || '宝宝'}的发育提醒`, path: '/pages/remind/remind' }
  }
})
