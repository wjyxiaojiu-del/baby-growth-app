/**
 * 智能提醒计算
 * 根据宝宝月龄计算各类提醒时间
 */

/**
 * 获取猛涨期提醒
 * 猛涨期通常在：2-3周、4-6周、3个月、6个月、9个月
 */
function getGrowthSpurtReminders(monthAge) {
  const stages = [
    { month: 1, title: '第一次猛涨期', desc: '宝宝可能出现频繁吃奶、哭闹增多，这是正常生长信号。' },
    { month: 2, title: '第二次猛涨期', desc: '吃奶量增加，睡眠可能暂时紊乱，持续2-3天。' },
    { month: 3, title: '第三次猛涨期', desc: '宝宝开始认人，对周围环境更感兴趣。' },
    { month: 6, title: '六个月猛涨期', desc: '辅食添加期，体格快速发育，注意营养均衡。' },
    { month: 9, title: '九个月猛涨期', desc: '活动量大增，爬行探索期，注意安全防护。' }
  ]
  return stages.filter(s => s.month >= monthAge && s.month <= monthAge + 1)
}

/**
 * 获取出牙期提醒
 * 通常第一颗牙在6-10个月萌出
 */
function getTeethingReminders(monthAge) {
  const schedule = [
    { month: 6, teeth: '下中切牙（2颗）', desc: '宝宝可能流口水增多、喜欢咬东西，可准备牙胶。' },
    { month: 8, teeth: '上中切牙（2颗）', desc: '注意口腔清洁，可用纱布轻轻擦拭牙龈。' },
    { month: 10, teeth: '上侧切牙（2颗）', desc: '出牙期可能影响睡眠和食欲，多安抚。' },
    { month: 12, teeth: '下侧切牙（2颗）', desc: '可以开始用婴儿牙刷清洁了。' }
  ]
  return schedule.filter(s => s.month >= monthAge && s.month <= monthAge + 2)
}

/**
 * 获取辅食添加提醒
 */
function getFoodReminders(monthAge) {
  const stages = [
    { month: 5, title: '辅食准备期', desc: '宝宝开始对食物感兴趣，可以尝试米糊等单一谷物。', icon: '🥣' },
    { month: 6, title: '辅食初期', desc: '每天1-2次辅食，从高铁米粉开始，逐步添加蔬菜泥。', icon: '🥕' },
    { month: 7, title: '辅食进阶', desc: '可以尝试肉泥、蛋黄，注意观察过敏反应。', icon: '🥩' },
    { month: 8, title: '手指食物', desc: '可以给宝宝软烂的手指食物，锻炼抓握能力。', icon: '🍌' },
    { month: 9, title: '多样化饮食', desc: '逐步增加食物种类，培养宝宝对不同口味的接受度。', icon: '🍽️' },
    { month: 10, title: '自主进食', desc: '鼓励宝宝自己用勺子吃饭，锻炼手眼协调。', icon: '🥄' },
    { month: 12, title: '过渡到家庭餐', desc: '可以逐步过渡到与家人相似的饮食，注意少盐少糖。', icon: '👨‍👩‍👧' }
  ]
  return stages.filter(s => s.month >= monthAge && s.month <= monthAge + 1)
}

/**
 * 获取体检提醒（根据国家儿童保健规范）
 */
function getCheckupReminders(monthAge) {
  const schedule = [
    { month: 1, title: '满月体检', desc: '体重、身高、头围测量，黄疸检查。', days: 30 },
    { month: 3, title: '3月龄体检', desc: '体格发育评估，视听筛查，补充维生素D。', days: 90 },
    { month: 6, title: '6月龄体检', desc: '血常规检查，发育评估，辅食添加指导。', days: 180 },
    { month: 8, title: '8月龄体检', desc: '发育评估，口腔检查。', days: 240 },
    { month: 12, title: '12月龄体检', desc: '全面体检，血常规，听力筛查，发育评估。', days: 365 }
  ]
  const now = Date.now()
  return schedule.filter(s => {
    const dueTime = now + (s.month - monthAge) * 30 * 86400000
    return s.month >= monthAge && s.month <= monthAge + 2
  }).map(s => ({
    ...s,
    dueIn: s.month === monthAge ? '本月' : `${s.month - monthAge}个月后`
  }))
}

/**
 * 获取所有当前提醒
 */
function getAllReminders(monthAge) {
  return {
    growthSpurt: getGrowthSpurtReminders(monthAge),
    teething: getTeethingReminders(monthAge),
    food: getFoodReminders(monthAge),
    checkup: getCheckupReminders(monthAge)
  }
}

module.exports = {
  getGrowthSpurtReminders,
  getTeethingReminders,
  getFoodReminders,
  getCheckupReminders,
  getAllReminders
}
