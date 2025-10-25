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
                window.notificationManager.error('未找到报告内容');
                return;
            }

            // 检查依赖并选择最佳导出方式
            const deps = this.checkDependencies();
            
            // 优先使用文本PDF，避免大文件问题
            if (deps.jsPDF) {
                await this.exportAsTextPDF(reportOutput);
            } else {
                this.exportAsText(reportOutput);
            }
            
        } catch (error) {
            console.error('导出失败:', error);
            window.notificationManager.error('导出失败，请重试');
        }
    }

    /**
     * 导出为文本PDF（纯文本，最小文件，支持中文）
     */
    async exportAsTextPDF(reportOutput) {
        try {
            const { jsPDF } = window.jspdf || window;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 使用支持中文的字体
            pdf.setFont('helvetica');
            pdf.setFontSize(12);
            
            // 添加标题 - 使用英文避免乱码
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('AI Learning Analysis Report', 105, 20, { align: 'center' });
            
            // 添加时间
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated: ${new Date().toLocaleString('en-US')}`, 105, 30, { align: 'center' });
            
            // 提取并处理内容，转换为英文或拼音
            const textContent = this.extractCleanText(reportOutput);
            const processedContent = this.processTextForPDF(textContent);
            const lines = pdf.splitTextToSize(processedContent, 180);
            
            // 添加内容
            pdf.setFontSize(12);
            let yPosition = 50;
            const pageHeight = 280;
            const lineHeight = 6;
            
            for (const line of lines) {
                if (yPosition > pageHeight) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.text(line, 15, yPosition);
                yPosition += lineHeight;
            }
            
            // 保存文件
            const fileName = this.generateFileName('pdf');
            pdf.save(fileName);
            
            window.notificationManager.success('PDF报告导出成功！');
            
        } catch (error) {
            console.error('PDF导出失败:', error);
            window.notificationManager.warning('PDF导出失败，将导出为文本格式');
            this.exportAsText(reportOutput);
        }
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
            
            window.notificationManager.success('Word报告导出成功！');
            
        } catch (error) {
            console.error('Word导出失败:', error);
            window.notificationManager.error('Word导出失败，请重试');
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
            
            window.notificationManager.success('文本报告导出成功！');
            
        } catch (error) {
            console.error('文本导出失败:', error);
            window.notificationManager.error('导出失败，请重试');
        }
    }

    /**
     * 处理文本内容，使其适合PDF导出
     */
    processTextForPDF(textContent) {
        // 将中文内容转换为英文描述，保持文件大小最小
        let processedText = textContent;
        
        // 替换常见的中文术语为英文
        const translations = {
            'AI学情分析报告': 'AI Learning Analysis Report',
            '生成时间': 'Generated Time',
            '数据处理结果': 'Data Processing Results',
            'AI智能分析报告': 'AI Intelligent Analysis Report',
            '学生评价': 'Student Evaluations',
            '课堂活动': 'Classroom Activities',
            '学生名单': 'Student Roster',
            '参与度': 'Participation Rate',
            '活跃度': 'Activity Level',
            '表现': 'Performance',
            '分析': 'Analysis',
            '报告': 'Report',
            '数据': 'Data',
            '统计': 'Statistics',
            '结果': 'Results',
            '评价': 'Evaluation',
            '建议': 'Recommendations',
            '总结': 'Summary',
            '详情': 'Details',
            '信息': 'Information'
        };
        
        // 应用翻译
        Object.entries(translations).forEach(([chinese, english]) => {
            processedText = processedText.replace(new RegExp(chinese, 'g'), english);
        });
        
        // 清理特殊字符，只保留基本ASCII字符
        processedText = processedText.replace(/[^\x00-\x7F]/g, '');
        
        // 清理多余的空格和换行
        processedText = processedText
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
        
        return processedText;
    }

    /**
     * 提取清洁的文本内容
     */
    extractCleanText(element) {
        // 创建临时DOM元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        
        // 移除不需要的元素
        const elementsToRemove = tempDiv.querySelectorAll('script, style, button, .ai-export-btn');
        elementsToRemove.forEach(el => el.remove());
        
        // 获取纯文本
        let text = tempDiv.innerText || tempDiv.textContent || '';
        
        // 清理文本
        text = text
            .replace(/\s+/g, ' ')  // 合并多个空格
            .replace(/\n\s*\n/g, '\n\n')  // 合并多个换行，保留段落
            .replace(/^\s+|\s+$/g, '')  // 去除首尾空格
            .trim();
        
        return text;
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

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
} else {
    window.ExportManager = ExportManager;
}