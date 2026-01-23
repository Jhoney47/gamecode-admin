const express = require('express');
const fs = require('fs');
const path = require('path');
const AutoSync = require('./auto-sync');

const app = express();
const PORT = 8888;
const JSON_FILE = path.join(__dirname, 'GameCodeBase.json');

// 自动同步配置
const autoSync = new AutoSync(JSON_FILE, __dirname);

// 中间件
app.use(express.json());
app.use(express.static(__dirname));

// 内存中的数据缓存
let cachedData = null;
let lastModifiedTime = null;

// 读取JSON文件
function loadData() {
  try {
    const stats = fs.statSync(JSON_FILE);
    const currentModifiedTime = stats.mtime.getTime();

    // 如果文件没有变化，返回缓存数据
    if (cachedData && lastModifiedTime === currentModifiedTime) {
      return cachedData;
    }

    const rawData = fs.readFileSync(JSON_FILE, 'utf-8');
    cachedData = JSON.parse(rawData);
    lastModifiedTime = currentModifiedTime;

    console.log(`📥 [${new Date().toLocaleString('zh-CN')}] 数据已从文件加载`);
    return cachedData;
  } catch (error) {
    console.error('❌ 读取JSON文件失败:', error);
    return null;
  }
}

// 保存JSON文件
function saveData(data) {
  try {
    // 更新元数据
    data.lastUpdated = new Date().toISOString();
    data.totalCodes = data.games.reduce((sum, game) => sum + game.codeCount, 0);

    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // 更新缓存
    cachedData = data;
    const stats = fs.statSync(JSON_FILE);
    lastModifiedTime = stats.mtime.getTime();

    console.log(`💾 [${new Date().toLocaleString('zh-CN')}] 数据已保存到文件`);
    return true;
  } catch (error) {
    console.error('❌ 保存JSON文件失败:', error);
    return false;
  }
}

// 监听文件变化
fs.watch(JSON_FILE, (eventType, filename) => {
  if (eventType === 'change') {
    console.log(`🔄 [${new Date().toLocaleString('zh-CN')}] 检测到文件变化，重新加载数据...`);
    loadData();
  }
});

// API路由

// 获取所有数据
app.get('/api/data', (req, res) => {
  const data = loadData();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: '无法读取数据' });
  }
});

// 保存所有数据
app.post('/api/data', (req, res) => {
  const success = saveData(req.body);
  if (success) {
    res.json({ success: true, message: '数据保存成功' });
  } else {
    res.status(500).json({ success: false, message: '数据保存失败' });
  }
});

// 获取所有游戏列表
app.get('/api/games', (req, res) => {
  const data = loadData();
  if (data && data.games) {
    res.json({ games: data.games });
  } else {
    res.status(500).json({ error: '无法读取数据' });
  }
});

// 添加新游戏
app.post('/api/games', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: '无法读取数据' });
  }

  const newGame = {
    gameName: req.body.gameName,
    codeCount: 0,
    codes: []
  };

  data.games.push(newGame);

  if (saveData(data)) {
    res.json({ success: true, game: newGame });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// 删除游戏
app.delete('/api/games/:gameName', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: '无法读取数据' });
  }

  const gameName = decodeURIComponent(req.params.gameName);
  data.games = data.games.filter(game => game.gameName !== gameName);

  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// 添加兑换码
