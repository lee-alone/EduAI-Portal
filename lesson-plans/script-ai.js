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
        
        this.init();
    }

    /**
     * 初始化AI功能
     */
    init() {
        this.bindEvents();
        this.setupMarkdownRenderer();
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

        // 导出PDF按钮
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportToPDF();
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
        // 首先定义当前日期
        const currentDate = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const systemPrompt = `你是一位资深的教育专家，专门从事教学设计和课程开发。请根据用户提供的课程信息，按照标准教案格式生成一份完整的教学设计方案。

**重要要求：必须严格按照以下分块结构输出，每个部分都要详细完整**

## 第一部分：教案基本信息

### 1. 课题课标要求
- 课程标题和课程标准要求

### 2. 基本信息
- 备课时间：${currentDate}
- 课时数：[根据用户输入或自动确定]
- 教师：[用户输入的教师姓名]

### 3. 素养目标
- 学科核心素养培养目标
- 跨学科综合素养目标
- 21世纪技能培养目标

### 4. 重点
- 本课程的教学重点内容
- 核心知识点和技能要求

### 5. 难点
- 学生理解和掌握的难点
- 需要重点突破的认知障碍

### 6. 学情分析
- 学生年龄特点和认知水平
- 已有知识基础和经验
- 学习兴趣和动机分析
- 个体差异考虑

### 7. 教学策略
- 采用的教学方法和策略
- 学科融合的具体方式
- 信息技术应用策略

### 8. 教学资源
- 教学媒体和技术工具
- 实验器材和教具
- 学习材料和参考资源
- 网络资源和数字化工具

## 第二部分：教学过程设计

### 教学过程表格
请按照以下三列格式详细设计：

| 教师活动 | 学生活动 | 设计意图 |
|---------|---------|---------|
| [详细描述教师在各个教学环节的具体活动] | [详细描述学生的学习活动和参与方式] | [说明每个环节的教学目的和设计理念] |

教学过程应包括：
1. 导入环节（5-10分钟）
2. 新课讲授（20-25分钟）
3. 巩固练习（10-15分钟）
4. 总结反思（5分钟）

## 第三部分：板书设计与教学反思

### 9. 板书设计
- 板书布局和结构设计
- 关键概念和知识点呈现
- 图表、公式或示意图设计
- 板书的逻辑关系和层次

### 10. 教学反思
- 教学目标达成情况分析
- 教学方法效果评估
- 学生学习效果反馈
- 教学改进建议和优化方向
- 下次教学的调整策略

**格式要求：**
- 使用Markdown格式输出
- 每个部分都要有明确的标题
- 内容要详实具体，符合实际教学需要
- 语言专业规范，便于教师实际使用
- 确保所有10个部分都完整包含`;

        const userPrompt = `请为以下课程设计标准教案：

**课程信息：**
- 课程名称：${formData.courseName}
- 教师：${formData.teacher}
- 备课时间：${currentDate}
- 年级段：${formData.gradeLevel || '请根据课程名称自动判断'}
- 课时数：${formData.classHours || '请根据课程内容自动确定'}

**教学设计要求：**
- 期望融合的学科：${formData.fusionSubjects || '请根据课程名称自动推荐相关学科'}
- 教学方式偏好：${formData.fusionApproach || '请选择最适合的教学方式'}
- 学科融合比例：${formData.fusionRatio}

**教学内容重点：**
${formData.lessonContent || '请根据课程名称分析教学内容要点'}

**实际应用场景：**
${formData.realWorldContext || '请设计与现实生活相关的应用情境'}

**特殊要求：**
${formData.customRequirements || '请按照标准教案格式进行设计'}

**重要提醒：**
1. 必须严格按照上述10个分块结构输出，不能遗漏任何部分
2. 首先分析课程名称，识别主要学科和适合的年级段
3. 根据课程特点确定合适的课时数（如果用户未指定）
4. 教学过程设计要详细具体，包含完整的时间安排
5. 板书设计要有实际可操作性
6. 教学反思要深入具体，有指导价值
7. 所有内容都要符合实际教学需要，便于教师直接使用
   - 如果是70:30比例，主学科内容应占70%，融合学科占30%
   - 如果是自定义比例，请严格按照指定百分比分配
   - 在教学过程设计中明确体现各学科的时间和内容分配
   - 确保主学科始终保持主导地位，融合学科起辅助和拓展作用

请生成一份完整的多学科融合教学设计方案。`;

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
        // 添加融合教学设计头部信息
        const formData = window.lessonPlanCore.getFormData();
        const headerInfo = `
            <div class="lesson-header">
                <h1>${formData.courseName} - 多学科融合教学设计</h1>
                <div class="lesson-info">
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">课程名称：</span>
                        <span>${formData.courseName}</span>
                    </div>
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">设计教师：</span>
                        <span>${formData.teacher}</span>
                    </div>
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">融合学科：</span>
                        <span>${formData.fusionSubjects || 'AI自动推荐'}</span>
                    </div>
                    <div class="lesson-info-item">
                        <span class="lesson-info-label">融合方式：</span>
                        <span>${formData.fusionApproach || 'AI自动选择'}</span>
                    </div>
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
     * 导出为PDF文档
     */
    async exportToPDF() {
        try {
            const previewContent = document.getElementById('preview-content');
            if (!previewContent || !previewContent.innerHTML.trim()) {
                window.lessonPlanCore.showNotification('没有可导出的内容，请先生成教案', 'warning');
                return;
            }

            // 显示加载提示
            window.lessonPlanCore.showNotification('正在生成PDF，请稍候...', 'info');

            // 检查库是否加载 - 支持多种加载方式
            const html2canvasLoaded = typeof html2canvas !== 'undefined';
            const jsPDFLoaded = typeof jsPDF !== 'undefined' || typeof window.jsPDF !== 'undefined';
            
            if (!html2canvasLoaded || !jsPDFLoaded) {
                // 如果库未加载，尝试备用方案
                console.warn('PDF库未完全加载，尝试备用方案');
                await this.exportToPDFFallback();
                return;
            }

            // 使用html2canvas将HTML转换为canvas
            const canvas = await html2canvas(previewContent, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: previewContent.scrollWidth,
                height: previewContent.scrollHeight
            });

            // 创建PDF文档 - 兼容不同的加载方式
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const PDFClass = window.jsPDF || jsPDF;
            const pdf = new PDFClass('p', 'mm', 'a4');
            
            // 计算PDF页面尺寸
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            // 添加图片到PDF
            pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

            // 保存PDF
            const fileName = this.getPDFFileName();
            pdf.save(fileName);
            
            window.lessonPlanCore.showNotification('PDF导出成功！', 'success');

        } catch (error) {
            console.error('PDF导出错误:', error);
            // 尝试备用方案
            try {
                await this.exportToPDFFallback();
            } catch (fallbackError) {
                window.lessonPlanCore.showNotification(`PDF导出失败: ${error.message}`, 'error');
            }
        }
    }

    /**
     * PDF导出备用方案 - 使用浏览器打印功能
     */
    async exportToPDFFallback() {
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) {
            throw new Error('没有可导出的内容');
        }

        // 创建新窗口进行打印
        const printWindow = window.open('', '_blank');
        const formData = window.lessonPlanCore.getFormData();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${formData.courseName} - 教学设计</title>
                <style>
                    body { 
                        font-family: "SimSun", "Times New Roman", serif; 
                        margin: 20px;
                        line-height: 1.6;
                        color: #000;
                    }
                    @media print {
                        body { margin: 0; }
                        @page { margin: 1cm; }
                    }
                    h1, h2, h3 { color: #333; margin-top: 1.5em; }
                    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                ${previewContent.innerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        window.lessonPlanCore.showNotification('已打开打印对话框，请选择"保存为PDF"', 'info');
    }







    /**
     * 获取PDF文件名
     */
    getPDFFileName() {
        const formData = window.lessonPlanCore.getFormData();
        const timestamp = new Date().toISOString().slice(0, 10);
        const baseName = `教学设计_${formData.courseName}_${formData.teacher}_${timestamp}`;
        return baseName.replace(/[^\w\u4e00-\u9fa5]/g, '_') + '.pdf';
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
