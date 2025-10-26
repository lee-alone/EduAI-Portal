/**
 * AI分析模块异步加载器
 * 只在用户点击AI学情分析标签时才加载相关模块
 */

class AIAnalysisLoader {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.isPreloading = false;
        this.loadPromise = null;
        this.preloadTimer = null;
        this.init();
    }

    /**
     * 初始化加载器
     */
    init() {
        this.bindTabEvents();
        this.setupSmartPreloading();
    }

    /**
     * 设置智能预加载
     */
    setupSmartPreloading() {
        // 1. 页面加载完成后，延迟5秒开始预加载
        this.preloadTimer = setTimeout(() => {
            this.preloadAIModules();
        }, 5000);

        // 2. 用户行为触发预加载
        this.setupBehaviorDetection();
    }

    /**
     * 设置用户行为检测
     */
    setupBehaviorDetection() {
        // 鼠标悬停AI标签时预加载
        const aiTab = document.querySelector('[data-tab="ai-analysis"]');
        if (aiTab) {
            aiTab.addEventListener('mouseenter', () => {
                this.preloadAIModules();
            });
        }

        // 上传文件时预加载
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.files.length > 0) {
                    this.preloadAIModules();
                }
            });
        });

        // 用户开始输入时预加载（可能要进行AI分析）
        const textInputs = document.querySelectorAll('input[type="text"], textarea');
        textInputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.preloadAIModules();
            });
        });
    }

    /**
     * 绑定标签页切换事件
     */
    bindTabEvents() {
        const aiTabButton = document.querySelector('[data-tab="ai-analysis"]');
        if (aiTabButton) {
            aiTabButton.addEventListener('click', () => {
                this.loadAIAnalysisModules();
            });
        }
    }

    /**
     * 预加载AI模块（后台静默加载）
     */
    async preloadAIModules() {
        if (this.isLoaded || this.isLoading || this.isPreloading) {
            return;
        }

        this.isPreloading = true;
        console.log('🔄 后台预加载AI模块...');

        try {
            await this.loadModulesInOrder();
            this.isLoaded = true;
            console.log('✅ AI模块预加载完成');
            
            // 清除预加载定时器
            if (this.preloadTimer) {
                clearTimeout(this.preloadTimer);
                this.preloadTimer = null;
            }
        } catch (error) {
            console.warn('⚠️ AI模块预加载失败，将在用户点击时重新加载:', error);
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * 异步加载AI分析模块
     */
    async loadAIAnalysisModules() {
        // 如果已经预加载完成，立即显示
        if (this.isLoaded) {
            this.hideLoadingIndicator();
            this.showSuccessMessage();
            return;
        }

        // 如果正在预加载，等待完成
        if (this.isPreloading) {
            this.showLoadingIndicator();
            this.updateLoadingProgress('正在完成预加载...');
            
            // 等待预加载完成
            while (this.isPreloading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (this.isLoaded) {
                this.hideLoadingIndicator();
                this.showSuccessMessage();
                return;
            }
        }

        // 如果已经加载或正在加载，直接返回
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.showLoadingIndicator();

        try {
            // 按依赖顺序加载模块
            await this.loadModulesInOrder();
            
            this.isLoaded = true;
            this.hideLoadingIndicator();
            this.showSuccessMessage();
            
        } catch (error) {
            console.error('AI分析模块加载失败:', error);
            this.hideLoadingIndicator();
            this.showErrorMessage();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 按依赖顺序加载模块
     */
    async loadModulesInOrder() {
        // 首先加载AI分析相关CDN
        await this.loadAIDependencies();
        
        // 然后加载AI分析模块
        const modules = [
            'js/features/ai-analysis/FileUploadManager.js',
            'js/features/ai-analysis/APIConfigManager.js',
            'js/features/ai-analysis/DataProcessor.js',
            'js/features/ai-analysis/prompts.js',
            'js/features/ai-analysis/PromptManager.js',
            'js/features/ai-analysis/StudentEvaluationParser.js',
            'js/features/ai-analysis/HTMLRenderer.js',
            'js/features/ai-analysis/AIAnalyzer.js',
            'js/features/ai-analysis/ReportGenerator.js',
            'js/features/ai-analysis/ExportManager.js',
            'js/features/ai-analysis/AIAnalysisManager.js'
        ];

        for (const module of modules) {
            await this.loadScript(module);
        }
    }

    /**
     * 加载AI分析相关依赖CDN
     */
    async loadAIDependencies() {
        this.updateLoadingProgress('正在加载AI分析依赖库...');
        
        const aiCDNs = [
            'https://cdn.bootcdn.net/ajax/libs/jszip/3.10.1/jszip.min.js',
            'https://cdn.jsdelivr.net/npm/html-docx-js-version-updated@0.4.0/dist/html-docx.js',
            'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
        ];

        for (let i = 0; i < aiCDNs.length; i++) {
            this.updateLoadingProgress(`正在加载AI分析依赖库... (${i + 1}/${aiCDNs.length})`);
            await this.loadScript(aiCDNs[i]);
        }
        
        this.updateLoadingProgress('正在加载AI分析模块...');
    }

    /**
     * 动态加载单个脚本
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查脚本是否已经加载
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 显示加载指示器
     */
    showLoadingIndicator() {
        const aiAnalysisContent = document.getElementById('ai-analysis');
        if (aiAnalysisContent) {
            aiAnalysisContent.innerHTML = `
                <div class="ai-loading-container" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    text-align: center;
                    color: #718096;
                ">
                    <div class="ai-loading-spinner" style="
                        width: 50px;
                        height: 50px;
                        border: 4px solid #e2e8f0;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 1rem;
                    "></div>
                    <h3 style="margin-bottom: 0.5rem; color: #4a5568;">正在加载AI分析模块...</h3>
                    <p style="margin: 0; font-size: 0.9rem;">首次使用需要加载相关组件和导出功能，请稍候</p>
                    <div id="loading-progress" style="
                        margin-top: 1rem;
                        font-size: 0.8rem;
                        color: #a0aec0;
                    ">正在加载依赖库...</div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    /**
     * 更新加载进度
     */
    updateLoadingProgress(message) {
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = message;
        }
    }

    /**
     * 隐藏加载指示器
     */
    hideLoadingIndicator() {
        // 加载完成后，恢复原始内容
        const aiAnalysisContent = document.getElementById('ai-analysis');
        if (aiAnalysisContent) {
            aiAnalysisContent.innerHTML = `
                <div class="ai-analysis-title">
                    <h2><i class="fas fa-brain mr-3"></i>AI学情分析与报告</h2>
                    <p class="ai-analysis-subtitle">智能分析学生表现，生成个性化学情报告</p>
                </div>
                
                <div class="ai-analysis-card ai-fade-in">
                    <!-- 文件上传区域 -->
                    <div class="ai-upload-section">
                        <h3 class="ai-upload-title">
                            <i class="fas fa-upload"></i>
                            数据上传
                        </h3>
                        
                        <!-- 水平并列的文件上传区域 -->
                        <div class="ai-upload-grid">
                            <div class="ai-file-upload ai-file-upload-compact">
                                <input type="file" id="activity-excel-upload" accept=".xlsx,.xls" />
                                <label for="activity-excel-upload" class="ai-file-upload-label">
                                    <div class="ai-file-upload-content">
                                        <i class="fas fa-file-excel ai-file-upload-icon"></i>
                                        <div class="ai-file-upload-text">课堂活动Excel文件</div>
                                        <div class="ai-file-upload-hint">支持 .xlsx 和 .xls 格式</div>
                                    </div>
                                </label>
                            </div>
                            
                            <div class="ai-file-upload ai-file-upload-compact">
                                <input type="file" id="roster-excel-upload" accept=".xlsx,.xls" />
                                <label for="roster-excel-upload" class="ai-file-upload-label">
                                    <div class="ai-file-upload-content">
                                        <i class="fas fa-users ai-file-upload-icon"></i>
                                        <div class="ai-file-upload-text">学生名单Excel</div>
                                        <div class="ai-file-upload-hint">座号-姓名对照</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI高级设置 - 折叠式设计 -->
                    <div class="ai-advanced-settings">
                        <div class="flex items-center justify-between cursor-pointer" id="ai-advanced-settings-toggle-header" onclick="toggleAIAdvancedSettings()">
                            <label class="block text-gray-700 text-lg font-bold">
                                <i class="fas fa-cog mr-2"></i>AI高级设置
                            </label>
                            <i class="fas fa-chevron-down text-gray-500 transition-transform duration-200" id="ai-advanced-settings-chevron"></i>
                        </div>
                        
                        <!-- 折叠内容区域 -->
                        <div id="ai-advanced-settings-content" class="mt-4" style="display: none;">
                            <!-- AI模型配置 -->
                            <div class="ai-model-section">
                                <h3 class="ai-model-title">
                                    <i class="fas fa-robot"></i>
                                    AI模型配置
                                </h3>
                                <div class="ai-model-selection">
                                    <label for="ai-model-select" class="ai-model-label">选择AI模型:</label>
                                    <select id="ai-model-select" class="ai-model-select">
                                        <option value="deepseek-chat" selected>DeepSeek 教育模型</option>
                                        <option value="glm-4">智谱 GLM 教育版</option>
                                        <option value="qwen-turbo">通义千问 教研助手</option>
                                        <option value="custom">自定义模型</option>
                                    </select>
                                </div>
                                <div class="ai-model-custom">
                                    <label for="ai-model-custom-input" class="ai-model-custom-label">自定义模型 (可选):</label>
                                    <input type="text" id="ai-model-custom-input" class="ai-model-custom-input" 
                                           placeholder="输入自定义模型名称">
                                </div>
                                <div class="ai-model-hint">
                                    选择适合的AI模型可以获得更好的分析效果。DeepSeek适合教育场景，GLM-4适合中文理解，通义千问适合教研分析。
                                </div>
                            </div>
                            
                            <!-- API配置 -->
                            <div class="ai-api-section">
                                <h3 class="ai-api-title">
                                    <i class="fas fa-key"></i>
                                    API配置
                                </h3>
                                <div class="ai-api-key-group">
                                    <label for="ai-api-key" class="ai-api-label">API Key（可选）:</label>
                                    <input type="password" id="ai-api-key" class="ai-api-key-input" 
                                           placeholder="如有专属 API Key，请在此输入">
                                    <div class="ai-api-hint">
                                        <i class="fas fa-info-circle"></i>
                                        留空将使用默认API Key，输入自定义Key将覆盖默认设置
                                    </div>
                                </div>
                                <div class="ai-endpoint-group">
                                    <label for="ai-endpoint-select" class="ai-endpoint-label">API端点:</label>
                                    <select id="ai-endpoint-select" class="ai-endpoint-select">
                                        <option value="auto" selected>自动匹配模型</option>
                                        <option value="https://api.deepseek.com/v1/chat/completions">DeepSeek API</option>
                                        <option value="https://open.bigmodel.cn/api/paas/v4/chat/completions">智谱AI API</option>
                                        <option value="https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation">通义千问 API</option>
                                        <option value="custom">自定义端点</option>
                                    </select>
                                    <div class="ai-endpoint-custom">
                                        <label for="ai-endpoint-custom-input" class="ai-endpoint-custom-label">自定义端点:</label>
                                        <input type="url" id="ai-endpoint-custom-input" class="ai-endpoint-custom-input" 
                                               placeholder="https://api.example.com/v1/chat/completions">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 自定义提示词 -->
                            <div class="ai-prompt-section">
                                <h3 class="ai-prompt-title">
                                    <i class="fas fa-edit"></i>
                                    自定义AI提示词
                                </h3>
                                <textarea id="custom-prompt-textarea" class="ai-prompt-textarea" 
                                          placeholder="例如：请以班主任的口吻，对学生的课堂表现进行总结和鼓励。分析学生的学习状态，提供个性化的建议和鼓励。"></textarea>
                                <div class="ai-prompt-hint">
                                    <i class="fas fa-lightbulb"></i>
                                    提示：详细的提示词能帮助AI生成更准确的学情分析报告
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 生成按钮 -->
                    <button id="generate-ai-report-btn" class="ai-generate-btn">
                        <i class="fas fa-robot mr-2"></i>
                        生成AI学情分析报告
                    </button>
                    
                    <!-- AI报告输出 -->
                    <div id="ai-report-output" class="ai-report-output">
                        <div class="ai-report-content">
                            <div style="text-align: center; color: #718096;">
                                <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">AI学情分析报告</p>
                                <p>上传数据文件并点击生成按钮，AI将为您生成详细的学情分析报告</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 显示成功消息
     */
    showSuccessMessage() {
        if (window.notificationManager) {
            window.notificationManager.success('AI分析模块加载完成！');
        }
    }

    /**
     * 显示错误消息
     */
    showErrorMessage() {
        if (window.notificationManager) {
            window.notificationManager.error('AI分析模块加载失败，请刷新页面重试');
        }
    }
}

// 创建全局实例
window.aiAnalysisLoader = new AIAnalysisLoader();
