# 🎮 GameCode 后台管理系统

一个简单易用的Web后台管理界面，用于可视化编辑 `GameCodeBase.json` 文件。

---

## ✨ 功能特点

- ✅ **可视化编辑** - 通过Web界面管理游戏兑换码
- ✅ **实时搜索** - 快速查找游戏和兑换码
- ✅ **统计面板** - 实时显示数据统计
- ✅ **增删改查** - 完整的CRUD操作
- ✅ **精美界面** - 现代化的UI设计
- ✅ **无需数据库** - 直接编辑JSON文件

---

## 🚀 快速开始

### 方式1：使用启动脚本（推荐）

#### Linux/Mac
```bash
cd /home/ubuntu/gamecode_admin
./start.sh
```

#### Windows
双击运行 `start.bat`

### 方式2：手动启动

```bash
cd /home/ubuntu/gamecode_admin
node server.js
```

---

## 📡 访问地址

启动后在浏览器中访问：

```
http://localhost:3000
```

---

## 💡 使用说明

### 1. 添加兑换码
- 点击"➕ 添加兑换码"按钮
- 填写游戏名称、兑换码、奖励等信息
- 点击"保存"

### 2. 编辑兑换码
- 在表格中找到要编辑的兑换码
- 点击"编辑"按钮
- 修改信息后点击"保存"

### 3. 删除兑换码
- 在表格中找到要删除的兑换码
- 点击"删除"按钮
- 确认删除

### 4. 搜索兑换码
- 在搜索框中输入关键词
- 自动过滤显示匹配的结果

### 5. 保存更改
- 完成编辑后，点击"💾 保存到文件"按钮
- 更改会写入 `GameCodeBase.json` 文件

### 6. 重新加载
- 点击"🔄 重新加载"按钮
- 从文件重新加载数据（会丢失未保存的更改）

---

## 📁 文件说明

```
gamecode_admin/
├── server.js           # Node.js后端服务器
├── index.html          # Web管理界面
├── GameCodeBase.json   # 游戏数据文件
├── start.sh            # Linux/Mac启动脚本
├── start.bat           # Windows启动脚本
└── README.md           # 说明文档
```

---

## 🔧 技术栈

- **后端：** Node.js (原生HTTP模块)
- **前端：** HTML + CSS + JavaScript (原生)
- **数据：** JSON文件存储

---

## ⚙️ 配置

### 修改端口

编辑 `server.js` 文件，修改第5行：

```javascript
const PORT = 3000;  // 改为你想要的端口
```

### 修改数据文件路径

编辑 `server.js` 文件，修改第6行：

```javascript
const JSON_FILE = path.join(__dirname, 'GameCodeBase.json');
```

---

## 📝 数据格式

`GameCodeBase.json` 文件格式：

```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-21T00:00:00Z",
  "games": [
    {
      "gameName": "游戏名称",
      "codes": [
        {
          "code": "ABCD1234",
          "rewardDescription": "钻石x100",
          "sourcePlatform": "官方微博",
          "status": "active",
          "expiryDate": "2026-12-31 23:59:59",
          "codeType": "limited",
          "verificationCount": 0,
          "reviewStatus": "approved"
        }
      ]
    }
  ]
}
```

---

## 🛡️ 安全提示

⚠️ **重要：** 此后台管理系统仅用于本地开发和测试！

- ❌ 没有用户认证
- ❌ 没有权限控制
- ❌ 不适合公网部署

如需在生产环境使用，请添加：
- 用户登录认证
- 数据验证
- HTTPS加密
- 访问日志

---

## 🐛 常见问题

### Q: 启动后无法访问？
**A:** 检查端口是否被占用，尝试修改端口号。

### Q: 保存失败？
**A:** 检查文件权限，确保有写入权限。

### Q: 数据丢失？
**A:** 定期备份 `GameCodeBase.json` 文件。

### Q: 如何停止服务器？
**A:** 在终端按 `Ctrl + C`。

---

## 📞 技术支持

如有问题，请查看：
- GitHub仓库：https://github.com/Jhoney47/game_code_flutter
- 数据文件位置：`/home/ubuntu/gamecode_admin/GameCodeBase.json`

---

## 📄 许可证

MIT License - 自由使用和修改

---

**享受使用 GameCode 后台管理系统！** 🎉
