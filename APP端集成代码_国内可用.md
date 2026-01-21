# APP端集成代码（国内无需梯子）

## 🇨🇳 方案说明

使用 **jsDelivr CDN** + **版本号控制**，确保：
- ✅ 国内可直接访问，无需梯子
- ✅ 速度快（CDN加速）
- ✅ 获取最新数据（版本号控制）

---

## 📱 APP端代码

### 方法1：简单版本（推荐）

```javascript
// jsDelivr CDN地址（国内可访问）
const CDN_URL = 'https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json';

// 添加时间戳参数，强制刷新缓存
async function getGameCodes() {
  try {
    const timestamp = Date.now();
    const url = `${CDN_URL}?t=${timestamp}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('数据版本:', data.version);
    console.log('更新时间:', data.lastUpdated);
    console.log('游戏数量:', data.games.length);
    
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
}

// 使用示例
getGameCodes().then(data => {
  data.games.forEach(game => {
    console.log(`游戏: ${game.gameName}`);
    game.codes.forEach(code => {
      console.log(`  兑换码: ${code.code}`);
      console.log(`  准确率: ${code.accuracyRate}%`);
    });
  });
});
```

### 方法2：版本号控制（最佳）

```javascript
const CDN_URL = 'https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json';

// 本地缓存
let cachedData = null;
let cachedVersion = null;

async function getGameCodes(forceRefresh = false) {
  try {
    // 如果有缓存且不强制刷新，先检查版本号
    if (cachedData && !forceRefresh) {
      // 快速检查是否有新版本
      const timestamp = Date.now();
      const response = await fetch(`${CDN_URL}?t=${timestamp}`);
      const data = await response.json();
      
      if (data.version === cachedVersion) {
        console.log('数据未变化，使用缓存');
        return cachedData;
      } else {
        console.log('检测到新版本，更新数据');
        cachedData = data;
        cachedVersion = data.version;
        
        // 保存到本地存储
        localStorage.setItem('gameCodeData', JSON.stringify(data));
        localStorage.setItem('gameCodeVersion', data.version);
        
        return data;
      }
    }
    
    // 首次加载或强制刷新
    const timestamp = Date.now();
    const response = await fetch(`${CDN_URL}?t=${timestamp}`);
    const data = await response.json();
    
    cachedData = data;
    cachedVersion = data.version;
    
    // 保存到本地存储
    localStorage.setItem('gameCodeData', JSON.stringify(data));
    localStorage.setItem('gameCodeVersion', data.version);
    
    console.log('数据已更新');
    return data;
    
  } catch (error) {
    console.error('获取数据失败:', error);
    
    // 如果网络失败，尝试从本地存储读取
    const localData = localStorage.getItem('gameCodeData');
    if (localData) {
      console.log('网络失败，使用本地缓存');
      return JSON.parse(localData);
    }
    
    throw error;
  }
}

// 使用示例
// 首次加载
getGameCodes().then(data => {
  console.log('首次加载完成');
});

// 用户刷新时
function onUserRefresh() {
  getGameCodes(true).then(data => {
    console.log('刷新完成，数据已更新');
  });
}

