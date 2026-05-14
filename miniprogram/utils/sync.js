const api = require('./api')
const db = require('./db')

// 同步状态
let syncing = false
let lastSyncTime = 0
let syncVersion = 0

// 需要同步的集合列表
const SYNC_COLLECTIONS = [
  'baby_info', 'records', 'milestone_checks', 'ai_reports',
  'vaccine_schedule', 'food_logs', 'food_reactions',
  'photos', 'achievements', 'knowledge_favorites'
]

/**
 * 获取用户 openid
 * 微信小程序通过 wx.cloud 或 wx.login 获取
 * 这里使用一个简化的方案：首次生成并缓存
 */
function getOpenId() {
  let openid = wx.getStorageSync('user_openid')
  if (!openid) {
    openid = 'wx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    wx.setStorageSync('user_openid', openid)
  }
  return openid
}

/**
 * 收集所有本地数据
 */
function collectLocalData() {
  const data = {}
  SYNC_COLLECTIONS.forEach(name => {
    const key = `db_${name}`
    try {
      data[name] = JSON.parse(wx.getStorageSync(key) || '[]')
    } catch (e) {
      data[name] = []
    }
  })
  return data
}

/**
 * 将服务器数据写入本地
 */
function applyServerData(data) {
  if (!data) return
  SYNC_COLLECTIONS.forEach(name => {
    if (data[name]) {
      wx.setStorageSync(`db_${name}`, JSON.stringify(data[name]))
    }
  })
}

/**
 * 上传本地数据到服务器
 */
async function uploadToServer() {
  const openid = getOpenId()
  const data = collectLocalData()

  const result = await api.uploadData(openid, data)
  if (result.success) {
    syncVersion = result.version
    wx.setStorageSync('sync_version', syncVersion)
  }
  return result
}

/**
 * 从服务器下载数据到本地
 */
async function downloadFromServer() {
  const openid = getOpenId()
  const result = await api.downloadData(openid)

  if (result.success && result.data) {
    applyServerData(result.data)
    syncVersion = result.version
    wx.setStorageSync('sync_version', syncVersion)
  }
  return result
}

/**
 * 智能合并同步
 * 1. 上传本地数据到服务器（合并模式）
 * 2. 服务器返回合并后的版本号
 */
async function syncToServer() {
  if (syncing) return { success: false, error: '正在同步中' }

  syncing = true
  try {
    const openid = getOpenId()
    const data = collectLocalData()
    const clientVersion = wx.getStorageSync('sync_version') || 0

    const result = await api.mergeData(openid, data, clientVersion)
    if (result.success) {
      syncVersion = result.version
      wx.setStorageSync('sync_version', syncVersion)
      lastSyncTime = Date.now()
      wx.setStorageSync('last_sync_time', lastSyncTime)
    }
    return result
  } finally {
    syncing = false
  }
}

/**
 * 完整同步流程
 * 1. 先尝试下载服务器数据
 * 2. 如果服务器有数据且本地无数据，使用服务器数据
 * 3. 否则上传本地数据
 */
async function fullSync() {
  if (syncing) return { success: false, error: '正在同步中' }

  syncing = true
  try {
    const openid = getOpenId()

    // 先检查服务器是否有数据
    const serverResult = await api.downloadData(openid)

    if (serverResult.success && serverResult.data) {
      const localData = collectLocalData()
      const hasLocalData = SYNC_COLLECTIONS.some(name =>
        Array.isArray(localData[name]) && localData[name].length > 0
      )

      if (!hasLocalData) {
        // 本地无数据，使用服务器数据
        applyServerData(serverResult.data)
        syncVersion = serverResult.version
        wx.setStorageSync('sync_version', syncVersion)
        lastSyncTime = Date.now()
        wx.setStorageSync('last_sync_time', lastSyncTime)
        return { success: true, action: 'download', version: syncVersion }
      }
    }

    // 本地有数据或服务器无数据，执行合并同步
    const result = await syncToServer()
    return { success: result.success, action: 'merge', version: syncVersion }
  } finally {
    syncing = false
  }
}

/**
 * 初始化同步
 * 登录 + 首次同步
 */
async function initSync(nickname) {
  const openid = getOpenId()
  try {
    await api.login(openid, nickname || '')
    const result = await fullSync()
    return { success: true, openid, ...result }
  } catch (e) {
    console.error('同步初始化失败:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 获取同步状态
 */
function getSyncStatus() {
  return {
    syncing,
    lastSyncTime: wx.getStorageSync('last_sync_time') || 0,
    syncVersion: wx.getStorageSync('sync_version') || 0,
    openid: getOpenId()
  }
}

module.exports = {
  getOpenId,
  uploadToServer,
  downloadFromServer,
  syncToServer,
  fullSync,
  initSync,
  getSyncStatus,
  collectLocalData,
  applyServerData
}
