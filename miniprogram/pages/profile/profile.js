const { calcBabyAge } = require('../../utils/util')
const db = require('../../utils/db')
const sync = require('../../utils/sync')
const { getAllAchievements, checkAndUnlock } = require('../../utils/achievements')

Page({
  data: {
    babyInfo: null,
    babyAge: null,
    stats: { recordCount: 0, reportCount: 0, milestoneCount: 0, foodLogCount: 0 },
    achievements: [],
    unlockedCount: 0,
    showAllAchievements: false,
    syncStatus: null,
    syncing: false,
    menuItems: [
      { key: 'editBaby', label: '编辑宝宝信息', icon: '👶' },
      { key: 'multiBaby', label: '多宝宝管理', icon: '👶👶' },
      { key: 'album', label: '成长相册', icon: '📷' },
      { key: 'remind', label: '智能提醒', icon: '🔔' },
      { key: 'knowledge', label: '育儿知识库', icon: '📚' },
      { key: 'vaccine', label: '疫苗接种管理', icon: '💉' },
      { key: 'export', label: '导出成长数据', icon: '📤' },
      { key: 'sync', label: '数据同步', icon: '☁️' },
      { key: 'privacy', label: '隐私设置', icon: '🔒' },
      { key: 'feedback', label: '意见反馈', icon: '💬' },
      { key: 'about', label: '关于我们', icon: 'ℹ️' }
    ]
  },

  onLoad() { this.loadBabyInfo(); this.loadStats(); this.loadAchievements(); this.loadSyncStatus() },
  onShow() { this.loadBabyInfo(); this.loadAchievements(); this.loadSyncStatus() },

  async loadBabyInfo() {
    try {
      const baby = await db.getBabyInfo()
      if (baby) {
        this.setData({ babyInfo: baby, babyAge: calcBabyAge(baby.birthDate) })
      }
    } catch (e) { console.error('加载宝宝信息失败:', e) }
  },

  async loadStats() {
    try {
      const [rc, rsc, mc, fc] = await Promise.all([db.getRecordCount(), db.getReportCount(), db.getMilestoneCheckCount(), db.getFoodLogCount()])
      this.setData({ stats: { recordCount: rc, reportCount: rsc, milestoneCount: mc, foodLogCount: fc } })
    } catch (e) { console.error('加载统计失败:', e) }
  },

  async loadAchievements() {
    await checkAndUnlock(db)
    const all = await getAllAchievements(db)
    const unlockedCount = all.filter(a => a.unlocked).length
    this.setData({ achievements: all, unlockedCount })
  },

  toggleAchievements() {
    this.setData({ showAllAchievements: !this.data.showAllAchievements })
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key
    switch (key) {
      case 'editBaby': wx.navigateTo({ url: '/pages/profile/edit-baby' }); break
      case 'multiBaby': this.showMultiBabyManager(); break
      case 'album': wx.navigateTo({ url: '/pages/album/album' }); break
      case 'remind': wx.navigateTo({ url: '/pages/remind/remind' }); break
      case 'knowledge': wx.navigateTo({ url: '/pages/knowledge/knowledge' }); break
      case 'vaccine': wx.navigateTo({ url: '/pages/vaccine/vaccine' }); break
      case 'export': this.exportData(); break
      case 'sync': this.manualSync(); break
      case 'privacy': wx.navigateTo({ url: '/pages/profile/privacy' }); break
      case 'feedback': wx.showToast({ title: '感谢反馈！', icon: 'none' }); break
      case 'about': wx.navigateTo({ url: '/pages/profile/about' }); break
    }
  },

  loadSyncStatus() {
    const status = sync.getSyncStatus()
    const lastTime = status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : '从未同步'
    this.setData({ syncStatus: { ...status, lastSyncTimeStr: lastTime } })
  },

  async manualSync() {
    if (this.data.syncing) return
    this.setData({ syncing: true })
    wx.showLoading({ title: '同步中...' })

    try {
      const result = await sync.fullSync()
      wx.hideLoading()
      this.loadSyncStatus()
      if (result.success) {
        wx.showToast({ title: result.action === 'download' ? '数据已恢复' : '同步完成' })
      } else {
        wx.showToast({ title: '同步失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '同步失败', icon: 'none' })
    } finally {
      this.setData({ syncing: false })
    }
  },

  async showMultiBabyManager() {
    const babies = await db.getAllBabies()
    const activeBaby = await db.getBabyInfo()
    const items = babies.map(b => `${b._id === activeBaby?._id ? '✓ ' : ''}${b.nickname || '宝宝'} (${b.gender === 'girl' ? '女' : '男'})`)
    items.push('+ 添加新宝宝')
    items.push('取消')

    wx.showActionSheet({
      itemList: items,
      success: async (res) => {
        if (res.tapIndex < babies.length) {
          // 切换宝宝
          await db.switchBaby(babies[res.tapIndex]._id)
          this.loadBabyInfo()
          this.loadStats()
          this.loadAchievements()
          wx.showToast({ title: `已切换到 ${babies[res.tapIndex].nickname || '宝宝'}` })
        } else if (res.tapIndex === babies.length) {
          // 添加新宝宝
          wx.showModal({
            title: '添加宝宝',
            editable: true,
            placeholderText: '宝宝昵称',
            success: async (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                await db.addBaby({ nickname: modalRes.content, gender: 'boy', birthDate: '' })
                this.loadBabyInfo()
                this.loadStats()
                wx.showToast({ title: '已添加，请编辑宝宝信息' })
                wx.navigateTo({ url: '/pages/profile/edit-baby' })
              }
            }
          })
        }
      }
    })
  },

  async exportData() {
    wx.showLoading({ title: '导出中...' })
    try {
      const records = await db.getRecords({ limit: 9999 })
      let csv = '日期,类型,数值,单位,备注\n'
      records.forEach(r => {
        csv += `${r.date},${r.typeLabel || r.type},${r.value || ''},${r.unit || ''},${r.note || ''}\n`
      })
      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/baby_growth_data.csv`
      fs.writeFileSync(filePath, csv, 'utf8')
      wx.hideLoading()
      wx.shareFileMessage({
        filePath,
        success: () => wx.showToast({ title: '导出成功' }),
        fail: () => wx.showToast({ title: '导出取消', icon: 'none' })
      })
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }) }
  },

  async clearAllData() {
    wx.showModal({
      title: '确认删除',
      content: '此操作将删除所有宝宝数据，且无法恢复。确定要删除吗？',
      confirmColor: '#FF4444',
      success: async (res) => {
        if (res.confirm) {
          await db.clearAllData()
          this.setData({ babyInfo: null, babyAge: null, stats: { recordCount: 0, reportCount: 0, milestoneCount: 0, foodLogCount: 0 }, achievements: [], unlockedCount: 0 })
          wx.showToast({ title: '已删除所有数据' })
        }
      }
    })
  }
})
