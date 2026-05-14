/**
 * 数据访问层 — 本地存储版本
 */

const COLLECTIONS = {
  BABY_INFO: 'baby_info',
  RECORDS: 'records',
  MILESTONE_CHECKS: 'milestone_checks',
  AI_REPORTS: 'ai_reports',
  VACCINE_SCHEDULE: 'vaccine_schedule',
  FOOD_LOGS: 'food_logs',
  FOOD_REACTIONS: 'food_reactions',
  PHOTOS: 'photos',
  ACHIEVEMENTS: 'achievements',
  KNOWLEDGE_FAVORITES: 'knowledge_favorites'
}

// ========== 本地存储工具 ==========

function getCollection(name) {
  const key = `db_${name}`
  try {
    return JSON.parse(wx.getStorageSync(key) || '[]')
  } catch (e) {
    return []
  }
}

function saveCollection(name, data) {
  const key = `db_${name}`
  wx.setStorageSync(key, JSON.stringify(data))
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ========== 宝宝信息 ==========

function getActiveBabyId() {
  return wx.getStorageSync('active_baby_id') || null
}

function setActiveBabyId(id) {
  wx.setStorageSync('active_baby_id', id)
}

async function getBabyInfo() {
  const list = getCollection(COLLECTIONS.BABY_INFO)
  if (list.length === 0) return null
  const activeId = getActiveBabyId()
  return list.find(b => b._id === activeId) || list[0]
}

async function getAllBabies() {
  return getCollection(COLLECTIONS.BABY_INFO)
}

async function saveBabyInfo(data) {
  const list = getCollection(COLLECTIONS.BABY_INFO)
  const activeId = getActiveBabyId()
  const idx = activeId ? list.findIndex(b => b._id === activeId) : 0
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...data, updateTime: new Date().toISOString() }
  } else {
    const newBaby = { _id: genId(), ...data, createTime: new Date().toISOString() }
    list.push(newBaby)
    setActiveBabyId(newBaby._id)
  }
  saveCollection(COLLECTIONS.BABY_INFO, list)
  return list[idx >= 0 ? idx : list.length - 1]
}

async function addBaby(data) {
  const list = getCollection(COLLECTIONS.BABY_INFO)
  const newBaby = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.push(newBaby)
  saveCollection(COLLECTIONS.BABY_INFO, list)
  setActiveBabyId(newBaby._id)
  return newBaby
}

async function switchBaby(id) {
  setActiveBabyId(id)
}

async function deleteBaby(id) {
  const list = getCollection(COLLECTIONS.BABY_INFO)
  const filtered = list.filter(b => b._id !== id)
  saveCollection(COLLECTIONS.BABY_INFO, filtered)
  if (filtered.length > 0 && getActiveBabyId() === id) {
    setActiveBabyId(filtered[0]._id)
  }
}

// ========== 成长记录 ==========

async function addRecord(data) {
  const list = getCollection(COLLECTIONS.RECORDS)
  const record = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.unshift(record)
  saveCollection(COLLECTIONS.RECORDS, list)
  return record
}

async function getRecords(options = {}) {
  let list = getCollection(COLLECTIONS.RECORDS)
  if (options.type) {
    list = list.filter(r => r.type === options.type)
  }
  if (options.date) {
    list = list.filter(r => r.date === options.date)
  }
  if (options.limit) {
    list = list.slice(0, options.limit)
  }
  return list
}

async function getRecordCount() {
  return getCollection(COLLECTIONS.RECORDS).length
}

async function deleteRecord(id) {
  const list = getCollection(COLLECTIONS.RECORDS)
  const filtered = list.filter(r => r._id !== id)
  saveCollection(COLLECTIONS.RECORDS, filtered)
}

// ========== 里程碑勾选 ==========

async function getMilestoneChecks(month) {
  const list = getCollection(COLLECTIONS.MILESTONE_CHECKS)
  if (month !== undefined) {
    return list.filter(m => m.month === month)
  }
  return list
}

