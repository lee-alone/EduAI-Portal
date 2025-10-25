/**
 * 导出管理模块 - 重构版本
 * 专注于文本导出，最小化文件体积
 * 支持PDF和Word格式，避免图片导出
 */

class ExportManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化导出功能
     */
    init() {
        this.checkDependencies();
    }

    /**
     * 检查依赖库加载状态
     */
    checkDependencies() {
        return {
            jsPDF: typeof window.jspdf !== 'undefined' || typeof jsPDF !== 'undefined',
            fileSaver: typeof saveAs !== 'undefined'
        };
    }

    /**
     * 主导出方法 - 智能选择最佳导出方式
     */
    async exportAIReport() {
        try {
            const reportOutput = document.getElementById('ai-report-output');
            if (!reportOutput) {
                if (window.notificationManager) {
                    window.notificationManager.error('未找到报告内容');
                }
                return;
            }

            // 优先使用Word文档导出（可编辑，保持样式）
            await this.exportAsWordDocument(reportOutput);
            
        } catch (error) {
            console.error('导出失败:', error);
            if (window.notificationManager) {
                window.notificationManager.error('导出失败，请重试');
            }
        }
    }

    /**
     * 显示导出选项菜单
     */
    showExportOptions() {
        console.log('🔍 显示导出选项菜单');
        
        const reportOutput = document.getElementById('ai-report-output');
        if (!reportOutput) {
            console.error('❌ 未找到报告内容');
            if (window.notificationManager) {
                window.notificationManager.error('未找到报告内容');
            }
            return;
        }

        console.log('✅ 找到报告内容，创建导出选项菜单');

        // 创建导出选项菜单
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'export-options-menu';
        optionsMenu.innerHTML = `
            <div class="export-options-overlay" onclick="this.parentElement.remove()"></div>
            <div class="export-options-content">
                <h3>选择导出格式</h3>
                <div class="export-options">
                    <button class="export-option-btn">
                        <i class="fas fa-file-word"></i>
                        <div>
                            <strong>Word文档</strong>
                            <small>可编辑的文档格式，保持样式</small>
                        </div>
                    </button>
                    <button class="export-option-btn">
                        <i class="fas fa-file-alt"></i>
                        <div>
                            <strong>文本PDF</strong>
                            <small>纯文本格式，文件更小</small>
                        </div>
                    </button>
                    <button class="export-option-btn">
                        <i class="fas fa-file-text"></i>
                        <div>
                            <strong>文本文件</strong>
                            <small>纯文本格式</small>
                        </div>
                    </button>
                </div>
                <button class="export-cancel-btn" onclick="this.closest('.export-options-menu').remove();">取消</button>
            </div>
        `;

        // 添加样式
        this.addExportOptionsStyles();

        // 添加导出函数到按钮
        const buttons = optionsMenu.querySelectorAll('.export-option-btn');
        buttons.forEach((button, index) => {
            const functions = [
                () => this.exportAsWordDocument(reportOutput),
                () => this.exportAsTextPDF(reportOutput),
                () => this.exportAsText(reportOutput)
            ];
            
            button.addEventListener('click', () => {
                functions[index]();
                optionsMenu.remove();
            });
        });

        // 添加到页面
        document.body.appendChild(optionsMenu);
        
        console.log('✅ 导出选项菜单已添加到页面');
    }

    /**
     * 添加导出选项样式
     */
    addExportOptionsStyles() {
        if (document.getElementById('export-options-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'export-options-styles';
        style.textContent = `
            .export-options-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .export-options-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
            }
            
            .export-options-content {
                position: relative;
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .export-options-content h3 {
                margin: 0 0 1.5rem 0;
                color: #2d3748;
                text-align: center;
            }
            
            .export-options {
                display: grid;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .export-option-btn {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
            }
            
            .export-option-btn:hover {
                border-color: #667eea;
                background: #f7fafc;
                transform: translateY(-2px);
            }
            
            .export-option-btn i {
                font-size: 1.5rem;
                color: #667eea;
            }
            
            .export-option-btn strong {
                display: block;
                color: #2d3748;
                margin-bottom: 0.25rem;
            }
            
            .export-option-btn small {
                color: #718096;
                font-size: 0.875rem;
            }
            
            .export-cancel-btn {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: #f7fafc;
                color: #4a5568;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .export-cancel-btn:hover {
                background: #e2e8f0;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 导出为Word文档（使用html-docx库）
     */
    async exportAsWordDocument(reportOutput) {
        try {
            // 显示加载提示
            if (window.notificationManager) {
                window.notificationManager.info('正在生成Word文档，请稍候...');
            }
            
            console.log('🔄 开始生成Word文档...');
            
            // 检查依赖库是否已加载
            if (typeof htmlDocx === 'undefined') {
                throw new Error('html-docx库未加载，请检查CDN连接');
            }
            
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip库未加载，请检查CDN连接');
            }
            
            console.log('✅ 依赖库检查通过');
            
            // 获取报告HTML内容
            const reportHTML = this.generateWordHTML(reportOutput);
            console.log('✅ HTML内容生成完成，长度:', reportHTML.length);
            
            // 使用html-docx转换
            const docx = htmlDocx.asBlob(reportHTML, {
                orientation: 'portrait',
                margins: {
                    top: 720,
                    right: 720,
                    bottom: 720,
                    left: 720
                }
            });
            
            console.log('✅ Word文档生成完成');
            
            // 保存文件
            const fileName = this.generateFileName('docx');
            this.downloadFile(docx, fileName);
            
            console.log('✅ Word文档保存成功:', fileName);
            
            if (window.notificationManager) {
                window.notificationManager.success('Word文档导出成功！');
            }
            
        } catch (error) {
            console.error('❌ Word文档导出失败:', error);
            if (window.notificationManager) {
                window.notificationManager.warning('Word文档导出失败，将使用文本格式导出');
            }
            // 自动降级到文本格式
            console.log('🔄 自动降级到文本格式导出...');
            this.exportAsText(reportOutput);
        }
    }
    
    
    /**
     * 生成用于Word文档的HTML内容
     */
    generateWordHTML(reportOutput) {
        // 获取报告内容
        const reportHTML = reportOutput.innerHTML;
        
        // 清理HTML内容，移除不需要的元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reportHTML;
        
        // 移除不需要的元素
        const elementsToRemove = tempDiv.querySelectorAll('script, style, button, .ai-export-btn');
        elementsToRemove.forEach(el => el.remove());
        
        // 获取清理后的HTML
        const cleanHTML = tempDiv.innerHTML;
        
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>AI学情分析报告</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        
        .ai-report-header {
            margin-bottom: 30px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
        }
        
        .ai-report-header h3 {
            color: #2d3748;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .ai-report-section {
            margin-bottom: 30px;
        }
        
        .ai-report-section h4 {
            color: #4a5568;
            font-size: 18px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
            padding-left: 10px;
        }
        
        .student-evaluation {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }
        
        .student-name {
            font-weight: bold;
            color: #2d3748;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .evaluation-content {
            line-height: 1.7;
            color: #4a5568;
        }
        
        .data-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            background: #f7fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
            min-width: 150px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
        }
        
        .stat-label {
            color: #718096;
            font-size: 14px;
        }
    </style>
</head>
<body>
    ${cleanHTML}
</body>
</html>`;
    }
    
    /**
     * 生成用于打印的HTML内容
     */
    generatePrintHTML(reportOutput) {
        // 获取当前页面的所有样式
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');
        
        // 获取报告内容
        const reportHTML = reportOutput.innerHTML;
        
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI学情分析报告</title>
    <style>
        /* 基础样式 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
        }
        
        /* 打印样式 */
        @media print {
            body {
                margin: 0;
                padding: 15mm;
            }
            
            .ai-report-header {
                margin-bottom: 20px;
                border-bottom: 2px solid #667eea;
                padding-bottom: 15px;
            }
            
            .ai-report-section {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            
            .ai-report-section h4 {
                color: #667eea;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .student-evaluation {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                page-break-inside: avoid;
            }
            
            .student-name {
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 10px;
            }
            
            .evaluation-content {
                line-height: 1.7;
            }
        }
        
        /* 继承原有样式 */
        ${styles}
        
        /* 确保在打印时保持样式 */
        .ai-report-header h3 {
            color: #2d3748 !important;
            margin-bottom: 1rem !important;
        }
        
        .ai-report-section h4 {
            color: #4a5568 !important;
            margin-bottom: 1rem !important;
        }
        
        .student-evaluation {
            background: #f8f9fa !important;
            border-left: 4px solid #667eea !important;
        }
        
        .student-name {
            color: #2d3748 !important;
            font-weight: bold !important;
        }
    </style>
</head>
<body>
    ${reportHTML}
</body>
</html>`;
    }

    /**
     * 导出为文本PDF（纯文本，最小文件，支持中文）
     */
    async exportAsTextPDF(reportOutput, isFallback = false) {
        try {
            const { jsPDF } = window.jspdf || window;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            console.log('🔄 开始生成文本PDF...');
            
            // 添加标题
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('AI学情分析报告', 105, 20, { align: 'center' });
            
            // 添加时间
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 105, 30, { align: 'center' });
            
            // 提取并处理内容，保留AI分析内容
            const textContent = this.extractCleanText(reportOutput);
            console.log('📝 提取的文本内容长度:', textContent.length);
            
            // 处理文本内容，确保正确的格式
            const processedContent = this.processTextForPDF(textContent);
            console.log('📝 处理后的文本内容长度:', processedContent.length);
            
            // 分段处理内容，确保AI分析内容完整保存
            const sections = this.splitContentIntoSections(processedContent);
            console.log('📝 分割后的节数:', sections.length);
            
            let yPosition = 50;
            const pageHeight = 280;
            const lineHeight = 6;
            
            for (const section of sections) {
                console.log('📝 处理节:', section.title);
                
                // 添加节标题
                if (section.title) {
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(section.title, 15, yPosition);
                    yPosition += 10;
                }
                
                // 添加节内容
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                
                // 处理文本内容，确保正确的换行
                const cleanContent = this.cleanTextForPDF(section.content);
                const lines = pdf.splitTextToSize(cleanContent, 180);
                
                console.log('📝 节内容行数:', lines.length);
                
                for (const line of lines) {
                    if (yPosition > pageHeight) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    pdf.text(line, 15, yPosition);
                    yPosition += lineHeight;
                }
                
                yPosition += 5; // 节之间添加间距
            }
            
            // 保存文件
            const fileName = this.generateFileName('pdf');
            pdf.save(fileName);
            
            console.log('✅ 文本PDF生成成功:', fileName);
            
            // 只有在非降级调用时才显示成功提示
            if (window.notificationManager && !isFallback) {
                window.notificationManager.success('PDF报告导出成功！');
            }
            
        } catch (error) {
            console.error('❌ 文本PDF导出失败:', error);
            if (window.notificationManager && !isFallback) {
                window.notificationManager.warning('PDF导出失败，将导出为文本格式');
            }
            this.exportAsText(reportOutput);
        }
    }
    
    /**
     * 清理文本内容，确保正确的格式
     */
    cleanTextForPDF(text) {
        if (!text) return '';
        
        // 清理文本内容
        let cleanText = text
            .replace(/\r\n/g, '\n')  // 统一换行符
            .replace(/\r/g, '\n')    // 统一换行符
            .replace(/\n{3,}/g, '\n\n')  // 限制连续换行
            .replace(/[^\x00-\x7F\u4e00-\u9fff\s]/g, '')  // 移除特殊字符，保留中文和基本ASCII
            .trim();
        
        // 确保段落之间有适当的间距
        cleanText = cleanText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
        
        return cleanText;
    }
    
    /**
     * 将内容分割为不同的节
     */
    splitContentIntoSections(content) {
        const sections = [];
        
        // 查找AI智能分析报告部分
        const aiAnalysisMatch = content.match(/=== AI智能分析报告 ===\n\n([\s\S]*?)(?=\n\n|$)/);
        if (aiAnalysisMatch) {
            sections.push({
                title: 'AI智能分析报告',
                content: aiAnalysisMatch[1].trim()
            });
        }
        
        // 查找其他部分
        const otherContent = content.replace(/=== AI智能分析报告 ===\n\n[\s\S]*?(?=\n\n|$)/, '').trim();
        if (otherContent) {
            sections.push({
                title: '报告基本信息',
                content: otherContent
            });
        }
        
        return sections;
    }

    /**
     * 导出为Word格式（纯文本，最小文件）
     */
    exportAsWord(reportOutput) {
        try {
            // 提取清洁的文本内容
            const textContent = this.extractCleanText(reportOutput);
            
            // 构建Word文档内容
            const wordContent = this.buildWordContent(textContent);
            
            // 创建Blob并下载
            const blob = new Blob([wordContent], { 
                type: 'text/plain;charset=utf-8' 
            });
            const fileName = this.generateFileName('doc');
            this.downloadFile(blob, fileName);
            
            if (window.notificationManager) {
                window.notificationManager.success('Word报告导出成功！');
            }
            
        } catch (error) {
            console.error('Word导出失败:', error);
            if (window.notificationManager) {
                window.notificationManager.error('Word导出失败，请重试');
            }
        }
    }

    /**
     * 导出为纯文本格式
     */
    exportAsText(reportOutput) {
        try {
            const textContent = this.extractCleanText(reportOutput);
            const blob = new Blob([textContent], { 
                type: 'text/plain;charset=utf-8' 
            });
            const fileName = this.generateFileName('txt');
            this.downloadFile(blob, fileName);
            
            if (window.notificationManager) {
                window.notificationManager.success('文本报告导出成功！');
            }
            
        } catch (error) {
            console.error('文本导出失败:', error);
            if (window.notificationManager) {
                window.notificationManager.error('导出失败，请重试');
            }
        }
    }

    /**
     * 处理文本内容，使其适合PDF导出
     */
    processTextForPDF(textContent) {
        // 保留原始中文内容，只做必要的清理
        let processedText = textContent;
        
        // 清理多余的空格和换行，但保留段落结构
        processedText = processedText
            .replace(/\s+/g, ' ')  // 合并多个空格为单个空格
            .replace(/\n\s*\n/g, '\n\n')  // 合并多个换行，保留段落分隔
            .replace(/^\s+|\s+$/g, '')  // 去除首尾空格
            .trim();
        
        // 确保AI分析内容不被过度处理
        // 保留中文内容，因为这是AI分析的核心价值
        return processedText;
    }

    /**
     * 提取清洁的文本内容
     */
    extractCleanText(element) {
        console.log('🔍 开始提取文本内容...');
        
        // 创建临时DOM元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        
        // 移除不需要的元素
        const elementsToRemove = tempDiv.querySelectorAll('script, style, button, .ai-export-btn');
        elementsToRemove.forEach(el => el.remove());
        
        // 优先提取AI分析内容
        const aiAnalysisSection = tempDiv.querySelector('.ai-report-section');
        if (aiAnalysisSection) {
            console.log('✅ 找到AI分析节');
            
            // 提取AI分析的具体内容
            const analysisContent = aiAnalysisSection.querySelector('div[style*="background: #f8f9fa"]');
            if (analysisContent) {
                console.log('✅ 找到AI分析内容');
                let aiText = analysisContent.innerText || analysisContent.textContent || '';
                
                // 清理AI分析文本，但保留关键信息
                aiText = aiText
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n\n')
                    .trim();
                
                // 构建完整的报告内容
                const header = this.extractReportHeader(tempDiv);
                const dataSection = this.extractDataSection(tempDiv);
                
                const fullContent = `${header}\n\n${dataSection}\n\n=== AI智能分析报告 ===\n\n${aiText}`;
                console.log('📝 提取的完整内容长度:', fullContent.length);
                return fullContent;
            }
        }
        
        console.log('⚠️ 未找到AI分析内容，使用全文本提取');
        
        // 降级到全文本提取
        let text = tempDiv.innerText || tempDiv.textContent || '';
        
        // 清理文本
        text = text
            .replace(/\s+/g, ' ')  // 合并多个空格
            .replace(/\n\s*\n/g, '\n\n')  // 合并多个换行，保留段落
            .replace(/^\s+|\s+$/g, '')  // 去除首尾空格
            .trim();
        
        console.log('📝 全文本提取长度:', text.length);
        return text;
    }
    
    /**
     * 提取报告头部信息
     */
    extractReportHeader(element) {
        const header = element.querySelector('.ai-report-header');
        if (header) {
            return header.innerText || header.textContent || '';
        }
        return 'AI学情分析报告';
    }
    
    /**
     * 提取数据统计部分
     */
    extractDataSection(element) {
        const dataSection = element.querySelector('.ai-report-section');
        if (dataSection) {
            return dataSection.innerText || dataSection.textContent || '';
        }
        return '';
    }

    /**
     * 构建Word文档内容
     */
    buildWordContent(textContent) {
        const currentDate = new Date().toLocaleString('zh-CN');
        
        // 构建Word文档内容
        let wordContent = `AI学情分析报告\n`;
        wordContent += `生成时间: ${currentDate}\n`;
        wordContent += `\n${'='.repeat(50)}\n\n`;
        wordContent += textContent;
        wordContent += `\n\n${'='.repeat(50)}\n`;
        wordContent += `本报告由AI智能分析生成，基于真实课堂数据\n`;
        
        return wordContent;
    }

    /**
     * 生成文件名
     */
    generateFileName(extension) {
        const date = new Date().toISOString().slice(0, 10);
        return `AI学情分析报告_${date}.${extension}`;
    }

    /**
     * 下载文件
     */
    downloadFile(blob, fileName) {
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, fileName);
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

}

// 创建全局导出管理器实例
window.exportManager = new ExportManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
} else {
    window.ExportManager = ExportManager;
}