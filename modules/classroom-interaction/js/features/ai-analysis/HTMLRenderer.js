/**
 * HTML渲染器
 * 负责将AI生成的纯文本内容转换为HTML格式
 * 减少AI的token使用，提升生成速度
 */

class HTMLRenderer {
    /**
     * 将AI生成的班级整体分析文本转换为HTML
     */
    static renderOverallAnalysis(analysisText, data) {
        // 清理文本内容
        const cleanText = this.cleanText(analysisText);
        
        // 使用Markdown解析器处理文本
        const htmlContent = this.parseMarkdownToHTML(cleanText);
        
        let html = '<div class="overall-analysis">';
        
        // 添加标题
        html += '<h4 class="analysis-title">班级整体表现分析</h4>';
        
        // 添加解析后的HTML内容
        html += htmlContent;
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * 将AI生成的学生个别分析文本转换为HTML（优化版 - 支持标注解析）
     */
    static renderStudentAnalysis(analysisText, students) {
        // 首先尝试使用标注解析器
        if (analysisText.includes('<!-- STUDENT_START:') && analysisText.includes('<!-- STUDENT_END:')) {
            console.log('🔍 检测到标注格式，使用解析器处理');
            return StudentEvaluationParser.parseAndRenderStudentEvaluations(analysisText);
        }
        
        // 降级到传统方法
        console.log('⚠️ 未检测到标注格式，使用传统方法处理');
        return this.renderStudentAnalysisLegacy(analysisText, students);
    }
    
    /**
     * 传统的学生分析渲染方法（降级方案）
     */
    static renderStudentAnalysisLegacy(analysisText, students) {
        // 清理文本内容
        const cleanText = this.cleanText(analysisText);
        
        // 按学生分割（假设每个学生是一段话）
        const studentAnalyses = this.splitStudentAnalyses(cleanText, students);
        
        let html = '<div class="student-analyses">';
        html += '<h4 class="analysis-title">个别学生表现评价</h4>';
        
        studentAnalyses.forEach((analysis, index) => {
            if (index < students.length && analysis.trim()) {
                const student = students[index];
                html += this.renderSingleStudentAnalysis(student.name, analysis);
            }
        });
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * 渲染单个学生的分析
     */
    static renderSingleStudentAnalysis(studentName, analysisText) {
        return `
            <div class="student-evaluation">
                <h4 class="student-name">${studentName}</h4>
                <div class="evaluation-content">
                    <p>${analysisText}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * 分割学生分析文本
     */
    static splitStudentAnalyses(text, students) {
        // 尝试按学生姓名分割
        const analyses = [];
        let currentText = text;
        
        students.forEach((student, index) => {
            const nextStudent = students[index + 1];
            let studentAnalysis = '';
            
            if (nextStudent) {
                // 查找下一个学生姓名的位置
                const nextStudentIndex = currentText.indexOf(nextStudent.name);
                if (nextStudentIndex !== -1) {
                    studentAnalysis = currentText.substring(0, nextStudentIndex).trim();
                    currentText = currentText.substring(nextStudentIndex);
                } else {
                    // 如果找不到下一个学生，取剩余文本
                    studentAnalysis = currentText.trim();
                }
            } else {
                // 最后一个学生，取剩余文本
                studentAnalysis = currentText.trim();
            }
            
            analyses.push(studentAnalysis);
        });
        
        return analyses;
    }
    
    /**
     * 解析Markdown文本为HTML
     */
    static parseMarkdownToHTML(text) {
        if (!text) return '';
        
        let html = text;
        
        // 处理标题 (# ## ### ####)
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 处理粗体 (**text** 或 __text__)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // 处理斜体 (*text* 或 _text_)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // 处理列表项 (- item 或 * item)
        html = html.replace(/^[\s]*[-*] (.*$)/gim, '<li>$1</li>');
        
        // 处理数字列表 (1. item)
        html = html.replace(/^[\s]*\d+\. (.*$)/gim, '<li>$1</li>');
        
        // 将连续的列表项包装在ul或ol中
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            // 检查是否是数字列表
            const isNumberedList = /^\d+\./.test(match);
            const listTag = isNumberedList ? 'ol' : 'ul';
            return `<${listTag}>${match}</${listTag}>`;
        });
        
        // 处理段落 - 将非列表、非标题的文本包装在p标签中
        html = html.split('\n\n').map(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return '';
            
            // 如果已经是HTML标签，直接返回
            if (trimmed.startsWith('<')) return trimmed;
            
            // 如果是标题，直接返回
            if (trimmed.startsWith('<h')) return trimmed;
            
            // 如果是列表，直接返回
            if (trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>')) return trimmed;
            
            // 否则包装在p标签中
            return `<p>${trimmed}</p>`;
        }).join('\n');
        
        return html;
    }
    
    /**
     * 清理文本内容
     */
    static cleanText(text) {
        if (!text) return '';
        
        // 移除多余的空白字符，但保留换行符用于Markdown解析
        return text.replace(/[ \t]+/g, ' ').trim();
    }
    
    /**
     * 检查是否是标题
     */
    static isTitle(text) {
        return text.includes('分析') || 
               text.includes('评价') || 
               text.includes('建议') || 
               text.includes('关注') ||
               text.length < 50;
    }
    
    /**
     * 清理标题
     */
    static cleanTitle(text) {
        return text.replace(/[：:]\s*$/, '');
    }
    
    /**
     * 生成完整的报告HTML
     */
    static renderFullReport(overallAnalysis, studentAnalysis, data) {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = data.model || 'AI模型';
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">生成时间: ${currentDate}</p>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">使用模型: ${selectedModel}</p>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">数据匹配率: ${data.matchRate}%</p>
                <p style="color: #4a5568; margin-bottom: 2rem; font-weight: 500;">AI分析完成（优化模式）</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-database" style="color: #667eea;"></i>
                    数据处理结果
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #4299e1;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${data.totalRecords}</div>
                        <div style="color: #718096;">课堂活动记录数</div>
                    </div>
                    <div style="background: #f0fff4; padding: 1rem; border-radius: 8px; border-left: 4px solid #48bb78;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${data.matchedRecords}</div>
                        <div style="color: #718096;">成功匹配记录</div>
                    </div>
                    <div style="background: #fff5f5; padding: 1rem; border-radius: 8px; border-left: 4px solid #f56565;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${data.unmatchedRecords}</div>
                        <div style="color: #718096;">未匹配记录</div>
                    </div>
                    <div style="background: #faf5ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #9f7aea;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${data.totalClassSize}</div>
                        <div style="color: #718096;">班级总人数</div>
                    </div>
                    <div style="background: #e6fffa; padding: 1rem; border-radius: 8px; border-left: 4px solid #38b2ac;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${data.activeStudents}</div>
                        <div style="color: #718096;">参与活动学生</div>
                    </div>
                    <div style="background: #fef5e7; padding: 1rem; border-radius: 8px; border-left: 4px solid #ed8936;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${data.inactiveStudents}</div>
                        <div style="color: #718096;">未参与学生</div>
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
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <i class="fas fa-download"></i>
                        导出PDF报告
                    </button>
                </div>
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea;">
                    ${overallAnalysis}
                    ${studentAnalysis}
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
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTMLRenderer;
} else {
    window.HTMLRenderer = HTMLRenderer;
}
