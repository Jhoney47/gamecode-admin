# CDN缓存问题说明和解决方案

## 🔍 问题分析

### 当前情况
**您删除了一条兑换码后：**
- ✅ 后台显示已删除（本地JSON文件已更新）
- ✅ GitHub已同步（杖剑传说：40个兑换码）
- ❌ CDN还是旧数据（杖剑传说：41个兑换码）
- ❌ 手机APP获取到旧数据

### 数据对比
| 位置 | 杖剑传说兑换码数 | 状态 |
|------|----------------|------|
| 本地JSON | 40 | ✅ 最新 |
| GitHub | 41 | ❌ 未同步 |
| CDN | 41 | ❌ 旧缓存 |

---

## 🐛 根本原因

### 问题1：GitHub自动同步失败
**发现：** 本地文件已删除，但GitHub上还是41个兑换码

**原因：** 自动同步脚本可能遇到问题：
- Git冲突
- 推送失败
- 延迟过长

### 问题2：CDN缓存时间长
**jsDelivr CDN缓存机制：**
- 默认缓存：12小时
- 更新延迟：5-30分钟
- 即使GitHub更新，CDN也需要时间

---

## 🛠️ 解决方案

### 立即解决（手动操作）

#### 1. 手动推送到GitHub
```bash
cd /home/ubuntu/gamecode_admin
git add GameCodeBase.json
git commit -m "删除兑换码"
git push origin master
```

#### 2. 清除CDN缓存
访问以下URL清除缓存：
```
https://purge.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json
```

#### 3. APP端刷新
等待1-2分钟后，APP刷新即可获取最新数据

---

### 长期解决（改进系统）

#### 方案1：使用GitHub commit hash代替@master
**问题：** @master标签有缓存
**解决：** 使用具体的commit hash

**APP端代码改为：**
```javascript
// 每次获取最新commit hash
fetch('https://api.github.com/repos/Jhoney47/gamecode-admin/commits/master')
  .then(res => res.json())
  .then(commit => {
    const hash = commit.sha.substring(0, 7);
    // 使用commit hash获取数据（无缓存）
    return fetch(`https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@${hash}/GameCodeBase.json`);
  })
  .then(res => res.json())
  .then(data => {
    // 使用最新数据
  });
```

#### 方案2：使用GitHub Raw直接访问
**优点：** 无CDN缓存，实时更新
**缺点：** 速度较慢，有访问限制

**APP端代码：**
```javascript
fetch('https://raw.githubusercontent.com/Jhoney47/gamecode-admin/master/GameCodeBase.json')
  .then(res => res.json())
  .then(data => {
    // 使用数据
  });
```

#### 方案3：添加版本号参数
**在JSON文件中添加版本号：**
```json
{
  "version": "1.0.1",
  "lastUpdated": "2026-01-21T11:30:00Z",
  "games": [...]
}
```

**APP端检查版本号：**
```javascript
// 先获取版本号
fetch('https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json')
  .then(res => res.json())
  .then(data => {
    const localVersion = localStorage.getItem('dataVersion');
    if (data.version !== localVersion) {
      // 版本不同，强制刷新
      localStorage.setItem('dataVersion', data.version);
      // 使用新数据
    }
  });
```

#### 方案4：使用自己的服务器API
**优点：** 完全控制，实时更新
**缺点：** 需要服务器成本

**架构：**
```
后台 → JSON文件 → GitHub → 您的服务器 → APP
```

**您的服务器提供API：**
```
https://your-server.com/api/gamecodes
```

---

## 🚀 推荐方案

### 方案A：GitHub Raw（简单快速）
**适合：** 数据更新频繁，需要实时性

**优点：**
- ✅ 无缓存问题
- ✅ 实时更新
- ✅ 无需额外配置

**缺点：**
- ❌ 速度较慢（国内访问）
- ❌ 有访问限制（每小时60次）

**实现：**
```javascript
// APP端直接使用GitHub Raw
const API_URL = 'https://raw.githubusercontent.com/Jhoney47/gamecode-admin/master/GameCodeBase.json';

fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    // 使用数据
  });
```

### 方案B：CDN + 版本号（推荐）
**适合：** 平衡速度和实时性

**优点：**
- ✅ CDN加速，速度快
- ✅ 版本号控制，确保更新
- ✅ 国内无需VPN

**缺点：**
- ❌ 需要在后台添加版本号逻辑

**实现步骤：**

1. **后台自动更新版本号**
修改 `server_with_sync.js`：
```javascript
function saveData() {
  gameData.version = Date.now(); // 使用时间戳作为版本号
  gameData.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(gameData, null, 2));
}
```

2. **APP端检查版本号**
```javascript
const CDN_URL = 'https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json';
let cachedData = null;
let cachedVersion = null;

async function getData() {
  const response = await fetch(CDN_URL);
  const data = await response.json();
  
  if (data.version !== cachedVersion) {
    console.log('数据已更新，使用新数据');
    cachedData = data;
    cachedVersion = data.version;
  } else {
    console.log('数据未变化，使用缓存');
  }
  
  return cachedData;
}
```

### 方案C：混合方案（最佳）
**结合CDN和GitHub Raw的优点**

**策略：**
1. 优先使用CDN（快速）
2. 检查版本号
3. 如果版本不对，使用GitHub Raw（准确）

**实现：**
```javascript
const CDN_URL = 'https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json';
const RAW_URL = 'https://raw.githubusercontent.com/Jhoney47/gamecode-admin/master/GameCodeBase.json';

async function getData() {
  try {
    // 1. 先从CDN获取
    const cdnData = await fetch(CDN_URL).then(r => r.json());
    
    // 2. 检查是否是最新版本（可以加时间戳判断）
    const timeDiff = Date.now() - new Date(cdnData.lastUpdated).getTime();
    
    // 3. 如果超过5分钟，从GitHub Raw获取最新数据
    if (timeDiff > 5 * 60 * 1000) {
      console.log('CDN数据可能过期，从GitHub获取最新数据');
      return await fetch(RAW_URL).then(r => r.json());
    }
    
    return cdnData;
  } catch (error) {
    // 4. 如果CDN失败，降级到GitHub Raw
    console.log('CDN失败，使用GitHub Raw');
    return await fetch(RAW_URL).then(r => r.json());
  }
}
```

---

## 📋 立即行动

### 现在就解决您的问题：

1. **手动推送到GitHub**
```bash
cd /home/ubuntu/gamecode_admin
git add GameCodeBase.json
git commit -m "删除兑换码"
git push origin master
```

2. **清除CDN缓存**
访问：https://purge.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json

3. **APP端改用GitHub Raw**
```javascript
const API_URL = 'https://raw.githubusercontent.com/Jhoney47/gamecode-admin/master/GameCodeBase.json';
```

---

## 🎯 总结

**问题根源：**
1. GitHub自动同步可能失败
2. CDN有缓存延迟

**解决方法：**
- 短期：手动推送 + 清除缓存
- 长期：使用GitHub Raw或版本号控制

**推荐：** 使用混合方案（方案C），既快速又准确
