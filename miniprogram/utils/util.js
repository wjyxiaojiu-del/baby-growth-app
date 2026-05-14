/**
 * 日期格式化
 */
const formatDate = (date, fmt = 'YYYY-MM-DD') => {
  const d = date ? new Date(date) : new Date()
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0')
  }
  return Object.entries(map).reduce((s, [k, v]) => s.replace(k, v), fmt)
}

/**
 * 计算宝宝月龄（精确到天）
 */
const calcBabyAge = (birthDate) => {
  const birth = new Date(birthDate)
  const now = new Date()
  const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  const months = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth())
  const days = totalDays % 30
  let display = ''
  if (months >= 24) {
    const years = Math.floor(months / 12)
    const rem = months % 12
    display = rem > 0 ? `${years}岁${rem}个月` : `${years}岁`
  } else if (months > 0) {
    display = days > 0 ? `${months}个月${days}天` : `${months}个月`
  } else {
    display = `${totalDays}天`
  }
  return { months, days, totalDays, display }
}

/**
 * WHO生长标准数据（0-36月）
 * 来源：WHO Child Growth Standards
 * 格式：{ month: { L, M, S } }  LMS参数
 */
const WHO_STANDARDS = {
  weight_boy: {
    0: { L: -0.3, M: 3.3, S: 0.146 }, 1: { L: -0.2, M: 4.5, S: 0.138 },
    2: { L: -0.1, M: 5.6, S: 0.13 }, 3: { L: 0, M: 6.4, S: 0.126 },
    4: { L: 0, M: 7.0, S: 0.124 }, 5: { L: 0, M: 7.5, S: 0.123 },
    6: { L: 0, M: 7.9, S: 0.123 }, 7: { L: 0, M: 8.3, S: 0.124 },
    8: { L: 0, M: 8.6, S: 0.125 }, 9: { L: 0, M: 8.9, S: 0.126 },
    10: { L: 0, M: 9.2, S: 0.127 }, 11: { L: 0, M: 9.4, S: 0.128 },
    12: { L: 0, M: 9.6, S: 0.129 }, 13: { L: 0, M: 9.9, S: 0.13 },
    14: { L: 0, M: 10.1, S: 0.131 }, 15: { L: 0, M: 10.3, S: 0.132 },
    16: { L: 0, M: 10.5, S: 0.133 }, 17: { L: 0, M: 10.7, S: 0.134 },
    18: { L: 0, M: 10.9, S: 0.135 }, 19: { L: 0, M: 11.1, S: 0.136 },
    20: { L: 0, M: 11.3, S: 0.137 }, 21: { L: 0, M: 11.5, S: 0.137 },
    22: { L: 0, M: 11.8, S: 0.138 }, 23: { L: 0, M: 12.0, S: 0.139 },
    24: { L: 0, M: 12.2, S: 0.14 }, 25: { L: 0.1, M: 12.4, S: 0.14 },
    26: { L: 0.1, M: 12.5, S: 0.141 }, 27: { L: 0.1, M: 12.7, S: 0.141 },
    28: { L: 0.1, M: 12.9, S: 0.142 }, 29: { L: 0.1, M: 13.1, S: 0.142 },
    30: { L: 0.1, M: 13.3, S: 0.143 }, 31: { L: 0.1, M: 13.5, S: 0.143 },
    32: { L: 0.1, M: 13.7, S: 0.143 }, 33: { L: 0.1, M: 13.8, S: 0.144 },
    34: { L: 0.1, M: 14.0, S: 0.144 }, 35: { L: 0.1, M: 14.2, S: 0.144 },
    36: { L: 0.1, M: 14.3, S: 0.145 }
  },
  weight_girl: {
    0: { L: -0.4, M: 3.2, S: 0.142 }, 1: { L: -0.3, M: 4.2, S: 0.137 },
    2: { L: -0.1, M: 5.1, S: 0.13 }, 3: { L: 0, M: 5.8, S: 0.126 },
    4: { L: 0, M: 6.4, S: 0.124 }, 5: { L: 0, M: 6.9, S: 0.122 },
    6: { L: 0, M: 7.3, S: 0.122 }, 7: { L: 0, M: 7.6, S: 0.122 },
    8: { L: 0, M: 7.9, S: 0.123 }, 9: { L: 0, M: 8.2, S: 0.124 },
    10: { L: 0, M: 8.5, S: 0.126 }, 11: { L: 0, M: 8.7, S: 0.127 },
    12: { L: 0, M: 8.9, S: 0.128 }, 13: { L: 0, M: 9.2, S: 0.129 },
    14: { L: 0, M: 9.4, S: 0.13 }, 15: { L: 0, M: 9.6, S: 0.131 },
    16: { L: 0, M: 9.8, S: 0.132 }, 17: { L: 0, M: 10.0, S: 0.133 },
    18: { L: 0, M: 10.2, S: 0.134 }, 19: { L: 0, M: 10.4, S: 0.135 },
    20: { L: 0, M: 10.6, S: 0.136 }, 21: { L: 0, M: 10.9, S: 0.136 },
    22: { L: 0, M: 11.1, S: 0.137 }, 23: { L: 0, M: 11.3, S: 0.138 },
    24: { L: 0, M: 11.5, S: 0.139 }, 25: { L: 0, M: 11.7, S: 0.139 },
    26: { L: 0, M: 11.9, S: 0.14 }, 27: { L: 0, M: 12.1, S: 0.14 },
    28: { L: 0, M: 12.3, S: 0.141 }, 29: { L: 0, M: 12.5, S: 0.141 },
    30: { L: 0, M: 12.7, S: 0.142 }, 31: { L: 0, M: 12.9, S: 0.142 },
    32: { L: 0, M: 13.1, S: 0.142 }, 33: { L: 0, M: 13.3, S: 0.143 },
    34: { L: 0, M: 13.5, S: 0.143 }, 35: { L: 0, M: 13.7, S: 0.143 },
    36: { L: 0, M: 13.9, S: 0.143 }
  },
  height_boy: {
    0: { L: 1, M: 49.9, S: 0.0383 }, 1: { L: 1, M: 54.7, S: 0.0369 },
    2: { L: 1, M: 58.4, S: 0.0358 }, 3: { L: 1, M: 61.4, S: 0.035 },
    4: { L: 1, M: 63.9, S: 0.0344 }, 5: { L: 1, M: 65.9, S: 0.034 },
    6: { L: 1, M: 67.6, S: 0.0337 }, 7: { L: 1, M: 69.2, S: 0.0335 },
    8: { L: 1, M: 70.6, S: 0.0334 }, 9: { L: 1, M: 72.0, S: 0.0333 },
    10: { L: 1, M: 73.3, S: 0.0333 }, 11: { L: 1, M: 74.5, S: 0.0333 },
    12: { L: 1, M: 75.7, S: 0.0334 }, 13: { L: 1, M: 76.9, S: 0.0335 },
    14: { L: 1, M: 78.0, S: 0.0336 }, 15: { L: 1, M: 79.1, S: 0.0337 },
    16: { L: 1, M: 80.2, S: 0.0338 }, 17: { L: 1, M: 81.2, S: 0.0339 },
    18: { L: 1, M: 82.3, S: 0.034 }, 19: { L: 1, M: 83.2, S: 0.0342 },
    20: { L: 1, M: 84.2, S: 0.0343 }, 21: { L: 1, M: 85.1, S: 0.0344 },
    22: { L: 1, M: 86.0, S: 0.0345 }, 23: { L: 1, M: 86.9, S: 0.0346 },
    24: { L: 1, M: 87.8, S: 0.0348 }, 25: { L: 1, M: 88.0, S: 0.0349 },
    26: { L: 1, M: 88.8, S: 0.035 }, 27: { L: 1, M: 89.6, S: 0.0351 },
    28: { L: 1, M: 90.4, S: 0.0352 }, 29: { L: 1, M: 91.2, S: 0.0353 },
    30: { L: 1, M: 91.9, S: 0.0354 }, 31: { L: 1, M: 92.7, S: 0.0355 },
    32: { L: 1, M: 93.4, S: 0.0356 }, 33: { L: 1, M: 94.1, S: 0.0357 },
    34: { L: 1, M: 94.8, S: 0.0358 }, 35: { L: 1, M: 95.4, S: 0.0359 },
    36: { L: 1, M: 96.1, S: 0.036 }
  },
  height_girl: {
    0: { L: 1, M: 49.1, S: 0.0379 }, 1: { L: 1, M: 53.7, S: 0.0365 },
    2: { L: 1, M: 57.1, S: 0.0354 }, 3: { L: 1, M: 59.8, S: 0.0346 },
    4: { L: 1, M: 62.1, S: 0.034 }, 5: { L: 1, M: 64.0, S: 0.0336 },
    6: { L: 1, M: 65.7, S: 0.0333 }, 7: { L: 1, M: 67.3, S: 0.0331 },
    8: { L: 1, M: 68.7, S: 0.033 }, 9: { L: 1, M: 70.1, S: 0.0329 },
    10: { L: 1, M: 71.5, S: 0.0329 }, 11: { L: 1, M: 72.8, S: 0.0329 },
    12: { L: 1, M: 74.0, S: 0.033 }, 13: { L: 1, M: 75.2, S: 0.0331 },
    14: { L: 1, M: 76.4, S: 0.0332 }, 15: { L: 1, M: 77.5, S: 0.0333 },
    16: { L: 1, M: 78.6, S: 0.0334 }, 17: { L: 1, M: 79.7, S: 0.0335 },
    18: { L: 1, M: 80.7, S: 0.0337 }, 19: { L: 1, M: 81.7, S: 0.0338 },
    20: { L: 1, M: 82.7, S: 0.0339 }, 21: { L: 1, M: 83.7, S: 0.034 },
    22: { L: 1, M: 84.6, S: 0.0341 }, 23: { L: 1, M: 85.5, S: 0.0342 },
    24: { L: 1, M: 86.4, S: 0.0343 }, 25: { L: 1, M: 86.6, S: 0.0344 },
    26: { L: 1, M: 87.4, S: 0.0345 }, 27: { L: 1, M: 88.3, S: 0.0346 },
    28: { L: 1, M: 89.1, S: 0.0347 }, 29: { L: 1, M: 89.9, S: 0.0348 },
    30: { L: 1, M: 90.7, S: 0.0349 }, 31: { L: 1, M: 91.4, S: 0.035 },
    32: { L: 1, M: 92.2, S: 0.0351 }, 33: { L: 1, M: 92.9, S: 0.0352 },
    34: { L: 1, M: 93.6, S: 0.0353 }, 35: { L: 1, M: 94.4, S: 0.0354 },
    36: { L: 1, M: 95.1, S: 0.0355 }
  }
}