// 定期检查更新（可选）
setInterval(() => {
  getGameCodes().then(data => {
    console.log('后台检查更新完成');
  });
}, 5 * 60 * 1000); // 每5分钟检查一次
```

### 方法3：React Native示例

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CDN_URL = 'https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json';

export default function GameCodeScreen() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(null);

  // 加载数据
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // 添加时间戳强制刷新
      const timestamp = Date.now();
      const url = `${CDN_URL}?t=${timestamp}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // 检查版本号
      const cachedVersion = await AsyncStorage.getItem('gameCodeVersion');
      
      if (data.version !== cachedVersion || forceRefresh) {
        console.log('数据已更新');
        setGames(data.games);
        setVersion(data.version);
        
        // 保存到本地
        await AsyncStorage.setItem('gameCodeData', JSON.stringify(data));
        await AsyncStorage.setItem('gameCodeVersion', String(data.version));
      } else {
        console.log('数据未变化');
      }
      
    } catch (error) {
      console.error('加载数据失败:', error);
      
      // 从本地加载
      const localData = await AsyncStorage.getItem('gameCodeData');
      if (localData) {
        const data = JSON.parse(localData);
        setGames(data.games);
        setVersion(data.version);
      }
    } finally {
      setLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    loadData();
  }, []);

  // 下拉刷新
  const onRefresh = () => {
    loadData(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>游戏兑换码 (版本: {version})</Text>
      
      <FlatList
        data={games}
        keyExtractor={(item) => item.gameName}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.gameCard}>
            <Text style={styles.gameName}>{item.gameName}</Text>
            <Text style={styles.codeCount}>{item.codeCount} 个兑换码</Text>
            
            {item.codes.map((code) => (
              <View key={code.code} style={styles.codeItem}>
                <Text style={styles.code}>{code.code}</Text>
                <Text style={styles.reward}>{code.rewardDescription}</Text>
                {code.accuracyRate && (
                  <Text style={styles.accuracy}>准确率: {code.accuracyRate}%</Text>
                )}
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
  },
  gameCard: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  codeCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  codeItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  reward: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  accuracy: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 4,
  },
});
```

---

## 🔄 数据更新流程

### 后台管理员操作：
1. 在后台添加/编辑/删除兑换码
2. 数据自动保存到JSON文件
3. 1秒后自动推送到GitHub
4. 自动清除CDN缓存

### APP端用户操作：
1. 打开APP或下拉刷新
2. 从jsDelivr CDN获取数据（国内无需梯子）
3. 检查版本号是否变化
4. 如果有更新，显示最新数据

### 时间线：
```
后台修改 → 1秒 → GitHub更新 → 1-2分钟 → CDN更新 → APP刷新获取
```

---

## 📊 数据结构说明

### 完整数据结构
```json
{
  "version": 1737457066933,
  "lastUpdated": "2026-01-21T11:37:46.933Z",
  "games": [
    {
      "gameName": "铃兰之剑",
      "codeCount": 45,
      "codes": [
        {
          "code": "KSTGIFT",
          "rewardDescription": "钻石*100",
          "sourcePlatform": "官方",
          "sourceUrl": "https://example.com",
          "expireDate": null,
          "status": "active",
          "codeType": "permanent",
          "publishDate": "2026-01-21T10:00:00Z",
          "verificationCount": 0,
          "reviewStatus": "approved",
          "crawlSource": "manual",
          "crawlTime": "2026-01-21T10:00:00Z",
          "accuracyRate": 95,
          "verificationSuccessRate": 90,
          "lastVerifiedTime": null,
          "crawlerVersion": null
        }
      ]
    }
  ]
}
```

### 字段说明
- **version**: 数据版本号（时间戳），用于判断是否有更新
- **lastUpdated**: 最后更新时间（ISO 8601格式）
- **games**: 游戏数组
  - **gameName**: 游戏名称
  - **codeCount**: 兑换码数量
  - **codes**: 兑换码数组
    - **code**: 兑换码
    - **rewardDescription**: 奖励描述
    - **sourcePlatform**: 来源平台
    - **sourceUrl**: 来源URL
    - **status**: 状态（active/expired）
    - **accuracyRate**: 准确率（0-100）
    - **verificationSuccessRate**: 验证成功率（0-100）
    - **crawlSource**: 爬取来源（manual/auto/api）
    - **crawlTime**: 爬取时间

---

## ✅ 测试清单

### 国内访问测试
- [ ] 在国内网络环境下访问CDN地址
- [ ] 不使用梯子直接访问
- [ ] 测试加载速度（应该很快）

### 数据更新测试
- [ ] 后台修改数据
- [ ] 等待1-2分钟
- [ ] APP刷新获取最新数据
- [ ] 检查版本号是否变化

### 缓存测试
- [ ] 首次加载数据
- [ ] 关闭网络
- [ ] 从本地缓存读取数据
- [ ] 恢复网络后刷新

---

## 🎯 常见问题

### Q: 为什么有时候刷新还是旧数据？
A: CDN缓存需要1-2分钟更新。可以在URL后添加时间戳参数强制刷新：
```javascript
const url = `${CDN_URL}?t=${Date.now()}`;
```

### Q: 国内访问会被墙吗？
A: 不会。jsDelivr CDN在国内有节点，可以直接访问，无需梯子。

### Q: 如何确保获取到最新数据？
A: 使用版本号控制。每次后台修改，版本号都会更新。APP端检查版本号即可判断是否有更新。

### Q: 如果CDN挂了怎么办？
A: 代码中已包含本地缓存机制。如果CDN失败，会自动从本地缓存读取数据。

---

## 📝 总结

**推荐使用方法2（版本号控制）**，因为：
- ✅ 国内可访问（jsDelivr CDN）
- ✅ 速度快（CDN加速）
- ✅ 数据新鲜（版本号控制）
- ✅ 有本地缓存（离线可用）
- ✅ 自动更新（无需手动操作）

**完整流程：**
1. 后台修改 → 自动保存 → 自动推送GitHub → 自动清除CDN缓存
2. APP刷新 → 检查版本号 → 获取最新数据 → 保存本地缓存
3. 用户体验：无感知更新，国内无需梯子，速度快
