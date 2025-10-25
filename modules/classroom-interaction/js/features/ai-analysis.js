/**
 * AI学情分析功能模块 - 重构版本
 * 使用模块化组件管理AI分析界面的交互逻辑和数据处理
 */

// 导入模块化组件
// 注意：这些模块需要在HTML中单独引入
// <script src="js/features/ai-analysis/FileUploadManager.js"></script>
// <script src="js/features/ai-analysis/APIConfigManager.js"></script>
// <script src="js/features/ai-analysis/DataProcessor.js"></script>
// <script src="js/features/ai-analysis/AIAnalyzer.js"></script>
// <script src="js/features/ai-analysis/ReportGenerator.js"></script>
// <script src="js/features/ai-analysis/ExportManager.js"></script>

class AIAnalysisManager {
    constructor() {
        this.isGenerating = false;
        this.init();
    }

    /**
     * 初始化AI分析功能
     */
    init() {
        // 初始化各个模块
        this.fileUploadManager = new FileUploadManager();
        this.apiConfigManager = new APIConfigManager();
        this.dataProcessor = new DataProcessor();
        this.aiAnalyzer = new AIAnalyzer(this.apiConfigManager);
        this.reportGenerator = new ReportGenerator(this.apiConfigManager);
        this.exportManager = new ExportManager();
        
        // 绑定事件
        this.bindEvents();
        this.setupGenerateButton();
        
        // 设置全局导出函数
        this.setupGlobalExportFunctions();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 生成报告按钮
        document.getElementById('generate-ai-report-btn').addEventListener('click', () => {
            this.generateAIReport();
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
     * 设置全局导出函数
     */
    setupGlobalExportFunctions() {
        console.log('🔧 设置全局导出函数');
        
        // 全局PDF导出函数 - 显示导出选项菜单
        window.exportAIReport = () => {
            console.log('📤 调用导出函数');
            if (window.exportManager) {
                console.log('✅ 导出管理器已初始化，显示选项菜单');
                window.exportManager.showExportOptions();
            } else {
                console.error('❌ 导出管理器未初始化');
            }
        };

        // 全局Word导出函数
        window.exportAIWord = () => {
            const reportOutput = document.getElementById('ai-report-output');
            if (reportOutput) {
                this.exportManager.exportAsWord(reportOutput);
            } else {
                if (window.notificationManager) {
                    window.notificationManager.error('未找到报告内容');
                }
            }
        };

        // 全局文本导出函数
        window.exportAIText = () => {
            const reportOutput = document.getElementById('ai-report-output');
            if (reportOutput) {
                this.exportManager.exportAsText(reportOutput);
            } else {
                if (window.notificationManager) {
                    window.notificationManager.error('未找到报告内容');
                }
            }
        };
    }

    /**
     * 生成AI报告
     */
    async generateAIReport() {
        if (this.isGenerating) return;

        // 验证必要文件
        if (!this.fileUploadManager.hasRequiredFiles()) {
            if (window.notificationManager) {
                window.notificationManager.error('请先上传课堂活动文件和学生名单文件');
            }
            return;
        }

        // 验证API配置
        const configValidation = this.apiConfigManager.validateConfig();
        if (!configValidation.valid) {
            if (window.notificationManager) {
                window.notificationManager.error(configValidation.message);
            }
            return;
        }

        this.isGenerating = true;
        this.reportGenerator.updateGenerateButton(true);
        this.reportGenerator.showLoadingState();

        try {
            // 真实的数据处理流程
            await this.processExcelFiles();
            
            if (window.notificationManager) {
                window.notificationManager.success('AI学情分析报告生成成功！');
            }
        } catch (error) {
            console.error('AI分析失败:', error);
            if (window.notificationManager) {
                window.notificationManager.error(`AI分析失败: ${error.message}`);
            }
        } finally {
            this.isGenerating = false;
            this.reportGenerator.updateGenerateButton(false);
        }
    }

    /**
     * 处理Excel文件
     */
    async processExcelFiles() {
        this.reportGenerator.updateLoadingMessage('正在读取Excel文件...');
        
        // 获取上传的文件
        const uploadedFiles = this.fileUploadManager.getUploadedFiles();
        
        // 处理Excel文件
        const integratedData = await this.dataProcessor.processExcelFiles(
            uploadedFiles.activity, 
            uploadedFiles.roster
        );
        
        this.reportGenerator.updateLoadingMessage('正在整合数据...');
        
        // 生成数据摘要
        const summary = this.dataProcessor.generateDataSummary(integratedData);
        
        // 调试：输出处理结果到控制台
        this.dataProcessor.debugDataProcessing(integratedData, summary);
        
        this.reportGenerator.updateLoadingMessage('正在生成AI分析报告...');
        
        // 生成AI分析报告
        const report = await this.generateRealAIReport(integratedData, summary);
        this.reportGenerator.displayReport(report);
    }

    /**
     * 生成真实的AI分析报告
     */
    async generateRealAIReport(integratedData, summary) {
        // 生成数据摘要
        console.log('📊 开始生成AI分析报告...');
        
        // 检查学生数量，决定是否需要分批处理
        const studentCount = integratedData.integratedRecords.length;
        const shouldUseBatchProcessing = studentCount > 20; // 超过20个学生时使用分批处理
        
        if (shouldUseBatchProcessing) {
            console.log(`📊 学生数量较多(${studentCount}名)，使用分批分析模式`);
            return await this.aiAnalyzer.generateBatchAIReport(integratedData, summary);
        } else {
            // 调用AI分析
            this.reportGenerator.updateLoadingMessage('正在调用AI进行学情分析...');
            const aiReport = await this.aiAnalyzer.generateAIReport(integratedData, summary);
            
            // 生成最终报告HTML
            const report = this.reportGenerator.generateFinalReportHTML(integratedData, summary, aiReport);
            
            return report;
        }
    }

}

// 创建全局实例
window.aiAnalysisManager = new AIAnalysisManager();

// 全局PDF导出函数（保持向后兼容）
window.exportAIReport = function() {
    if (window.aiAnalysisManager) {
        window.aiAnalysisManager.exportManager.exportAIReport();
    } else {
        console.error('AI分析管理器未初始化');
    }
};

// 全局Word导出函数
window.exportAIWord = function() {
    if (window.aiAnalysisManager) {
        const reportOutput = document.getElementById('ai-report-output');
        if (reportOutput) {
            window.aiAnalysisManager.exportManager.exportAsWord(reportOutput);
        } else {
            console.error('未找到报告内容');
        }
    } else {
        console.error('AI分析管理器未初始化');
    }
};

// 全局文本导出函数
window.exportAIText = function() {
    if (window.aiAnalysisManager) {
        const reportOutput = document.getElementById('ai-report-output');
        if (reportOutput) {
            window.aiAnalysisManager.exportManager.exportAsText(reportOutput);
        } else {
            console.error('未找到报告内容');
        }
    } else {
        console.error('AI分析管理器未初始化');
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalysisManager;
} else {
    window.AIAnalysisManager = AIAnalysisManager;
}