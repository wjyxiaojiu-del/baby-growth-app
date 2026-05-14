const db = require('../../utils/db')

Page({
  data: {
    form: { nickname: '', gender: 'boy', birthDate: '', avatar: '' },
    genderOptions: [
      { key: 'boy', label: '男宝', icon: '👦' },
      { key: 'girl', label: '女宝', icon: '👧' }
    ],
    isEdit: false,
    saving: false
  },

  onLoad() { this.loadExistingInfo() },

  async loadExistingInfo() {
    try {
      const baby = await db.getBabyInfo()
      if (baby) {
        this.setData({
          form: { nickname: baby.nickname || '', gender: baby.gender || 'boy', birthDate: baby.birthDate || '', avatar: baby.avatar || '' },
          isEdit: true
        })
      }
    } catch (e) { console.error('加载宝宝信息失败:', e) }
  },

  onNicknameInput(e) { this.setData({ 'form.nickname': e.detail.value }) },
  onGenderChange(e) { this.setData({ 'form.gender': e.currentTarget.dataset.key }) },
  onBirthDateChange(e) { this.setData({ 'form.birthDate': e.detail.value }) },

  async chooseAvatar() {
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'] })
      this.setData({ 'form.avatar': res.tempFiles[0].tempFilePath })
    } catch (e) {}
  },

  async saveBabyInfo() {
    const { nickname, gender, birthDate, avatar } = this.data.form
    if (!nickname.trim()) { wx.showToast({ title: '请输入宝宝昵称', icon: 'none' }); return }
    if (!birthDate) { wx.showToast({ title: '请选择出生日期', icon: 'none' }); return }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })
    try {
      await db.saveBabyInfo({ nickname: nickname.trim(), gender, birthDate, avatar })
      wx.hideLoading()
      wx.showToast({ title: '保存成功' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (e) {
      wx.hideLoading()
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
