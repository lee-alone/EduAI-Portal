/**
 * 课堂互动平台主入口文件
 * 整合所有模块，提供统一的初始化和管理
 */

// 注意：由于改为传统script标签方式，模块导入将在HTML中处理

/**
 * 主应用类
 */
class ClassroomInteractionApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // 初始化模块
            await this.initializeModules();
            
            // 绑定全局事件
            this.bindGlobalEvents();
            
            // 加载保存的状态
            this.loadAppState();
            
            this.isInitialized = true;
            
        } catch (error) {
            // 应用初始化失败
            this.showErrorMessage('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 初始化所有模块
     */
    async initializeModules() {
        try {
            // 检查类是否已定义
            if (typeof ClassroomManager === 'undefined') {
                throw new Error('ClassroomManager 未定义');
            }
            if (typeof StudentManager === 'undefined') {
                throw new Error('StudentManager 未定义');
            }
            if (typeof PointsManager === 'undefined') {
                throw new Error('PointsManager 未定义');
            }
            
            // 初始化核心模块
            this.modules.classroom = new ClassroomManager();
            this.modules.students = new StudentManager();
            this.modules.points = new PointsManager();
            
            // 初始化功能模块
            this.modules.layout = new LayoutManager();
            this.modules.rollcall = new RollCallManager();
            this.modules.scoring = new ScoringManager();
            
            // 初始化工具模块
            this.modules.storage = new StorageManager();
            this.modules.helpers = new HelperManager();
            this.modules.componentLoader = new ComponentLoader();
            
            // 设置全局引用
            window.classroomManager = this.modules.classroom;
            window.studentManager = this.modules.students;
            window.pointsManager = this.modules.points;
            window.layoutManager = this.modules.layout;
            window.rollCallManager = this.modules.rollcall;
            window.scoringManager = this.modules.scoring;
            window.storageManager = this.modules.storage;
            window.helperManager = this.modules.helpers;
            window.componentLoader = this.modules.componentLoader;
        } catch (error) {
            // 模块初始化失败
            throw error;
        }
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // Tab切换
        this.bindTabSwitching();
        
        // 文件上传
        this.bindFileUpload();
        
        // AI报告生成
        this.bindAIReportGeneration();
        
        // 数据导出
        this.bindDataExport();
        
        // 页面卸载时保存状态
        window.addEventListener('beforeunload', () => {
            this.saveAppState();
        });
    }

    /**
     * 绑定Tab切换事件
     */
    bindTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // 更新按钮状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 更新内容显示
                tabContents.forEach(content => {
                    if (content.id === targetTab) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
    }

    /**
     * 绑定文件上传事件
     */
    bindFileUpload() {
        const activityExcelUpload = document.getElementById('activity-excel-upload');
        const rosterExcelUpload = document.getElementById('roster-excel-upload');

        if (activityExcelUpload) {
            activityExcelUpload.addEventListener('change', (event) => {
                this.handleFileUpload(event.target.files[0], 'activity');
            });
        }

        if (rosterExcelUpload) {
            rosterExcelUpload.addEventListener('change', (event) => {
                this.handleFileUpload(event.target.files[0], 'roster');
            });
        }
    }

    /**
     * 绑定AI报告生成事件
     */
    bindAIReportGeneration() {
        const generateAiReportBtn = document.getElementById('generate-ai-report-btn');
        if (generateAiReportBtn) {
            generateAiReportBtn.addEventListener('click', () => {
                this.generateAIReport();
            });
        }
    }

    /**
     * 绑定数据导出事件
     * 注意：导出按钮事件已在helpers.js中绑定，这里不需要重复绑定
     */
    bindDataExport() {
        // 导出按钮事件已在helpers.js中统一处理，避免重复绑定
    }

    /**
     * 处理文件上传
     */
    handleFileUpload(file, type) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (type === 'activity') {
                    this.handleActivityData(json);
                } else if (type === 'roster') {
                    this.handleRosterData(json);
                }
            } catch (error) {
                // 文件解析失败
                this.showErrorMessage('文件解析失败，请检查文件格式');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    /**
     * 处理课堂活动数据
     */
    handleActivityData(data) {
        this.showMessage('课堂活动Excel上传成功！', 'success');
        // 这里可以添加更多的数据处理逻辑
    }

    /**
     * 处理学生名单数据
     */
    handleRosterData(data) {
        const roster = this.parseRoster(data);
        this.modules.students.setStudentRoster(roster);
        this.showMessage('学生名单Excel上传成功！', 'success');
    }

    /**
     * 解析学生名单
     */
    parseRoster(json) {
        const roster = {};
        // 假设名单Excel有'座号'和'姓名'列
        json.forEach(row => {
            if (row['座号'] && row['姓名']) {
                roster[row['座号'].toString()] = row['姓名'];
            }
        });
        return roster;
    }

    /**
     * 生成AI报告
     */
    async generateAIReport() {
        try {
            const aiModelInput = document.getElementById('ai-model-input');
            const customPromptTextarea = document.getElementById('custom-prompt-textarea');
            const aiReportOutput = document.getElementById('ai-report-output');
            
            const model = aiModelInput?.value || 'deepseek-chat';
            const customPrompt = customPromptTextarea?.value || '';
            
            if (!customPrompt.trim()) {
                this.showMessage('请填写自定义AI提示词', 'warning');
                return;
            }
            
            // 显示加载状态
            if (aiReportOutput) {
                aiReportOutput.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>正在生成AI报告...</div>';
            }
            
            // 获取积分数据
            const pointsData = this.modules.points.getAllPointsData();
            const pointsLog = this.modules.points.pointsLog;
            
            // 构建提示词
            const prompt = this.buildAIPrompt(customPrompt, pointsData, pointsLog);
            
            // 调用AI API
            const report = await this.callAIAPI(model, prompt);
            
            // 显示结果
            if (aiReportOutput) {
                aiReportOutput.innerHTML = `
                    <div class="bg-white p-4 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-3">AI学情报告</h3>
                        <div class="prose max-w-none">${report}</div>
                    </div>
                `;
            }
            
            this.showMessage('AI报告生成成功！', 'success');
            
        } catch (error) {
            // 生成AI报告失败
            this.showErrorMessage('AI报告生成失败，请检查网络连接和API配置');
        }
    }

    /**
     * 构建AI提示词
     */
    buildAIPrompt(customPrompt, pointsData, pointsLog) {
        // 使用统一的PromptManager
        if (!this.promptManager) {
            this.promptManager = new PromptManager();
        }
        
        return this.promptManager.getCustomAnalysisPrompt(customPrompt, pointsData, pointsLog);
    }

    /**
     * 调用AI API
     */
    async callAIAPI(model, prompt) {
        const apiKey = this.getSharedApiKey();
        const apiConfig = this.getApiConfig(model);
        
        const payload = {
            model: model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        };
        
        const response = await fetch(apiConfig.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * 获取API密钥
     */
    getSharedApiKey() {
        const keyParts = ["sk-0560c9a8", "49694436a71c", "1ef4c053505a"];
        return keyParts.join('');
    }

    /**
     * 获取API配置
     */
    getApiConfig(model) {
        const API_CONFIG = {
            deepseek: { url: "https://api.deepseek.com/v1/chat/completions", models: ["deepseek-chat", "deepseek-reasoner"] },
            glm: { url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", models: ["glm-4"] },
            qwen: { url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", models: ["qwen-turbo"] }
        };
        
        return Object.values(API_CONFIG).find(config => config.models.includes(model)) || API_CONFIG.deepseek;
    }

    /**
     * 保存应用状态
     */
    saveAppState() {
        try {
            const state = {
                classroom: {
                    // 不保存学科信息，每次刷新后清空
                    classSize: this.modules.classroom?.classSize
                },
                students: {
                    studentRoster: this.modules.students?.studentRoster
                    // 注意：selectedStudents 和 calledStudents 不应该被持久化，每次打开网页应该从空白状态开始
                },
                points: {
                    pointsData: Object.fromEntries(this.modules.points?.pointsData || new Map()),
                    pointsLog: this.modules.points?.pointsLog || []
                },
                timestamp: Date.now()
            };
            
            this.modules.storage?.save('appState', state);
        } catch (error) {
            // 保存应用状态失败
        }
    }

    /**
     * 加载应用状态
     */
    loadAppState() {
        try {
            const state = this.modules.storage?.load('appState');
            if (!state) return;
            
            // 恢复课堂状态
            if (state.classroom) {
                // 不恢复学科信息，每次刷新后从空白开始
                this.modules.classroom.currentSubject = '';
                // 不要覆盖classroom.js中已经加载的classSize
                // this.modules.classroom.classSize = state.classroom.classSize || 55;
            }
            
            // 恢复学生状态
            if (state.students) {
                this.modules.students.studentRoster = state.students.studentRoster || {};
                // 注意：selectedStudents 和 calledStudents 不应该被恢复，每次打开网页应该从空白状态开始
                this.modules.students.selectedStudents.clear();
                this.modules.students.calledStudents.clear();
            }
            
            // 恢复积分状态
            if (state.points) {
                this.modules.points.pointsData = new Map(Object.entries(state.points.pointsData || {}));
                this.modules.points.pointsLog = state.points.pointsLog || [];
            }
            
            // 重新渲染界面
            this.refreshUI();
            
        } catch (error) {
            // 加载应用状态失败
        }
    }

    /**
     * 刷新UI
     */
    refreshUI() {
        // 刷新学生选择界面
        this.modules.students?.renderGroupStudentSelection();
        this.modules.students?.renderCalledStudents();
        
        // 刷新积分界面
        this.modules.points?.renderTopStudents();
        this.modules.points?.renderPointsDistributionChart();
        this.modules.points?.renderPointsLog();
    }

    /**
     * 显示消息
     */
    showMessage(message, type = "info", duration = 4000) {
        this.modules.helpers?.showMessage(message, type, duration);
    }

    /**
     * 显示错误消息
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error', 6000);
    }

    /**
     * 获取模块
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * 获取所有模块
     */
    getAllModules() {
        return this.modules;
    }
}

// 创建应用实例
const app = new ClassroomInteractionApp();