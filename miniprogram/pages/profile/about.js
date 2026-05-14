Page({
  data: {
    version: '1.0.0',
    features: [
      { icon: '📏', title: '成长记录', desc: '身高体重头围，WHO曲线对比' },
      { icon: '🎯', title: '发育评估', desc: '五大领域里程碑对照' },
      { icon: '😴', title: '日常记录', desc: '睡眠喂养便便，一键打卡' },
      { icon: 'AI', title: '智能分析', desc: '五维天赋画像与培养建议' },
      { icon: '💉', title: '疫苗管理', desc: '自动匹配接种计划' }
    ]
  },

  onShareAppMessage() {
    return {
      title: '宝宝成长记 - AI智能育儿助手',
      path: '/pages/index/index'
    }
  }
})
