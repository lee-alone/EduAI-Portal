/**
 * 学生评价解析器
 * 负责解析AI返回的带标注的学生评价，分离每个学生的评语
 */

class StudentEvaluationParser {
    /**
     * 解析AI返回的学生评价文本，提取每个学生的评语
     * @param {string} analysisText - AI返回的分析文本
     * @returns {Array} 学生评价数组，每个元素包含学生姓名和评语
     */
    static parseStudentEvaluations(analysisText) {
        if (!analysisText || typeof analysisText !== 'string') {
            console.warn('⚠️ 分析文本为空或格式错误');
            return [];
        }

        console.log('🔍 开始解析学生评价...');
        
        // 使用正则表达式匹配学生评价标注
        const studentPattern = /<!--\s*STUDENT_START:\s*([^>]+)\s*-->(.*?)<!--\s*STUDENT_END:\s*\1\s*-->/gs;
        const matches = [...analysisText.matchAll(studentPattern)];
        
        console.log(`📊 找到 ${matches.length} 个学生评价标注`);
        
        const studentEvaluations = matches.map((match, index) => {
            const studentName = match[1].trim();
            const evaluation = match[2].trim();
            
            console.log(`✅ 解析学生 ${studentName} 的评价`);
            
            return {
                name: studentName,
                evaluation: evaluation,
                index: index
            };
        });
        
        // 检查是否有未标注的学生评价
        const unannotatedEvaluations = this.findUnannotatedEvaluations(analysisText, studentEvaluations);
        if (unannotatedEvaluations.length > 0) {
            console.warn(`⚠️ 发现 ${unannotatedEvaluations.length} 个未标注的学生评价`);
            studentEvaluations.push(...unannotatedEvaluations);
        }
        
        console.log(`✅ 学生评价解析完成，共 ${studentEvaluations.length} 个学生`);
        
        return studentEvaluations;
    }
    
    /**
     * 查找未标注的学生评价
     * @param {string} analysisText - 完整分析文本
     * @param {Array} annotatedEvaluations - 已标注的评价
     * @returns {Array} 未标注的评价
     */
    static findUnannotatedEvaluations(analysisText, annotatedEvaluations) {
        const annotatedNames = new Set(annotatedEvaluations.map(e => e.name));
        const unannotatedEvaluations = [];
        
        // 查找可能的学生姓名模式
        const namePatterns = [
            /([^，。\s]+)同学/g,
            /([^，。\s]+)（\d+号）/g,
            /^([^，。\s]+)同学/gm
        ];
        
        for (const pattern of namePatterns) {
            const matches = [...analysisText.matchAll(pattern)];
            for (const match of matches) {
                const potentialName = match[1].trim();
                if (!annotatedNames.has(potentialName) && this.isValidStudentName(potentialName)) {
                    // 尝试提取该学生的评价内容
                    const evaluation = this.extractEvaluationForStudent(analysisText, potentialName);
                    if (evaluation) {
                        unannotatedEvaluations.push({
                            name: potentialName,
                            evaluation: evaluation,
                            index: annotatedEvaluations.length + unannotatedEvaluations.length
                        });
                    }
                }
            }
        }
        
        return unannotatedEvaluations;
    }
    
    /**
     * 验证学生姓名是否有效
     * @param {string} name - 学生姓名
     * @returns {boolean} 是否有效
     */
    static isValidStudentName(name) {
        if (!name || name.length < 2 || name.length > 10) {
            return false;
        }
        
        // 排除常见的非姓名词汇
        const excludeWords = ['学生', '同学', '老师', '班级', '课堂', '表现', '分析', '评价', '建议'];
        return !excludeWords.includes(name);
    }
    
