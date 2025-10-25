/**
 * AI分析提示词模板
 * 将长提示词逻辑抽离，减少字符串拼接开销
 * 优化版本 - 消除重复，提高维护性
 */

class PromptTemplates {
    // 模板片段定义
    static get TEMPLATE_FRAGMENTS() {
        return {
            // 数据概览片段
            dataOverview: (data) => `## 数据概览
- 总记录数: ${data.totalRecords}
- 成功匹配: ${data.matchedRecords}
- 活跃学生数: ${data.activeStudents}
- 班级总人数: ${data.totalClassSize}
- 未活跃学生数: ${data.inactiveStudents}
- 涉及学科: ${Array.isArray(data.subjects) ? data.subjects.join('、') : data.subjects}
- 数据匹配率: ${data.matchRate}%`,

            // 未活跃学生名单片段
            inactiveStudentsList: (inactiveStudentNames) => `## 未活跃学生名单
${inactiveStudentNames.length > 0 ? 
    `以下${inactiveStudentNames.length}名学生未参与课堂活动：${inactiveStudentNames.join('、')}` : 
    '所有学生都有参与记录'
}`,

            // 班级整体分析部分
            overallAnalysisSections: `### 1. 课堂参与度分析
- 分析学生参与课堂活动的积极性
- 统计参与率高的学生特点
- 分析参与度低的原因

### 2. 学科表现分布
- 分析各学科的学生表现情况
- 识别学科优势和薄弱环节
- 提供学科改进建议

### 3. 学习氛围评价
- 评价班级整体学习氛围
- 分析学生之间的互动情况
- 识别学习氛围的影响因素

### 4. 整体学习状态
- 总结班级整体学习状态
- 分析学习态度和积极性
- 识别需要关注的问题

### 5. 教学建议
- 针对班级整体的教学改进建议
- 课堂管理优化建议
- 教学方法调整建议

### 6. 个性化关注`,

            // 学生分析格式要求
            studentAnalysisFormat: (useAnnotations = false, minLength = 150, maxLength = 200) => `**重要格式要求：**
${useAnnotations ? 
    `- 每个学生的评价必须用以下标注格式包围：
- 开始标注：<!-- STUDENT_START:学生姓名 -->
- 结束标注：<!-- STUDENT_END:学生姓名 -->` : ''}
- 每个学生一段话，约${minLength}-${maxLength}字
- 不要使用"学习积极性评价："、"课堂表现特点："等标题
- 直接写一段话，包含：学习积极性、表现特点、建议鼓励、关注问题
- 语言要积极正面，体现教育关怀
- 分析要具体、深入、有针对性
- 使用HTML格式，但不要分段标题`,

            // 学生分析示例
            studentAnalysisExample: (useAnnotations = false) => {
                const example = `张三同学本学期表现积极，课堂参与度高，在数学和物理方面表现突出。他能够主动举手发言，思维敏捷，解题思路清晰。建议继续保持这种学习热情，可以尝试挑战更有难度的题目。需要注意的是，他在某些基础概念上还需要加强练习，建议多做一些基础题巩固。`;
                
                return useAnnotations ? 
                    `**示例格式：**
<!-- STUDENT_START:张三 -->
${example}
<!-- STUDENT_END:张三 -->` :
                    `**示例格式：**
${example}`;
            },

            // 特别关注部分
            studentAnalysisFocus: `**特别关注：**
- 对于有"无积分记录"的学生，要特别说明他们被点名但可能回答错误，老师给予了安慰评语，需要特别关注其学习状态
- 对于只有错误回答的学生，要分析原因并给予鼓励
- 对于混合表现的学生，要分析其学习波动原因
- 对于全部正确的学生，要给予肯定并鼓励继续保持`,

            // 输出格式提醒
            outputFormatReminder: (useHTML = true, minWords = 800) => `**重要提醒：**
- 必须生成完整的分析报告，不少于${minWords}字
- 每个部分都要有详细的分析内容
- 必须包含所有未活跃学生的具体姓名
- 使用${useHTML ? 'HTML' : '纯文本'}格式输出
- 确保内容详实、分析深入、建议具体`
        };
    }
    /**
     * 班级整体分析提示词
     */
    static getOverallAnalysisPrompt(data) {
        const fragments = this.TEMPLATE_FRAGMENTS;
        
        return `# 班级整体学情分析

${fragments.dataOverview(data)}

${fragments.inactiveStudentsList(data.inactiveStudentNames)}

## 分析要求
请基于以上数据，生成详细的班级整体表现分析报告，必须包含以下内容：

${fragments.overallAnalysisSections}
针对${data.inactiveStudents}名未活跃学生，必须具体列出每个学生的姓名：${data.inactiveStudentNames.join('、')}
为每个未活跃学生提供具体的关注建议。

${fragments.outputFormatReminder(true, 800)}`;
    }

