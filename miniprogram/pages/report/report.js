const { calcBabyAge, calcPercentile } = require('../../utils/util')
const db = require('../../utils/db')
const ai = require('../../utils/ai')
const { checkAndUnlock } = require('../../utils/achievements')

function getSleepAdvice(month) {
  if (month <= 3) return '每天需要约14-17小时睡眠（含小睡）'
  if (month <= 11) return '每天需要约12-15小时睡眠（含小睡）'
  return '每天需要约11-14小时睡眠（含小睡）'
}

Page({
  data: {
    babyInfo: null,
    babyAge: null,
    report: null,
    loading: true,
    generating: false,
    hasEnoughData: false,
    recordCount: 0,
    talentDimensions: [
      { key: 'motor', label: '运动天赋', icon: '🏃', desc: '大运动发育、身体协调性' },
      { key: 'language', label: '语言天赋', icon: '🗣️', desc: '发音、语音反应、模仿' },
      { key: 'cognitive', label: '逻辑认知', icon: '🧠', desc: '因果理解、探索、注意力' },
      { key: 'art', label: '艺术感知', icon: '🎨', desc: '色彩、音乐、节奏反应' },
      { key: 'social', label: '社交情感', icon: '😊', desc: '眼神交流、微笑、共情' }
    ],
    games: [],
    // AI深度评估
    activeTab: 'basic', // basic | trend | compare | plan | multi
    trendReport: null,
    compareReport: null,
    trainingPlan: null,
    multiBabyReport: null,
    otherBabies: [],
    aiLoading: false,
    aiError: ''
  },

  onLoad() { this.initData() },

  async initData() {
    try {
      const baby = await db.getBabyInfo()
      const count = await db.getRecordCount()
      if (baby) {
        const age = calcBabyAge(baby.birthDate)
        this.setData({ babyInfo: baby, babyAge: age, hasEnoughData: count >= 15, recordCount: count, loading: false })
        if (count >= 15) {
          this.loadLatestReport()
          this.loadSavedAIReports()
        }
      } else {
        this.setData({ loading: false })
      }
    } catch (e) { this.setData({ loading: false }) }
  },

  async loadLatestReport() {
    const report = await db.getLatestReport()
    if (report) this.setData({ report, games: report.games || [] })
  },

  async loadSavedAIReports() {
    try {
      const trend = wx.getStorageSync('ai_trend_report')
      const compare = wx.getStorageSync('ai_compare_report')
      const plan = wx.getStorageSync('ai_training_plan')
      const multi = wx.getStorageSync('ai_multi_baby_report')
      // 加载其他宝宝列表
      const allBabies = await db.getAllBabies()
      const currentBaby = await db.getBabyInfo()
      const others = allBabies.filter(b => b._id !== currentBaby?._id)
      const obj = { otherBabies: others }
      const obj = {}
      if (trend) {
        const t = JSON.parse(trend)
        if (t.heightTrend) {
          t.heightTrend = t.heightTrend.map(item => ({
            ...item,
            diff: (item.predicted - item.whoAvg).toFixed(1),
            absDiff: Math.abs(item.predicted - item.whoAvg).toFixed(1),
            above: item.predicted >= item.whoAvg
          }))
        }
        if (t.weightTrend) {
          t.weightTrend = t.weightTrend.map(item => ({
            ...item,
            diff: (item.predicted - item.whoAvg).toFixed(1),
            absDiff: Math.abs(item.predicted - item.whoAvg).toFixed(1),
            above: item.predicted >= item.whoAvg
          }))
        }
        obj.trendReport = t
      }
      if (compare) {
        const c = JSON.parse(compare)
        if (c.developmentCompare && typeof c.developmentCompare === 'object' && !Array.isArray(c.developmentCompare)) {
          const labelMap = { motor: '🏃 运动', language: '🗣️ 语言', cognitive: '🧠 认知', social: '😊 社交', art: '🎨 艺术' }
          c.developmentArray = Object.entries(c.developmentCompare).map(([key, val]) => ({
            key, label: labelMap[key] || key, ...val
          }))
        }
        obj.compareReport = c
      }
      if (plan) obj.trainingPlan = JSON.parse(plan)
      if (multi) obj.multiBabyReport = JSON.parse(multi)
      this.setData(obj)
    } catch (e) {}
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab, aiError: '' })
  },

  // ====== 基础报告生成 ======
  async generateReport() {
    if (this.data.generating) return
    this.setData({ generating: true })
    wx.showLoading({ title: 'AI分析中...' })

    const { babyInfo, babyAge } = this.data
    try {
      const records = await db.getRecords({ limit: 100 })
      const milestones = await db.getMilestoneChecks()
      const month = Math.min(Math.max(babyAge.months, 0), 12)

      const latestH = records.find(r => r.type === 'height')
      const latestW = records.find(r => r.type === 'weight')
      const hp = latestH ? Math.round(calcPercentile(latestH.value, month, babyInfo.gender || 'boy', 'height') || 50) : null
      const wp = latestW ? Math.round(calcPercentile(latestW.value, month, babyInfo.gender || 'boy', 'weight') || 50) : null

      const domains = ['motor', 'language', 'cognitive', 'social', 'art']
      const domainScores = domains.map(d => {
        const checked = milestones.filter(m => m.domain === d).length
        const expected = Math.max(Math.round(month * 1.5), 3)
        const total = Math.max(expected, checked)
        return { domain: d, score: Math.min(Math.round((checked / total) * 100), 100) }
      })

      const dimMap = { motor: '运动天赋', language: '语言天赋', cognitive: '逻辑认知', art: '艺术感知', social: '社交情感' }
      const iconMap = { motor: '🏃', language: '🗣️', cognitive: '🧠', art: '🎨', social: '😊' }
      const sleepRecords = records.filter(r => r.type === 'sleep')
      const talentScores = domainScores.map(d => {
        let score = d.score * 0.7 + 15
        if (d.domain === 'motor' && hp > 70) score += 8
        if (d.domain === 'social' && sleepRecords.length > 10) score += 5
        score += (Math.random() * 6 - 3)
        return { key: d.domain, label: dimMap[d.domain], icon: iconMap[d.domain], score: Math.max(20, Math.min(98, Math.round(score))) }
      })

      const totalScore = Math.round(talentScores.reduce((s, d) => s + d.score, 0) / talentScores.length)
      const sorted = [...talentScores].sort((a, b) => b.score - a.score)

      const suggMap = {
        motor: { s: `运动天赋突出！多提供自由活动空间，用玩具引导翻身和爬行。`, w: `多保证趴趴时间，用色彩鲜艳的玩具引导运动。` },
        language: { s: `语言感知力强！多说话、读绘本、唱儿歌。`, w: `多面对面说话、模仿宝宝发音、每天读10分钟绘本。` },
        cognitive: { s: `认知能力优秀！多提供不同材质、颜色的物品探索。`, w: `玩躲猫猫、藏玩具等游戏，锻炼因果理解。` },
        art: { s: `艺术感知敏锐！多听不同风格音乐，提供彩色触感玩具。`, w: `播放柔和音乐、展示彩色卡片、触摸不同质感物品。` },
        social: { s: `社交情感优秀！多创造社交场景，回应宝宝每次互动。`, w: `多做躲猫猫、照镜子等面对面游戏。` }
      }
      const suggestions = [
        { type: 'strength', text: suggMap[sorted[0].key]?.s || '' },
        { type: 'weakness', text: suggMap[sorted[sorted.length - 1].key]?.w || '' },
        { type: 'general', text: `${month}月龄宝宝${getSleepAdvice(month)}，保证充足营养和活动时间。` }
      ]

      const gameDB = {
        motor: [{ name: '障碍爬行赛', duration: '10分钟', desc: '用枕头设置小障碍引导爬越' }, { name: '踢腿游戏', duration: '5分钟', desc: '轻触脚底鼓励踢腿' }],
        language: [{ name: '指物说名', duration: '10分钟', desc: '指着日常物品告诉名称' }, { name: '绘本时间', duration: '10分钟', desc: '读简单布书' }],
        cognitive: [{ name: '躲猫猫', duration: '5分钟', desc: '用手遮脸再打开' }, { name: '藏玩具', duration: '5分钟', desc: '把玩具藏在布下让宝宝找' }],
        art: [{ name: '音乐律动', duration: '10分钟', desc: '播放不同节奏音乐抱着跳舞' }, { name: '彩色丝巾', duration: '5分钟', desc: '飘动彩色丝巾' }],
        social: [{ name: '照镜子', duration: '5分钟', desc: '带宝宝照镜子指认自己' }, { name: '拍手歌', duration: '5分钟', desc: '边唱儿歌边拍手' }]
      }
      const games = []
      sorted.slice(0, 2).forEach(s => { const g = gameDB[s.key]; if (g) games.push(g[Math.floor(Math.random() * g.length)]) })
      const weakG = gameDB[sorted[sorted.length - 1].key]
      if (weakG) games.push(weakG[0])

      const insight = `数据记录${records.length > 20 ? '丰富' : '良好'}，宝宝发育评估基于${records.length}条记录和${milestones.length}项里程碑数据。`

      const report = {
        month, babyName: babyInfo.nickname, totalScore, talentScores,
        heightPercentile: hp, weightPercentile: wp,
        strongDomains: sorted.slice(0, 2).map(s => s.label),
        weakDomains: sorted.filter(s => s.score < 50).map(s => s.label),
        suggestions, games, behaviorInsight: insight
      }

      await db.saveReport(report)
      this.setData({ report, games, generating: false })
      wx.hideLoading()
      wx.showToast({ title: '报告生成成功' })
    } catch (e) {
      wx.hideLoading()
      this.setData({ generating: false })
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
  },

  // ====== AI深度评估：发育趋势预测 ======
  async generateTrendReport() {
    if (this.data.aiLoading) return
    this.setData({ aiLoading: true, aiError: '' })
    wx.showLoading({ title: 'AI预测中...' })

    try {
      const { babyInfo, babyAge } = this.data
      const records = await db.getRecords({ limit: 100 })
      const milestones = await db.getMilestoneChecks()
      const month = Math.min(Math.max(babyAge.months, 0), 12)

      const result = await ai.generateTrendReport(babyInfo, records, milestones, month)
      // 预处理：为模板计算显示值
      if (result.heightTrend) {
        result.heightTrend = result.heightTrend.map(item => ({
          ...item,
          diff: (item.predicted - item.whoAvg).toFixed(1),
          absDiff: Math.abs(item.predicted - item.whoAvg).toFixed(1),
          above: item.predicted >= item.whoAvg
        }))
      }
      if (result.weightTrend) {
        result.weightTrend = result.weightTrend.map(item => ({
          ...item,
          diff: (item.predicted - item.whoAvg).toFixed(1),
          absDiff: Math.abs(item.predicted - item.whoAvg).toFixed(1),
          above: item.predicted >= item.whoAvg
        }))
      }
      wx.setStorageSync('ai_trend_report', JSON.stringify(result))
      this.setData({ trendReport: result, aiLoading: false })
      wx.hideLoading()
      wx.showToast({ title: '预测完成' })
      checkAndUnlock(db)
    } catch (e) {
      wx.hideLoading()
      this.setData({ aiLoading: false, aiError: e.message || '生成失败，请重试' })
    }
  },

  // ====== AI深度评估：同龄对比 ======
  async generateCompareReport() {
    if (this.data.aiLoading) return
    this.setData({ aiLoading: true, aiError: '' })
    wx.showLoading({ title: 'AI分析中...' })

    try {
      const { babyInfo, babyAge } = this.data
      const records = await db.getRecords({ limit: 100 })
      const milestones = await db.getMilestoneChecks()
      const month = Math.min(Math.max(babyAge.months, 0), 12)

      const latestH = records.find(r => r.type === 'height')
      const latestW = records.find(r => r.type === 'weight')
      const hp = latestH ? Math.round(calcPercentile(latestH.value, month, babyInfo.gender || 'boy', 'height') || 50) : null
      const wp = latestW ? Math.round(calcPercentile(latestW.value, month, babyInfo.gender || 'boy', 'weight') || 50) : null

      const result = await ai.generateCompareReport(babyInfo, records, milestones, month, {
        heightPercentile: hp, weightPercentile: wp
      })
      // 预处理：将 developmentCompare 对象转为数组
      if (result.developmentCompare && typeof result.developmentCompare === 'object' && !Array.isArray(result.developmentCompare)) {
        const labelMap = { motor: '🏃 运动', language: '🗣️ 语言', cognitive: '🧠 认知', social: '😊 社交', art: '🎨 艺术' }
        result.developmentArray = Object.entries(result.developmentCompare).map(([key, val]) => ({
          key, label: labelMap[key] || key, ...val
        }))
      }
      wx.setStorageSync('ai_compare_report', JSON.stringify(result))
      this.setData({ compareReport: result, aiLoading: false })
      wx.hideLoading()
      wx.showToast({ title: '对比完成' })
      checkAndUnlock(db)
    } catch (e) {
      wx.hideLoading()
      this.setData({ aiLoading: false, aiError: e.message || '生成失败，请重试' })
    }
  },

  // ====== AI深度评估：月度培养计划 ======
  async generateTrainingPlan() {
    if (this.data.aiLoading) return
    this.setData({ aiLoading: true, aiError: '' })
    wx.showLoading({ title: 'AI制定计划中...' })

    try {
      const { babyInfo, babyAge, report } = this.data
      const records = await db.getRecords({ limit: 100 })
      const milestones = await db.getMilestoneChecks()
      const month = Math.min(Math.max(babyAge.months, 0), 12)

      const result = await ai.generateTrainingPlan(babyInfo, records, milestones, month, report)
      wx.setStorageSync('ai_training_plan', JSON.stringify(result))
      this.setData({ trainingPlan: result, aiLoading: false })
      wx.hideLoading()
      wx.showToast({ title: '计划生成完成' })
      checkAndUnlock(db)
    } catch (e) {
      wx.hideLoading()
      this.setData({ aiLoading: false, aiError: e.message || '生成失败，请重试' })
    }
  },

  // ====== AI深度评估：多宝对比 ======
  async generateMultiBabyCompare() {
    if (this.data.aiLoading) return
    const { otherBabies, babyInfo, babyAge } = this.data
    if (otherBabies.length === 0) {
      wx.showToast({ title: '请先添加另一个宝宝', icon: 'none' })
      return
    }

    // 选择要对比的宝宝
    const items = otherBabies.map(b => b.nickname || '宝宝')
    wx.showActionSheet({
      itemList: items,
      success: async (res) => {
        const otherBaby = otherBabies[res.tapIndex]
        this.setData({ aiLoading: true, aiError: '' })
        wx.showLoading({ title: 'AI对比分析中...' })

        try {
          const month1 = Math.min(Math.max(babyAge.months, 0), 12)
          const age2 = calcBabyAge(otherBaby.birthDate)
          const month2 = Math.min(Math.max(age2.months, 0), 12)

          const [records1, records2, milestones1, milestones2] = await Promise.all([
            db.getRecords({ limit: 100 }),
            db.getRecords({ limit: 100 }),
            db.getMilestoneChecks(),
            db.getMilestoneChecks()
          ])

          const latestH1 = records1.find(r => r.type === 'height')
          const latestW1 = records1.find(r => r.type === 'weight')
          const latestH2 = records2.find(r => r.type === 'height')
          const latestW2 = records2.find(r => r.type === 'weight')

          const stats1 = {
            monthAge: month1,
            heightPercentile: latestH1 ? Math.round(calcPercentile(latestH1.value, month1, babyInfo.gender || 'boy', 'height') || 50) : null,
            weightPercentile: latestW1 ? Math.round(calcPercentile(latestW1.value, month1, babyInfo.gender || 'boy', 'weight') || 50) : null,
            recordCount: records1.length,
            milestoneCount: milestones1.length
          }

          const stats2 = {
            monthAge: month2,
            heightPercentile: latestH2 ? Math.round(calcPercentile(latestH2.value, month2, otherBaby.gender || 'boy', 'height') || 50) : null,
            weightPercentile: latestW2 ? Math.round(calcPercentile(latestW2.value, month2, otherBaby.gender || 'boy', 'weight') || 50) : null,
            recordCount: records2.length,
            milestoneCount: milestones2.length
          }

          const result = await ai.generateMultiBabyCompare(babyInfo, otherBaby, stats1, stats2)
          wx.setStorageSync('ai_multi_baby_report', JSON.stringify(result))
          this.setData({ multiBabyReport: result, aiLoading: false })
          wx.hideLoading()
          wx.showToast({ title: '对比完成' })
          await checkAndUnlock(db)
        } catch (e) {
          wx.hideLoading()
          this.setData({ aiLoading: false, aiError: e.message || '生成失败，请重试' })
        }
      }
    })
  },

  shareReport() {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
  },

  onShareAppMessage() {
    return { title: `${this.data.babyInfo?.nickname || '宝宝'}的成长评估报告`, path: '/pages/report/report' }
  }
})
