/**
 * 布局管理器
 * 负责屏幕比例检测、布局切换和动画效果
 */

class LayoutManager {
    constructor() {
        this.currentLayout = 'auto'; // auto, 4-3, 16-9
        this.isManualOverride = false;
        this.isFullscreen = false;
        this.init();
    }

    /**
     * 初始化布局管理器
     */
    init() {
        this.bindEvents();
        this.detectScreenRatio();
        this.applyLayout();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 布局切换按钮（导航栏和原位置）
        const toggleBtn = document.getElementById('layout-toggle-btn') || document.getElementById('layout-toggle-btn-header');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLayout());
        }

        // 全屏模式按钮（导航栏和原位置）
        const fullscreenBtn = document.getElementById('fullscreen-toggle-btn') || document.getElementById('fullscreen-toggle-btn-header');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // 键盘快捷键 (Ctrl/Cmd + L)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                this.toggleLayout();
            }
        });

        // 窗口大小变化监听
        window.addEventListener('resize', () => {
            if (!this.isManualOverride) {
                this.detectScreenRatio();
                this.applyLayout();
            }
        });

        // 存储用户偏好
        window.addEventListener('beforeunload', () => {
            this.saveUserPreference();
        });

        // 加载用户偏好
        this.loadUserPreference();
    }

    /**
     * 检测屏幕比例
     */
    detectScreenRatio() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const ratio = width / height;

        // 移动设备检测
        if (width <= 768) {
            return 'mobile';
        }

        // 平板设备检测
        if (width <= 1024 && height <= 768) {
            return 'tablet';
        }

        // 桌面显示器比例检测
        // 4:3 比例范围 (1.2 - 1.4)
        if (ratio >= 1.2 && ratio <= 1.4) {
            return '4-3';
        } 
        // 16:9 比例范围 (1.6 - 1.8)
        else if (ratio >= 1.6 && ratio <= 1.8) {
            return '16-9';
        } 
        // 超宽屏 (21:9)
        else if (ratio >= 2.0) {
            return 'ultrawide';
        }
        // 大屏幕优化：根据屏幕宽度选择布局
        else if (width >= 1600) {
            return '16-9'; // 大屏幕优先使用16:9布局
        }
        // 默认使用16:9布局（现代显示器）
        else {
            return '16-9';
        }
    }

    /**
     * 应用布局
     */
    applyLayout() {
        const container = document.getElementById('module-container');
        const modeText = document.getElementById('layout-mode-text');
        const notification = document.getElementById('layout-switch-notification');
        const notificationText = document.getElementById('notification-text');

        if (!container) return;

        // 移除之前的布局类
        container.classList.remove('layout-mode-4-3', 'layout-mode-16-9', 'layout-mode-mobile', 'layout-mode-ultrawide');
        
        // 添加切换动画
        this.addSwitchingAnimation();

        // 根据当前布局模式应用样式
        let layoutMode, layoutName;
        
        if (this.currentLayout === 'auto') {
            const detectedRatio = this.detectScreenRatio();
            layoutMode = this.getLayoutModeForDevice(detectedRatio);
            layoutName = this.getLayoutNameForDevice(detectedRatio);
        } else {
            layoutMode = this.currentLayout;
            layoutName = this.currentLayout === '4-3' ? '4:3 等宽布局' : '16:9 重点布局';
        }

        // 应用布局类
        container.classList.add(`layout-mode-${layoutMode}`);
        
        // 调试信息
        console.log('应用布局:', {
            currentLayout: this.currentLayout,
            layoutMode: layoutMode,
            layoutName: layoutName,
            containerClasses: container.className,
            isManualOverride: this.isManualOverride
        });
        
        // 验证CSS是否生效
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(container);
            console.log('实际CSS grid-template-columns:', computedStyle.gridTemplateColumns);
        }, 100);

        // 更新模式文本（导航栏和原位置）
        const modeTextHeader = document.getElementById('layout-mode-text-header');
        if (modeText) {
            modeText.textContent = this.isManualOverride ? layoutName : '自动检测';
        }
        if (modeTextHeader) {
            modeTextHeader.textContent = this.isManualOverride ? layoutName : '自动检测';
        }

        // 显示切换通知
        this.showNotification(layoutName);

        // 延迟移除动画类
        setTimeout(() => {
            this.removeSwitchingAnimation();
        }, 600);
    }

    /**
     * 切换布局
     */
    toggleLayout() {
        this.isManualOverride = true;
        
        if (this.currentLayout === 'auto') {
            // 从自动切换到手动，选择与当前检测相反的布局
            const detectedRatio = this.detectScreenRatio();
            this.currentLayout = detectedRatio === '4-3' ? '16-9' : '4-3';
        } else {
            // 在两种布局间切换
            this.currentLayout = this.currentLayout === '4-3' ? '16-9' : '4-3';
        }

        console.log('切换布局到:', this.currentLayout); // 调试信息
        this.applyLayout();
    }

    /**
     * 重置为自动检测
     */
    resetToAuto() {
        this.isManualOverride = false;
        this.currentLayout = 'auto';
        this.applyLayout();
    }

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        
        const body = document.body;
        const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
        const fullscreenBtnHeader = document.getElementById('fullscreen-toggle-btn-header');
        
        if (this.isFullscreen) {
            body.classList.add('fullscreen-mode');
            // 更新原位置按钮
            if (fullscreenBtn) {
                fullscreenBtn.classList.add('active');
                fullscreenBtn.innerHTML = '<i class="fas fa-compress mr-1"></i>退出全屏';
            }
            // 更新导航栏按钮
            if (fullscreenBtnHeader) {
                fullscreenBtnHeader.classList.add('active');
                fullscreenBtnHeader.innerHTML = '<i class="fas fa-compress"></i><span>退出全屏</span>';
            }
            this.showNotification('已启用全屏模式');
        } else {
            body.classList.remove('fullscreen-mode');
            // 更新原位置按钮
            if (fullscreenBtn) {
                fullscreenBtn.classList.remove('active');
                fullscreenBtn.innerHTML = '<i class="fas fa-expand mr-1"></i>全屏模式';
            }
            // 更新导航栏按钮
            if (fullscreenBtnHeader) {
                fullscreenBtnHeader.classList.remove('active');
                fullscreenBtnHeader.innerHTML = '<i class="fas fa-expand"></i><span>全屏模式</span>';
            }
            this.showNotification('已退出全屏模式');
        }
        
        // 保存全屏状态
        this.saveUserPreference();
    }

    /**
     * 添加切换动画
     */
    addSwitchingAnimation() {
        const modules = document.querySelectorAll('.module-section');
        modules.forEach(module => {
            module.classList.add('switching');
        });
    }

    /**
     * 移除切换动画
     */
    removeSwitchingAnimation() {
        const modules = document.querySelectorAll('.module-section');
        modules.forEach(module => {
            module.classList.remove('switching');
        });
    }

    /**
     * 显示切换通知
     */
    showNotification(layoutName) {
        const notification = document.getElementById('layout-switch-notification');
        const notificationText = document.getElementById('notification-text');

        if (!notification || !notificationText) return;

        notificationText.textContent = `已切换到 ${layoutName}`;
        notification.classList.remove('hidden');

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    /**
     * 根据设备类型获取布局模式
     */
    getLayoutModeForDevice(deviceType) {
        switch (deviceType) {
            case 'mobile':
            case 'tablet':
                return 'mobile'; // 移动设备使用单列布局
            case '4-3':
                return '4-3';
            case '16-9':
                return '16-9';
            case 'ultrawide':
                return 'ultrawide'; // 超宽屏使用特殊布局
            default:
                return '16-9';
        }
    }

    /**
     * 根据设备类型获取布局名称
     */
    getLayoutNameForDevice(deviceType) {
        switch (deviceType) {
            case 'mobile':
                return '移动端单列布局';
            case 'tablet':
                return '平板端单列布局';
            case '4-3':
                return '4:3 等宽布局';
            case '16-9':
                return '16:9 重点布局';
            case 'ultrawide':
                return '超宽屏布局';
            default:
                return '16:9 重点布局';
        }
    }

    /**
     * 获取当前布局信息
     */
    getLayoutInfo() {
        return {
            currentLayout: this.currentLayout,
            isManualOverride: this.isManualOverride,
            screenRatio: this.detectScreenRatio(),
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.innerWidth / window.innerHeight
            }
        };
    }

    /**
     * 保存用户偏好
     */
    saveUserPreference() {
        try {
            const preference = {
                currentLayout: this.currentLayout,
                isManualOverride: this.isManualOverride,
                isFullscreen: this.isFullscreen,
                timestamp: Date.now()
            };
            localStorage.setItem('layoutPreference', JSON.stringify(preference));
        } catch (error) {
            console.warn('无法保存布局偏好设置');
        }
    }

    /**
     * 加载用户偏好
     */
    loadUserPreference() {
        try {
            const saved = localStorage.getItem('layoutPreference');
            if (saved) {
                const preference = JSON.parse(saved);
                // 检查时间戳，如果超过7天则重置
                const daysSinceLastSave = (Date.now() - preference.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSinceLastSave < 7) {
                    this.currentLayout = preference.currentLayout || 'auto';
                    this.isManualOverride = preference.isManualOverride || false;
                    this.isFullscreen = preference.isFullscreen || false;
                    
                    // 恢复全屏状态
                    if (this.isFullscreen) {
                        document.body.classList.add('fullscreen-mode');
                        const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
                        const fullscreenBtnHeader = document.getElementById('fullscreen-toggle-btn-header');
                        
                        if (fullscreenBtn) {
                            fullscreenBtn.classList.add('active');
                            fullscreenBtn.innerHTML = '<i class="fas fa-compress mr-1"></i>退出全屏';
                        }
                        if (fullscreenBtnHeader) {
                            fullscreenBtnHeader.classList.add('active');
                            fullscreenBtnHeader.innerHTML = '<i class="fas fa-compress"></i><span>退出全屏</span>';
                        }
                    }
                    
                    return true;
                }
            }
        } catch (error) {
            console.warn('无法加载布局偏好设置');
        }
        return false;
    }

    /**
     * 获取布局统计信息
     */
    getLayoutStats() {
        const container = document.getElementById('module-container');
        if (!container) return null;

        const computedStyle = window.getComputedStyle(container);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        
        return {
            gridTemplateColumns,
            isEqualWidth: gridTemplateColumns.includes('1fr 1fr 1fr'),
            isFocusedLayout: gridTemplateColumns.includes('1fr 2fr 1fr'),
            currentLayout: this.currentLayout,
            isManualOverride: this.isManualOverride
        };
    }
}

// 创建全局实例
window.layoutManager = new LayoutManager();
