const express = require('express')
const cors = require('cors')
const { db, stmts } = require('./db')

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// ========== 健康检查 ==========
app.get('/api/status', (req, res) => {
  const userCount = stmts.getUserCount.get()
  const dataCount = stmts.getDataCount.get()
  res.json({
    status: 'ok',
    service: 'baby-growth-server',
    version: '1.0.0',
    users: userCount.count,
    dataEntries: dataCount.count,
    uptime: process.uptime()
  })
})

// ========== 用户登录 ==========
app.post('/api/login', (req, res) => {
  const { openid, nickname } = req.body
  if (!openid) return res.status(400).json({ error: 'openid is required' })

  try {
    stmts.getOrCreateUser.run(openid)
    if (nickname) stmts.updateNickname.run(nickname, openid)
    const user = stmts.getUser.get(openid)
    res.json({ success: true, user })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ========== 上传数据 ==========
app.post('/api/sync/upload', (req, res) => {
  const { openid, data } = req.body
  if (!openid) return res.status(400).json({ error: 'openid is required' })
  if (!data) return res.status(400).json({ error: 'data is required' })

  try {
    const dataStr = JSON.stringify(data)
    stmts.upsertData.run(openid, dataStr)
    const row = stmts.getData.get(openid)
    res.json({ success: true, version: row.version })
  } catch (e) {
    console.error('Upload error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ========== 下载数据 ==========
app.get('/api/sync/download', (req, res) => {
  const { openid } = req.query
  if (!openid) return res.status(400).json({ error: 'openid is required' })

  try {
    const row = stmts.getData.get(openid)
    if (!row) return res.json({ success: true, data: null, version: 0 })

    const data = JSON.parse(row.data)
    res.json({ success: true, data, version: row.version })
  } catch (e) {
    console.error('Download error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ========== 合并同步 ==========
app.post('/api/sync/merge', (req, res) => {
  const { openid, data, clientVersion } = req.body
  if (!openid) return res.status(400).json({ error: 'openid is required' })

  try {
    const row = stmts.getData.get(openid)
    if (!row) {
      // 首次同步，直接写入
      stmts.upsertData.run(openid, JSON.stringify(data))
      const newRow = stmts.getData.get(openid)
      return res.json({ success: true, version: newRow.version, merged: false })
    }

    const serverData = JSON.parse(row.data)
    const serverVersion = row.version

    // 简单冲突处理：版本号大的胜出
    // 如果客户端版本等于服务器版本，说明没有冲突，直接覆盖
    if (clientVersion === serverVersion || !serverData) {
      stmts.upsertData.run(openid, JSON.stringify(data))
      const newRow = stmts.getData.get(openid)
      return res.json({ success: true, version: newRow.version, merged: false })
    }

    // 版本不一致，需要合并
    const merged = mergeData(serverData, data)
    stmts.upsertData.run(openid, JSON.stringify(merged))
    const newRow = stmts.getData.get(openid)
    res.json({ success: true, version: newRow.version, merged: true })
  } catch (e) {
    console.error('Merge error:', e)
    res.status(500).json({ error: e.message })
  }
})

/**
 * 数据合并策略：
 * - 数组类型（records, milestones等）：按 _id 去重合并，保留最新的
 * - 对象类型（babyInfo等）：以客户端为准（客户端是最新操作端）
 */
function mergeData(serverData, clientData) {
  const merged = { ...serverData }

  for (const [key, clientVal] of Object.entries(clientData)) {
    if (Array.isArray(clientVal) && Array.isArray(serverData[key])) {
      // 数组合并：按 _id 去重，客户端优先
      const map = new Map()
      serverData[key].forEach(item => { if (item._id) map.set(item._id, item) })
      clientVal.forEach(item => { if (item._id) map.set(item._id, item) })
      merged[key] = Array.from(map.values())
    } else if (typeof clientVal === 'object' && clientVal !== null && typeof serverData[key] === 'object' && serverData[key] !== null && !Array.isArray(clientVal)) {
      // 对象合并：客户端覆盖
      merged[key] = { ...serverData[key], ...clientVal }
    } else {
      // 基本类型：客户端覆盖
      merged[key] = clientVal
    }
  }

  return merged
}

// ========== 删除用户数据 ==========
app.delete('/api/data', (req, res) => {
  const { openid } = req.body
  if (!openid) return res.status(400).json({ error: 'openid is required' })

  try {
    stmts.deleteUser.run(openid)
    stmts.deleteUserData.run(openid)
    res.json({ success: true })
  } catch (e) {
    console.error('Delete error:', e)
    res.status(500).json({ error: e.message })
  }
})

// 启动服务
app.listen(PORT, () => {
  console.log(`[baby-growth-server] Running on port ${PORT}`)
})

// 优雅关闭
process.on('SIGINT', () => { db.close(); process.exit() })
process.on('SIGTERM', () => { db.close(); process.exit() })