    /**
     * 学生个别分析提示词（简化版）
     */
    static getStudentAnalysisPrompt(students) {
        const fragments = this.TEMPLATE_FRAGMENTS;
        
        return `# 学生个别表现分析

## 学生表现数据
${students.map(student => this.formatStudentData(student)).join('\n\n')}

## 分析要求
请基于以上每个学生的具体表现数据，为每个学生生成一段话的个性化评价。

${fragments.studentAnalysisFormat(false, 150, 200)}

${fragments.studentAnalysisExample(false)}

${fragments.studentAnalysisFocus}

请确保每个学生都有完整的分析内容，不要遗漏任何学生。`;
    }

    /**
     * 学生个别分析提示词（超简化版 - 只传结构化数据）
     */
    static getSimplifiedStudentAnalysisPrompt(studentSummaries) {
        const fragments = this.TEMPLATE_FRAGMENTS;
        
        return `# 学生个别表现分析

## 学生表现数据
${studentSummaries.map(student => 
    `${student.name}（${student.studentId}号）：
- 参与${student.participationCount}次，积分${student.totalPoints}分
- 正确${student.correctAnswers}次，错误${student.incorrectAnswers}次，无积分${student.noScoreRecords}次
- 学科：${student.subjects}
- 趋势：${student.trend}
- 每日表现：${student.dailyPerformance}
- 学科表现：${student.subjectPerformance}
- 表现模式：${student.performancePattern}`
).join('\n\n')}

## 分析要求
请根据以上学生数据生成点评，每人一段话，包含积极性、特点、建议、关注问题。

${fragments.studentAnalysisFormat(true, 150, 200)}

${fragments.studentAnalysisExample(true)}

${fragments.studentAnalysisFocus}

请确保每个学生都有完整的分析内容，并使用正确的标注格式。`;
    }

    /**
     * 格式化学生数据（简化版）
     */
    static formatStudentData(student) {
        const { name, studentId, totalPoints, correctAnswers, incorrectAnswers, 
                subjects, participationCount, noScoreRecords } = student;
        
        return `**${name}（${studentId}号）**：
- 参与次数：${participationCount}次
- 总积分：${totalPoints}分
- 正确回答：${correctAnswers}次
- 错误回答：${incorrectAnswers}次
- 无积分记录：${noScoreRecords}次
- 涉及学科：${subjects.join('、')}`;
    }

    /**
     * 生成简化的学生数据结构（优化版 - 包含摘要信息）
     */
    static generateStudentSummary(student) {
        const { name, studentId, totalPoints, correctAnswers, incorrectAnswers, 
                subjects, participationCount, noScoreRecords, dailySummaries, subjectSummaries } = student;
        
        // 生成每日表现摘要
        const dailyPerformance = this.generateDailyPerformanceSummary(dailySummaries);
        
        // 生成学科表现摘要
        const subjectPerformance = this.generateSubjectPerformanceSummary(subjectSummaries);
        
        return {
            name,
            studentId,
            totalPoints,
            correctAnswers,
            incorrectAnswers,
            subjects: subjects.join('、'),
            participationCount,
            noScoreRecords,
            trend: this.getStudentTrend(totalPoints, correctAnswers, incorrectAnswers),
            dailyPerformance, // 每日表现摘要
            subjectPerformance, // 学科表现摘要
            // 新增：表现模式分析
            performancePattern: this.analyzePerformancePattern(dailySummaries, subjectSummaries)
        };
    }
    
