# 0-12月龄婴幼儿成长管理小程序 — 数据库Schema设计

## 集合列表

### 1. baby_info（宝宝信息）

```json
{
  "_id": "自动生成",
  "_openid": "用户openid",
  "nickname": "小豆豆",
  "gender": "boy | girl",
  "birthDate": "2026-01-15",
  "avatar": "cloud://xxx/avatars/xxx.jpg",
  "createTime": "2026-01-15T00:00:00Z",
  "updateTime": "2026-05-11T00:00:00Z"
}
```

**索引：** `_openid`（唯一）

---

### 2. records（成长记录）

```json
{
  "_id": "自动生成",
  "_openid": "用户openid",
  "type": "height | weight | headCircum | sleep | feed | poop",
  "typeLabel": "身高 | 体重 | 头围 | 睡眠 | 喂养 | 便便",
  "value": 62.5,
  "unit": "cm | kg",
  "date": "2026-05-11",
  "displayValue": "62.5cm",

  // 睡眠特有字段
  "startTime": "21:30",
  "endTime": "06:00",
  "duration": 510,

  // 喂养特有字段
  "feedType": "breast | formula | mixed | solid",
  "feedTypeLabel": "母乳 | 奶粉 | 混合 | 辅食",
  "amount": 120,
  "breastSide": "left | right | both",

  // 便便特有字段
  "color": "yellow | green | brown | black | red",
  "texture": "soft | mushy | hard | liquid",

  "note": "备注信息",
  "createTime": "2026-05-11T10:30:00Z"
}
```

**索引：**
- `_openid` + `date`（复合索引）
- `_openid` + `type`（复合索引）
- `_openid` + `createTime`（降序）

---

### 3. milestone_checks（里程碑勾选）

```json
{
  "_id": "自动生成",
  "_openid": "用户openid",
  "milestoneId": "m3_1",
  "domain": "motor | language | cognitive | social | art",
  "month": 3,
  "checkedAt": "2026-05-11T10:30:00Z"
}
```

**索引：**
- `_openid` + `month`（复合索引）
- `_openid` + `domain`（复合索引）

---

### 4. ai_reports（AI评估报告）

```json
{
  "_id": "自动生成",
  "_openid": "用户openid",
  "monthAge": 6,
  "babyName": "小豆豆",
  "totalScore": 78,
  "talentScores": [
    { "key": "motor", "label": "运动天赋", "score": 85, "icon": "🏃" },
    { "key": "language", "label": "语言天赋", "score": 72, "icon": "🗣️" },
    { "key": "cognitive", "label": "逻辑认知", "score": 80, "icon": "🧠" },
    { "key": "art", "label": "艺术感知", "score": 65, "icon": "🎨" },
    { "key": "social", "label": "社交情感", "score": 88, "icon": "😊" }
  ],
  "heightPercentile": 75,
  "weightPercentile": 60,
  "strongDomains": ["运动天赋", "社交情感"],
  "weakDomains": ["艺术感知"],
  "suggestions": [
    { "type": "strength", "text": "运动天赋突出..." },
    { "type": "weakness", "text": "艺术感知可以多关注..." },
    { "type": "general", "text": "6月龄宝宝每天需要约12小时睡眠..." }
  ],
  "games": [
    { "name": "障碍爬行赛", "duration": "10分钟", "desc": "用枕头设置小障碍..." }
  ],
  "behaviorInsight": "数据记录良好，睡眠充足...",
  "createTime": "2026-05-11T10:30:00Z"
}
```

**索引：**
- `_openid` + `createTime`（降序）

---

### 5. vaccine_schedule（疫苗接种计划）

```json
{
  "_id": "自动生成",
  "_openid": "用户openid",
  "name": "乙肝疫苗（第2针）",
  "category": "一类（免费）",
  "dueDate": "2026-06-15",
  "status": "pending | completed | skipped",
  "completedDate": null,
  "reaction": null,
  "note": null,
  "createTime": "2026-01-15T00:00:00Z"
}
```

**索引：**
- `_openid` + `status`（复合索引）
- `_openid` + `dueDate`（复合索引）

---

## 数据库权限设置

| 集合 | 读权限 | 写权限 |
|------|--------|--------|
| baby_info | 仅创建者 | 仅创建者 |
| records | 仅创建者 | 仅创建者 |
| milestone_checks | 仅创建者 | 仅创建者 |
| ai_reports | 仅创建者 | 仅创建者+管理端 |
| vaccine_schedule | 仅创建者 | 仅创建者 |

## 数据安全策略

1. 所有集合设置为"仅创建者可读写"
2. 敏感字段（如出生日期）在传输时走HTTPS加密
3. 头像等文件存储在云存储中，通过fileID访问
4. 不采集位置、通讯录等敏感信息
5. 用户可在"我的"页面一键删除所有数据
