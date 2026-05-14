const config = require('../config')

const BASE_URL = config.SERVER_URL

/**
 * 通用请求封装
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      timeout: options.timeout || 15000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.error || `请求失败(${res.statusCode})`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 用户登录
 */
async function login(openid, nickname) {
  return request('/api/login', {
    method: 'POST',
    data: { openid, nickname }
  })
}

/**
 * 上传数据到服务器
 */
async function uploadData(openid, data) {
  return request('/api/sync/upload', {
    method: 'POST',
    data: { openid, data }
  })
}

/**
 * 从服务器下载数据
 */
async function downloadData(openid) {
  return request('/api/sync/download', {
    method: 'GET',
    data: { openid }
  })
}

/**
 * 合并同步数据
 */
async function mergeData(openid, data, clientVersion) {
  return request('/api/sync/merge', {
    method: 'POST',
    data: { openid, data, clientVersion }
  })
}

/**
 * 服务状态检查
 */
async function getStatus() {
  return request('/api/status')
}

/**
 * 删除用户数据
 */
async function deleteUserData(openid) {
  return request('/api/data', {
    method: 'DELETE',
    data: { openid }
  })
}

module.exports = {
  request,
  login,
  uploadData,
  downloadData,
  mergeData,
  getStatus,
  deleteUserData
}
