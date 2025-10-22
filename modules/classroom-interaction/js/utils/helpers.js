/**
 * 工具函数模块
 * 提供通用的辅助函数
 */

/**
 * 显示消息提示
 * @param {string} message 消息内容
 * @param {string} type 消息类型 ('success' | 'error' | 'warning' | 'info')
 * @param {number} duration 显示时长（毫秒）
 */
export function showMessage(message, type = "info", duration = 4000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-alert ${type}`;
    messageDiv.innerHTML = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, duration);
}

/**
 * 格式化日期
 * @param {Date} date 日期对象
 * @param {string} locale 语言环境
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, locale = 'zh-CN') {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString(locale, options);
}

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {string} locale 语言环境
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(date, locale = 'zh-CN') {
    return date.toLocaleString(locale);
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 节流后的函数
 */
export function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 生成随机ID
 * @param {number} length ID长度
 * @returns {string} 随机ID
 */
export function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 验证手机号格式
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
export function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

/**
 * 数组去重
 * @param {Array} arr 要去重的数组
 * @returns {Array} 去重后的数组
 */
export function uniqueArray(arr) {
    return [...new Set(arr)];
}

/**
 * 数组分组
 * @param {Array} arr 要分组的数组
 * @param {Function} keyFn 分组键函数
 * @returns {Object} 分组后的对象
 */
export function groupBy(arr, keyFn) {
    return arr.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * 等待指定时间
 * @param {number} ms 等待时间（毫秒）
 * @returns {Promise} Promise对象
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的JSON解析
 * @param {string} jsonString JSON字符串
 * @param {any} defaultValue 默认值
 * @returns {any} 解析结果或默认值
 */
export function safeJsonParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON解析失败:', error);
        return defaultValue;
    }
}

/**
 * 安全的JSON字符串化
 * @param {any} obj 要序列化的对象
 * @param {string} defaultValue 默认值
 * @returns {string} JSON字符串或默认值
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.warn('JSON序列化失败:', error);
        return defaultValue;
    }
}

