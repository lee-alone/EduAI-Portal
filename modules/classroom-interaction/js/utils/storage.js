/**
 * 存储工具模块
 * 负责本地存储、数据持久化等功能
 */

class StorageManager {
    constructor() {
        this.storageKey = 'classroom-interaction-data';
    }

    /**
     * 保存数据到本地存储
     */
    save(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            return true;
        } catch (error) {
            // 保存数据失败
            return false;
        }
    }

    /**
     * 从本地存储加载数据
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            // 加载数据失败
            return defaultValue;
        }
    }

    /**
     * 删除数据
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            // 删除数据失败
            return false;
        }
    }

    /**
     * 清空所有数据
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            // 清空数据失败
            return false;
        }
    }

    /**
     * 检查存储空间
     */
    checkStorageSpace() {
        try {
            const testKey = 'storage-test';
            const testData = 'x'.repeat(1024 * 1024); // 1MB测试数据
            
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            
            return true;
        } catch (error) {
            // 存储空间不足
            return false;
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            
            return {
                used: totalSize,
                usedKB: Math.round(totalSize / 1024),
                usedMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
            };
        } catch (error) {
            // 获取存储使用情况失败
            return null;
        }
    }

    /**
     * 导出所有数据
     */
    exportAllData() {
        try {
            const allData = {};
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    allData[key] = this.load(key);
                }
            }
            
            return {
                exportTime: new Date().toISOString(),
                data: allData,
                version: '1.0'
            };
        } catch (error) {
            // 导出数据失败
            return null;
        }
    }

    /**
     * 导入数据
     */
    importData(importData) {
        try {
            if (!importData || !importData.data) {
                throw new Error('无效的导入数据');
            }
            
            const { data } = importData;
            let importedCount = 0;
            
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    this.save(key, data[key]);
                    importedCount++;
                }
            }
            
            return {
                success: true,
                importedCount,
                message: `成功导入 ${importedCount} 项数据`
            };
        } catch (error) {
            // 导入数据失败
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 备份数据
     */
    backup() {
        try {
            const backupData = this.exportAllData();
            if (!backupData) {
                throw new Error('备份数据失败');
            }
            
            const backupKey = `backup_${Date.now()}`;
            this.save(backupKey, backupData);
            
            return {
                success: true,
                backupKey,
                message: '数据备份成功'
            };
        } catch (error) {
            // 备份数据失败
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 恢复数据
     */
    restore(backupKey) {
        try {
            const backupData = this.load(backupKey);
            if (!backupData) {
                throw new Error('备份数据不存在');
            }
            
            // 清空当前数据
            this.clear();
            
            // 恢复数据
            const result = this.importData(backupData);
            
            return {
                success: result.success,
                message: result.success ? '数据恢复成功' : '数据恢复失败'
            };
        } catch (error) {
            // 恢复数据失败
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取所有备份
     */
    getAllBackups() {
        try {
            const backups = [];
            for (let key in localStorage) {
                if (key.startsWith('backup_')) {
                    const backupData = this.load(key);
                    if (backupData && backupData.exportTime) {
                        backups.push({
                            key,
                            exportTime: backupData.exportTime,
                            timestamp: new Date(backupData.exportTime).getTime()
                        });
                    }
                }
            }
            
            return backups.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            // 获取备份列表失败
            return [];
        }
    }

    /**
     * 清理过期备份
     */
    cleanupBackups(keepDays = 30) {
        try {
            const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
            const backups = this.getAllBackups();
            let cleanedCount = 0;
            
            backups.forEach(backup => {
                if (backup.timestamp < cutoffTime) {
                    this.remove(backup.key);
                    cleanedCount++;
                }
            });
            
            return {
                success: true,
                cleanedCount,
                message: `清理了 ${cleanedCount} 个过期备份`
            };
        } catch (error) {
            // 清理备份失败
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 创建全局实例
window.storageManager = new StorageManager();