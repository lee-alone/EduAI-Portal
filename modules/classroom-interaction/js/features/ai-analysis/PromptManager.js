/**
 * AI提示词统一管理器
 * 负责所有AI分析相关的提示词生成和管理
 */

class PromptManager {
    constructor() {
        // 初始化模板片段
        this.partials = this.initializePartials();
        
        this.templates = {
            // 班级整体分析模板
            overallAnalysis: this.getOverallAnalysisTemplate(),
            
            // 学生个别分析模板
            studentAnalysis: this.getStudentAnalysisTemplate(),
            
            // 完整分析模板（班级+学生）
            fullAnalysis: this.getFullAnalysisTemplate(),
            
            // 优化的完整分析模板（单次分析模式）
            optimizedFullAnalysis: this.getOptimizedFullAnalysisTemplate(),
            
            // 优化的分批学生分析模板
            optimizedBatchStudentAnalysis: this.getOptimizedBatchStudentAnalysisTemplate(),
            
            // 自定义分析模板
            customAnalysis: this.getCustomAnalysisTemplate()
        };
        
        this.config = {
            // 输出格式配置
            outputFormat: {
                useHTML: false,  // 是否使用HTML格式
                useAnnotations: true,  // 是否使用学生标注格式
                maxLength: 200,  // 每个学生评价最大长度
                minLength: 150   // 每个学生评价最小长度
            },
            
            // 分析深度配置
            analysisDepth: {
                includeTrends: true,     // 包含学习趋势
                includeSubjects: true,   // 包含学科分析
                includeDaily: true,      // 包含每日表现
                includePatterns: true    // 包含表现模式
            }
        };
    }

    /**
     * 获取班级整体分析提示词
     */
    getOverallAnalysisPrompt(data) {
        const template = this.templates.overallAnalysis;
        return this.renderTemplate(template, data);
    }

    /**
     * 获取学生个别分析提示词
     */
    getStudentAnalysisPrompt(students) {
        const template = this.templates.studentAnalysis;
        const data = {
            students: this.formatStudentData(students),
            outputFormat: this.config.outputFormat
        };
        return this.renderTemplate(template, data);
    }

    /**
     * 获取完整分析提示词（班级+学生）
     */
    getFullAnalysisPrompt(data) {
        const template = this.templates.fullAnalysis;
        const processedData = {
            ...data,
            studentSummaries: this.generateStudentSummaries(data.studentList),
            outputFormat: this.config.outputFormat,
            analysisDepth: this.config.analysisDepth
        };
        return this.renderTemplate(template, processedData);
    }

    /**
     * 获取自定义分析提示词
     */
    getCustomAnalysisPrompt(customPrompt, pointsData, pointsLog) {
        const template = this.templates.customAnalysis;
        const data = {
            customPrompt,
            pointsData: this.formatPointsData(pointsData),
            pointsLog: this.formatPointsLog(pointsLog)
        };
        return this.renderTemplate(template, data);
    }

    /**
     * 获取优化的完整分析提示词（单次分析模式）
     */
    getOptimizedFullAnalysisPrompt(data) {
        const template = this.templates.optimizedFullAnalysis;
        const processedData = {
            ...data,
            studentSummaries: this.generateStudentSummaries(data.studentList),
            outputFormat: this.config.outputFormat,
            analysisDepth: this.config.analysisDepth
        };
        return this.renderTemplate(template, processedData);
    }

    /**
     * 获取优化的分批学生分析提示词（减少重复，传递上下文）
     */
    getOptimizedBatchStudentAnalysisPrompt(studentSummaries, overallAnalysis, batchIndex, totalBatches) {
        const template = this.templates.optimizedBatchStudentAnalysis;
        const data = {
            students: studentSummaries,
            overallAnalysis: overallAnalysis,
            batchIndex: batchIndex,
            totalBatches: totalBatches,
            outputFormat: this.config.outputFormat,
            isOptimized: true
        };
        return this.renderTemplate(template, data);
    }

    /**
     * 获取简化学生分析提示词（用于分批处理）
     */
    getSimplifiedStudentAnalysisPrompt(studentSummaries) {
        const template = this.templates.studentAnalysis;
        const data = {
            students: studentSummaries,
            outputFormat: this.config.outputFormat,
            isSimplified: true
        };
        return this.renderTemplate(template, data);
    }

