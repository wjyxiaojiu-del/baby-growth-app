const { calcBabyAge, formatDate } = require('../../utils/util')
const db = require('../../utils/db')

const VACCINE_SCHEDULE = [
  { month: 0, name: '乙肝疫苗（第1针）', category: '一类', days: 0 },
  { month: 0, name: '卡介苗', category: '一类', days: 0 },
  { month: 1, name: '乙肝疫苗（第2针）', category: '一类', days: 30 },
  { month: 2, name: '脊灰疫苗（第1针）', category: '一类', days: 60 },
  { month: 3, name: '脊灰疫苗（第2针）', category: '一类', days: 90 },
  { month: 3, name: '百白破疫苗（第1针）', category: '一类', days: 90 },
  { month: 4, name: '脊灰疫苗（第3针）', category: '一类', days: 120 },
  { month: 4, name: '百白破疫苗（第2针）', category: '一类', days: 120 },
  { month: 5, name: '百白破疫苗（第3针）', category: '一类', days: 150 },
  { month: 6, name: '乙肝疫苗（第3针）', category: '一类', days: 180 },
  { month: 6, name: 'A群流脑疫苗（第1针）', category: '一类', days: 180 },
  { month: 8, name: '麻风疫苗', category: '一类', days: 240 },
  { month: 9, name: 'A群流脑疫苗（第2针）', category: '一类', days: 270 }
]

Page({
  data: { vaccines: [], loading: true },

  onLoad() { this.loadVaccines() },

  async loadVaccines() {
    try {
      const baby = await db.getBabyInfo()
      if (!baby) { this.setData({ loading: false }); return }

      const birth = new Date(baby.birthDate)
      const now = new Date()
      const completed = await db.getCompletedVaccines()
      const completedNames = new Set(completed.map(c => c.name))

      const vaccines = VACCINE_SCHEDULE.map(v => {
        const due = new Date(birth.getTime() + v.days * 86400000)
        const isPast = due < now
        const isUpcoming = !isPast && (due - now) < 3 * 86400000
        const done = completedNames.has(v.name)

        return {
          ...v,
          dueDate: formatDate(due),
          status: done ? 'completed' : isPast ? 'overdue' : isUpcoming ? 'upcoming' : 'pending',
          statusLabel: done ? '已接种' : isPast ? '已到期' : isUpcoming ? '即将到期' : '待接种',
          statusColor: done ? '#4CAF50' : isPast ? '#FF6B81' : isUpcoming ? '#FF9800' : '#CCC'
        }
      })

      this.setData({ vaccines, loading: false })
    } catch (e) { this.setData({ loading: false }) }
  },

  async markCompleted(e) {
    const { name, category, duedate } = e.currentTarget.dataset
    wx.showModal({
      title: '确认接种',
      content: `确认已接种 "${name}" 吗？`,
      success: async (res) => {
        if (res.confirm) {
          await db.addVaccineRecord({ name, category, dueDate: duedate, status: 'completed', completedDate: formatDate() })
          wx.showToast({ title: '已标记接种' })
          this.loadVaccines()
        }
      }
    })
  }
})