/**
 * 计算WHO百分位（支持0-36月，体重/身高）
 * @param {number} value - 测量值
 * @param {number} month - 月龄
 * @param {string} gender - 'boy' | 'girl'
 * @param {string} type - 'weight' | 'height'
 * @returns {number|null} 百分位数(0-100)
 */
const calcPercentile = (value, month, gender, type = 'weight') => {
  const key = `${type}_${gender}`
  const std = WHO_STANDARDS[key]
  if (!std) return null
  // 超出范围则用最近的月龄
  const maxMonth = Math.max(...Object.keys(std).map(Number))
  const m = Math.min(month, maxMonth)
  const data = std[m] || std[maxMonth]
  if (!data) return null
  const { L, M, S } = data
  const z = L === 0
    ? Math.log(value / M) / S
    : (Math.pow(value / M, L) - 1) / (L * S)
  return Math.round(normalCDF(z) * 100)
}

/**
 * 获取百分位描述
 */
const getPercentileLabel = (p) => {
  if (p === null) return '数据不足'
  if (p < 3) return '偏低，建议咨询医生'
  if (p < 15) return '偏低'
  if (p < 25) return '略低'
  if (p <= 75) return '正常'
  if (p <= 85) return '略高'
  if (p <= 97) return '偏高'
  return '偏高，建议咨询医生'
}

/**
 * 标准正态分布CDF近似
 */
const normalCDF = (z) => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * z)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)
  return 0.5 * (1.0 + sign * y)
}

/**
 * 节流
 */
const throttle = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

module.exports = {
  formatDate,
  calcBabyAge,
  calcPercentile,
  getPercentileLabel,
  WHO_STANDARDS,
  throttle
}
