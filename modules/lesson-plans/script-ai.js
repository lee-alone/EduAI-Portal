/**
 * AI智能教案生成器 - AI功能模块
 * 负责与AI模型交互，生成教案内容，处理Markdown渲染和Word导出
 */

class LessonPlanAI {
    constructor() {
        this.apiEndpoints = {
            'deepseek-chat': 'https://api.deepseek.com/v1/chat/completions',
            'deepseek-coder': 'https://api.deepseek.com/v1/chat/completions',
            'qwen-turbo': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            'baichuan2': 'https://api.baichuan-ai.com/v1/chat/completions'
        };
        
        // 库加载状态管理
        this.libraryStatus = {
            marked: false,
            htmlDocx: false
        };
        
        // 提示词管理器
        this.promptManager = null;
        this.promptsLoaded = false;
        
        this.init();
    }

    /**
     * 初始化AI功能
     */
    init() {
        this.bindEvents();
        this.setupMarkdownRenderer();
        this.setupLazyLoading();
        this.loadPrompts();
    }

    /**
     * 异步加载提示词文件
     */
    async loadPrompts() {
        try {
            // 检查是否已经加载过
            if (this.promptsLoaded) {
                return;
            }

            // 检查PromptManager是否已存在
            if (typeof PromptManager !== 'undefined') {
                this.promptManager = new PromptManager();
                this.promptsLoaded = true;
                console.log('✅ 提示词管理器加载成功');
                return;
            }

            // 动态加载提示词文件
            await this.loadScript('./prompts.js');
            
            // 等待PromptManager类可用
            let attempts = 0;
            const maxAttempts = 10;
            while (typeof PromptManager === 'undefined' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (typeof PromptManager !== 'undefined') {
                this.promptManager = new PromptManager();
                this.promptsLoaded = true;
                console.log('✅ 提示词管理器异步加载成功');
            } else {
                throw new Error('提示词管理器加载失败');
            }
        } catch (error) {
            console.error('❌ 提示词加载失败:', error);
            this.promptsLoaded = false;
        }
    }

    /**
     * 设置延迟加载
     */
    setupLazyLoading() {
        // 页面加载完成后3秒开始后台加载库
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loadThirdStepLibrariesInBackground();
            }, 3000); // 3秒延迟
        });

        // 监听生成按钮，确保所有库都已加载
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.ensureLibrariesLoaded();
            });
        }
    }

    /**
     * 后台静默加载Word导出和Markdown渲染需要的库
     */
    async loadThirdStepLibrariesInBackground() {
        // 防止重复加载
        if (this.isLoadingLibraries) {
            console.log('库正在加载中，跳过重复加载');
            return;
        }

        this.isLoadingLibraries = true;
        console.log('开始后台加载Word导出和Markdown渲染库...');

        const libraries = [
            {
                name: 'marked',
                url: 'https://cdn.bootcdn.net/ajax/libs/marked/4.3.0/marked.min.js',
                check: () => typeof marked !== 'undefined'
            },
            {
                name: 'htmlDocx',
                url: 'https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js',
                check: () => typeof htmlDocx !== 'undefined'
            }
        ];

        for (const lib of libraries) {
            if (!this.libraryStatus[lib.name]) {
                let loaded = false;
                
                // 支持多个URL的库（如html2canvas）
                const urls = lib.urls || [lib.url];
                
                for (const url of urls) {
                    try {
                        console.log(`🔄 尝试加载 ${lib.name} 从: ${url}`);
                        await this.loadScript(url);
                        
                        // 等待更长时间让库完全初始化
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // 多次检查库是否真正可用
                        let isLoaded = false;
                        for (let i = 0; i < 3; i++) {
                            isLoaded = lib.check();
                            if (isLoaded) break;
                            
                            
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        
                        if (isLoaded) {
                            this.libraryStatus[lib.name] = true;
                            console.log(`✅ ${lib.name} 库后台加载成功`);
                            loaded = true;
                            break;
                        } else {
                            console.warn(`⚠️ ${lib.name} 库加载后检查失败，尝试下一个URL`);
                        }
                    } catch (error) {
                        console.warn(`⚠️ ${lib.name} 库从 ${url} 加载失败:`, error);
                        continue;
                    }
                }
                
                if (!loaded) {
                    console.error(`❌ ${lib.name} 库所有URL都加载失败`);
                    this.libraryStatus[lib.name] = false;
                }
            } else {
                console.log(`✅ ${lib.name} 库已加载`);
            }
        }

        this.isLoadingLibraries = false;

        // 检查加载状态
        const allLoaded = Object.values(this.libraryStatus).every(status => status);
        if (allLoaded) {
            console.log('🎉 所有Word导出和Markdown渲染库后台加载完成');
        } else {
            const failedLibs = Object.entries(this.libraryStatus)
                .filter(([name, status]) => !status)
                .map(([name]) => name);
            console.warn(`⚠️ 以下库加载失败: ${failedLibs.join(', ')}`);
        }
    }

    /**
     * 加载Word导出和Markdown渲染需要的库（用户触发时的快速加载）
     */
    async loadThirdStepLibraries() {
        // 如果后台已经加载完成，直接返回
        const allLoaded = Object.values(this.libraryStatus).every(status => status);
        if (allLoaded) {
            console.log('所有库已加载完成，无需重复加载');
            return;
        }

        // 如果后台正在加载，等待完成
        if (this.isLoadingLibraries) {
            console.log('等待后台加载完成...');
            // 等待后台加载完成
            while (this.isLoadingLibraries) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        // 如果后台加载失败或未开始，重新尝试
        console.log('重新尝试加载缺失的库...');
        await this.loadThirdStepLibrariesInBackground();
    }

    /**
     * 动态加载脚本（带重试机制）
     */
    async loadScript(url, maxRetries = 3) {
        // 检查是否已经加载
        if (document.querySelector(`script[src="${url}"]`)) {
            console.log(`📦 脚本已存在，跳过加载: ${url}`);
            return Promise.resolve();
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const script = document.createElement('script');
                script.src = url;
                script.async = true;
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        console.log(`📦 脚本加载成功: ${url}`);
                        resolve();
                    };
                    script.onerror = (error) => {
                        console.warn(`⚠️ 脚本加载失败 (尝试 ${attempt}/${maxRetries}): ${url}`, error);
                        // 清理失败的脚本标签
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                        if (attempt === maxRetries) {
                            reject(error);
                        } else {
                            console.log(`🔄 重试加载脚本 (${attempt}/${maxRetries}): ${url}`);
                            setTimeout(() => {
                                this.loadScript(url, maxRetries).then(resolve).catch(reject);
                            }, 1000 * attempt);
                        }
                    };
                    document.head.appendChild(script);
                });
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.log(`🔄 重试加载脚本 (${attempt}/${maxRetries}): ${url}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }


    /**
     * 确保所有库都已加载
     */
    async ensureLibrariesLoaded() {
        const allLoaded = Object.values(this.libraryStatus).every(status => status);
        
        if (!allLoaded) {
            console.log('检测到缺失的库，尝试加载...');
            // 静默尝试加载缺失的库
            await this.loadThirdStepLibraries();
            
            // 再次检查加载状态
            const stillMissing = Object.values(this.libraryStatus).some(status => !status);
            if (stillMissing) {
                const failedLibs = Object.entries(this.libraryStatus)
                    .filter(([name, status]) => !status)
                    .map(([name]) => name);
                console.error('以下库加载失败:', failedLibs);
                window.lessonPlanCore.showNotification(`导出功能库加载失败: ${failedLibs.join(', ')}，请刷新页面重试`, 'error');
                return false;
            }
        }
        
        console.log('所有库加载完成，可以开始生成教案');
        return true;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 生成教案按钮
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateLessonPlan();
            });
        }

        // 导出Word按钮
        const exportWordBtn = document.getElementById('export-word-btn');
        if (exportWordBtn) {
            exportWordBtn.addEventListener('click', () => {
                this.exportToWord();
            });
        }
    }

    /**
     * 设置Markdown渲染器
     */
    setupMarkdownRenderer() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                sanitize: false
            });
        }
    }

    /**
     * 生成教案 (串流版本)
     */
    async generateLessonPlan() {
        try {
            // 验证表单
            if (!window.lessonPlanCore.validateAllFields()) {
                window.lessonPlanCore.showNotification('请填写所有必填字段', 'error');
                return;
            }

            // 确保提示词已加载
            if (!this.promptsLoaded) {
                window.lessonPlanCore.showNotification('正在加载提示词，请稍候...', 'info');
                await this.loadPrompts();
                if (!this.promptsLoaded) {
                    window.lessonPlanCore.showNotification('提示词加载失败，请刷新页面重试', 'error');
                    return;
                }
            }

            // 确保所有必要的库都已加载
            const librariesReady = await this.ensureLibrariesLoaded();
            if (!librariesReady) {
                return;
            }

            // 获取表单数据
            const formData = window.lessonPlanCore.getFormData();
            
            // 验证API密钥
            if (!formData.apiKey) {
                window.lessonPlanCore.showNotification('请设置API密钥', 'error');
                return;
            }

            // 检查是否启用串流模式
            const streamingMode = document.getElementById('streaming-mode')?.checked ?? true;
            
            // 显示加载状态
            window.lessonPlanCore.showLoading(true);

            // 构建提示词
            const prompt = this.buildPrompt(formData);

            if (streamingMode && (formData.aiModel.startsWith('deepseek') || formData.aiModel === 'baichuan2')) {
                // 串流模式
                window.lessonPlanCore.showStreamingInterface();

                // 初始化串流内容
                let streamedContent = '';
                let isStreamingComplete = false;

                // 调用串流AI API
                await this.callAIStream(
                    formData.aiModel, 
                    formData.apiKey, 
                    prompt,
                    // onChunk - 处理每个内容块
                    (chunk) => {
                        streamedContent += chunk;
                        window.lessonPlanCore.updateStreamingContent(streamedContent);
                    },
                    // onComplete - 处理完成
                    (response) => {
                        isStreamingComplete = true;
                        if (response && response.content) {
                            // 显示完成状态的进度条
                            const streamingStatus = document.getElementById('streaming-status');
                            if (streamingStatus) {
                                streamingStatus.textContent = '生成完成，正在格式化预览...';
                            }
                            
                            // 渲染最终的Markdown内容
                            const htmlContent = this.renderMarkdownToHTML(response.content);
                            window.lessonPlanCore.updatePreview(htmlContent);
                        } else {
                            throw new Error('AI响应格式错误');
                        }
                    },
                    // onError - 处理错误
                    (error) => {
                        window.lessonPlanCore.showNotification(`生成失败: ${error.message}`, 'error');
                    }
                );
            } else {
                // 传统模式
                const response = await this.callAI(formData.aiModel, formData.apiKey, prompt);

                // 处理响应
                if (response && response.content) {
                    const htmlContent = this.renderMarkdownToHTML(response.content);
                    window.lessonPlanCore.updatePreview(htmlContent);
                    window.lessonPlanCore.showResult(); // 显示结果页面
                    window.lessonPlanCore.showNotification('教学方案生成成功！', 'success');
                } else {
                    throw new Error('AI响应格式错误');
                }
            }

        } catch (error) {
            window.lessonPlanCore.showNotification(`生成失败: ${error.message}`, 'error');
        } finally {
            window.lessonPlanCore.showLoading(false);
            window.lessonPlanCore.hideStreamingInterface();
        }
    }

    /**
     * 构建AI提示词
     */
    buildPrompt(formData) {
        // 检查提示词是否已加载
        if (!this.promptsLoaded || !this.promptManager) {
            throw new Error('提示词尚未加载完成，请稍后重试');
        }

        // 首先定义当前日期
        const currentDate = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        // 根据是否启用融合生成不同的系统提示词
        const systemPromptType = formData.enableFusion ? 'fusionSystem' : 'singleSubjectSystem';
        const userPromptType = formData.enableFusion ? 'fusionUser' : 'singleSubjectUser';

        const systemPrompt = this.promptManager.getPrompt(systemPromptType, formData, currentDate);
        const userPrompt = this.promptManager.getPrompt(userPromptType, formData, currentDate);

        return { systemPrompt, userPrompt };
    }


    /**
     * 调用AI API (串流版本)
     */
    async callAIStream(model, apiKey, prompt, onChunk, onComplete, onError) {
        const endpoint = this.apiEndpoints[model];
        if (!endpoint) {
            throw new Error(`不支持的AI模型: ${model}`);
        }

        // 根据不同模型构建请求
        let requestBody, headers;

        if (model.startsWith('deepseek') || model === 'baichuan2') {
            // OpenAI兼容格式
            requestBody = {
                model: model === 'deepseek-chat' ? 'deepseek-chat' : 
                       model === 'deepseek-coder' ? 'deepseek-coder' : 'Baichuan2-Turbo',
                messages: [
                    {
                        role: 'system',
                        content: prompt.systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt.userPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                stream: true  // 启用串流
            };

            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        } else if (model === 'qwen-turbo') {
            // 通义千问格式 - 注意：通义千问可能不支持串流，这里先保留原格式
            requestBody = {
                model: 'qwen-turbo',
                input: {
                    messages: [
                        {
                            role: 'system',
                            content: prompt.systemPrompt
                        },
                        {
                            role: 'user',
                            content: prompt.userPrompt
                        }
                    ]
                },
                parameters: {
                    temperature: 0.7,
                    max_tokens: 4000
                }
            };

            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败 (${response.status}): ${errorText}`);
            }

            // 处理串流响应
            if (model.startsWith('deepseek') || model === 'baichuan2') {
                await this.handleStreamResponse(response, onChunk, onComplete, onError);
            } else {
                // 对于不支持串流的模型，使用传统方式
                const data = await response.json();
                let content = data.output?.text;
                if (content) {
                    onComplete({ content });
                } else {
                    throw new Error('AI响应中未找到生成的内容');
                }
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络设置');
            }
            onError(error);
        }
    }

    /**
     * 处理串流响应
     */
    async handleStreamResponse(response, onChunk, onComplete, onError) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let chunkCount = 0;
        let lastChunkTime = Date.now();

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    // 如果流结束但没有[DONE]标记，仍然调用完成回调
                    if (fullContent.trim()) {
                        onComplete({ content: fullContent });
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onComplete({ content: fullContent });
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                fullContent += content;
                                chunkCount++;
                                lastChunkTime = Date.now();
                                
                                // 批量处理内容块以提高性能
                                if (chunkCount % 5 === 0 || Date.now() - lastChunkTime > 100) {
                                    onChunk(content);
                                }
                            }
                            
                            // 检查是否有错误信息
                            if (parsed.error) {
                                onError(new Error(parsed.error.message || 'API返回错误'));
                                return;
                            }
                        } catch (e) {
                            // 忽略解析错误，继续处理下一行
                            console.warn('解析串流数据失败:', e);
                        }
                    }
                }

                // 检查超时（30秒无响应）
                if (Date.now() - lastChunkTime > 30000) {
                    throw new Error('串流响应超时');
                }
            }
        } catch (error) {
            // 如果已经有部分内容，仍然尝试完成
            if (fullContent.trim()) {
                console.warn('串流过程中出现错误，但已获得部分内容:', error);
                onComplete({ content: fullContent });
            } else {
                onError(error);
            }
        } finally {
            try {
                reader.releaseLock();
            } catch (e) {
                // 忽略释放锁的错误
            }
        }
    }

    /**
     * 调用AI API (传统版本 - 保留作为备用)
     */
    async callAI(model, apiKey, prompt) {
        const endpoint = this.apiEndpoints[model];
        if (!endpoint) {
            throw new Error(`不支持的AI模型: ${model}`);
        }

        // 根据不同模型构建请求
        let requestBody, headers;

        if (model.startsWith('deepseek') || model === 'baichuan2') {
            // OpenAI兼容格式
            requestBody = {
                model: model === 'deepseek-chat' ? 'deepseek-chat' : 
                       model === 'deepseek-coder' ? 'deepseek-coder' : 'Baichuan2-Turbo',
                messages: [
                    {
                        role: 'system',
                        content: prompt.systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt.userPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                stream: false
            };

            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        } else if (model === 'qwen-turbo') {
            // 通义千问格式
            requestBody = {
                model: 'qwen-turbo',
                input: {
                    messages: [
                        {
                            role: 'system',
                            content: prompt.systemPrompt
                        },
                        {
                            role: 'user',
                            content: prompt.userPrompt
                        }
                    ]
                },
                parameters: {
                    temperature: 0.7,
                    max_tokens: 4000
                }
            };

            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            
            // 解析不同模型的响应格式
            let content = '';
            
            if (model.startsWith('deepseek') || model === 'baichuan2') {
                content = data.choices?.[0]?.message?.content;
            } else if (model === 'qwen-turbo') {
                content = data.output?.text;
            }

            if (!content) {
                throw new Error('AI响应中未找到生成的内容');
            }

            return { content };

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络设置');
            }
            throw error;
        }
    }

    /**
     * 将Markdown渲染为HTML
     */
    renderMarkdownToHTML(markdown) {
        if (typeof marked === 'undefined') {
            // 如果marked库未加载，返回简单的HTML格式
            return this.simpleMarkdownToHTML(markdown);
        }

        try {
            let html = marked.parse(markdown);
            
            // 添加教案特定的样式类
            html = this.enhanceHTMLForLessonPlan(html);
            
            return html;
        } catch (error) {
            return this.simpleMarkdownToHTML(markdown);
        }
    }

    /**
     * 简单的Markdown到HTML转换（备用方案）
     */
    simpleMarkdownToHTML(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.*)$/gim, '<p>$1</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<li>.*?<\/li>)<\/p>/g, '<ul>$1</ul>');
    }

    /**
     * 增强HTML以适配教案格式
     */
    enhanceHTMLForLessonPlan(html) {
        // 添加教学设计头部信息
        const formData = window.lessonPlanCore.getFormData();
        const headerTitle = formData.enableFusion ? 
            `${formData.courseName} - 多学科融合教学设计` : 
            `${formData.courseName} - 教学设计`;
        
        const headerInfo = `
            <div class="lesson-header">
                <h1>${headerTitle}</h1>
                <div class="lesson-info">
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">课程名称：</span>
                        <span>${formData.courseName}</span>
                    </div>
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">设计教师：</span>
                        <span>${formData.teacher}</span>
                    </div>
                    ${formData.enableFusion ? `
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">融合学科：</span>
                        <span>${formData.fusionSubjects || 'AI自动推荐'}</span>
                    </div>
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">融合方式：</span>
                        <span>${formData.fusionApproach || 'AI自动选择'}</span>
                    </div>
                    ` : `
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">教学类型：</span>
                        <span>单一学科教学</span>
                    </div>
                    `}
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">设计时间：</span>
                        <span>${window.lessonPlanCore.getCurrentDateTime()}</span>
                    </div>
                </div>
            </div>
        `;

        // 处理教学过程表格
        html = html.replace(
            /(<h[2-3]>.*?教学过程.*?<\/h[2-3]>)(.*?)(<h[2-3]|$)/gs,
            (match, title, content, next) => {
                if (content.includes('教师活动') && content.includes('学生活动')) {
                    // 转换为表格格式
                    const tableHTML = this.convertToTeachingProcessTable(content);
                    return title + tableHTML + (next === '$' ? '' : next);
                }
                return match;
            }
        );

        return headerInfo + html;
    }

    /**
     * 转换教学过程为表格格式
     */
    convertToTeachingProcessTable(content) {
        // 这里可以根据实际的AI输出格式来解析和转换
        // 简化处理，直接包装在表格容器中
        return `
            <div class="lesson-section">
                <table class="teaching-process-table">
                    <thead>
                        <tr>
                            <th style="width: 33.33%">教师活动</th>
                            <th style="width: 33.33%">学生活动</th>
                            <th style="width: 33.33%">设计意图</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="min-height: 100px; vertical-align: top; padding: 1rem;">
                                ${content}
                            </td>
                            <td style="min-height: 100px; vertical-align: top; padding: 1rem;">
                                <!-- AI生成的学生活动内容 -->
                            </td>
                            <td style="min-height: 100px; vertical-align: top; padding: 1rem;">
                                <!-- AI生成的设计意图内容 -->
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }










    /**
     * 导出为Word文档
     */
    async exportToWord() {
        try {
            const previewContent = document.getElementById('preview-content');
            if (!previewContent || !previewContent.innerHTML.trim()) {
                window.lessonPlanCore.showNotification('没有可导出的内容，请先生成教案', 'warning');
                return;
            }

            // 显示加载提示
            window.lessonPlanCore.showNotification('正在生成Word文档，请稍候...', 'info');

            // 创建与预览完全一致的Word文档
            const fullHTML = this.createWordDocumentFromPreview(previewContent);
            
            // 使用html-docx-js库导出
            if (typeof htmlDocx !== 'undefined') {
                const converted = htmlDocx.asBlob(fullHTML);
                
                // 创建下载链接
                const formData = window.lessonPlanCore.getFormData();
                const fileName = window.lessonPlanCore.formatFileName('教学设计') + '.docx';
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(converted);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.lessonPlanCore.showNotification('Word文档导出成功！', 'success');
            } else {
                // 备用方案：导出为HTML文件
                this.exportAsHTML(fullHTML);
            }

        } catch (error) {
            window.lessonPlanCore.showNotification(`导出失败: ${error.message}`, 'error');
        }
    }

    /**
     * 创建基于预览内容的Word文档
     */
    createWordDocumentFromPreview(previewContent) {
        const formData = window.lessonPlanCore.getFormData();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${formData.courseName} - 教学设计</title>
                <style>
                    body {
                        font-family: "SimSun", "Times New Roman", serif;
                        font-size: 12pt;
                        line-height: 1.6;
                        margin: 2cm;
                        color: #000;
                        background: white;
                    }
                    .lesson-header {
                        text-align: center;
                        margin-bottom: 2rem;
                        padding-bottom: 1rem;
                        border-bottom: 2px solid #3B82F6;
                    }
                    .lesson-info {
                        display: table;
                        width: 100%;
                        margin-bottom: 2rem;
                        padding: 1rem;
                        background-color: #F9FAFB;
                        border-radius: 0.5rem;
                    }
                    .lesson-info-item {
                        display: table-row;
                    }
                    .lesson-info-label {
                        display: table-cell;
                        font-weight: 600;
                        padding: 0.25rem 1rem 0.25rem 0;
                        color: #374151;
                        width: 120px;
                    }
                    .lesson-info-value {
                        display: table-cell;
                        padding: 0.25rem 0;
                    }
                    h1 {
                        font-size: 18pt;
                        font-weight: bold;
                        margin-bottom: 1rem;
                        color: #111827;
                        text-align: center;
                        border-bottom: 2px solid #3B82F6;
                        padding-bottom: 0.5rem;
                    }
                    h2 {
                        font-size: 16pt;
                        font-weight: 600;
                        margin: 1.5rem 0 1rem 0;
                        color: #1F2937;
                        border-left: 4px solid #3B82F6;
                        padding-left: 1rem;
                    }
                    h3 {
                        font-size: 14pt;
                        font-weight: 600;
                        margin: 1.25rem 0 0.75rem 0;
                        color: #374151;
                    }
                    p {
                        margin-bottom: 1rem;
                        text-indent: 2em;
                    }
                    ul, ol {
                        margin: 1rem 0;
                        padding-left: 2rem;
                    }
                    li {
                        margin-bottom: 0.5rem;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1.5rem 0;
                        border: 1px solid #D1D5DB;
                    }
                    th, td {
                        padding: 0.75rem;
                        text-align: left;
                        border: 1px solid #D1D5DB;
                        vertical-align: top;
                    }
                    th {
                        background-color: #F9FAFB;
                        font-weight: 600;
                        text-align: center;
                    }
                    .teaching-process-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1rem 0;
                    }
                    .teaching-process-table th {
                        background-color: #3B82F6;
                        color: white;
                        padding: 1rem;
                        text-align: center;
                        font-weight: 600;
                    }
                    .teaching-process-table td {
                        padding: 1rem;
                        vertical-align: top;
                        border: 1px solid #D1D5DB;
                        min-height: 100px;
                    }
                    .teaching-process-table tr:nth-child(even) {
                        background-color: #F9FAFB;
                    }
                    blockquote {
                        border-left: 4px solid #D1D5DB;
                        padding-left: 1rem;
                        margin: 1rem 0;
                        font-style: italic;
                        color: #6B7280;
                    }
                    strong {
                        font-weight: bold;
                    }
                    em {
                        font-style: italic;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                </style>
            </head>
            <body>
                ${previewContent.innerHTML}
            </body>
            </html>
        `;
    }








    /**
     * 备用方案：导出为HTML文件
     */
    exportAsHTML(content) {
        const formData = window.lessonPlanCore.getFormData();
        const fullHTML = this.createWordDocumentFromPreview(document.getElementById('preview-content'));
        
        const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
        const fileName = window.lessonPlanCore.formatFileName('多学科融合教学设计') + '.html';
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.lessonPlanCore.showNotification('已导出为HTML文件（请使用Word打开）', 'info');
    }
}

// 初始化AI功能
document.addEventListener('DOMContentLoaded', () => {
    window.lessonPlanAI = new LessonPlanAI();
});
