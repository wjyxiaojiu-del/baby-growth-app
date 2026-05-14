const { calcBabyAge } = require('../../utils/util')
const db = require('../../utils/db')
const ai = require('../../utils/ai')

Page({
  data: {
    babyInfo: null,
    babyAge: null,
    loading: true,
    activeTab: 'articles',
    articles: [],
    favorites: [],
    // AI问答
    chatMessages: [],
    chatInput: '',
    chatLoading: false
  },

  onLoad() { this.initData() },
  onShow() { this.loadFavorites() },

  async initData() {
    const baby = await db.getBabyInfo()
    if (baby) {
      const age = calcBabyAge(baby.birthDate)
      const articles = this.getArticlesByMonth(age.months)
      this.setData({ babyInfo: baby, babyAge: age, articles, loading: false })
    } else {
      this.setData({ loading: false })
    }
  },

  async loadFavorites() {
    const favs = await db.getKnowledgeFavorites()
    this.setData({ favorites: favs })
  },

  getArticlesByMonth(month) {
    const allArticles = [
      { id: 'm0_sleep', month: 0, title: '新生儿睡眠指南', icon: '😴', category: '睡眠', summary: '新生儿每天需要16-17小时睡眠，分多次进行。建立昼夜节律是关键。', content: '新生儿的胃容量小，需要频繁进食，因此睡眠也被分割成多个短周期。建议：1.白天保持正常光线和声音；2.夜间喂奶保持安静昏暗；3.注意仰卧睡姿，避免趴睡。' },
      { id: 'm0_feed', month: 0, title: '母乳喂养要点', icon: '🍼', category: '喂养', summary: '按需喂养，每天8-12次。注意正确的含乳姿势。', content: '母乳是新生儿最好的食物。每次喂奶应让宝宝充分吸空一侧再换另一侧。注意：1.正确的含乳姿势能避免乳头疼痛；2.按需喂养而非按时；3.观察每天6次以上湿尿布。' },
      { id: 'm1_bath', month: 1, title: '婴儿洗澡技巧', icon: '🛁', category: '护理', summary: '水温37-38°C，时间5-10分钟。注意脐带护理。', content: '准备工作：1.室温保持在26°C以上；2.水温37-38°C；3.准备好所有用品再开始。洗澡步骤：先洗头再洗身体，注意皮肤褶皱处的清洁。' },
      { id: 'm2_tummy', month: 2, title: '趴趴时间的重要性', icon: '💪', category: '运动', summary: '每天累计30分钟以上的趴卧时间，促进大运动发育。', content: '趴卧时间对宝宝非常重要：1.锻炼颈部和上肢力量；2.预防扁头；3.为翻身做准备。建议在宝宝清醒且心情好时进行，可以用彩色玩具吸引注意力。' },
      { id: 'm3_play', month: 3, title: '3月龄亲子互动游戏', icon: '🎮', category: '早教', summary: '追视游戏、抓握练习、发声互动，促进感知觉发展。', content: '推荐游戏：1.用彩色球在宝宝眼前缓慢移动，锻炼追视；2.悬挂容易抓握的玩具，鼓励抓握；3.模仿宝宝的发音，鼓励更多发声。' },
      { id: 'm4_tummy', month: 4, title: '翻身训练指导', icon: '🔄', category: '运动', summary: '用玩具引导宝宝练习翻身，注意安全防护。', content: '翻身是4-6月龄的重要里程碑。训练方法：1.让宝宝仰卧，用玩具在一侧吸引；2.轻轻辅助宝宝翻转；3.多练习，不要强迫。注意：床上加护栏，避免坠床。' },
      { id: 'm5_solid', month: 5, title: '辅食添加准备', icon: '🥣', category: '喂养', summary: '观察宝宝的辅食信号：能坐稳、对食物感兴趣、挺舌反射消失。', content: '辅食添加的信号：1.能够稳定地坐（有支撑）；2.看到食物会张嘴；3.挺舌反射消失；4.体重达到出生时的两倍。建议先从高铁米粉开始。' },
      { id: 'm6_food', month: 6, title: '6月龄辅食指南', icon: '🥕', category: '喂养', summary: '每天1-2次辅食，从单一食材开始，每种尝试3天观察过敏。', content: '辅食添加原则：1.从稀到稠、从少到多；2.每次只添加一种新食物；3.观察3天无过敏再加新种类。推荐食材：高铁米粉、南瓜泥、胡萝卜泥、苹果泥。' },
      { id: 'm7_tooth', month: 7, title: '出牙期护理', icon: '🦷', category: '护理', summary: '宝宝可能流口水增多、烦躁。可用牙胶缓解不适。', content: '出牙期症状：1.流口水增多；2.喜欢咬东西；3.可能轻微发热；4.睡眠不安稳。护理方法：1.准备牙胶（冷藏效果更好）；2.用纱布清洁牙龈；3.必要时用婴儿退烧药。' },
      { id: 'm8_crawl', month: 8, title: '爬行训练方法', icon: '🏃', category: '运动', summary: '用玩具引导宝宝爬行，设置安全的探索环境。', content: '爬行训练：1.让宝宝趴在地垫上，前方放喜欢的玩具；2.家长可以用手推宝宝的脚底辅助；3.设置安全的探索空间。注意：不是所有宝宝都会标准爬行，有的会匍匐或滚动。' },
      { id: 'm9_separation', month: 9, title: '分离焦虑期应对', icon: '🥺', category: '心理', summary: '8-10个月是分离焦虑高峰期。短暂分离练习有助缓解。', content: '分离焦虑是正常发育标志，说明宝宝能区分熟人和陌生人。应对方法：1.玩躲猫猫游戏，建立"消失会回来"的概念；2.短暂离开并按时回来；3.告别时不要偷偷溜走。' },
      { id: 'm10_language', month: 10, title: '语言启蒙方法', icon: '🗣️', category: '语言', summary: '多和宝宝说话、读绘本、唱儿歌，丰富的语言环境促进语言发展。', content: '语言启蒙方法：1.日常活动时描述你在做什么；2.指着物品说名字；3.回应宝宝的咿呀声；4.每天读10-15分钟绘本；5.唱简单重复的儿歌。' },
      { id: 'm11_walk', month: 11, title: '学步期准备', icon: '👟', category: '运动', summary: '宝宝开始扶站扶走。选择合适的学步鞋，确保家庭环境安全。', content: '学步准备：1.让宝宝多赤脚在地垫上练习，增强足底感知；2.选择软底学步鞋；3.家具边角加防撞条；4.不要过早使用学步车；5.每个宝宝学步时间差异大，不必焦虑。' },
      { id: 'm12_birthday', month: 12, title: '1岁宝宝发育总结', icon: '🎂', category: '发育', summary: '回顾宝宝一年的成长，了解1岁宝宝应达到的发育标准。', content: '1岁宝宝发育标准：1.能独立站立或行走；2.会说1-3个词；3.能理解简单指令；4.能用手指指物；5.对同龄小朋友感兴趣。建议做一次全面的1岁体检。' },
      { id: 'm12_toddler', month: 12, title: '1岁后的喂养转变', icon: '🍽️', category: '喂养', summary: '逐步从奶为主过渡到以饭为主，培养自主进食习惯。', content: '1岁后喂养要点：1.三餐两点规律进食；2.逐步减少奶量至每天400-500ml；3.鼓励自己用勺子吃饭；4.少盐少糖，不加调味品；5.保证蛋白质、铁、钙的摄入。' }
    ]
    // 返回当前月龄及之前的+下个月的
    return allArticles.filter(a => a.month <= month + 1 && a.month >= month - 1)
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  viewArticle(e) {
    const { id } = e.currentTarget.dataset
    const article = this.data.articles.find(a => a.id === id) ||
      this.data.favorites.find(f => f.articleId === id)
    if (!article) return
    wx.showModal({
      title: article.title,
      content: article.content || article.summary,
      showCancel: true,
      confirmText: '收藏',
      cancelText: '关闭',
      success: async (res) => {
        if (res.confirm) {
          await db.addKnowledgeFavorite({
            articleId: article.id || article.articleId,
            title: article.title,
            summary: article.summary,
            content: article.content,
            icon: article.icon,
            category: article.category
          })
          await this.loadFavorites()
          wx.showToast({ title: '已收藏' })
        }
      }
    })
  },

  async unfavorite(e) {
    const { id } = e.currentTarget.dataset
    await db.removeKnowledgeFavorite(id)
    await this.loadFavorites()
    wx.showToast({ title: '已取消收藏' })
  },

  // ====== AI问答 ======
  onChatInput(e) {
    this.setData({ chatInput: e.detail.value })
  },

  async sendQuestion() {
    const question = this.data.chatInput.trim()
    if (!question || this.data.chatLoading) return

    const messages = [...this.data.chatMessages, { role: 'user', content: question }]
    this.setData({ chatMessages: messages, chatInput: '', chatLoading: true })

    try {
      const month = this.data.babyAge ? this.data.babyAge.months : 0
      const gender = this.data.babyInfo?.gender === 'girl' ? '女' : '男'
      const systemPrompt = `你是一位资深儿科医生和育儿专家，正在为一位宝宝${month}个月大的家长提供建议。
回答要求：1.简洁实用，不超过200字；2.基于科学育儿知识；3.如有严重症状建议及时就医；4.语气温暖亲切。`

      const result = await ai.callAI(systemPrompt, question)
      const reply = result.raw || result.answer || result.response || JSON.stringify(result)
      messages.push({ role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) })
      this.setData({ chatMessages: messages, chatLoading: false })
    } catch (e) {
      messages.push({ role: 'assistant', content: '抱歉，暂时无法回答，请稍后再试。' })
      this.setData({ chatMessages: messages, chatLoading: false })
    }
  },

  clearChat() {
    this.setData({ chatMessages: [] })
  },

  sendQuickQ(e) {
    const q = e.currentTarget.dataset.q
    if (q) {
      this.setData({ chatInput: q })
      this.sendQuestion()
    }
  }
})
