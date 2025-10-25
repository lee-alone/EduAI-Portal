/**
 * API配置管理模块
 * 负责管理AI模型选择、API端点和密钥配置
 */

class APIConfigManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化API配置
     */
    init() {
        this.setupModelInput();
        this.setupAPIConfig();
        this.setupPromptTextarea();
        this.updateModelSelection();
        this.updateEndpointSelection();
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
        
        // 使用共享的默认API Key（与thinkeduai模块保持一致）
        if (typeof getSharedApiKey === 'function') {
            return getSharedApiKey();
        }
        
        return 'sk-0560c9a849694436a71c1ef4c053505a'; // 备用默认值
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
        
        // 如果选择自动匹配，根据模型自动选择端点
        if (endpointSelect.value === 'auto') {
            const selectedModel = this.getSelectedModel();
            if (selectedModel.includes('deepseek')) {
                return 'https://api.deepseek.com/v1/chat/completions';
            } else if (selectedModel.includes('glm')) {
                return 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
            } else if (selectedModel.includes('qwen')) {
                return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
            }
            // 默认使用DeepSeek
            return 'https://api.deepseek.com/v1/chat/completions';
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
     * 验证配置是否完整
     */
    validateConfig() {
        const selectedModel = this.getSelectedModel();
        const apiKey = this.getAPIKey();
        const apiEndpoint = this.getAPIEndpoint();
        
        if (!selectedModel) {
            return { valid: false, message: '请选择AI模型' };
        }
        
        if (!apiKey) {
            return { valid: false, message: '请配置API Key' };
        }
        
        if (!apiEndpoint) {
            return { valid: false, message: '请配置API端点' };
        }
        
        return { valid: true };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfigManager;
} else {
    window.APIConfigManager = APIConfigManager;
}
