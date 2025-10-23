/**
 * 组件加载器模块
 * 负责动态加载和管理组件
 */

class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.componentCache = new Map();
        this.init();
    }

    /**
     * 初始化组件加载器
     */
    init() {
        // 预加载核心组件
        this.preloadCoreComponents();
    }

    /**
     * 预加载核心组件
     */
    preloadCoreComponents() {
        // 核心组件已经在主入口文件中加载
        this.loadedComponents.add('classroom');
        this.loadedComponents.add('students');
        this.loadedComponents.add('points');
        this.loadedComponents.add('rollcall');
        this.loadedComponents.add('scoring');
        this.loadedComponents.add('storage');
        this.loadedComponents.add('helpers');
    }

    /**
     * 动态加载组件
     */
    async loadComponent(componentName) {
        if (this.loadedComponents.has(componentName)) {
            return this.componentCache.get(componentName);
        }

        try {
            let component;
            
            switch (componentName) {
                case 'classroom':
                    component = await import('./core/classroom.js');
                    break;
                case 'students':
                    component = await import('./core/students.js');
                    break;
                case 'points':
                    component = await import('./core/points.js');
                    break;
                case 'rollcall':
                    component = await import('./features/rollcall.js');
                    break;
                case 'scoring':
                    component = await import('./features/scoring.js');
                    break;
                case 'storage':
                    component = await import('./utils/storage.js');
                    break;
                case 'helpers':
                    component = await import('./utils/helpers.js');
                    break;
                default:
                    throw new Error(`未知组件: ${componentName}`);
            }

            this.loadedComponents.add(componentName);
            this.componentCache.set(componentName, component);
            
            return component;
        } catch (error) {
            // 加载组件失败
            throw error;
        }
    }

    /**
     * 检查组件是否已加载
     */
    isComponentLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }

    /**
     * 获取已加载的组件列表
     */
    getLoadedComponents() {
        return Array.from(this.loadedComponents);
    }

    /**
     * 卸载组件
     */
    unloadComponent(componentName) {
        if (this.loadedComponents.has(componentName)) {
            this.loadedComponents.delete(componentName);
            this.componentCache.delete(componentName);
            return true;
        }
        return false;
    }

    /**
     * 重新加载组件
     */
    async reloadComponent(componentName) {
        this.unloadComponent(componentName);
        return await this.loadComponent(componentName);
    }

    /**
     * 批量加载组件
     */
    async loadComponents(componentNames) {
        const loadPromises = componentNames.map(name => this.loadComponent(name));
        return await Promise.all(loadPromises);
    }

    /**
     * 获取组件信息
     */
    getComponentInfo(componentName) {
        const component = this.componentCache.get(componentName);
        if (!component) {
            return null;
        }

        return {
            name: componentName,
            loaded: true,
            exports: Object.keys(component),
            size: JSON.stringify(component).length
        };
    }

    /**
     * 获取所有组件信息
     */
    getAllComponentsInfo() {
        const info = {};
        this.loadedComponents.forEach(name => {
            info[name] = this.getComponentInfo(name);
        });
        return info;
    }

    /**
     * 清理组件缓存
     */
    clearCache() {
        this.componentCache.clear();
        this.loadedComponents.clear();
    }

    /**
     * 检查组件依赖
     */
    checkDependencies(componentName) {
        const dependencies = {
            'classroom': [],
            'students': ['classroom'],
            'points': ['students'],
            'rollcall': ['classroom', 'students', 'points'],
            'scoring': ['classroom', 'students', 'points'],
            'storage': [],
            'helpers': []
        };

        return dependencies[componentName] || [];
    }

    /**
     * 按依赖顺序加载组件
     */
    async loadComponentsWithDependencies(componentNames) {
        const loaded = new Set();
        const toLoad = [...componentNames];
        const results = [];

        while (toLoad.length > 0) {
            const currentBatch = [];
            
            for (let i = toLoad.length - 1; i >= 0; i--) {
                const componentName = toLoad[i];
                const dependencies = this.checkDependencies(componentName);
                
                if (dependencies.every(dep => loaded.has(dep))) {
                    currentBatch.push(componentName);
                    toLoad.splice(i, 1);
                }
            }

            if (currentBatch.length === 0) {
                throw new Error('组件依赖循环或无法解析');
            }

            const batchResults = await this.loadComponents(currentBatch);
            results.push(...batchResults);
            currentBatch.forEach(name => loaded.add(name));
        }

        return results;
    }
}

// 创建全局实例
window.componentLoader = new ComponentLoader();