app.post('/api/games/:gameName/codes', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: '无法读取数据' });
  }

  const gameName = decodeURIComponent(req.params.gameName);
  const game = data.games.find(g => g.gameName === gameName);

  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  const newCode = {
    code: req.body.code,
    rewardDescription: req.body.rewardDescription || '',
    sourcePlatform: req.body.sourcePlatform || '',
    sourceUrl: req.body.sourceUrl || '',
    expireDate: req.body.expireDate || null,
    status: req.body.status || 'active',
    codeType: req.body.codeType || 'permanent',
    publishDate: new Date().toISOString(),
    verificationCount: 0,
    reviewStatus: req.body.reviewStatus || 'approved',
    // 新增爬取相关字段
    crawlSource: req.body.crawlSource || 'manual', // manual, auto, api
    crawlTime: req.body.crawlTime || new Date().toISOString(),
    accuracyRate: req.body.accuracyRate || null, // 0-100
    verificationSuccessRate: req.body.verificationSuccessRate || null, // 0-100
    lastVerifiedTime: req.body.lastVerifiedTime || null,
    crawlerVersion: req.body.crawlerVersion || null
  };

  game.codes.push(newCode);
  game.codeCount = game.codes.length;

  if (saveData(data)) {
    res.json({ success: true, code: newCode });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// 更新兑换码
app.put('/api/games/:gameName/codes/:code', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: '无法读取数据' });
  }

  const gameName = decodeURIComponent(req.params.gameName);
  const codeStr = decodeURIComponent(req.params.code);
  const game = data.games.find(g => g.gameName === gameName);

  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  const codeIndex = game.codes.findIndex(c => c.code === codeStr);

  if (codeIndex === -1) {
    return res.status(404).json({ error: '兑换码不存在' });
  }

  // 保留原有的爬取相关字段，只更新提供的字段
  const updatedCode = {
    ...game.codes[codeIndex],
    ...req.body,
    // 如果更新了验证相关信息，更新最后验证时间
    lastVerifiedTime: req.body.verificationCount !== undefined ? new Date().toISOString() : game.codes[codeIndex].lastVerifiedTime
  };

  game.codes[codeIndex] = updatedCode;

  if (saveData(data)) {
    res.json({ success: true, code: updatedCode });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// 删除兑换码
app.delete('/api/games/:gameName/codes/:code', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: '无法读取数据' });
  }

  const gameName = decodeURIComponent(req.params.gameName);
  const codeStr = decodeURIComponent(req.params.code);
  const game = data.games.find(g => g.gameName === gameName);

  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  const codeIndex = game.codes.findIndex(c => c.code === codeStr);

  if (codeIndex === -1) {
    return res.status(404).json({ error: '兑换码不存在' });
  }

  game.codes.splice(codeIndex, 1);
  game.codeCount = game.codes.length;

  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// 获取统计信息
app.get('/api/stats', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: '无法读取数据' });
  }

  let totalCodes = 0;
  let activeCodes = 0;
  let expiredCodes = 0;
  let autoCrawledCodes = 0;
  let manualCodes = 0;
  let totalAccuracyRate = 0;
  let codesWithAccuracy = 0;

  data.games.forEach(game => {
    game.codes.forEach(code => {
      totalCodes++;

      if (code.status === 'active') activeCodes++;
      if (code.status === 'expired') expiredCodes++;

      if (code.crawlSource === 'auto' || code.crawlSource === 'api') {
        autoCrawledCodes++;
      } else {
        manualCodes++;
      }

      if (code.accuracyRate !== null && code.accuracyRate !== undefined) {
        totalAccuracyRate += code.accuracyRate;
        codesWithAccuracy++;
      }
    });
  });

  const avgAccuracyRate = codesWithAccuracy > 0 ? (totalAccuracyRate / codesWithAccuracy).toFixed(2) : null;

  res.json({
    totalGames: data.games.length,
    totalCodes,
    activeCodes,
    expiredCodes,
    autoCrawledCodes,
    manualCodes,
    avgAccuracyRate,
    lastUpdated: data.lastUpdated
  });
});

// 手动推送到 GitHub
app.post('/api/sync/push', async (req, res) => {
  console.log('🔼 收到手动推送请求...');
  try {
    const result = await autoSync.syncToGitHub();
    if (result.success) {
      res.json({ success: true, message: result.message, commitMsg: result.commitMsg });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '推送失败: ' + error.message });
  }
});

// 从 GitHub 拉取最新数据
app.post('/api/sync/pull', async (req, res) => {
  console.log('🔽 收到拉取请求...');
  try {
    const result = await autoSync.pullFromGitHub();
    if (result.success) {
      // 拉取成功后，重新加载数据
      const newData = loadData();
      res.json({ success: true, message: result.message, data: newData });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '拉取失败: ' + error.message });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  console.log('============================================================');
  console.log('🎮 GameCode 后台管理系统已启动！');
  console.log('============================================================');
  console.log('📡 服务器地址:');
  console.log(`   本地访问: http://localhost:${PORT}`);
  console.log(`   局域网访问: http://127.0.0.1:${PORT}`);
  console.log(`📁 数据文件: ${JSON_FILE}`);
  console.log('🔄 文件监听: 已启用（自动检测文件变化）');
  console.log('💡 使用说明:');
  console.log('   1. 在浏览器中打开上面的地址');
  console.log('   2. 添加、编辑或删除游戏兑换码');
  console.log('   3. 修改会自动保存到JSON文件');
  console.log('   4. 外部修改JSON文件会自动同步到后台');
  console.log('   5. 按 Ctrl+C 停止服务器');
  console.log('============================================================');

  // 启动时自动从 GitHub 拉取最新数据
  console.log('🔄 正在启动自动同步 (Auto-Pull)...');
  try {
    const result = await autoSync.pullFromGitHub();
    if (result.success) {
      console.log('✅ 启动时同步成功: 已获取最新数据');
    } else {
      console.error('❌ 启动时同步失败:', result.message);
    }
  } catch (err) {
    console.error('❌ 启动同步异常:', err);
  }

  // 初始加载数据
  loadData();
});
