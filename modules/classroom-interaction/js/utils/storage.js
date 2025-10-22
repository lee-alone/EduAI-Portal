/**
 * 本地存储管理模块
 * 负责数据的本地存储和读取
 */

/**
 * 存储管理类
 */
export class StorageManager {
    constructor() {
        this.storageKey = 'classroomData';
    }

    /**
     * 保存数据到本地存储
     * @param {string} key 存储键
     * @param {any} data 要存储的数据
     * @returns {boolean} 是否成功
     */
    save(key, data) {
        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem(key, jsonString);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    /**
     * 从本地存储读取数据
     * @param {string} key 存储键
     * @param {any} defaultValue 默认值
     * @returns {any} 读取的数据或默认值
     */
    load(key, defaultValue = null) {
        try {
            const jsonString = localStorage.getItem(key);
            if (jsonString === null) {
                return defaultValue;
            }
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除存储的数据
     * @param {string} key 存储键
     * @returns {boolean} 是否成功
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有存储数据
     * @returns {boolean} 是否成功
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 检查存储空间是否可用
     * @returns {boolean} 是否可用
     */
    isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取存储使用情况
     * @returns {Object} 存储使用情况
     */
    getStorageInfo() {
        if (!this.isAvailable()) {
            return {
                available: false,
                used: 0,
                total: 0
            };
        }

        let used = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length;
            }
        }

        return {
            available: true,
            used: used,
            total: 5 * 1024 * 1024, // 假设5MB限制
            percentage: (used / (5 * 1024 * 1024) * 100).toFixed(2)
        };
    }

    /**
     * 保存课堂状态
     * @param {Object} classroomState 课堂状态
     * @returns {boolean} 是否成功
     */
    saveClassroomState(classroomState) {
        return this.save('classroomState', classroomState);
    }

    /**
     * 加载课堂状态
     * @returns {Object} 课堂状态
     */
    loadClassroomState() {
        return this.load('classroomState', {
            studentPoints: {},
            calledStudents: [],
            pointsLog: []
        });
    }

    /**
     * 保存学生名单
     * @param {Object} roster 学生名单
     * @returns {boolean} 是否成功
     */
    saveStudentRoster(roster) {
        return this.save('studentRoster', roster);
    }

    /**
     * 加载学生名单
     * @returns {Object} 学生名单
     */
    loadStudentRoster() {
        return this.load('studentRoster', {});
    }

    /**
     * 保存活动数据
     * @param {Array} activityData 活动数据
     * @returns {boolean} 是否成功
     */
    saveActivityData(activityData) {
        return this.save('activityData', activityData);
    }

    /**
     * 加载活动数据
     * @returns {Array} 活动数据
     */
    loadActivityData() {
        return this.load('activityData', []);
    }

    /**
     * 保存用户设置
     * @param {Object} settings 用户设置
     * @returns {boolean} 是否成功
     */
    saveUserSettings(settings) {
        return this.save('userSettings', settings);
    }

    /**
     * 加载用户设置
     * @returns {Object} 用户设置
     */
    loadUserSettings() {
        return this.load('userSettings', {
            theme: 'light',
            language: 'zh-CN',
            autoSave: true,
            notifications: true
        });
    }
}
