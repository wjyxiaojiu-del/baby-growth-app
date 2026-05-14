/**
 * 成就徽章定义
 */
const ACHIEVEMENTS = [
  { key: 'first_record', icon: '📝', title: '成长起步', desc: '完成第一条记录', check: (s) => s.recordCount >= 1 },
  { key: 'record_10', icon: '📊', title: '记录达人', desc: '累计记录10条', check: (s) => s.recordCount >= 10 },
  { key: 'record_50', icon: '🏆', title: '成长档案员', desc: '累计记录50条', check: (s) => s.recordCount >= 50 },
  { key: 'record_100', icon: '👑', title: '超级记录家', desc: '累计记录100条', check: (s) => s.recordCount >= 100 },
  { key: 'first_report', icon: '🤖', title: 'AI初体验', desc: '生成第一份AI报告', check: (s) => s.reportCount >= 1 },
  { key: 'report_5', icon: '📈', title: '数据驱动', desc: '生成5份AI报告', check: (s) => s.reportCount >= 5 },
  { key: 'milestone_5', icon: '⭐', title: '里程碑猎人', desc: '完成5项里程碑', check: (s) => s.milestoneCount >= 5 },
  { key: 'milestone_15', icon: '🌟', title: '发育之星', desc: '完成15项里程碑', check: (s) => s.milestoneCount >= 15 },
  { key: 'milestone_all', icon: '💫', title: '全能宝宝', desc: '完成30项里程碑', check: (s) => s.milestoneCount >= 30 },
  { key: 'food_5', icon: '🥕', title: '辅食探索家', desc: '尝试5种辅食', check: (s) => s.foodLogCount >= 5 },
  { key: 'food_20', icon: '🍽️', title: '美食家宝宝', desc: '尝试20种辅食', check: (s) => s.foodLogCount >= 20 },
  { key: 'streak_3', icon: '🔥', title: '三天打鱼', desc: '连续记录3天', check: (s) => s.consecutiveDays >= 3 },
  { key: 'streak_7', icon: '💪', title: '一周坚持', desc: '连续记录7天', check: (s) => s.consecutiveDays >= 7 },
  { key: 'streak_30', icon: '🏅', title: '月度之星', desc: '连续记录30天', check: (s) => s.consecutiveDays >= 30 },
  { key: 'photo_1', icon: '📷', title: '第一张照片', desc: '上传第一张成长照', check: (s) => s.photoCount >= 1 },
  { key: 'photo_10', icon: '🖼️', title: '相册初成', desc: '累计10张照片', check: (s) => s.photoCount >= 10 },
  { key: 'trend_report', icon: '📉', title: '趋势洞察者', desc: '生成趋势预测报告', check: (s) => s.hasTrendReport },
  { key: 'compare_report', icon: '👶', title: '同龄对比家', desc: '生成同龄对比报告', check: (s) => s.hasCompareReport },
  { key: 'plan_report', icon: '📋', title: '培养规划师', desc: '生成培养计划', check: (s) => s.hasPlanReport }
]

/**
 * 检查并解锁成就
 * @param {Object} db - 数据库模块
 * @returns {Array} 新解锁的成就列表
 */
async function checkAndUnlock(db) {
  const stats = {
    recordCount: await db.getRecordCount(),
    reportCount: await db.getReportCount(),
    milestoneCount: await db.getMilestoneCheckCount(),
    foodLogCount: await db.getFoodLogCount(),
    photoCount: await db.getPhotoCount(),
    consecutiveDays: await db.getConsecutiveDays(),
    hasTrendReport: !!wx.getStorageSync('ai_trend_report'),
    hasCompareReport: !!wx.getStorageSync('ai_compare_report'),
    hasPlanReport: !!wx.getStorageSync('ai_training_plan')
  }

  const newUnlocks = []
  for (const achievement of ACHIEVEMENTS) {
    if (achievement.check(stats)) {
      const result = await db.unlockAchievement(achievement.key)
      if (result) newUnlocks.push({ ...achievement, ...result })
    }
  }
  return newUnlocks
}

/**
 * 获取所有成就及解锁状态
 */
async function getAllAchievements(db) {
  const unlocked = await db.getAchievements()
  const unlockedKeys = new Set(unlocked.map(a => a.key))
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedKeys.has(a.key),
    unlockedAt: unlocked.find(u => u.key === a.key)?.unlockedAt
  }))
}

module.exports = { ACHIEVEMENTS, checkAndUnlock, getAllAchievements }
