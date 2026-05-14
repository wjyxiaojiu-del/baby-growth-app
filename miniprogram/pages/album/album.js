const { calcBabyAge, formatDate } = require('../../utils/util')
const db = require('../../utils/db')
const { checkAndUnlock } = require('../../utils/achievements')

Page({
  data: {
    babyInfo: null,
    babyAge: null,
    monthGroups: [],
    loading: true,
    totalPhotos: 0
  },

  onLoad() { this.initData() },
  onShow() { this.loadPhotos() },

  async initData() {
    const baby = await db.getBabyInfo()
    if (baby) {
      this.setData({ babyInfo: baby, babyAge: calcBabyAge(baby.birthDate) })
    }
    this.setData({ loading: false })
  },

  async loadPhotos() {
    const groups = await db.getPhotosByMonth()
    const total = await db.getPhotoCount()
    this.setData({ monthGroups: groups, totalPhotos: total })
  },

  async addPhoto() {
    try {
      const res = await wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })

      if (!res.tempFiles || res.tempFiles.length === 0) return

      wx.showLoading({ title: '保存中...' })
      const { babyAge } = this.data
      const month = babyAge ? babyAge.months : 0

      for (const file of res.tempFiles) {
        // 复制到用户目录持久保存
        const fs = wx.getFileSystemManager()
        const ext = file.tempFilePath.split('.').pop() || 'jpg'
        const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
        const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`

        try {
          fs.copyFileSync(file.tempFilePath, savedPath)
        } catch (e) {
          // 如果复制失败，使用临时路径
        }

        await db.addPhoto({
          filePath: savedPath,
          tempFilePath: file.tempFilePath,
          monthAge: month,
          date: formatDate(),
          width: file.width,
          height: file.height,
          size: file.size,
          milestoneTag: ''
        })
      }

      await this.loadPhotos()
      await checkAndUnlock(db)
      wx.hideLoading()
      wx.showToast({ title: `已添加${res.tempFiles.length}张照片` })
    } catch (e) {
      wx.hideLoading()
      if (e.errMsg && e.errMsg.includes('cancel')) return
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  previewPhoto(e) {
    const { path } = e.currentTarget.dataset
    const urls = this.data.monthGroups.flatMap(g => g.photos.map(p => p.filePath || p.tempFilePath))
    wx.previewImage({ current: path, urls })
  },

  async deletePhoto(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmColor: '#FF4444',
      success: async (res) => {
        if (res.confirm) {
          await db.deletePhoto(id)
          await this.loadPhotos()
          wx.showToast({ title: '已删除' })
        }
      }
    })
  },

  async tagMilestone(e) {
    const { id } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['第一次翻身', '第一次坐', '第一次爬', '第一颗牙', '第一次站', '第一步', '第一次叫妈妈', '第一次叫爸爸', '取消'],
      success: async (res) => {
        if (res.tapIndex >= 8) return
        const tags = ['第一次翻身', '第一次坐', '第一次爬', '第一颗牙', '第一次站', '第一步', '第一次叫妈妈', '第一次叫爸爸']
        const photos = await db.getPhotos()
        const photo = photos.find(p => p._id === id)
        if (photo) {
          const list = JSON.parse(wx.getStorageSync('db_photos') || '[]')
          const idx = list.findIndex(p => p._id === id)
          if (idx >= 0) {
            list[idx].milestoneTag = tags[res.tapIndex]
            wx.setStorageSync('db_photos', JSON.stringify(list))
            await this.loadPhotos()
            wx.showToast({ title: '已标记' })
          }
        }
      }
    })
  }
})
