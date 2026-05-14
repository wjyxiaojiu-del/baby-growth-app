const sync = require('./utils/sync')

App({
  onLaunch() {
    // 初始化数据同步
    this.initSync()
  },

  async initSync() {
    try {
      const result = await sync.initSync()
      if (result.success) {
        console.log('[Sync] 初始化成功:', result.action || 'ok')
        this.globalData.syncReady = true
      } else {
        console.warn('[Sync] 初始化失败:', result.error)
      }
    } catch (e) {
      console.warn('[Sync] 同步服务不可用，使用本地模式')
    }
    this.globalData.syncStatus = sync.getSyncStatus()
  },

  // 手动触发同步
  async manualSync() {
    try {
      const result = await sync.fullSync()
      return result
    } catch (e) {
      return { success: false, error: e.message }
    }
  },

  globalData: {
    userInfo: null,
    babyInfo: null,
    syncReady: false,
    syncStatus: null
  }
})