    /**
     * 班级整体分析模板
     */
    getOverallAnalysisTemplate() {
        return `# 班级整体学情分析

{{> dataOverview}}

## 分析要求
请基于以上数据，生成详细的班级整体表现分析报告，必须包含以下内容：

{{> overallAnalysisSections}}

{{> outputFormatReminder}}`;
    }

    /**
     * 学生个别分析模板
     */
    getStudentAnalysisTemplate() {
        return `# 学生个别表现分析

## 学生表现数据
{{> studentDataSection}}

## 分析要求
请基于以上每个学生的具体表现数据，为每个学生生成一段话的个性化评价。

{{> studentAnalysisFormat}}

{{> studentAnalysisFocus}}

请确保每个学生都有完整的分析内容，不要遗漏任何学生。`;
    }

    /**
     * 完整分析模板（班级+学生）
     */
    getFullAnalysisTemplate() {
        return `# 学情分析任务

{{> dataOverview}}

## 活跃学生表现数据
{{> activeStudentData}}

## 分析要求
请基于以上数据，生成一份详细的学情分析报告，包含以下内容：

### 1. 班级整体表现分析
{{> overallAnalysisSections}}

### 2. 个别学生表现评价
{{> studentAnalysisFormat}}

{{> studentAnalysisFocus}}

### 3. 教学建议
- 针对班级整体的教学建议
- 个别学生的关注重点
- 改进措施和后续计划
- **个性化关注**: 针对{{inactiveStudents}}名未活跃学生，建议进行个别沟通，了解具体原因。未活跃学生名单：{{inactiveStudentNames}}

{{> outputFormatReminder}}`;
    }

    /**
     * 优化的完整分析模板（单次分析模式 - 减少重复内容）
     */
    getOptimizedFullAnalysisTemplate() {
        return `# 学情分析任务

{{> optimizedDataOverview}}

## 活跃学生表现数据
{{> optimizedActiveStudentData}}

## 分析要求
请基于以上数据，生成一份详细的学情分析报告，包含以下内容：

### 1. 班级整体表现分析
{{> optimizedOverallAnalysisSections}}

### 2. 个别学生表现评价
{{> optimizedStudentAnalysisFormat}}

### 3. 教学建议
{{> optimizedTeachingSuggestions}}

{{> optimizedOutputFormatReminder}}`;
    }

    /**
     * 优化的分批学生分析模板（传递上下文，减少重复）
     */
    getOptimizedBatchStudentAnalysisTemplate() {
        return `# 学生个别表现分析（第{{batchIndex}}批，共{{totalBatches}}批）

## 班级整体分析结果（参考）
{{overallAnalysis}}

## 当前批次学生表现数据
{{> optimizedBatchStudentData}}

## 分析要求
请基于班级整体分析结果和当前批次学生数据，为每个学生生成个性化评价。

{{> optimizedBatchStudentAnalysisFormat}}

{{> optimizedBatchStudentAnalysisFocus}}

请确保分析结果与班级整体分析保持一致，不要重复分析班级整体情况。`;
    }

    /**
     * 自定义分析模板
     */
    getCustomAnalysisTemplate() {
        return `{{customPrompt}}

以下是学生的积分数据：

积分排行榜（前10名）：
{{#each pointsData}}
{{@index}}. {{this.studentName}}（{{this.studentId}}号）：{{this.points}}分
{{/each}}

最近活动记录：
{{#each pointsLog}}
{{this.timestamp}} - {{this.studentName}}：{{this.reason}}（{{#if this.points > 0}}+{{/if}}{{this.points}}分）
{{/each}}

请基于以上数据生成学情报告。`;
    }

    /**
     * 格式化学生数据
     */
    formatStudentData(students) {
        return students.map(student => ({
            name: student.name,
            studentId: student.studentId,
            totalPoints: student.totalPoints,
            correctAnswers: student.correctAnswers,
            incorrectAnswers: student.incorrectAnswers,
            subjects: Array.isArray(student.subjects) ? student.subjects.join('、') : student.subjects,
            participationCount: student.participationCount,
            noScoreRecords: student.noScoreRecords
        }));
    }