async function addMilestoneCheck(data) {
  const list = getCollection(COLLECTIONS.MILESTONE_CHECKS)
  // 避免重复
  const exists = list.find(m => m.milestoneId === data.milestoneId)
  if (exists) return exists
  const check = { _id: genId(), ...data, checkedAt: new Date().toISOString() }
  list.push(check)
  saveCollection(COLLECTIONS.MILESTONE_CHECKS, list)
  return check
}

async function removeMilestoneCheck(milestoneId) {
  const list = getCollection(COLLECTIONS.MILESTONE_CHECKS)
  const filtered = list.filter(m => m.milestoneId !== milestoneId)
  saveCollection(COLLECTIONS.MILESTONE_CHECKS, filtered)
}

async function getMilestoneCheckCount() {
  return getCollection(COLLECTIONS.MILESTONE_CHECKS).length
}

// ========== AI报告 ==========

async function saveReport(data) {
  const list = getCollection(COLLECTIONS.AI_REPORTS)
  const report = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.unshift(report)
  saveCollection(COLLECTIONS.AI_REPORTS, list)
  return report
}

async function getLatestReport() {
  const list = getCollection(COLLECTIONS.AI_REPORTS)
  return list.length > 0 ? list[0] : null
}

async function getReportCount() {
  return getCollection(COLLECTIONS.AI_REPORTS).length
}

// ========== 疫苗接种 ==========

async function getVaccineSchedule() {
  return getCollection(COLLECTIONS.VACCINE_SCHEDULE)
}

async function addVaccineRecord(data) {
  const list = getCollection(COLLECTIONS.VACCINE_SCHEDULE)
  const record = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.push(record)
  saveCollection(COLLECTIONS.VACCINE_SCHEDULE, list)
  return record
}

async function getCompletedVaccines() {
  const list = getCollection(COLLECTIONS.VACCINE_SCHEDULE)
  return list.filter(v => v.status === 'completed')
}

// ========== 辅食记录 ==========

async function addFoodLog(data) {
  const list = getCollection(COLLECTIONS.FOOD_LOGS)
  const log = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.unshift(log)
  saveCollection(COLLECTIONS.FOOD_LOGS, list)
  return log
}

async function getFoodLogs(options = {}) {
  let list = getCollection(COLLECTIONS.FOOD_LOGS)
  if (options.date) {
    list = list.filter(l => l.date === options.date)
  }
  if (options.foodId) {
    list = list.filter(l => l.foodId === options.foodId)
  }
  if (options.startDate && options.endDate) {
    list = list.filter(l => l.date >= options.startDate && l.date <= options.endDate)
  }
  return list
}

async function deleteFoodLog(id) {
  const list = getCollection(COLLECTIONS.FOOD_LOGS)
  const filtered = list.filter(l => l._id !== id)
  saveCollection(COLLECTIONS.FOOD_LOGS, filtered)
}

async function getFoodLogCount() {
  return getCollection(COLLECTIONS.FOOD_LOGS).length
}

async function getAddedFoodIds() {
  const list = getCollection(COLLECTIONS.FOOD_LOGS)
  return [...new Set(list.map(l => l.foodId))]
}

// ========== 食物反应记录 ==========

async function addFoodReaction(data) {
  const list = getCollection(COLLECTIONS.FOOD_REACTIONS)
  const reaction = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.unshift(reaction)
  saveCollection(COLLECTIONS.FOOD_REACTIONS, list)
  return reaction
}

async function getFoodReactions(foodId) {
  const list = getCollection(COLLECTIONS.FOOD_REACTIONS)
  if (foodId) {
    return list.filter(r => r.foodId === foodId)
  }
  return list
}

// ========== 照片记录 ==========

async function addPhoto(data) {
  const list = getCollection(COLLECTIONS.PHOTOS)
  const photo = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.unshift(photo)
  saveCollection(COLLECTIONS.PHOTOS, list)
  return photo
}

async function getPhotos(options = {}) {
  let list = getCollection(COLLECTIONS.PHOTOS)
  if (options.monthAge !== undefined) {
    list = list.filter(p => p.monthAge === options.monthAge)
  }
  if (options.milestoneTag) {
    list = list.filter(p => p.milestoneTag === options.milestoneTag)
  }
  if (options.limit) {
    list = list.slice(0, options.limit)
  }
  return list
}

