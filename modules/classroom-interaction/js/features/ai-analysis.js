/**
 * AI学情分析功能模块
 * 负责AI分析界面的交互逻辑和数据处理
 */

class AIAnalysisManager {
    constructor() {
        this.uploadedFiles = {
            activity: null,
            roster: null
        };
        this.isGenerating = false;
        this.init();
    }

    /**
     * 初始化AI分析功能
     */
    init() {
        this.bindEvents();
        this.setupFileUploads();
        this.setupModelInput();
        this.setupAPIConfig();
        this.setupPromptTextarea();
        this.setupGenerateButton();
        // 初始化模型选择状态
        this.updateModelSelection();
        // 初始化端点选择状态
        this.updateEndpointSelection();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 文件上传事件
        document.getElementById('activity-excel-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'activity');
        });

        document.getElementById('roster-excel-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'roster');
        });

        // 生成报告按钮
        document.getElementById('generate-ai-report-btn').addEventListener('click', () => {
            this.generateAIReport();
        });
    }

    /**
     * 设置文件上传组件
     */
    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateFileUploadDisplay(e.target);
            });
        });
    }

    /**
     * 处理文件上传
     */
    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型
        const allowedTypes = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showNotification('请上传Excel文件 (.xlsx 或 .xls 格式)', 'error');
            event.target.value = '';
            return;
        }

        // 验证文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('文件大小不能超过10MB', 'error');
            event.target.value = '';
            return;
        }

        this.uploadedFiles[type] = file;
        this.updateFileUploadDisplay(event.target);
        this.showNotification(`${type === 'activity' ? '课堂活动' : '学生名单'}文件上传成功`, 'success');
    }

    /**
     * 更新文件上传显示
     */
    updateFileUploadDisplay(input) {
        const file = input.files[0];
        const label = input.nextElementSibling;
        const content = label.querySelector('.ai-file-upload-content');
        
        if (file) {
            // 更新显示为已选择状态
            content.innerHTML = `
                <i class="fas fa-check-circle ai-file-upload-icon" style="color: #48bb78;"></i>
                <div class="ai-file-upload-text">${file.name}</div>
                <div class="ai-file-upload-hint">文件大小: ${this.formatFileSize(file.size)}</div>
            `;
            label.style.borderColor = '#48bb78';
            label.style.background = 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)';
        } else {
            // 恢复默认状态
            const icon = input.id.includes('activity') ? 'fas fa-file-excel' : 'fas fa-users';
            const text = input.id.includes('activity') ? '上传课堂活动Excel文件' : '上传学生名单Excel (座号-姓名对照)';
            
            content.innerHTML = `
                <i class="${icon} ai-file-upload-icon"></i>
                <div class="ai-file-upload-text">${text}</div>
                <div class="ai-file-upload-hint">支持 .xlsx 和 .xls 格式</div>
            `;
            label.style.borderColor = '#cbd5e0';
            label.style.background = 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)';
        }
    }

    /**
     * 设置AI模型选择
     */
    setupModelInput() {
        const modelSelect = document.getElementById('ai-model-select');
        const customModelInput = document.getElementById('ai-model-custom-input');
        
        // 模型选择下拉框事件
        modelSelect.addEventListener('change', () => {
            this.updateModelSelection();
        });
        
        // 自定义模型输入框事件
        customModelInput.addEventListener('focus', () => {
            customModelInput.parentElement.classList.add('focused');
        });
        
        customModelInput.addEventListener('blur', () => {
            customModelInput.parentElement.classList.remove('focused');
        });
        
        customModelInput.addEventListener('input', () => {
            this.updateModelSelection();
        });
    }
    
    /**
     * 设置API配置
     */
    setupAPIConfig() {
        const endpointSelect = document.getElementById('ai-endpoint-select');
        const customEndpointInput = document.getElementById('ai-endpoint-custom-input');
        const apiKeyInput = document.getElementById('ai-api-key');
        
        // API端点选择事件
        endpointSelect.addEventListener('change', () => {
            this.updateEndpointSelection();
        });
        
        // 自定义端点输入框事件
        customEndpointInput.addEventListener('focus', () => {
            customEndpointInput.parentElement.classList.add('focused');
        });
        
        customEndpointInput.addEventListener('blur', () => {
            customEndpointInput.parentElement.classList.remove('focused');
        });
        
        customEndpointInput.addEventListener('input', () => {
            this.updateEndpointSelection();
        });
        
        // API Key输入框事件
        apiKeyInput.addEventListener('focus', () => {
            apiKeyInput.parentElement.classList.add('focused');
        });
        
        apiKeyInput.addEventListener('blur', () => {
            apiKeyInput.parentElement.classList.remove('focused');
        });
    }
    
    /**
     * 更新模型选择状态
     */
    updateModelSelection() {
        const modelSelect = document.getElementById('ai-model-select');
        const customModelContainer = document.querySelector('.ai-model-custom');
        const customModelInput = document.getElementById('ai-model-custom-input');
        
        // 如果选择了自定义选项，显示自定义输入框
        if (modelSelect.value === 'custom') {
            customModelContainer.classList.add('show');
            customModelInput.required = true;
        } else {
            customModelContainer.classList.remove('show');
            customModelInput.required = false;
        }
    }
    
    /**
     * 更新端点选择状态
     */
    updateEndpointSelection() {
        const endpointSelect = document.getElementById('ai-endpoint-select');
        const customEndpointContainer = document.querySelector('.ai-endpoint-custom');
        const customEndpointInput = document.getElementById('ai-endpoint-custom-input');
        
        // 如果选择了自定义端点，显示自定义输入框
        if (endpointSelect.value === 'custom') {
            customEndpointContainer.classList.add('show');
            customEndpointInput.required = true;
        } else {
            customEndpointContainer.classList.remove('show');
            customEndpointInput.required = false;
        }
    }
    
    /**
     * 获取当前选择的模型
     */
    getSelectedModel() {
        const modelSelect = document.getElementById('ai-model-select');
        const customModelInput = document.getElementById('ai-model-custom-input');
        
        if (modelSelect.value === 'custom') {
            return customModelInput.value.trim() || 'deepseek-chat';
        }
        return modelSelect.value;
    }
    
    /**
     * 获取API Key
     */
    getAPIKey() {
        const apiKeyInput = document.getElementById('ai-api-key');
        const customApiKey = apiKeyInput.value.trim();
        
        // 如果有自定义API Key，使用自定义的；否则使用默认的
        if (customApiKey) {
            return customApiKey;
        }
        
        // 使用共享的默认API Key
        if (typeof getSharedApiKey === 'function') {
            return getSharedApiKey();
        }
        
        return 'sk-default-key'; // 备用默认值
    }
    
    /**
     * 获取API端点
     */
    getAPIEndpoint() {
        const endpointSelect = document.getElementById('ai-endpoint-select');
        const customEndpointInput = document.getElementById('ai-endpoint-custom-input');
        
        if (endpointSelect.value === 'custom') {
            return customEndpointInput.value.trim() || 'https://api.deepseek.com/v1/chat/completions';
        }
        return endpointSelect.value;
    }

    /**
     * 设置提示词文本区域
     */
    setupPromptTextarea() {
        const textarea = document.getElementById('custom-prompt-textarea');
        
        textarea.addEventListener('focus', () => {
            textarea.parentElement.classList.add('focused');
        });
        
        textarea.addEventListener('blur', () => {
            textarea.parentElement.classList.remove('focused');
        });

        // 自动调整高度
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
        });
    }

    /**
     * 设置生成按钮
     */
    setupGenerateButton() {
        const generateBtn = document.getElementById('generate-ai-report-btn');
        
        generateBtn.addEventListener('mouseenter', () => {
            if (!this.isGenerating) {
                generateBtn.style.transform = 'translateY(-3px)';
            }
        });
        
        generateBtn.addEventListener('mouseleave', () => {
            if (!this.isGenerating) {
                generateBtn.style.transform = 'translateY(0)';
            }
        });
    }

    /**
     * 生成AI报告
     */
    async generateAIReport() {
        if (this.isGenerating) return;

        // 验证必要文件
        if (!this.uploadedFiles.activity || !this.uploadedFiles.roster) {
            this.showNotification('请先上传课堂活动文件和学生名单文件', 'error');
            return;
        }

        const selectedModel = this.getSelectedModel();
        const apiKey = this.getAPIKey();
        const apiEndpoint = this.getAPIEndpoint();
        
        if (!selectedModel) {
            this.showNotification('请选择AI模型', 'error');
            return;
        }
        
        if (!apiKey) {
            this.showNotification('请配置API Key', 'error');
            return;
        }
        
        if (!apiEndpoint) {
            this.showNotification('请配置API端点', 'error');
            return;
        }

        this.isGenerating = true;
        this.updateGenerateButton(true);
        this.showLoadingState();

        try {
            // 模拟AI分析过程
            await this.simulateAIAnalysis();
            
            // 生成模拟报告
            const report = this.generateMockReport();
            this.displayReport(report);
            
            this.showNotification('AI学情分析报告生成成功！', 'success');
        } catch (error) {
            // AI分析失败
            this.showNotification('AI分析失败，请重试', 'error');
        } finally {
            this.isGenerating = false;
            this.updateGenerateButton(false);
        }
    }

    /**
     * 模拟AI分析过程
     */
    async simulateAIAnalysis() {
        const selectedModel = this.getSelectedModel();
        const apiEndpoint = this.getAPIEndpoint();
        
        // 模拟分析时间
        const analysisSteps = [
            `正在连接 ${apiEndpoint.includes('deepseek') ? 'DeepSeek' : apiEndpoint.includes('bigmodel') ? '智谱AI' : apiEndpoint.includes('dashscope') ? '通义千问' : '自定义'} API...`,
            `正在初始化 ${selectedModel} 模型...`,
            '正在读取数据文件...',
            '分析学生表现数据...',
            '识别学习模式和趋势...',
            '生成个性化建议...',
            '优化报告内容...'
        ];

        for (let i = 0; i < analysisSteps.length; i++) {
            this.updateLoadingMessage(analysisSteps[i]);
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
    }

    /**
     * 更新生成按钮状态
     */
    updateGenerateButton(isGenerating) {
        const btn = document.getElementById('generate-ai-report-btn');
        
        if (isGenerating) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>正在生成报告...';
            btn.disabled = true;
            btn.classList.add('ai-generate-btn:disabled');
        } else {
            btn.innerHTML = '<i class="fas fa-robot mr-2"></i>生成AI学情报告';
            btn.disabled = false;
            btn.classList.remove('ai-generate-btn:disabled');
        }
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        const output = document.getElementById('ai-report-output');
        output.innerHTML = `
            <div class="ai-report-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span id="loading-message">正在初始化AI分析...</span>
            </div>
        `;
    }

    /**
     * 更新加载消息
     */
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }

    /**
     * 生成模拟报告
     */
    generateMockReport() {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = this.getSelectedModel();
        const apiEndpoint = this.getAPIEndpoint();
        const apiProvider = apiEndpoint.includes('deepseek') ? 'DeepSeek' : 
                           apiEndpoint.includes('bigmodel') ? '智谱AI' : 
                           apiEndpoint.includes('dashscope') ? '通义千问' : '自定义API';
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #718096; margin-bottom: 0.5rem;">生成时间: ${currentDate}</p>
                <p style="color: #718096; margin-bottom: 0.5rem;">使用模型: ${selectedModel}</p>
                <p style="color: #718096; margin-bottom: 2rem;">API提供商: ${apiProvider}</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-users" style="color: #667eea;"></i>
                    班级整体表现
                </h4>
                <p style="line-height: 1.7; margin-bottom: 1.5rem;">
                    根据课堂活动数据分析，本班学生在课堂参与度方面表现良好，平均参与率达到85%。大部分学生能够积极参与课堂讨论，展现出良好的学习热情。
                </p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-star" style="color: #667eea;"></i>
                    优秀表现学生
                </h4>
                <p style="line-height: 1.7; margin-bottom: 1.5rem;">
                    张三、李四、王五等同学在课堂表现中脱颖而出，他们不仅积极参与讨论，还能提出有深度的问题，展现出较强的学习能力和创新思维。
                </p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-lightbulb" style="color: #667eea;"></i>
                    改进建议
                </h4>
                <ul style="line-height: 1.7; margin-bottom: 1.5rem; padding-left: 1.5rem;">
                    <li>建议增加小组合作活动，提升学生协作能力</li>
                    <li>对于参与度较低的学生，可以给予更多关注和鼓励</li>
                    <li>适当增加互动环节，保持学生学习的积极性</li>
                </ul>
            </div>
            
            <div class="ai-report-footer" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 0.9rem; text-align: center;">
                    <i class="fas fa-robot mr-1"></i>
                    本报告由AI智能分析生成，仅供参考
                </p>
            </div>
        `;
    }

    /**
     * 显示报告
     */
    displayReport(report) {
        const output = document.getElementById('ai-report-output');
        output.innerHTML = `
            <div class="ai-report-content">
                ${report}
            </div>
        `;
        
        // 添加淡入动画
        output.style.opacity = '0';
        output.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            output.style.transition = 'all 0.6s ease-out';
            output.style.opacity = '1';
            output.style.transform = 'translateY(0)';
        }, 100);
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
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
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 创建全局实例
window.aiAnalysisManager = new AIAnalysisManager();
