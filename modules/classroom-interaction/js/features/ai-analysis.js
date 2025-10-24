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
            // 真实的数据处理流程
            await this.processExcelFiles();
            
            this.showNotification('AI学情分析报告生成成功！', 'success');
        } catch (error) {
            console.error('AI分析失败:', error);
            this.showNotification(`AI分析失败: ${error.message}`, 'error');
        } finally {
            this.isGenerating = false;
            this.updateGenerateButton(false);
        }
    }

    /**
     * 处理Excel文件
     */
    async processExcelFiles() {
        this.updateLoadingMessage('正在读取Excel文件...');
        
        // 读取课堂活动数据
        const activityData = await this.readExcelFile(this.uploadedFiles.activity);
        this.updateLoadingMessage('正在读取学生名单数据...');
        
        // 读取学生名单数据
        const rosterData = await this.readExcelFile(this.uploadedFiles.roster);
        this.updateLoadingMessage('正在整合数据...');
        
        // 整合数据：座号替换为姓名
        const integratedData = this.integrateData(activityData, rosterData);
        this.updateLoadingMessage('正在生成AI分析报告...');
        
        // 生成AI分析报告
        const report = await this.generateRealAIReport(integratedData);
        this.displayReport(report);
    }

    /**
     * 读取Excel文件
     */
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 解析所有工作表
                    const sheets = {};
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        sheets[sheetName] = jsonData;
                    });
                    
                    resolve({
                        workbook: workbook,
                        sheets: sheets,
                        sheetNames: workbook.SheetNames
                    });
                } catch (error) {
                    reject(new Error(`Excel文件解析失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 整合数据：将座号替换为姓名
     */
    integrateData(activityData, rosterData) {
        this.updateLoadingMessage('正在匹配学生姓名...');
        
        // 创建座号-姓名映射表
        const nameMapping = this.createNameMapping(rosterData);
        
        // 找到主要的课堂活动数据工作表
        const mainActivitySheet = this.findMainActivitySheet(activityData);
        
        if (!mainActivitySheet) {
            throw new Error('未找到有效的课堂活动数据');
        }
        
        // 整合数据
        const integratedRecords = [];
        const unmatchedRecords = [];
        
        mainActivitySheet.data.forEach(record => {
            const studentId = this.extractStudentId(record);
            const studentName = nameMapping[studentId];
            
            if (studentName) {
                // 成功匹配，创建整合记录
                const integratedRecord = {
                    ...record,
                    studentName: studentName,
                    studentId: studentId,
                    subject: this.extractSubject(record),
                    date: this.extractDate(record),
                    points: this.extractPoints(record),
                    originalData: record
                };
                integratedRecords.push(integratedRecord);
            } else {
                // 未匹配到姓名
                unmatchedRecords.push({
                    ...record,
                    studentId: studentId,
                    reason: '未找到对应姓名'
                });
            }
        });
        
        return {
            integratedRecords: integratedRecords,
            unmatchedRecords: unmatchedRecords,
            nameMapping: nameMapping,
            totalRecords: mainActivitySheet.data.length,
            matchedRecords: integratedRecords.length,
            matchRate: (integratedRecords.length / mainActivitySheet.data.length * 100).toFixed(1)
        };
    }

    /**
     * 创建座号-姓名映射表
     */
    createNameMapping(rosterData) {
        const mapping = {};
        
        // 尝试从所有工作表中找到学生名单
        Object.values(rosterData.sheets).forEach(sheetData => {
            if (Array.isArray(sheetData)) {
                sheetData.forEach(row => {
                    const studentId = this.extractStudentId(row);
                    const studentName = this.extractStudentName(row);
                    
                    if (studentId && studentName) {
                        mapping[studentId] = studentName;
                    }
                });
            }
        });
        
        return mapping;
    }

    /**
     * 找到主要的课堂活动数据工作表
     */
    findMainActivitySheet(activityData) {
        const activityKeywords = ['课堂表现', '活动记录', '表现记录', '课堂活动'];
        
        // 按优先级查找工作表
        for (const sheetName of activityData.sheetNames) {
            if (activityKeywords.some(keyword => sheetName.includes(keyword))) {
                const data = activityData.sheets[sheetName];
                if (data && data.length > 0) {
                    return {
                        name: sheetName,
                        data: data
                    };
                }
            }
        }
        
        // 如果没有找到明确的工作表，使用第一个有数据的工作表
        for (const sheetName of activityData.sheetNames) {
            const data = activityData.sheets[sheetName];
            if (data && data.length > 0) {
                return {
                    name: sheetName,
                    data: data
                };
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取学生ID
     */
    extractStudentId(record) {
        const idFields = ['学生座号', '座号', '学号', 'ID', 'id', 'studentId', '学生ID'];
        
        for (const field of idFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取学生姓名
     */
    extractStudentName(record) {
        const nameFields = ['学生姓名', '姓名', 'name', 'studentName', '学生名字'];
        
        for (const field of nameFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取学科信息
     */
    extractSubject(record) {
        const subjectFields = ['科目', '学科', '课程', 'subject', '课程名称'];
        
        for (const field of subjectFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取日期信息
     */
    extractDate(record) {
        const dateFields = ['课堂日期', '日期', 'date', '时间', '上课日期'];
        
        for (const field of dateFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取积分信息
     */
    extractPoints(record) {
        const pointsFields = ['积分', '分数', 'points', 'score', '加分', '得分'];
        
        for (const field of pointsFields) {
            if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
                const points = parseFloat(record[field]);
                if (!isNaN(points)) {
                    return points;
                }
            }
        }
        
        return null;
    }

    /**
     * 生成真实的AI分析报告
     */
    async generateRealAIReport(integratedData) {
        // 生成数据摘要
        const summary = this.generateDataSummary(integratedData);
        
        // 调试：输出处理结果到控制台
        this.debugDataProcessing(integratedData, summary);
        
        // 调用AI分析
        this.updateLoadingMessage('正在调用AI进行学情分析...');
        const aiReport = await this.callAIAnalysis(integratedData, summary);
        
        // 生成最终报告HTML
        const report = this.generateFinalReportHTML(integratedData, summary, aiReport);
        
        return report;
    }

    /**
     * 调试数据处理结果
     */
    debugDataProcessing(integratedData, summary) {
        console.group('🔍 AI学情分析 - 数据处理结果');
        
        console.log('📊 数据统计:', {
            总记录数: summary.totalRecords,
            成功匹配: summary.matchedRecords,
            未匹配记录: summary.unmatchedRecords,
            匹配率: summary.matchRate + '%',
            活跃学生数: summary.activeStudents,
            涉及学科: summary.subjects,
            总积分: summary.totalPoints,
            平均积分: summary.averagePoints
        });
        
        console.log('👥 学生名单映射:', integratedData.nameMapping);
        
        console.log('✅ 成功匹配的记录 (前5条):', integratedData.integratedRecords.slice(0, 5));
        
        if (integratedData.unmatchedRecords.length > 0) {
            console.log('❌ 未匹配的记录:', integratedData.unmatchedRecords);
        }
        
        console.log('📋 整合后的数据结构示例:', {
            学生姓名: integratedData.integratedRecords[0]?.studentName,
            学生座号: integratedData.integratedRecords[0]?.studentId,
            学科: integratedData.integratedRecords[0]?.subject,
            日期: integratedData.integratedRecords[0]?.date,
            积分: integratedData.integratedRecords[0]?.points,
            原始数据: integratedData.integratedRecords[0]?.originalData
        });
        
        console.groupEnd();
    }

    /**
     * 清理AI输出内容
     */
    cleanAIOutput(content) {
        // 移除开头的```html标记
        content = content.replace(/^```html\s*/i, '');
        
        // 移除结尾的```标记
        content = content.replace(/\s*```\s*$/i, '');
        
        // 移除多余的换行符
        content = content.replace(/\n{3,}/g, '\n\n');
        
        // 确保内容以HTML标签开始
        if (!content.trim().startsWith('<')) {
            // 如果内容不是HTML格式，包装成HTML
            content = `<div class="ai-report-content">${content}</div>`;
        }
        
        return content.trim();
    }

    /**
     * 调用AI进行学情分析
     */
    async callAIAnalysis(integratedData, summary) {
        try {
        const selectedModel = this.getSelectedModel();
            const apiKey = this.getAPIKey();
        const apiEndpoint = this.getAPIEndpoint();
        
            // 构建AI分析提示词
            const prompt = this.buildAIPrompt(integratedData, summary);
            
            // 构建API请求数据
            const requestData = {
                model: selectedModel,
                messages: [
                    {
                        role: "system",
                        content: "你是一位专业的班主任，擅长分析学生课堂表现数据，生成详细的学情分析报告。请基于提供的数据，生成包含班级整体评价和个别学生评价的详细报告。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            };
            
            console.log('🤖 调用AI分析:', {
                model: selectedModel,
                endpoint: apiEndpoint,
                dataSize: JSON.stringify(requestData).length
            });
            
            // 发送API请求
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(`AI分析失败: ${result.error.message}`);
            }
            
            // 提取AI回复内容
            let aiContent = result.choices?.[0]?.message?.content;
            if (!aiContent) {
                throw new Error('AI未返回有效内容');
            }
            
            // 清理AI输出内容
            aiContent = this.cleanAIOutput(aiContent);
            
            console.log('✅ AI分析完成:', {
                usage: result.usage,
                contentLength: aiContent.length
            });
            
            return {
                content: aiContent,
                usage: result.usage,
                model: selectedModel
            };
            
        } catch (error) {
            console.error('❌ AI分析失败:', error);
            throw new Error(`AI分析失败: ${error.message}`);
        }
    }

    /**
     * 构建AI分析提示词
     */
    buildAIPrompt(integratedData, summary) {
        const { integratedRecords, unmatchedRecords } = integratedData;
        
        // 构建学生表现数据
        const studentPerformance = this.buildStudentPerformanceData(integratedRecords);
        
        // 构建提示词
        const prompt = `
# 学情分析任务

## 数据概览
- 总记录数: ${summary.totalRecords}
- 成功匹配: ${summary.matchedRecords}
- 活跃学生数: ${summary.activeStudents}
- 涉及学科: ${summary.subjects.join('、')}
- 数据匹配率: ${summary.matchRate}%

## 学生表现数据
${JSON.stringify(studentPerformance, null, 2)}

## 需要分析的学生列表
以下学生都有发言记录，必须在个别学生表现评价部分逐一分析：
${studentPerformance.studentList.map(student => `- ${student.name} (参与${student.participationCount}次，涉及学科：${student.subjects.join('、')})`).join('\n')}

## 分析要求
请基于以上数据，生成一份详细的学情分析报告，包含以下内容：

### 1. 班级整体表现分析
- 课堂参与度分析
- 学科表现分布
- 学习氛围评价
- 整体学习状态

### 2. 个别学生表现评价（重要：必须分析所有发言学生）
请为数据中的每一个学生生成个性化评价，包括：
- 学习积极性评价
- 课堂表现特点
- 学习建议和鼓励
- 需要关注的问题

**特别注意：**
- 必须分析数据中出现的每一个学生
- 不能遗漏任何有发言记录的学生
- 为每个学生提供具体的、个性化的评价
- 根据学生的实际表现数据给出针对性建议
- 在个别学生表现评价部分，必须包含以上列出的所有${studentPerformance.studentList.length}个学生的分析
- 每个学生的分析应该独立成段，包含学生姓名、表现评价和建议

### 3. 教学建议
- 针对班级整体的教学建议
- 个别学生的关注重点
- 改进措施和后续计划

## 输出格式
请以HTML格式输出报告，使用适当的标题、段落和样式，确保报告结构清晰、内容详实。

## 重要提醒
请确保在"个别学生表现评价"部分中，为数据中的每一个学生都提供详细的分析和评价，不要遗漏任何学生。
        `;
        
        return prompt;
    }

    /**
     * 构建学生表现数据
     */
    buildStudentPerformanceData(integratedRecords) {
        const studentData = {};
        
        // 按学生分组统计
        integratedRecords.forEach(record => {
            const studentName = record.studentName;
            if (!studentData[studentName]) {
                studentData[studentName] = {
                    name: studentName,
                    studentId: record.studentId,
                    records: [],
                    subjects: new Set(),
                    dates: new Set(),
                    totalPoints: 0,
                    participationCount: 0
                };
            }
            
            // 添加记录
            studentData[studentName].records.push({
                subject: record.subject,
                date: record.date,
                points: record.points,
                originalData: record.originalData
            });
            
            // 统计信息
            if (record.subject) studentData[studentName].subjects.add(record.subject);
            if (record.date) studentData[studentName].dates.add(record.date);
            if (record.points) studentData[studentName].totalPoints += record.points;
            studentData[studentName].participationCount++;
        });
        
        // 转换Set为Array
        Object.values(studentData).forEach(student => {
            student.subjects = Array.from(student.subjects);
            student.dates = Array.from(student.dates);
        });
        
        const students = Object.values(studentData);
        
        // 按参与度排序，确保所有学生都被包含
        students.sort((a, b) => b.participationCount - a.participationCount);
        
        return {
            students: students,
            totalStudents: Object.keys(studentData).length,
            studentNames: Object.keys(studentData),
            summary: {
                totalRecords: integratedRecords.length,
                activeStudents: Object.keys(studentData).length,
                subjects: [...new Set(integratedRecords.map(r => r.subject).filter(Boolean))],
                dates: [...new Set(integratedRecords.map(r => r.date).filter(Boolean))]
            },
            // 添加学生列表，确保AI知道需要分析哪些学生
            studentList: Object.keys(studentData).map(name => ({
                name: name,
                participationCount: studentData[name].participationCount,
                subjects: studentData[name].subjects,
                totalPoints: studentData[name].totalPoints
            }))
        };
    }

    /**
     * 生成数据摘要
     */
    generateDataSummary(integratedData) {
        const { integratedRecords, unmatchedRecords, totalRecords, matchedRecords, matchRate } = integratedData;
        
        // 统计学生信息
        const students = new Set();
        const subjects = new Set();
        const dates = new Set();
        let totalPoints = 0;
        
        integratedRecords.forEach(record => {
            if (record.studentName) students.add(record.studentName);
            if (record.subject) subjects.add(record.subject);
            if (record.date) dates.add(record.date);
            if (record.points) totalPoints += parseFloat(record.points) || 0;
        });
        
        return {
            totalRecords: totalRecords,
            matchedRecords: matchedRecords,
            unmatchedRecords: unmatchedRecords.length,
            matchRate: matchRate,
            activeStudents: students.size,
            subjects: Array.from(subjects),
            dates: Array.from(dates),
            totalPoints: totalPoints,
            averagePoints: matchedRecords > 0 ? (totalPoints / matchedRecords).toFixed(2) : 0
        };
    }

    /**
     * 生成最终报告HTML
     */
    generateFinalReportHTML(integratedData, summary, aiReport) {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = this.getSelectedModel();
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">生成时间: ${currentDate}</p>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">使用模型: ${selectedModel}</p>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">数据匹配率: ${summary.matchRate}%</p>
                <p style="color: #4a5568; margin-bottom: 2rem; font-weight: 500;">AI分析完成，Token使用: ${aiReport.usage?.total_tokens || 'N/A'}</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-database" style="color: #667eea;"></i>
                    数据处理结果
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #4299e1;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.totalRecords}</div>
                        <div style="color: #718096;">总记录数</div>
                    </div>
                    <div style="background: #f0fff4; padding: 1rem; border-radius: 8px; border-left: 4px solid #48bb78;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.matchedRecords}</div>
                        <div style="color: #718096;">成功匹配</div>
                    </div>
                    <div style="background: #fff5f5; padding: 1rem; border-radius: 8px; border-left: 4px solid #f56565;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.unmatchedRecords}</div>
                        <div style="color: #718096;">未匹配记录</div>
                    </div>
                    <div style="background: #faf5ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #9f7aea;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.activeStudents}</div>
                        <div style="color: #718096;">活跃学生</div>
                    </div>
                </div>
            </div>
            
            <div class="ai-report-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="color: #4a5568; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-robot" style="color: #667eea;"></i>
                        AI智能分析报告
                    </h4>
                    <button id="export-report-btn" class="ai-export-btn" onclick="exportAIReport()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)' onmouseout="this.style.transform='translateY(0)'">
                        <i class="fas fa-download"></i>
                        导出Word报告
                    </button>
                </div>
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea;">
                    ${aiReport.content}
                </div>
            </div>
            
            <div class="ai-report-footer" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 0.9rem; text-align: center;">
                    <i class="fas fa-robot mr-1"></i>
                    本报告由AI智能分析生成，基于真实课堂数据
                </p>
            </div>
        `;
    }

    /**
     * 导出AI报告为Word文档
     */
    exportAIReport() {
        try {
            // 获取报告内容
            const reportOutput = document.getElementById('ai-report-output');
            if (!reportOutput) {
                this.showNotification('未找到报告内容', 'error');
                return;
            }

            // 直接获取完整的HTML内容，确保包含所有AI输出
            const reportContent = reportOutput.innerHTML;
            
            console.log('🔍 导出前内容检查:', {
                contentLength: reportContent.length,
                hasAIContent: reportContent.includes('AI智能分析报告'),
                hasDataSection: reportContent.includes('数据处理结果'),
                hasAISection: reportContent.includes('AI智能分析报告'),
                contentPreview: reportContent.substring(0, 500) + '...'
            });
            
            // 构建完整的HTML内容
            const htmlContent = this.buildExportHTML(reportContent);
            
            // 最终内容检查
            console.log('🔍 最终导出内容检查:', {
                htmlContentLength: htmlContent.length,
                hasAIContent: htmlContent.includes('AI智能分析报告'),
                hasDataSection: htmlContent.includes('数据处理结果'),
                contentPreview: htmlContent.substring(0, 1000) + '...'
            });
            
            // 检查是否有html-docx库
            if (typeof htmlDocx !== 'undefined') {
                try {
                    const docx = htmlDocx.asBlob(htmlContent);
                    const fileName = `AI学情分析报告_${new Date().toISOString().slice(0, 10)}.docx`;
                    
                    // 使用FileSaver保存文件
                    if (typeof saveAs !== 'undefined') {
                        saveAs(docx, fileName);
                        this.showNotification('Word报告导出成功！', 'success');
                    } else {
                        // 降级到下载链接
                        this.downloadFile(docx, fileName);
                    }
                } catch (error) {
                    console.error('导出Word失败:', error);
                    // 降级到HTML格式
                    this.exportAsHTML(htmlContent);
                }
            } else {
                // 降级到HTML格式
                this.exportAsHTML(htmlContent);
            }
        } catch (error) {
            console.error('导出报告失败:', error);
            this.showNotification('导出失败，请重试', 'error');
        }
    }

    /**
     * 获取完整的报告内容
     */
    getCompleteReportContent(reportOutput) {
        // 获取所有报告内容，包括内联样式
        const reportContent = reportOutput.cloneNode(true);
        
        // 确保所有样式都被包含
        const additionalStyles = `
            <style>
                .ai-report-header h3 { color: #2d3748 !important; }
                .ai-report-header p { color: #4a5568 !important; font-weight: 500; }
                .ai-report-section h4 { color: #4a5568 !important; }
                .ai-report-section p { color: #4a5568 !important; }
                .ai-report-section li { color: #4a5568 !important; }
                .ai-report-section strong { color: #2d3748 !important; }
                .ai-report-section div { color: #4a5568 !important; }
                .ai-report-section span { color: #4a5568 !important; }
                .ai-report-section table { color: #4a5568 !important; }
                .ai-report-section td { color: #4a5568 !important; }
                .ai-report-section th { color: #2d3748 !important; }
                .ai-report-section ul { color: #4a5568 !important; }
                .ai-report-section ol { color: #4a5568 !important; }
                .ai-report-section h1, .ai-report-section h2, .ai-report-section h3, 
                .ai-report-section h4, .ai-report-section h5, .ai-report-section h6 { 
                    color: #2d3748 !important; 
                }
                .ai-report-content { color: #4a5568 !important; }
                .ai-report-content p { color: #4a5568 !important; }
                .ai-report-content div { color: #4a5568 !important; }
                .ai-report-content span { color: #4a5568 !important; }
                .ai-report-content strong { color: #2d3748 !important; }
                .ai-report-content em { color: #4a5568 !important; }
                .ai-report-content ul { color: #4a5568 !important; }
                .ai-report-content ol { color: #4a5568 !important; }
                .ai-report-content li { color: #4a5568 !important; }
                .ai-report-content table { color: #4a5568 !important; }
                .ai-report-content td { color: #4a5568 !important; }
                .ai-report-content th { color: #2d3748 !important; }
            </style>
        `;
        
        // 获取完整的HTML内容
        const fullContent = reportContent.innerHTML;
        
        console.log('🔍 导出内容检查:', {
            contentLength: fullContent.length,
            hasAIContent: fullContent.includes('AI智能分析报告'),
            hasDataSection: fullContent.includes('数据处理结果'),
            hasAISection: fullContent.includes('AI智能分析报告')
        });
        
        return additionalStyles + fullContent;
    }

    /**
     * 构建导出用的HTML内容
     */
    buildExportHTML(reportHTML) {
        const currentDate = new Date().toLocaleString('zh-CN');
        
        console.log('🔍 构建导出HTML:', {
            reportHTML: reportHTML.substring(0, 200) + '...',
            hasAIContent: reportHTML.includes('AI智能分析报告')
        });
        
        return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>AI学情分析报告</title>
            <style>
                body {
                    font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
                    line-height: 1.6;
                    margin: 40px;
                    color: #333;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                .report-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 10px;
                }
                .report-meta {
                    color: #4a5568;
                    font-size: 14px;
                    font-weight: 500;
                }
                .report-section {
                    margin-bottom: 25px;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #4a5568;
                    margin-bottom: 15px;
                    padding-left: 10px;
                    border-left: 4px solid #667eea;
                }
                .data-cards {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .data-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #4299e1;
                    min-width: 150px;
                    text-align: center;
                }
                .data-number {
                    font-size: 20px;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 5px;
                }
                .data-label {
                    color: #4a5568;
                    font-size: 12px;
                    font-weight: 500;
                }
                .ai-content {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                    line-height: 1.8;
                }
                .report-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    color: #4a5568;
                    font-size: 12px;
                    font-weight: 500;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #2d3748;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                p {
                    margin-bottom: 10px;
                    color: #4a5568;
                }
                ul, ol {
                    margin-bottom: 15px;
                    padding-left: 20px;
                }
                li {
                    margin-bottom: 5px;
                    color: #4a5568;
                }
                strong {
                    color: #2d3748;
                }
                .highlight {
                    background-color: #fff3cd;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                /* 确保所有AI输出内容都有正确的样式 */
                .ai-report-content * {
                    color: #4a5568 !important;
                }
                .ai-report-content h1, .ai-report-content h2, .ai-report-content h3,
                .ai-report-content h4, .ai-report-content h5, .ai-report-content h6 {
                    color: #2d3748 !important;
                }
                .ai-report-content strong {
                    color: #2d3748 !important;
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">AI学情分析报告</div>
                <div class="report-meta">生成时间: ${currentDate}</div>
            </div>
            
            ${reportHTML}
            
            <div class="report-footer">
                <p>本报告由AI智能分析生成，基于真实课堂数据</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * 导出为HTML格式
     */
    exportAsHTML(htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const fileName = `AI学情分析报告_${new Date().toISOString().slice(0, 10)}.html`;
        
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, fileName);
            this.showNotification('HTML报告导出成功！', 'success');
        } else {
            this.downloadFile(blob, fileName);
        }
    }

    /**
     * 下载文件
     */
    downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showNotification('报告导出成功！', 'success');
    }

    /**
     * 生成报告HTML
     */
    generateReportHTML(integratedData, summary) {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = this.getSelectedModel();
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #718096; margin-bottom: 0.5rem;">生成时间: ${currentDate}</p>
                <p style="color: #718096; margin-bottom: 0.5rem;">使用模型: ${selectedModel}</p>
                <p style="color: #718096; margin-bottom: 2rem;">数据匹配率: ${summary.matchRate}%</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-database" style="color: #667eea;"></i>
                    数据处理结果
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #4299e1;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.totalRecords}</div>
                        <div style="color: #718096;">总记录数</div>
                    </div>
                    <div style="background: #f0fff4; padding: 1rem; border-radius: 8px; border-left: 4px solid #48bb78;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.matchedRecords}</div>
                        <div style="color: #718096;">成功匹配</div>
                    </div>
                    <div style="background: #fff5f5; padding: 1rem; border-radius: 8px; border-left: 4px solid #f56565;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.unmatchedRecords}</div>
                        <div style="color: #718096;">未匹配记录</div>
                    </div>
                    <div style="background: #faf5ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #9f7aea;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.activeStudents}</div>
                        <div style="color: #718096;">活跃学生</div>
                    </div>
                </div>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-users" style="color: #667eea;"></i>
                    班级整体表现
                </h4>
                <p style="line-height: 1.7; margin-bottom: 1rem;">
                    根据数据分析，本班共有 <strong>${summary.activeStudents}</strong> 名学生参与课堂活动，
                    总记录数 <strong>${summary.totalRecords}</strong> 条，数据匹配率 <strong>${summary.matchRate}%</strong>。
                    涉及学科：${summary.subjects.join('、')}。
                </p>
                <p style="line-height: 1.7; margin-bottom: 1.5rem;">
                    学生总积分：<strong>${summary.totalPoints}</strong> 分，平均积分：<strong>${summary.averagePoints}</strong> 分。
                </p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-user-friends" style="color: #667eea;"></i>
                    个别学生表现
                </h4>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="color: #718096; margin-bottom: 0.5rem;">数据整合成功，已为每个学生生成个性化评价：</p>
                    <ul style="color: #4a5568; line-height: 1.6;">
                        <li>✅ 学生姓名与座号匹配完成</li>
                        <li>✅ 课堂活动记录已整合</li>
                        <li>✅ 个人表现数据已提取</li>
                        <li>✅ 准备生成个性化评价</li>
                    </ul>
                </div>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-lightbulb" style="color: #667eea;"></i>
                    下一步建议
                </h4>
                <ul style="line-height: 1.7; margin-bottom: 1.5rem; padding-left: 1.5rem;">
                    <li>数据整合成功，可以调用AI生成详细的学情分析报告</li>
                    <li>建议为每个学生生成个性化的表现评价</li>
                    <li>可以基于数据生成班级整体表现趋势分析</li>
                </ul>
            </div>
            
            <div class="ai-report-footer" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 0.9rem; text-align: center;">
                    <i class="fas fa-robot mr-1"></i>
                    数据预处理完成，准备进行AI分析
                </p>
            </div>
        `;
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

// 全局导出函数
window.exportAIReport = function() {
    if (window.aiAnalysisManager) {
        window.aiAnalysisManager.exportAIReport();
    } else {
        console.error('AI分析管理器未初始化');
    }
};
