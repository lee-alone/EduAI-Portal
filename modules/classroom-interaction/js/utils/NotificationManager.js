/**
 * 统一通知管理工具
 * 避免重复的通知代码，提供统一的通知功能
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
    }

    /**
     * 显示通知
     */
    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ai-notification ai-notification-${type}`;
        notification.innerHTML = `
            <div class="ai-notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        this.notifications.push(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            this.hide(notification);
        }, 3000);
    }

    /**
     * 隐藏通知
     */
    hide(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }
        }, 300);
    }

    /**
     * 隐藏所有通知
     */
    hideAll() {
        this.notifications.forEach(notification => {
            this.hide(notification);
        });
    }

    /**
     * 成功通知
     */
    success(message) {
        this.show(message, 'success');
    }

    /**
     * 错误通知
     */
    error(message) {
        this.show(message, 'error');
    }

    /**
     * 信息通知
     */
    info(message) {
        this.show(message, 'info');
    }

    /**
     * 警告通知
     */
    warning(message) {
        this.show(message, 'warning');
    }
}

// 创建全局实例
window.notificationManager = new NotificationManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
} else {
    window.NotificationManager = NotificationManager;
}
