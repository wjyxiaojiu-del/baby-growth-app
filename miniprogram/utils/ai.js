const config = require('../config')

/**
 * 调用 DeepSeek API
 */
function callAI(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.AI.endpoint,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.AI.key}`
      },
      data: {
        model: config.AI.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config.AI.maxTokens,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      timeout: config.AI.timeout,
      success(res) {
        if (res.statusCode === 200 && res.data.choices) {
          const content = res.data.choices[0].message.content
          try {
            resolve(JSON.parse(content))
          } catch (e) {
            resolve({ raw: content })
          }
        } else {
          reject(new Error(res.data?.error?.message || `请求失败(${res.statusCode})`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 生成发育趋势预测报告
 * @param {Object} baby - 宝宝信息
 * @param {Array} records - 成长记录
 * @param {Array} milestones - 里程碑数据
 * @param {number} monthAge - 当前月龄
 */
function generateTrendReport(baby, records, milestones, monthAge) {
  const heightRecords = records.filter(r => r.type === 'height')
  const weightRecords = records.filter(r => r.type === 'weight')

  const systemPrompt = `你是一位资深儿科医生和儿童发育专家。请根据宝宝的成长数据，预测未来3个月的发育趋势。
必须返回JSON格式，结构如下：
{
  "currentStatus": "当前发育状况简述",
  "heightTrend": [
    {"month": "当前月龄+1", "predicted": 预测身高cm, "whoAvg": WHO标准均值},
    {"month": "当前月龄+2", "predicted": 预测身高cm, "whoAvg": WHO标准均值},
    {"month": "当前月龄+3", "predicted": 预测身高cm, "whoAvg": WHO标准均值}
  ],
  "weightTrend": [
    {"month": "当前月龄+1", "predicted": 预测体重kg, "whoAvg": WHO标准均值},
    {"month": "当前月龄+2", "predicted": 预测体重kg, "whoAvg": WHO标准均值},
    {"month": "当前月龄+3", "predicted": 预测体重kg, "whoAvg": WHO标准均值}
  ],
  "milestonePrediction": "未来3个月可能出现的发育里程碑描述",
  "riskAlerts": ["需要关注的风险点1", "风险点2"],
  "advice": "总体建议"
}
预测要基于已有数据的趋势，结合WHO标准，给出合理区间。数值保留一位小数。`

  const userPrompt = `宝宝信息：
- 性别：${baby.gender === 'girl' ? '女' : '男'}
- 当前月龄：${monthAge}个月
- 出生日期：${baby.birthDate}

身高记录（按时间倒序）：
${heightRecords.slice(0, 10).map(r => `${r.date}: ${r.value}cm`).join('\n') || '暂无数据'}

体重记录（按时间倒序）：
${weightRecords.slice(0, 10).map(r => `${r.date}: ${r.value}kg`).join('\n') || '暂无数据'}

里程碑完成情况：
已通过${milestones.length}项里程碑检查

请预测未来3个月的发育趋势。`

  return callAI(systemPrompt, userPrompt)
}

/**
 * 生成同龄对比报告
 * @param {Object} baby - 宝宝信息
 * @param {Array} records - 成长记录
 * @param {Array} milestones - 里程碑数据
 * @param {number} monthAge - 当前月龄
 * @param {Object} percentiles - 百分位数据
 */
function generateCompareReport(baby, records, milestones, monthAge, percentiles) {
  const sleepRecords = records.filter(r => r.type === 'sleep')
  const feedRecords = records.filter(r => r.type === 'feed')

  const systemPrompt = `你是一位资深儿科医生。请将宝宝的发育数据与同龄（相同月龄）宝宝进行对比分析。
必须返回JSON格式，结构如下：
{
  "overallRanking": "整体发育水平描述（如：中上等、优秀等）",
  "physicalCompare": {
    "height": {"percentile": 百分位数, "level": "偏矮/正常/偏高", "description": "描述"},
    "weight": {"percentile": 百分位数, "level": "偏轻/正常/偏重", "description": "描述"}
  },
  "developmentCompare": {
    "motor": {"level": "落后/正常/超前", "score": 0-100, "description": "描述"},
    "language": {"level": "落后/正常/超前", "score": 0-100, "description": "描述"},
    "cognitive": {"level": "落后/正常/超前", "score": 0-100, "description": "描述"},
    "social": {"level": "落后/正常/超前", "score": 0-100, "description": "描述"},
    "art": {"level": "落后/正常/超前", "score": 0-100, "description": "描述"}
  },
  "behaviorCompare": {
    "sleep": {"level": "偏少/正常/充足", "description": "描述"},
    "feeding": {"level": "偏少/正常/充足", "description": "描述"}
  },
  "highlights": ["亮点1", "亮点2"],
  "concerns": ["关注点1"],
  "suggestion": "综合建议"
}
百分位数基于WHO标准，0-100之间。`

  const userPrompt = `宝宝信息：
- 性别：${baby.gender === 'girl' ? '女' : '男'}
- 月龄：${monthAge}个月