async function getPhotoCount() {
  return getCollection(COLLECTIONS.PHOTOS).length
}

async function deletePhoto(id) {
  const list = getCollection(COLLECTIONS.PHOTOS)
  const filtered = list.filter(p => p._id !== id)
  saveCollection(COLLECTIONS.PHOTOS, filtered)
}

async function getPhotosByMonth() {
  const list = getCollection(COLLECTIONS.PHOTOS)
  const groups = {}
  list.forEach(p => {
    const key = p.monthAge !== undefined ? p.monthAge : 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([month, photos]) => ({ month: Number(month), photos, count: photos.length }))
}

// ========== 成就徽章 ==========

async function getAchievements() {
  return getCollection(COLLECTIONS.ACHIEVEMENTS)
}

async function unlockAchievement(key) {
  const list = getCollection(COLLECTIONS.ACHIEVEMENTS)
  if (list.find(a => a.key === key)) return null
  const achievement = { _id: genId(), key, unlockedAt: new Date().toISOString() }
  list.push(achievement)
  saveCollection(COLLECTIONS.ACHIEVEMENTS, list)
  return achievement
}

async function hasAchievement(key) {
  const list = getCollection(COLLECTIONS.ACHIEVEMENTS)
  return !!list.find(a => a.key === key)
}

// ========== 知识收藏 ==========

async function addKnowledgeFavorite(data) {
  const list = getCollection(COLLECTIONS.KNOWLEDGE_FAVORITES)
  if (list.find(f => f.articleId === data.articleId)) return null
  const fav = { _id: genId(), ...data, createTime: new Date().toISOString() }
  list.unshift(fav)
  saveCollection(COLLECTIONS.KNOWLEDGE_FAVORITES, list)
  return fav
}

async function removeKnowledgeFavorite(articleId) {
  const list = getCollection(COLLECTIONS.KNOWLEDGE_FAVORITES)
  const filtered = list.filter(f => f.articleId !== articleId)
  saveCollection(COLLECTIONS.KNOWLEDGE_FAVORITES, filtered)
}

async function getKnowledgeFavorites() {
  return getCollection(COLLECTIONS.KNOWLEDGE_FAVORITES)
}

async function isKnowledgeFavorited(articleId) {
  const list = getCollection(COLLECTIONS.KNOWLEDGE_FAVORITES)
  return !!list.find(f => f.articleId === articleId)
}

// ========== 连续记录天数 ==========

async function getConsecutiveDays() {
  const records = getCollection(COLLECTIONS.RECORDS)
  if (records.length === 0) return 0
  const dates = [...new Set(records.map(r => r.date))].sort().reverse()
  let count = 0
  const today = new Date()
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today.getTime() - i * 86400000)
    const expectedStr = expected.toISOString().slice(0, 10)
    if (dates[i] === expectedStr) {
      count++
    } else {
      break
    }
  }
  return count
}

// ========== 数据清除 ==========

async function clearAllData() {
  Object.values(COLLECTIONS).forEach(name => {
    wx.removeStorageSync(`db_${name}`)
  })
}

module.exports = {
  COLLECTIONS,
  getBabyInfo,
  getAllBabies,
  saveBabyInfo,
  addBaby,
  switchBaby,
  deleteBaby,
  addRecord,
  getRecords,
  getRecordCount,
  deleteRecord,
  getMilestoneChecks,
  addMilestoneCheck,
  removeMilestoneCheck,
  getMilestoneCheckCount,
  saveReport,
  getLatestReport,
  getReportCount,
  getVaccineSchedule,
  addVaccineRecord,
  getCompletedVaccines,
  addFoodLog,
  getFoodLogs,
  deleteFoodLog,
  getFoodLogCount,
  getAddedFoodIds,
  addFoodReaction,
  getFoodReactions,
  addPhoto,
  getPhotos,
  getPhotoCount,
  deletePhoto,
  getPhotosByMonth,
  getAchievements,
  unlockAchievement,
  hasAchievement,
  addKnowledgeFavorite,
  removeKnowledgeFavorite,
  getKnowledgeFavorites,
  isKnowledgeFavorited,
  getConsecutiveDays,
  clearAllData
}