    /**
     * 生成学生摘要数据
     */
    generateStudentSummaries(studentList) {
        return studentList.map(student => this.generateStudentSummary(student));
    }

    /**
     * 生成单个学生摘要
     */
    generateStudentSummary(student) {
        const { name, studentId, totalPoints, correctAnswers, incorrectAnswers, 
                subjects, participationCount, noScoreRecords, dailySummaries, subjectSummaries } = student;
        
        return {
            name,
            studentId,
            totalPoints,
            correctAnswers,
            incorrectAnswers,
            subjects: Array.isArray(subjects) ? subjects.join('、') : subjects,
            participationCount,
            noScoreRecords,
            trend: this.getStudentTrend(totalPoints, correctAnswers, incorrectAnswers),
            dailyPerformance: this.generateDailyPerformanceSummary(dailySummaries),
            subjectPerformance: this.generateSubjectPerformanceSummary(subjectSummaries),
            performancePattern: this.analyzePerformancePattern(dailySummaries, subjectSummaries)
        };
    }

    /**
     * 格式化积分数据
     */
    formatPointsData(pointsData) {
        return pointsData
            .filter(s => s.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
    }

    /**
     * 格式化积分日志
     */
    formatPointsLog(pointsLog) {
        return pointsLog.slice(0, 20);
    }

    /**
     * 生成每日表现摘要
     */
    generateDailyPerformanceSummary(dailySummaries) {
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
    generateSubjectPerformanceSummary(subjectSummaries) {
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
    analyzePerformancePattern(dailySummaries, subjectSummaries) {
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
    getStudentTrend(totalPoints, correctAnswers, incorrectAnswers) {
        if (totalPoints >= 5) return "持续优秀";
        if (totalPoints >= 2) return "表现良好";
        if (totalPoints > 0) return "有待提升";
        return "需要关注";
    }

    /**
     * 初始化模板片段
     */
    initializePartials() {
        return {
            // 数据概览片段
            dataOverview: `## 数据概览
- 总记录数: {{totalRecords}}
- 成功匹配: {{matchedRecords}}
- 活跃学生数: {{activeStudents}}
- 班级总人数: {{totalClassSize}}
- 未活跃学生数: {{inactiveStudents}}
- 涉及学科: {{subjects}}
- 数据匹配率: {{matchRate}}%

## 未活跃学生名单
{{#if inactiveStudentNames.length}}
以下{{inactiveStudentNames.length}}名学生未参与课堂活动：{{inactiveStudentNames}}
{{else}}
所有学生都有参与记录
{{/if}}`,

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

### 6. 个性化关注
针对{{inactiveStudents}}名未活跃学生，必须具体列出每个学生的姓名：{{inactiveStudentNames}}
为每个未活跃学生提供具体的关注建议。`,

            // 学生数据部分
            studentDataSection: `{{#each students}}
{{#if isSimplified}}
{{this.name}}（{{this.studentId}}号）：
- 参与{{this.participationCount}}次，积分{{this.totalPoints}}分
- 正确{{this.correctAnswers}}次，错误{{this.incorrectAnswers}}次，无积分{{this.noScoreRecords}}次
- 学科：{{this.subjects}}
- 趋势：{{this.trend}}
- 每日表现：{{this.dailyPerformance}}
- 学科表现：{{this.subjectPerformance}}
- 表现模式：{{this.performancePattern}}
{{else}}
**{{this.name}}（{{this.studentId}}号）**：
- 参与次数：{{this.participationCount}}次
- 总积分：{{this.totalPoints}}分
- 正确回答：{{this.correctAnswers}}次
- 错误回答：{{this.incorrectAnswers}}次
- 无积分记录：{{this.noScoreRecords}}次
- 涉及学科：{{this.subjects}}
{{/if}}

{{/each}}`,

            // 活跃学生数据
            activeStudentData: `{{#each studentSummaries}}
{{this.name}}（{{this.studentId}}号）：参与{{this.participationCount}}次，积分{{this.totalPoints}}分，正确{{this.correctAnswers}}次，错误{{this.incorrectAnswers}}次，无积分{{this.noScoreRecords}}次，学科{{this.subjects}}，趋势{{this.trend}}
{{/each}}`,

            // 学生分析格式要求
            studentAnalysisFormat: `**重要格式要求：**
{{#if outputFormat.useAnnotations}}
- 每个学生的评价必须用以下标注格式包围：
- 开始标注：<!-- STUDENT_START:学生姓名 -->
- 结束标注：<!-- STUDENT_END:学生姓名 -->
{{/if}}
- 每个学生一段话，约{{outputFormat.minLength}}-{{outputFormat.maxLength}}字
- 不要使用"学习积极性评价："、"课堂表现特点："等标题
- 直接写一段话，包含：学习积极性、表现特点、建议鼓励、关注问题
- 语言要积极正面，体现教育关怀
- 分析要具体、深入、有针对性
{{#if outputFormat.useHTML}}
- 使用HTML格式，但不要分段标题
{{/if}}

**示例格式：**
{{#if outputFormat.useAnnotations}}
<!-- STUDENT_START:张三 -->
张三同学这段时间表现积极，课堂参与度高，在数学和物理方面表现突出。他能够主动举手发言，思维敏捷，解题思路清晰。建议继续保持这种学习热情，可以尝试挑战更有难度的题目。需要注意的是，他在某些基础概念上还需要加强练习，建议多做一些基础题巩固。
<!-- STUDENT_END:张三 -->
{{else}}
张三同学这段时间表现积极，课堂参与度高，在数学和物理方面表现突出。他能够主动举手发言，思维敏捷，解题思路清晰。建议继续保持这种学习热情，可以尝试挑战更有难度的题目。需要注意的是，他在某些基础概念上还需要加强练习，建议多做一些基础题巩固。
{{/if}}`,

            // 学生分析关注点
            studentAnalysisFocus: `**特别关注：**
- 对于有"无积分记录"的学生，要特别说明他们被点名但可能回答错误，老师给予了安慰评语，需要特别关注其学习状态
- 对于只有错误回答的学生，要分析原因并给予鼓励
- 对于混合表现的学生，要分析其学习波动原因
- 对于全部正确的学生，要给予肯定并鼓励继续保持`,

            // 输出格式提醒
            outputFormatReminder: `**重要提醒：**
- 必须生成完整的分析报告，不少于800字
- 每个部分都要有详细的分析内容
- 必须包含所有未活跃学生的具体姓名
- 使用{{#if outputFormat.useHTML}}HTML{{else}}纯文本{{/if}}格式输出
- 确保内容详实、分析深入、建议具体`,

            // 优化的数据概览片段（减少重复内容）
            optimizedDataOverview: `## 数据概览
- 总记录数: {{totalRecords}} | 成功匹配: {{matchedRecords}} | 匹配率: {{matchRate}}%
- 班级总人数: {{totalClassSize}} | 活跃学生: {{activeStudents}} | 未活跃学生: {{inactiveStudents}}
- 涉及学科: {{subjects}}

## 未活跃学生名单
{{#if inactiveStudentNames.length}}
以下{{inactiveStudentNames.length}}名学生未参与课堂活动：{{inactiveStudentNames}}
{{else}}
所有学生都有参与记录
{{/if}}`,

            // 优化的活跃学生数据
            optimizedActiveStudentData: `{{#each studentSummaries}}
{{this.name}}（{{this.studentId}}号）：参与{{this.participationCount}}次，积分{{this.totalPoints}}分，正确{{this.correctAnswers}}次，错误{{this.incorrectAnswers}}次，无积分{{this.noScoreRecords}}次，学科{{this.subjects}}，趋势{{this.trend}}
{{/each}}`,

            // 优化的班级整体分析部分
            optimizedOverallAnalysisSections: `- 课堂参与度分析：分析学生参与课堂活动的积极性和参与率
- 学科表现分布：分析各学科的学生表现情况和学科优势
- 学习氛围评价：评价班级整体学习氛围和互动情况
- 整体学习状态：总结班级整体学习状态和需要关注的问题`,

            // 优化的学生分析格式
            optimizedStudentAnalysisFormat: `**格式要求：**
{{#if outputFormat.useAnnotations}}
- 每个学生的评价必须用以下标注格式包围：
- 开始标注：<!-- STUDENT_START:学生姓名 -->
- 结束标注：<!-- STUDENT_END:学生姓名 -->
{{/if}}
- 每个学生一段话，约{{outputFormat.minLength}}-{{outputFormat.maxLength}}字
- 直接写一段话，包含：学习积极性、表现特点、建议鼓励、关注问题
- 语言要积极正面，体现教育关怀
- 分析要具体、深入、有针对性`,

            // 优化的教学建议
            optimizedTeachingSuggestions: `- 针对班级整体的教学建议
- 个别学生的关注重点
- 改进措施和后续计划
- **个性化关注**: 针对{{inactiveStudents}}名未活跃学生，建议进行个别沟通，了解具体原因。未活跃学生名单：{{inactiveStudentNames}}`,

            // 优化的输出格式提醒
            optimizedOutputFormatReminder: `**重要提醒：**
- 必须生成完整的分析报告，不少于600字
- 每个部分都要有详细的分析内容
- 必须包含所有未活跃学生的具体姓名
- 使用{{#if outputFormat.useHTML}}HTML{{else}}纯文本{{/if}}格式输出
- 确保内容详实、分析深入、建议具体`,

            // 优化的分批学生数据
            optimizedBatchStudentData: `{{#each students}}
{{this.name}}（{{this.studentId}}号）：参与{{this.participationCount}}次，积分{{this.totalPoints}}分，正确{{this.correctAnswers}}次，错误{{this.incorrectAnswers}}次，无积分{{this.noScoreRecords}}次，学科{{this.subjects}}，趋势{{this.trend}}
{{/each}}`,

            // 优化的分批学生分析格式
            optimizedBatchStudentAnalysisFormat: `**格式要求（绝对不允许违反）：**
{{#if outputFormat.useAnnotations}}
- 每个学生的评价必须用以下标注格式包围，不得有任何例外：
- 开始标注：<!-- STUDENT_START:学生姓名 -->
- 结束标注：<!-- STUDENT_END:学生姓名 -->
- 绝对不允许出现未标注的学生评价
- 如果某个学生没有标注，整个分析将被视为无效
{{/if}}
- 每个学生一段话，约{{outputFormat.minLength}}-{{outputFormat.maxLength}}字
- 直接写一段话，包含：学习积极性、表现特点、建议鼓励、关注问题
- 语言要积极正面，体现教育关怀
- 分析要具体、深入、有针对性
- **重要**：基于班级整体分析结果，保持分析风格的一致性
- **完成所有学生个人评价后，必须添加分隔标识符：<!-- STUDENT_ANALYSIS_END -->`,

            // 优化的分批学生分析关注点
            optimizedBatchStudentAnalysisFocus: `**特别关注：**
- 对于有"无积分记录"的学生，要特别说明他们被点名但可能回答错误，老师给予了安慰评语，需要特别关注其学习状态
- 对于只有错误回答的学生，要分析原因并给予鼓励
- 对于混合表现的学生，要分析其学习波动原因
- 对于全部正确的学生，要给予肯定并鼓励继续保持
- **一致性要求**：分析结果应与班级整体分析保持一致，避免矛盾`
        };
    }

    /**
     * 渲染模板（简单的模板引擎）
     */
    renderTemplate(template, data) {
        // 首先处理模板片段（partials）
        let rendered = template.replace(/\{\{>\s*([^}]+)\s*\}\}/g, (match, partialName) => {
            const partial = this.partials[partialName.trim()];
            return partial || match;
        });
        
        // 然后处理变量替换
        rendered = rendered
            .replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                const value = this.getNestedValue(data, key.trim());
                return value !== undefined ? value : match;
            })
            .replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
                const value = this.getNestedValue(data, condition.trim());
                return value ? content : '';
            })
            .replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, content) => {
                const array = this.getNestedValue(data, arrayKey.trim());
                if (!Array.isArray(array)) return '';
                
                return array.map((item, index) => {
                    return content
                        .replace(/\{\{this\.([^}]+)\}\}/g, (m, prop) => item[prop] || '')
                        .replace(/\{\{@index\}\}/g, index + 1);
                }).join('');
            });
            
        return rendered;
    }

    /**
     * 获取嵌套对象值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptManager;
} else {
    window.PromptManager = PromptManager;
}
