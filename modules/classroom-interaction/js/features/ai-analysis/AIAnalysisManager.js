/**
 * AI学情分析功能模块 - 重构版本
 * 使用模块化组件管理AI分析界面的交互逻辑和数据处理
 */

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
        // 全局导出函数
        window.exportAIReport = () => {
            this.exportManager.exportAIReport();
        };

        // 全局简单导出函数
        window.exportAISimple = () => {
            this.exportManager.exportAsWordSimple();
        };
    }

    /**
     * 生成AI报告
     */
    async generateAIReport() {
        if (this.isGenerating) return;

        // 验证必要文件
        if (!this.fileUploadManager.hasRequiredFiles()) {
            window.notificationManager.error('请先上传课堂活动文件和学生名单文件');
            return;
        }

        // 验证API配置
        const configValidation = this.apiConfigManager.validateConfig();
        if (!configValidation.valid) {
            window.notificationManager.error(configValidation.message);
            return;
        }

        this.isGenerating = true;
        this.reportGenerator.updateGenerateButton(true);
        this.reportGenerator.showLoadingState();

        try {
            // 真实的数据处理流程
            await this.processExcelFiles();
            
            window.notificationManager.success('AI学情分析报告生成成功！');
        } catch (error) {
            console.error('AI分析失败:', error);
            window.notificationManager.error(`AI分析失败: ${error.message}`);
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
     * 生成真实的AI分析报告（优化版）
     */
    async generateRealAIReport(integratedData, summary) {
        // 生成数据摘要
        console.log('📊 开始生成AI分析报告...');
        
        // 检查学生数量，决定是否需要分批处理
        const studentCount = integratedData.integratedRecords.length;
        const shouldUseBatchProcessing = studentCount > 30; // 提高阈值到30个学生
        
        if (shouldUseBatchProcessing) {
            console.log(`📊 学生数量较多(${studentCount}名)，使用优化的分批分析模式`);
            this.reportGenerator.updateLoadingMessage('正在使用优化的分批分析模式...');
            return await this.aiAnalyzer.generateOptimizedBatchAIReport(integratedData, summary);
        } else {
            // 使用优化的单次分析模式
            console.log(`📊 学生数量适中(${studentCount}名)，使用优化的单次分析模式`);
            this.reportGenerator.updateLoadingMessage('正在使用优化的单次分析模式...');
            const aiReport = await this.aiAnalyzer.generateAIReport(integratedData, summary);
            
            // 生成最终报告HTML
            const report = this.reportGenerator.generateFinalReportHTML(integratedData, summary, aiReport);
            
            return report;
        }
    }

}

// 创建全局实例
window.aiAnalysisManager = new AIAnalysisManager();

// 全局导出函数（保持向后兼容）
window.exportAIReport = function() {
    if (window.aiAnalysisManager) {
        window.aiAnalysisManager.exportManager.exportAIReport();
    } else {
        console.error('AI分析管理器未初始化');
    }
};

// 全局简单导出函数（保持向后兼容）
window.exportAISimple = function() {
    if (window.aiAnalysisManager) {
        window.aiAnalysisManager.exportManager.exportAsWordSimple();
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
