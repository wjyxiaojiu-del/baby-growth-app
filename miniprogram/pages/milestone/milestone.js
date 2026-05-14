const { calcBabyAge } = require('../../utils/util')
const db = require('../../utils/db')

// 发育里程碑数据库（0-12月龄）
const MILESTONE_DB = {
  0: {
    motor: [{ id: 'm0_1', text: '俯卧时能短暂抬头' }, { id: 'm0_2', text: '双手能握拳' }, { id: 'm0_3', text: '四肢能对称活动' }],
    language: [{ id: 'l0_1', text: '能发出哭声' }, { id: 'l0_2', text: '对声音有反应（转头、眨眼）' }],
    cognitive: [{ id: 'c0_1', text: '能注视人脸' }, { id: 'c0_2', text: '视线能短暂跟随移动物体' }],
    social: [{ id: 's0_1', text: '被抱起时能安静下来' }, { id: 's0_2', text: '对温柔的声音有反应' }],
    art: [{ id: 'a0_1', text: '对明亮的光线有反应' }, { id: 'a0_2', text: '对柔和的声音表现出安静' }]
  },
  1: {
    motor: [{ id: 'm1_1', text: '俯卧抬头45度' }, { id: 'm1_2', text: '手指能打开再握紧' }, { id: 'm1_3', text: '仰卧时头能转向一侧' }],
    language: [{ id: 'l1_1', text: '能发出a/o等元音' }, { id: 'l1_2', text: '听到声音会安静或转头' }],
    cognitive: [{ id: 'c1_1', text: '能注视人脸10秒以上' }, { id: 'c1_2', text: '视线能跟随物体移动90度' }],
    social: [{ id: 's1_1', text: '看到人脸会安静' }, { id: 's1_2', text: '被逗弄时会微笑' }],
    art: [{ id: 'a1_1', text: '对黑白图案感兴趣' }, { id: 'a1_2', text: '听到音乐会安静' }]
  },
  2: {
    motor: [{ id: 'm2_1', text: '俯卧抬头45-90度' }, { id: 'm2_2', text: '手能短暂握住摇铃' }, { id: 'm2_3', text: '仰卧时双手能在胸前相触' }],
    language: [{ id: 'l2_1', text: '能发出啊/哦等声音' }, { id: 'l2_2', text: '对说话声有反应' }],
    cognitive: [{ id: 'c2_1', text: '注视物体时间延长' }, { id: 'c2_2', text: '开始认识妈妈的脸' }],
    social: [{ id: 's2_1', text: '逗弄时会微笑' }, { id: 's2_2', text: '看到妈妈会兴奋' }],
    art: [{ id: 'a2_1', text: '喜欢看色彩鲜艳的物品' }, { id: 'a2_2', text: '对不同声音有不同反应' }]
  },
  3: {
    motor: [{ id: 'm3_1', text: '俯卧时能用手臂撑起上身' }, { id: 'm3_2', text: '能主动抓握物品' }, { id: 'm3_3', text: '仰卧时能翻身到侧卧' }],
    language: [{ id: 'l3_1', text: '能大声笑出声' }, { id: 'l3_2', text: '能发出多个辅音' }],
    cognitive: [{ id: 'c3_1', text: '能追视180度移动的物体' }, { id: 'c3_2', text: '开始探索自己的手' }],
    social: [{ id: 's3_1', text: '见到人会主动微笑' }, { id: 's3_2', text: '喜欢和人说话' }],
    art: [{ id: 'a3_1', text: '对镜子中的自己感兴趣' }, { id: 'a3_2', text: '听到音乐会摆动手脚' }]
  },
  4: {
    motor: [{ id: 'm4_1', text: '能从仰卧翻身到俯卧' }, { id: 'm4_2', text: '双手能同时抓住物品' }, { id: 'm4_3', text: '扶坐时头能稳定' }],
    language: [{ id: 'l4_1', text: '能发出连续的元音+辅音' }, { id: 'l4_2', text: '对自己的名字有反应' }],
    cognitive: [{ id: 'c4_1', text: '能找到声源' }, { id: 'c4_2', text: '开始用手探索物品' }],
    social: [{ id: 's4_1', text: '会用笑声表达开心' }, { id: 's4_2', text: '对陌生人会观察' }],
    art: [{ id: 'a4_1', text: '喜欢抓握不同质感的物品' }, { id: 'a4_2', text: '对节奏感强的声音有反应' }]
  },
  5: {
    motor: [{ id: 'm5_1', text: '能熟练翻身（双向）' }, { id: 'm5_2', text: '能伸手够到眼前的物品' }, { id: 'm5_3', text: '扶坐时身体前倾用手支撑' }],
    language: [{ id: 'l5_1', text: '能发出ba/ma/da等音节' }, { id: 'l5_2', text: '对不同的语调有不同反应' }],
    cognitive: [{ id: 'c5_1', text: '能区分熟悉人和陌生人' }, { id: 'c5_2', text: '物品掉落会去寻找' }],
    social: [{ id: 's5_1', text: '见到熟悉的人会兴奋' }, { id: 's5_2', text: '喜欢玩躲猫猫' }],
    art: [{ id: 'a5_1', text: '喜欢撕纸和揉捏' }, { id: 'a5_2', text: '对音乐节奏有身体反应' }]
  },
  6: {
    motor: [{ id: 'm6_1', text: '能独坐（短暂不用手支撑）' }, { id: 'm6_2', text: '能用整个手掌抓握物品' }, { id: 'm6_3', text: '开始尝试手膝爬行' }],
    language: [{ id: 'l6_1', text: '能发出连续的音节串' }, { id: 'l6_2', text: '对自己的名字有明确反应' }],
    cognitive: [{ id: 'c6_1', text: '能伸手去拿想要的东西' }, { id: 'c6_2', text: '开始理解不的意思' }],
    social: [{ id: 's6_1', text: '能区分亲人和陌生人' }, { id: 's6_2', text: '会用表情表达需求' }],
    art: [{ id: 'a6_1', text: '喜欢敲打物品发出声音' }, { id: 'a6_2', text: '对鲜艳的颜色反应明显' }]
  },
  7: {
    motor: [{ id: 'm7_1', text: '独坐稳定' }, { id: 'm7_2', text: '能用拇指和食指捏取小物品' }, { id: 'm7_3', text: '能手膝爬行' }],
    language: [{ id: 'l7_1', text: '能模仿简单的声音' }, { id: 'l7_2', text: '能理解简单的词语' }],
    cognitive: [{ id: 'c7_1', text: '能找到被部分遮盖的物品' }, { id: 'c7_2', text: '开始用拇指和食指捏取' }],
    social: [{ id: 's7_1', text: '对陌生人会怕生' }, { id: 's7_2', text: '喜欢和人互动游戏' }],
    art: [{ id: 'a7_1', text: '喜欢用手指涂鸦' }, { id: 'a7_2', text: '听到音乐会跟着摆动' }]
  },
  8: {
    motor: [{ id: 'm8_1', text: '能扶着家具站立' }, { id: 'm8_2', text: '能双手各拿一个物品' }, { id: 'm8_3', text: '爬行熟练' }],
    language: [{ id: 'l8_1', text: '能发出mama/baba等音' }, { id: 'l8_2', text: '能理解不和简单的指令' }],
    cognitive: [{ id: 'c8_1', text: '能找到藏起来的物品' }, { id: 'c8_2', text: '开始探索物品的功能' }],
    social: [{ id: 's8_1', text: '会模仿简单的动作' }, { id: 's8_2', text: '喜欢被表扬' }],
    art: [{ id: 'a8_1', text: '喜欢敲打不同的物品听声音' }, { id: 'a8_2', text: '对不同的形状感兴趣' }]
  },
  9: {
    motor: [{ id: 'm9_1', text: '能扶着家具侧步走' }, { id: 'm9_2', text: '能用食指指物' }, { id: 'm9_3', text: '能从坐到爬的转换' }],
    language: [{ id: 'l9_1', text: '能有意识地叫mama/baba' }, { id: 'l9_2', text: '能理解10个以上的词语' }],
    cognitive: [{ id: 'c9_1', text: '能模仿简单的动作（如拍手）' }, { id: 'c9_2', text: '开始理解因果关系' }],
    social: [{ id: 's9_1', text: '会挥手再见' }, { id: 's9_2', text: '喜欢和其他小朋友在一起' }],
    art: [{ id: 'a9_1', text: '喜欢翻书页' }, { id: 'a9_2', text: '对简单的儿歌有反应' }]
  },
  10: {
    motor: [{ id: 'm10_1', text: '能独站片刻' }, { id: 'm10_2', text: '能用拇指和食指精确捏取' }, { id: 'm10_3', text: '能把物品放入容器' }],
    language: [{ id: 'l10_1', text: '能有意识地叫人' }, { id: 'l10_2', text: '能理解简单的问句' }],
    cognitive: [{ id: 'c10_1', text: '能找到被完全遮盖的物品' }, { id: 'c10_2', text: '开始尝试解决问题' }],
    social: [{ id: 's10_1', text: '会用手指指向想要的东西' }, { id: 's10_2', text: '会模仿大人的表情' }],
    art: [{ id: 'a10_1', text: '喜欢涂鸦' }, { id: 'a10_2', text: '能跟着音乐节奏拍手' }]
  },
  11: {
    motor: [{ id: 'm11_1', text: '能扶着家具走几步' }, { id: 'm11_2', text: '能用杯子喝水' }, { id: 'm11_3', text: '能叠两块积木' }],
    language: [{ id: 'l11_1', text: '能说2-3个词' }, { id: 'l11_2', text: '能理解简单的指令' }],
    cognitive: [{ id: 'c11_1', text: '能找到隐藏的物品' }, { id: 'c11_2', text: '开始尝试模仿大人的动作' }],
    social: [{ id: 's11_1', text: '会表示拒绝（摇头、推开）' }, { id: 's11_2', text: '喜欢和大人互动' }],
    art: [{ id: 'a11_1', text: '喜欢翻书和看图片' }, { id: 'a11_2', text: '对简单的节奏有反应' }]
  },
  12: {
    motor: [{ id: 'm12_1', text: '能独走几步' }, { id: 'm12_2', text: '能叠3-4块积木' }, { id: 'm12_3', text: '能用笔涂鸦' }],
    language: [{ id: 'l12_1', text: '能说3-5个词' }, { id: 'l12_2', text: '能理解简单的问句' }],
    cognitive: [{ id: 'c12_1', text: '能找到被藏起来的物品' }, { id: 'c12_2', text: '开始尝试解决问题' }],
    social: [{ id: 's12_1', text: '会表示拒绝' }, { id: 's12_2', text: '喜欢和其他小朋友在一起' }],
    art: [{ id: 'a12_1', text: '喜欢涂鸦' }, { id: 'a12_2', text: '能跟着音乐节奏拍手' }]
  }
}

