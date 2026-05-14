const db = require('../../utils/db')

Page({
  data: {
    settings: [
      { key: 'dataCollection', label: '允许数据用于模型优化', desc: '匿名化数据可用于提升AI评估准确性', value: false },
      { key: 'pushReminder', label: '接收推送提醒', desc: '疫苗到期、记录提醒等', value: true },
      { key: 'shareReport', label: '允许报告分享', desc: '分享报告时包含宝宝昵称', value: true }
    ]
  },

  onLoad() { this.loadSettings() },

  loadSettings() {
    const settings = wx.getStorageSync('privacy_settings')
    if (settings) {
      this.setData({ settings: this.data.settings.map(s => ({ ...s, value: settings[s.key] ?? s.value })) })
    }
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key
    const settings = this.data.settings.map(s => s.key === key ? { ...s, value: !s.value } : s)
    this.setData({ settings })
    const map = {}
    settings.forEach(s => { map[s.key] = s.value })
    wx.setStorageSync('privacy_settings', map)
  },

  async deleteAllData() {
    wx.showModal({
      title: '确认删除',
      content: '此操作将永久删除所有宝宝数据，包括记录、报告、里程碑等，且无法恢复。',
      confirmColor: '#FF4444',
      confirmText: '确认删除',
      success: async (res) => {
        if (res.confirm) {
          await db.clearAllData()
          wx.removeStorageSync('privacy_settings')
          wx.showToast({ title: '数据已删除' })
        }
      }
    })
  }
})