    /**
     * 为特定学生提取评价内容
     * @param {string} analysisText - 完整分析文本
     * @param {string} studentName - 学生姓名
     * @returns {string|null} 评价内容
     */
    static extractEvaluationForStudent(analysisText, studentName) {
        // 查找学生姓名出现的位置
        const nameIndex = analysisText.indexOf(studentName);
        if (nameIndex === -1) {
            return null;
        }
        
        // 从学生姓名开始，提取到下一个学生姓名或段落结束
        const startIndex = nameIndex;
        const nextStudentPattern = /([^，。\s]+)同学/g;
        const nextStudentMatch = nextStudentPattern.exec(analysisText.substring(startIndex + studentName.length));
        
        let endIndex;
        if (nextStudentMatch) {
            endIndex = startIndex + studentName.length + nextStudentMatch.index;
        } else {
            // 如果没有找到下一个学生，取到段落结束
            const paragraphEnd = analysisText.indexOf('\n\n', startIndex);
            endIndex = paragraphEnd !== -1 ? paragraphEnd : analysisText.length;
        }
        
        const evaluation = analysisText.substring(startIndex, endIndex).trim();
        
        // 清理评价内容
        return this.cleanEvaluationText(evaluation);
    }
    
    /**
     * 清理评价文本
     * @param {string} text - 原始文本
     * @returns {string} 清理后的文本
     */
    static cleanEvaluationText(text) {
        if (!text) return '';
        
        // 移除多余的空白字符
        return text.replace(/\s+/g, ' ').trim();
    }
    
    /**
     * 将学生评价转换为HTML格式
     * @param {Array} studentEvaluations - 学生评价数组
     * @returns {string} HTML格式的学生评价
     */
    static renderStudentEvaluationsHTML(studentEvaluations) {
        if (!studentEvaluations || studentEvaluations.length === 0) {
            return '<div class="student-analyses"><h4 class="analysis-title">个别学生表现评价</h4><p>暂无学生分析数据</p></div>';
        }
        
        let html = '<div class="student-analyses">';
        html += '<h4 class="analysis-title">个别学生表现评价</h4>';
        
        studentEvaluations.forEach((student, index) => {
            html += this.renderSingleStudentEvaluation(student.name, student.evaluation, index);
        });
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * 渲染单个学生的评价
     * @param {string} studentName - 学生姓名
     * @param {string} evaluation - 评价内容
     * @param {number} index - 索引
     * @returns {string} HTML格式
     */
    static renderSingleStudentEvaluation(studentName, evaluation, index) {
        return `
            <div class="student-evaluation" id="student-${index + 1}">
                <h4 class="student-name">${studentName}</h4>
                <div class="evaluation-content">
                    <p>${evaluation}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * 解析并渲染学生评价（一体化方法）
     * @param {string} analysisText - AI返回的分析文本
     * @returns {string} HTML格式的学生评价
     */
    static parseAndRenderStudentEvaluations(analysisText) {
        const studentEvaluations = this.parseStudentEvaluations(analysisText);
        return this.renderStudentEvaluationsHTML(studentEvaluations);
    }
    
    /**
     * 验证解析结果
     * @param {Array} studentEvaluations - 解析结果
     * @param {Array} expectedStudents - 期望的学生列表
     * @returns {Object} 验证结果
     */
    static validateParsingResult(studentEvaluations, expectedStudents) {
        const parsedNames = studentEvaluations.map(e => e.name);
        const expectedNames = expectedStudents.map(s => s.name);
        
        const missingStudents = expectedNames.filter(name => !parsedNames.includes(name));
        const extraStudents = parsedNames.filter(name => !expectedNames.includes(name));
        
        return {
            isValid: missingStudents.length === 0 && extraStudents.length === 0,
            totalParsed: studentEvaluations.length,
            totalExpected: expectedStudents.length,
            missingStudents: missingStudents,
            extraStudents: extraStudents,
            matchRate: (expectedStudents.length - missingStudents.length) / expectedStudents.length * 100
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentEvaluationParser;
} else {
    window.StudentEvaluationParser = StudentEvaluationParser;
}