Page({
  data: {
    babyAge: null,
    currentMonth: 0,
    milestones: {},
    checkedItems: {},
    radarData: null,
    loading: true,
    showResult: false,
    domains: [
      { key: 'motor', label: '大运动', icon: '🏃', color: '#4CAF50' },
      { key: 'language', label: '语言', icon: '🗣️', color: '#2196F3' },
      { key: 'cognitive', label: '认知', icon: '🧠', color: '#9C27B0' },
      { key: 'social', label: '社交', icon: '😊', color: '#FF9800' },
      { key: 'art', label: '艺术', icon: '🎨', color: '#E91E63' }
    ]
  },

  onLoad() { this.initBabyAge() },
  onShow() { this.loadCheckedItems() },

  async initBabyAge() {
    try {
      const baby = await db.getBabyInfo()
      if (baby) {
        const age = calcBabyAge(baby.birthDate)
        const month = Math.min(Math.max(age.months, 0), 12)
        this.setData({ babyAge: age, currentMonth: month, milestones: MILESTONE_DB[month] || MILESTONE_DB[0], loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (e) { this.setData({ loading: false }) }
  },

  async loadCheckedItems() {
    const checks = await db.getMilestoneChecks(this.data.currentMonth)
    const checked = {}
    checks.forEach(item => { checked[item.milestoneId] = true })
    this.setData({ checkedItems: checked })
  },

  async toggleMilestone(e) {
    const { id, domain } = e.currentTarget.dataset
    const isChecked = !this.data.checkedItems[id]
    this.setData({ [`checkedItems.${id}`]: isChecked })
    if (isChecked) {
      await db.addMilestoneCheck({ milestoneId: id, domain, month: this.data.currentMonth })
    } else {
      await db.removeMilestoneCheck(id)
    }
  },

  switchMonth(e) {
    const month = e.currentTarget.dataset.month
    this.setData({ currentMonth: month, milestones: MILESTONE_DB[month] || MILESTONE_DB[0], checkedItems: {}, showResult: false, radarData: null })
    this.loadCheckedItems()
  },

  generateRadar() {
    const { domains, milestones, checkedItems, currentMonth } = this.data
    const scores = domains.map(d => {
      const items = milestones[d.key] || []
      const checked = items.filter(i => checkedItems[i.id]).length
      return { key: d.key, label: d.label, score: items.length > 0 ? Math.round((checked / items.length) * 100) : 0, total: items.length, checked }
    })

    const radarData = {
      scores,
      totalScore: Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length),
      weakDomains: scores.filter(s => s.score < 50).map(s => s.label),
      strongDomains: scores.filter(s => s.score >= 80).map(s => s.label)
    }

    this.setData({ radarData, showResult: true })
  },

  goReport() { wx.navigateTo({ url: '/pages/report/report' }) }
})
