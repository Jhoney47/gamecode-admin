const { exec } = require('child_process');
const path = require('path');

class AutoSync {
    constructor(jsonFile, baseDir) {
        this.jsonFile = jsonFile;
        this.baseDir = baseDir;
        this.debounceTimer = null;
    }

    // 防抖同步
    debouncedSync(delay = 3000) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.syncToGitHub();
        }, delay);
    }

    // 执行Shell命令
    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: this.baseDir }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ 命令执行失败: ${command}`, stderr);
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    // 自动提交并在后台推送
    async syncToGitHub() {
        console.log('🔄 正在执行自动同步...');
        try {
            // 检查是否有变化
            try {
                const status = await this.execCommand('git status --porcelain');
                if (!status) {
                    console.log('⚡ 没有文件变化，跳过同步');
                    return { success: true, message: '没有变化' };
                }
            } catch (e) {
                // 忽略错误，继续尝试
            }

            await this.execCommand('git add .');

            const timestamp = new Date().toLocaleString('zh-CN');
            const commitMsg = `Auto update data: ${timestamp}`;
            await this.execCommand(`git commit -m "${commitMsg}"`);

            console.log(`✅ 本地提交完成: ${commitMsg}`);

            // 异步推送，不阻塞
            this.execCommand('git push origin master').then(() => {
                console.log('🚀 已推送到 GitHub');
            }).catch(err => {
                console.error('❌ 推送失败:', err);
            });

            return { success: true, message: '已提交并在后台推送', commitMsg };
        } catch (error) {
            console.error('❌ 同步失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 从 GitHub 拉取 (强制覆盖本地)
    async pullFromGitHub() {
        console.log('🔽 正在从 GitHub 拉取...');
        try {
            await this.execCommand('git fetch origin master');
            await this.execCommand('git reset --hard origin/master');
            console.log('✅ 拉取成功 (已覆盖本地)');
            return { success: true, message: '拉取成功' };
        } catch (error) {
            console.error('❌ 拉取失败:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = AutoSync;
