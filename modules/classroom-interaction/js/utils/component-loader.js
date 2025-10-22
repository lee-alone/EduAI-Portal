/**
 * 组件加载器
 * 负责动态加载HTML组件
 */

export class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.componentCache = new Map();
    }

    /**
     * 加载组件
     * @param {string} componentPath 组件路径
     * @param {string} targetSelector 目标选择器
     * @param {Object} options 选项
     * @returns {Promise<HTMLElement>} 加载的组件元素
     */
    async loadComponent(componentPath, targetSelector, options = {}) {
        try {
            // 检查是否已加载
            if (this.loadedComponents.has(componentPath)) {
                return this.getComponentFromCache(componentPath);
            }

            // 从缓存获取或加载组件
            let componentHTML;
            if (this.componentCache.has(componentPath)) {
                componentHTML = this.componentCache.get(componentPath);
            } else {
                componentHTML = await this.fetchComponent(componentPath);
                this.componentCache.set(componentPath, componentHTML);
            }

            // 创建临时容器
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = componentHTML;

            // 获取目标元素
            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) {
                throw new Error(`目标元素未找到: ${targetSelector}`);
            }

            // 插入组件
            const componentElement = this.insertComponent(tempContainer, targetElement, options);

            // 标记为已加载
            this.loadedComponents.add(componentPath);

            return componentElement;

        } catch (error) {
            console.error(`加载组件失败: ${componentPath}`, error);
            throw error;
        }
    }

    /**
     * 获取组件HTML内容
     * @param {string} componentPath 组件路径
     * @returns {Promise<string>} HTML内容
     */
    async fetchComponent(componentPath) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`获取组件失败: ${componentPath}`, error);
            throw error;
        }
    }

    /**
     * 插入组件到目标元素
     * @param {HTMLElement} tempContainer 临时容器
     * @param {HTMLElement} targetElement 目标元素
     * @param {Object} options 选项
     * @returns {HTMLElement} 插入的组件元素
     */
    insertComponent(tempContainer, targetElement, options = {}) {
        const { 
            position = 'append', 
            replace = false,
            prepend = false 
        } = options;

        let componentElement;

        if (tempContainer.children.length === 1) {
            componentElement = tempContainer.firstElementChild;
        } else {
            componentElement = tempContainer;
        }

        if (replace) {
            targetElement.innerHTML = '';
        }

        switch (position) {
            case 'prepend':
                targetElement.insertBefore(componentElement, targetElement.firstChild);
                break;
            case 'append':
            default:
                targetElement.appendChild(componentElement);
                break;
        }

        return componentElement;
    }

    /**
     * 从缓存获取组件
     * @param {string} componentPath 组件路径
     * @returns {HTMLElement|null} 组件元素
     */
    getComponentFromCache(componentPath) {
        if (this.componentCache.has(componentPath)) {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = this.componentCache.get(componentPath);
            return tempContainer.firstElementChild;
        }
        return null;
    }

    /**
     * 批量加载组件
     * @param {Array} components 组件配置数组
     * @returns {Promise<Array>} 加载的组件元素数组
     */
    async loadComponents(components) {
        const loadPromises = components.map(config => 
            this.loadComponent(config.path, config.target, config.options)
        );
        
        try {
            return await Promise.all(loadPromises);
        } catch (error) {
            console.error('批量加载组件失败:', error);
            throw error;
        }
    }

    /**
     * 预加载组件
     * @param {Array} componentPaths 组件路径数组
     * @returns {Promise<void>}
     */
    async preloadComponents(componentPaths) {
        const preloadPromises = componentPaths.map(async (path) => {
            try {
                if (!this.componentCache.has(path)) {
                    const html = await this.fetchComponent(path);
                    this.componentCache.set(path, html);
                }
            } catch (error) {
                console.warn(`预加载组件失败: ${path}`, error);
            }
        });

        await Promise.all(preloadPromises);
    }

    /**
     * 清除组件缓存
     * @param {string} componentPath 组件路径（可选）
     */
    clearCache(componentPath = null) {
        if (componentPath) {
            this.componentCache.delete(componentPath);
            this.loadedComponents.delete(componentPath);
        } else {
            this.componentCache.clear();
            this.loadedComponents.clear();
        }
    }

    /**
     * 检查组件是否已加载
     * @param {string} componentPath 组件路径
     * @returns {boolean} 是否已加载
     */
    isComponentLoaded(componentPath) {
        return this.loadedComponents.has(componentPath);
    }

    /**
     * 获取缓存状态
     * @returns {Object} 缓存状态
     */
    getCacheStatus() {
        return {
            loadedComponents: Array.from(this.loadedComponents),
            cachedComponents: Array.from(this.componentCache.keys()),
            cacheSize: this.componentCache.size
        };
    }
}

// 创建全局组件加载器实例
export const componentLoader = new ComponentLoader();