体格数据：
- 身高百分位：${percentiles.heightPercentile || '未知'}
- 体重百分位：${percentiles.weightPercentile || '未知'}

里程碑完成数：${milestones.length}项
记录总数：${records.length}条

睡眠记录数：${sleepRecords.length}条
喂养记录数：${feedRecords.length}条

请进行同龄对比分析。`

  return callAI(systemPrompt, userPrompt)
}

/**
 * 生成个性化月度培养计划
 * @param {Object} baby - 宝宝信息
 * @param {Array} records - 成长记录
 * @param {Array} milestones - 里程碑数据
 * @param {number} monthAge - 当前月龄
 * @param {Object} report - 现有评估报告（可选）
 */
function generateTrainingPlan(baby, records, milestones, monthAge, report) {
  const systemPrompt = `你是一位资深早教专家和儿科医生。请为宝宝制定下个月的个性化培养计划。
必须返回JSON格式，结构如下：
{
  "planTitle": "X月龄培养计划",
  "summary": "计划概述（1-2句话）",
  "focusAreas": ["重点领域1", "重点领域2", "重点领域3"],
  "weeklyPlan": [
    {
      "week": "第1周",
      "theme": "本周主题",
      "activities": [
        {"name": "活动名称", "duration": "时长", "frequency": "频率", "desc": "详细说明", "tip": "小贴士"}
      ]
    }
  ],
  "milestoneGoals": ["本月建议关注的里程碑1", "里程碑2", "里程碑3"],
  "nutritionAdvice": "本月营养建议",
  "sleepAdvice": "本月睡眠建议",
  "warningSigns": ["需要警惕的信号1", "信号2"],
  "encouragement": "给家长的鼓励语"
}
计划要具体可操作，每天不超过3个活动。`

  const talentInfo = report ? `\n五维天赋评估：
- 运动天赋：${report.talentScores?.find(t => t.key === 'motor')?.score || '未知'}分
- 语言天赋：${report.talentScores?.find(t => t.key === 'language')?.score || '未知'}分
- 逻辑认知：${report.talentScores?.find(t => t.key === 'cognitive')?.score || '未知'}分
- 艺术感知：${report.talentScores?.find(t => t.key === 'art')?.score || '未知'}分
- 社交情感：${report.talentScores?.find(t => t.key === 'social')?.score || '未知'}分
优势领域：${report.strongDomains?.join('、') || '未知'}
待发展领域：${report.weakDomains?.join('、') || '未知'}` : ''

  const userPrompt = `宝宝信息：
- 性别：${baby.gender === 'girl' ? '女' : '男'}
- 当前月龄：${monthAge}个月
- 下月月龄：${monthAge + 1}个月

记录数据：共${records.length}条
里程碑完成数：${milestones.length}项
${talentInfo}

请制定下个月的个性化培养计划。`

  return callAI(systemPrompt, userPrompt)
}

/**
 * 生成多宝对比报告
 * @param {Object} baby1 - 宝宝1信息
 * @param {Object} baby2 - 宝宝2信息
 * @param {Object} stats1 - 宝宝1的统计数据
 * @param {Object} stats2 - 宝宝2的统计数据
 */
function generateMultiBabyCompare(baby1, baby2, stats1, stats2) {
  const systemPrompt = `你是一位资深儿科医生。请对两个宝宝的发育数据进行对比分析，帮助家长了解两个宝宝的发育差异。
必须返回JSON格式，结构如下：
{
  "summary": "对比总结（2-3句话）",
  "comparisons": [
    {
      "dimension": "对比维度名称",
      "baby1": "宝宝1的情况",
      "baby2": "宝宝2的情况",
      "analysis": "分析说明"
    }
  ],
  "baby1Strengths": ["宝宝1的优势1", "优势2"],
  "baby2Strengths": ["宝宝2的优势1", "优势2"],
  "suggestions": ["给家长的建议1", "建议2"]
}
注意：每个宝宝的发育节奏不同，对比仅供参考，不要制造焦虑。`

  const userPrompt = `宝宝1：
- 昵称：${baby1.nickname}
- 性别：${baby1.gender === 'girl' ? '女' : '男'}
- 月龄：${stats1.monthAge}个月
- 身高百分位：${stats1.heightPercentile || '未知'}
- 体重百分位：${stats1.weightPercentile || '未知'}
- 记录数：${stats1.recordCount}条
- 里程碑完成：${stats1.milestoneCount}项

宝宝2：
- 昵称：${baby2.nickname}
- 性别：${baby2.gender === 'girl' ? '女' : '男'}
- 月龄：${stats2.monthAge}个月
- 身高百分位：${stats2.heightPercentile || '未知'}
- 体重百分位：${stats2.weightPercentile || '未知'}
- 记录数：${stats2.recordCount}条
- 里程碑完成：${stats2.milestoneCount}项

请进行对比分析。`

  return callAI(systemPrompt, userPrompt)
}

module.exports = {
  callAI,
  generateTrendReport,
  generateCompareReport,
  generateTrainingPlan,
  generateMultiBabyCompare
}