    /**
     * 生成每日表现摘要
     */
    static generateDailyPerformanceSummary(dailySummaries) {
        if (!dailySummaries || dailySummaries.size === 0) {
            return '无记录';
        }
        
        const summaries = Array.from(dailySummaries.values());
        const excellentDays = summaries.filter(s => s.performance === 'excellent').length;
        const totalDays = summaries.length;
        
        return `${excellentDays}/${totalDays}天表现优秀`;
    }
    
    /**
     * 生成学科表现摘要
     */
    static generateSubjectPerformanceSummary(subjectSummaries) {
        if (!subjectSummaries || subjectSummaries.size === 0) {
            return '无记录';
        }
        
        const summaries = Array.from(subjectSummaries.values());
        const excellentSubjects = summaries.filter(s => s.performance === 'excellent').length;
        const totalSubjects = summaries.length;
        
        return `${excellentSubjects}/${totalSubjects}科表现优秀`;
    }
    
    /**
     * 分析表现模式
     */
    static analyzePerformancePattern(dailySummaries, subjectSummaries) {
        if (!dailySummaries || dailySummaries.size === 0) {
            return '无数据';
        }
        
        const summaries = Array.from(dailySummaries.values());
        const excellentCount = summaries.filter(s => s.performance === 'excellent').length;
        const totalCount = summaries.length;
        const excellentRate = excellentCount / totalCount;
        
        if (excellentRate >= 0.8) {
            return '持续优秀';
        } else if (excellentRate >= 0.6) {
            return '表现良好';
        } else if (excellentRate >= 0.4) {
            return '波动较大';
        } else {
            return '需要关注';
        }
    }

    /**
     * 获取学生学习趋势
     */
    static getStudentTrend(totalPoints, correctAnswers, incorrectAnswers) {
        if (totalPoints >= 5) return "持续优秀";
        if (totalPoints >= 2) return "表现良好";
        if (totalPoints > 0) return "有待提升";
        return "需要关注";
    }

    /**
     * 单次分析提示词（完整版 - 优化版）
     */
    static getFullAnalysisPrompt(data) {
        const { totalRecords, matchedRecords, activeStudents, totalClassSize, 
                inactiveStudents, subjects, matchRate, inactiveStudentNames, 
                studentList } = data;
        
        // 使用简化的学生数据结构
        const studentSummaries = studentList.map(student => this.generateStudentSummary(student));
        const fragments = this.TEMPLATE_FRAGMENTS;
        
        return `# 学情分析任务

${fragments.dataOverview(data)}

## 活跃学生表现数据
${studentSummaries.map(student => 
    `${student.name}（${student.studentId}号）：参与${student.participationCount}次，积分${student.totalPoints}分，正确${student.correctAnswers}次，错误${student.incorrectAnswers}次，无积分${student.noScoreRecords}次，学科${student.subjects}，趋势${student.trend}`
).join('\n')}

${fragments.inactiveStudentsList(inactiveStudentNames)}

## 分析要求
请基于以上数据，生成一份详细的学情分析报告，包含以下内容：

### 1. 班级整体表现分析
- 课堂参与度分析
- 学科表现分布  
- 学习氛围评价
- 整体学习状态

### 2. 个别学生表现评价
${fragments.studentAnalysisFormat(true, 150, 200)}

${fragments.studentAnalysisExample(true)}

${fragments.studentAnalysisFocus}

### 3. 教学建议
- 针对班级整体的教学建议
- 个别学生的关注重点
- 改进措施和后续计划
- **个性化关注**: 针对${inactiveStudents}名未活跃学生，建议进行个别沟通，了解具体原因。未活跃学生名单：${inactiveStudentNames.join('、')}

## 输出格式
请以纯文本格式输出报告，确保内容详实、分析深入、建议具体。

## 重要提醒
请确保为数据中的每一个学生都提供详细的分析和评价，不要遗漏任何学生。`;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptTemplates;
} else {
    window.PromptTemplates = PromptTemplates;
}
