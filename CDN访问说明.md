# GameCode 数据访问方案

## ✅ GitHub Raw CDN访问（推荐）

### 方案1：jsDelivr CDN（国内可访问）
```
https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json
```

**特点：**
- ✅ 国内可直接访问，无需VPN
- ✅ 全球CDN加速，速度快
- ✅ 自动缓存，减少服务器压力
- ✅ 支持版本控制（@master表示最新版）

**使用示例（APP端）：**
```javascript
// React Native / Expo
fetch('https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json')
  .then(response => response.json())
  .then(data => {
    console.log('获取到游戏数据:', data);
    // 更新本地数据
  })
  .catch(error => console.error('获取数据失败:', error));
```

### 方案2：GitHub Raw（备用）
```
https://raw.githubusercontent.com/Jhoney47/gamecode-admin/master/GameCodeBase.json
```

**特点：**
- ⚠️ 国内可能需要VPN
- ✅ 实时数据，无缓存延迟
- ✅ GitHub官方服务

### 方案3：Statically CDN（备用）
```
https://cdn.statically.io/gh/Jhoney47/gamecode-admin/master/GameCodeBase.json
```

**特点：**
- ✅ 国内可访问
- ✅ CDN加速
- ✅ 免费服务

## 🔄 自动同步流程

### 后台管理 → GitHub → CDN → APP

1. **后台修改数据** 
   - 在 https://8888-ih8el24d8dxezasg9avep-f0fdca25.sg1.manus.computer 添加/编辑兑换码
   
2. **自动保存到JSON文件**
   - 数据立即写入 `/home/ubuntu/gamecode_admin/GameCodeBase.json`
   
3. **自动推送到GitHub**
   - 1秒后自动执行 `sync_to_github.sh` 脚本
   - 提交并推送到 GitHub 仓库
   
4. **CDN自动更新**
   - jsDelivr CDN会在几分钟内自动刷新缓存
   - 用户刷新APP即可获取最新数据

## 📱 APP端集成示例

### React Native / Expo 示例

```javascript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CDN_URL = 'https://cdn.jsdelivr.net/gh/Jhoney47/gamecode-admin@master/GameCodeBase.json';
const CACHE_KEY = 'gamecode_data';
const CACHE_TIME_KEY = 'gamecode_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export function useGameCodeData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // 检查缓存
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        const cacheTime = await AsyncStorage.getItem(CACHE_TIME_KEY);
        
        if (cachedData && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < CACHE_DURATION) {
            setData(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }
      }
      
      // 从CDN获取最新数据
      const response = await fetch(CDN_URL);
      const jsonData = await response.json();
      
      // 保存到缓存
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(jsonData));
      await AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      
      setData(jsonData);
      setError(null);
    } catch (err) {
      console.error('获取数据失败:', err);
      setError(err.message);
      
      // 如果网络失败，尝试使用缓存数据
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setData(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: () => fetchData(true) };
}
```

### 使用示例

```javascript
function GameCodeScreen() {
  const { data, loading, error, refresh } = useGameCodeData();

  if (loading) return <Text>加载中...</Text>;
  if (error) return <Text>加载失败: {error}</Text>;

  return (
    <ScrollView>
      <Button title="刷新数据" onPress={refresh} />
      {data?.games.map(game => (
        <View key={game.gameName}>
          <Text>{game.gameName}</Text>
          {game.codes.map(code => (
            <View key={code.code}>
              <Text>兑换码: {code.code}</Text>
              <Text>奖励: {code.rewardDescription}</Text>
              <Text>准确率: {code.accuracyRate}%</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
```

## 🚀 性能优化建议

### 1. 使用缓存策略
- 本地缓存5分钟，减少网络请求
- 首次加载使用缓存，后台静默更新

### 2. 增量更新
```javascript
// 只下载更新的数据
const lastUpdate = await AsyncStorage.getItem('last_update_time');
const url = `${CDN_URL}?t=${lastUpdate}`;
```

### 3. 错误处理
- 网络失败时使用缓存数据
- 显示数据更新时间
- 提供手动刷新按钮

## 🔒 数据安全

### 当前方案
- ✅ GitHub私有仓库（代码和配置私有）
- ✅ JSON文件公开访问（仅数据公开）
- ✅ 无敏感信息泄露

### 如需加密
可以在后台添加数据加密功能：
```javascript
// 服务器端加密
const crypto = require('crypto');
const encrypted = crypto.createCipher('aes-256-cbc', SECRET_KEY)
  .update(JSON.stringify(data), 'utf8', 'hex');
```

## 📊 监控和统计

### GitHub仓库统计
- 访问 https://github.com/Jhoney47/gamecode-admin
- 查看 Insights → Traffic 了解访问量

### CDN统计
- jsDelivr提供访问统计
- 可通过 https://www.jsdelivr.com/package/gh/Jhoney47/gamecode-admin 查看

## 🆘 故障排查

### 问题1：APP获取不到数据
1. 检查网络连接
2. 尝试访问 CDN URL 确认数据可访问
3. 查看浏览器控制台错误信息

### 问题2：数据不是最新的
1. CDN缓存需要几分钟更新
2. 可以添加时间戳强制刷新：`${CDN_URL}?t=${Date.now()}`
3. 或使用 GitHub Raw 直接访问

### 问题3：国内访问慢
1. 优先使用 jsDelivr CDN
2. 备用 Statically CDN
3. 考虑使用国内CDN服务（如七牛、阿里云OSS）

## 📝 总结

✅ **推荐方案：jsDelivr CDN**
- 国内可访问
- 自动同步
- 高性能
- 零成本

✅ **完整流程：**
后台修改 → 自动保存 → GitHub推送 → CDN更新 → APP刷新获取
