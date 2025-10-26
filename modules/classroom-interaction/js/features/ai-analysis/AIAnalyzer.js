/**
 * AI分析模块
 * 负责调用AI进行学情分析
 */

class AIAnalyzer {
    constructor(apiConfigManager) {
        this.apiConfigManager = apiConfigManager;
        this.promptManager = new PromptManager();
        this.init();
    }

    /**
     * 初始化AI分析功能
     */
    init() {
        this.checkDependencies();
    }

    /**
     * 检查依赖库加载状态
     */
    checkDependencies() {
        console.log('🔍 检查AI分析依赖库...');
        
        
        
        // 检查FileSaver库
        if (typeof saveAs !== 'undefined') {
            console.log('✅ FileSaver库已加载');
        } else {
            console.warn('⚠️ FileSaver库未加载，文件下载功能可能受限');
        }
    }


    /**
     * 生成AI分析报告（优化版 - 减少重复发送）
     */
    async generateAIReport(integratedData, summary) {
        console.log('🤖 开始生成AI分析报告...');
        
        // 检查学生数量，决定是否需要分批处理
        const studentCount = integratedData.integratedRecords.length;
        const shouldUseBatchProcessing = studentCount > 30; // 提高阈值到30个学生
        
        if (shouldUseBatchProcessing) {
            console.log(`📊 学生数量较多(${studentCount}名)，使用优化的分批分析模式`);
            return await this.generateOptimizedBatchAIReport(integratedData, summary);
        } else {
            // 使用优化的单次分析模式
            console.log(`📊 学生数量适中(${studentCount}名)，使用单次分析模式`);
            return await this.callOptimizedAIAnalysis(integratedData, summary);
        }
    }
    
    /**
     * 优化的单次AI分析（合并班级整体分析和学生个别分析）
     */
    async callOptimizedAIAnalysis(integratedData, summary) {
        try {
            console.log('🚀 使用优化的单次分析模式...');
            
            // 构建学生表现数据
            const studentPerformance = this.buildStudentPerformanceData(integratedData.integratedRecords);
            const { nameMapping } = integratedData;
            
            // 获取班级总人数和未活跃学生信息
            const totalClassSize = Object.keys(nameMapping).length;
            const activeStudents = summary.activeStudents;
            const inactiveStudents = totalClassSize - activeStudents;
            
            // 获取未活跃学生名单
            const activeStudentNames = new Set(studentPerformance.studentList.map(s => s.name));
            const inactiveStudentNames = Object.values(nameMapping).filter(name => !activeStudentNames.has(name));
            
            // 使用优化的提示词数据（减少重复内容）
            const promptData = {
                totalRecords: summary.totalRecords,
                matchedRecords: summary.matchedRecords,
                activeStudents: summary.activeStudents,
                totalClassSize: totalClassSize,
                inactiveStudents: inactiveStudents,
                subjects: summary.subjects,
                matchRate: summary.matchRate,
                inactiveStudentNames: inactiveStudentNames,
                studentList: studentPerformance.studentList
            };
            
            // 使用优化的提示词模板
            const prompt = this.promptManager.getOptimizedFullAnalysisPrompt(promptData);
            
            // 单次调用AI分析
            const aiResult = await this.callAIAnalysisWithPrompt(prompt);
            
            // 生成完整报告
            const reportData = {
                totalRecords: summary.totalRecords,
                matchedRecords: summary.matchedRecords,
                unmatchedRecords: summary.unmatchedRecords || 0,
                totalClassSize: totalClassSize,
                activeStudents: summary.activeStudents,
                inactiveStudents: inactiveStudents,
                matchRate: summary.matchRate,
                model: this.apiConfigManager.getSelectedModel()
            };
            
            const fullReport = HTMLRenderer.renderFullReport(aiResult, '', reportData);
            
            return {
                content: fullReport,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                model: this.apiConfigManager.getSelectedModel()
            };
            
        } catch (error) {
            console.error('❌ 优化分析失败:', error);
            throw new Error(`AI分析失败: ${error.message}`);
        }
    }

    /**
     * 优化的分批AI分析报告（减少重复发送）
     */
    async generateOptimizedBatchAIReport(integratedData, summary) {
        console.log('🔄 开始优化的分批AI分析...');
        
        try {
            // 第一步：生成班级整体分析
            const overallAnalysis = await this.callOverallAnalysis(integratedData, summary);
            
            // 第二步：分批生成学生个别分析（优化版）
            const studentAnalyses = await this.callOptimizedBatchStudentAnalysis(integratedData, summary, overallAnalysis);
            
            // 第三步：合并所有分析结果
            const combinedReport = this.combineBatchAnalyses(overallAnalysis, studentAnalyses, summary);
            
            return combinedReport;
        } catch (error) {
            console.error('❌ 优化分批分析失败:', error);
            // 降级到优化的单次分析
            return await this.callOptimizedAIAnalysis(integratedData, summary);
        }
    }

    /**
     * 分批生成AI分析报告（保留原方法作为备用）
     */
    async generateBatchAIReport(integratedData, summary) {
        console.log('🔄 开始分批AI分析...');
        
        try {
            // 第一步：生成班级整体分析
            const overallAnalysis = await this.callOverallAnalysis(integratedData, summary);
            
            // 第二步：分批生成学生个别分析
            const studentAnalyses = await this.callBatchStudentAnalysis(integratedData, summary);
            
            // 第三步：合并所有分析结果
            const combinedReport = this.combineBatchAnalyses(overallAnalysis, studentAnalyses, summary);
            
            return combinedReport;
        } catch (error) {
            console.error('❌ 分批分析失败:', error);
            // 降级到单次分析
            const aiReport = await this.callAIAnalysis(integratedData, summary);
            return aiReport;
        }
    }
    
    /**
     * 调用班级整体分析（优化版）
     */
    async callOverallAnalysis(integratedData, summary) {
        const { nameMapping } = integratedData;
        
        // 获取班级总人数和未活跃学生信息
        const totalClassSize = Object.keys(nameMapping).length;
        const activeStudents = summary.activeStudents;
        const inactiveStudents = totalClassSize - activeStudents;
        
        // 获取未活跃学生名单
        const studentPerformance = this.buildStudentPerformanceData(integratedData.integratedRecords);
        const activeStudentNames = new Set(studentPerformance.studentList.map(s => s.name));
        const inactiveStudentNames = Object.values(nameMapping).filter(name => !activeStudentNames.has(name));
        
        // 使用新的提示词模板
        const promptData = {
            totalRecords: summary.totalRecords,
            matchedRecords: summary.matchedRecords,
            activeStudents: summary.activeStudents,
            totalClassSize: totalClassSize,
            inactiveStudents: inactiveStudents,
            subjects: summary.subjects,
            matchRate: summary.matchRate,
            inactiveStudentNames: inactiveStudentNames
        };
        
        const prompt = this.promptManager.getOverallAnalysisPrompt(promptData);
        
        return await this.callAIAnalysisWithPrompt(prompt);
    }
    
    /**
     * 优化的分批学生个别分析（减少重复发送，传递上下文）
     */
    async callOptimizedBatchStudentAnalysis(integratedData, summary, overallAnalysis) {
        const studentPerformance = this.buildStudentPerformanceData(integratedData.integratedRecords);
        const students = studentPerformance.studentList;
        const batchSize = 15; // 增加批处理大小到15个学生
        const batches = [];
        
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            batches.push(batch);
        }
        
        const allAnalyses = [];
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            // 使用优化的学生数据结构，包含上下文信息
            const studentSummaries = batch.map(student => this.promptManager.generateStudentSummary(student));
            const prompt = this.promptManager.getOptimizedBatchStudentAnalysisPrompt(
                studentSummaries, 
                overallAnalysis, 
                i, 
                batches.length
            );
            
            const analysis = await this.callAIAnalysisWithPrompt(prompt);
            
            // 立即验证这一批的格式
            const validationResult = this.validateBatchAnalysis(analysis, batch);
            if (!validationResult.isValid) {
                console.warn(`⚠️ 批次 ${i + 1} 格式验证失败: ${validationResult.errors.join(', ')}`);
                console.log(`📊 批次 ${i + 1} 验证详情:`, validationResult);
            } else {
                console.log(`✅ 批次 ${i + 1} 格式验证通过`);
            }
            
            allAnalyses.push(analysis);
            
            // 减少延迟时间
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 减少到500ms
            }
        }
        
        return allAnalyses;
    }

    /**
     * 分批调用学生个别分析（原方法保留作为备用）
     */
    async callBatchStudentAnalysis(integratedData, summary) {
        const studentPerformance = this.buildStudentPerformanceData(integratedData.integratedRecords);
        const students = studentPerformance.studentList;
        const batchSize = 10; // 每批处理10个学生
        const batches = [];
        
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            batches.push(batch);
        }
        
        const allAnalyses = [];
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            // 使用简化的学生数据结构
            const studentSummaries = batch.map(student => this.promptManager.generateStudentSummary(student));
            const prompt = this.promptManager.getSimplifiedStudentAnalysisPrompt(studentSummaries);
            
            const analysis = await this.callAIAnalysisWithPrompt(prompt);
            allAnalyses.push(analysis);
            
            // 添加延迟避免API限制
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return allAnalyses;
    }
    
    /**
     * 生成学生描述（一人一段话格式）
     */
    generateStudentDescription(student) {
        const { name, studentId, participationCount, subjects, totalPoints, 
                correctAnswers, incorrectAnswers, noScoreRecords, records } = student;
        
        // 计算时间段描述
        const timeDescription = this.getTimeDescription(records);
        
        // 基础信息
        let description = `**${name}（${studentId}号）**：${timeDescription}参与课堂活动${participationCount}次`;
        
        // 学科信息
        if (subjects.length > 0) {
            description += `，主要涉及${subjects.join('、')}${subjects.length > 1 ? '等' : ''}学科`;
        }
        
        // 表现类型分析
        if (correctAnswers > 0 && incorrectAnswers > 0) {
            description += `。表现特点为混合型，其中正确回答${correctAnswers}次，错误回答${incorrectAnswers}次`;
        } else if (correctAnswers > 0) {
            description += `。表现优秀，全部正确回答${correctAnswers}次`;
        } else if (incorrectAnswers > 0) {
            description += `。表现一般，错误回答${incorrectAnswers}次`;
        }
        
        // 特殊情况
        if (noScoreRecords > 0) {
            description += `，另有${noScoreRecords}次无积分记录（老师给予安慰评语）`;
        }
        
        // 积分总结
        description += `。总积分为${totalPoints}分`;
        
        // 学习状态评价
        if (totalPoints >= 5) {
            description += `，显示出良好的学习积极性，是班级的学习榜样`;
        } else if (totalPoints >= 2) {
            description += `，学习态度认真，课堂参与度较高`;
        } else if (totalPoints > 0) {
            description += `，有一定的学习积极性，但还需要加强`;
        } else {
            description += `，需要特别关注其学习状态，建议加强基础知识的巩固`;
        }
        
        return description + '。';
    }

    /**
     * 根据数据时间范围确定时间段描述
     */
    getTimeDescription(records) {
        if (!records || records.length === 0) {
            return '本学期';
        }
        
        // 获取最早的记录日期
        const dates = records
            .map(record => record.date)
            .filter(date => date)
            .map(date => {
                // 尝试解析不同格式的日期
                let parsedDate;
                if (typeof date === 'string') {
                    // 尝试解析中文日期格式
                    if (date.includes('年') && date.includes('月') && date.includes('日')) {
                        // 格式：2024年1月15日
                        const match = date.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                        if (match) {
                            parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                        }
                    } else if (date.includes('-')) {
                        // 格式：2024-01-15
                        parsedDate = new Date(date);
                    } else if (date.includes('/')) {
                        // 格式：2024/01/15
                        parsedDate = new Date(date);
                    }
                }
                return parsedDate;
            })
            .filter(date => date && !isNaN(date.getTime()));
        
        if (dates.length === 0) {
            return '本学期';
        }
        
        // 找到最早的日期
        const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate - earliestDate) / (1000 * 60 * 60 * 24));
        
        // 根据时间差确定描述
        if (daysDiff <= 7) {
            return '本周';
        } else if (daysDiff <= 30) {
            return '本月';
        } else if (daysDiff <= 60) {
            return '上学期';
        } else {
            return '本学期';
        }
    }

    /**
     * 使用自定义提示词调用AI分析
     */
    async callAIAnalysisWithPrompt(prompt) {
        const selectedModel = this.apiConfigManager.getSelectedModel();
        const apiKey = this.apiConfigManager.getAPIKey();
        const apiEndpoint = this.apiConfigManager.getAPIEndpoint();
        
        const requestData = {
            model: selectedModel,
            messages: [
                {
                    role: "system",
                    content: "你是一位专业的班主任，擅长分析学生课堂表现数据，生成详细的学情分析报告。"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 6000,
            stream: false
        };
        
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
        
        let aiContent = result.choices?.[0]?.message?.content;
        if (!aiContent) {
            throw new Error('AI未返回有效内容');
        }
        
        // 跟踪Token使用情况
        if (result.usage) {
            console.log('📊 API返回Token使用情况:', result.usage);
            this.updateTokenUsage(result.usage);
        }
        
        return this.cleanAIOutput(aiContent);
    }

    /**
     * 调用AI进行学情分析（优化版）
     */
    async callAIAnalysis(integratedData, summary) {
        try {
            // 使用新的统一PromptManager
            const { nameMapping } = integratedData;
            const studentPerformance = this.buildStudentPerformanceData(integratedData.integratedRecords);
            
            // 获取班级总人数和未活跃学生信息
            const totalClassSize = Object.keys(nameMapping).length;
            const activeStudents = summary.activeStudents;
            const inactiveStudents = totalClassSize - activeStudents;
            
            // 获取未活跃学生名单
            const activeStudentNames = new Set(studentPerformance.studentList.map(s => s.name));
            const inactiveStudentNames = Object.values(nameMapping).filter(name => !activeStudentNames.has(name));
            
            // 使用统一的提示词管理器
            const promptData = {
                totalRecords: summary.totalRecords,
                matchedRecords: summary.matchedRecords,
                activeStudents: summary.activeStudents,
                totalClassSize: totalClassSize,
                inactiveStudents: inactiveStudents,
                subjects: summary.subjects,
                matchRate: summary.matchRate,
                inactiveStudentNames: inactiveStudentNames,
                studentList: studentPerformance.studentList
            };
            
            const prompt = this.promptManager.getFullAnalysisPrompt(promptData);
            
            // 调用AI分析
            const aiResult = await this.callAIAnalysisWithPrompt(prompt);
            
            // 使用HTML渲染器处理输出
            const renderedOverallAnalysis = HTMLRenderer.renderOverallAnalysis(aiResult, summary);
            const renderedStudentAnalysis = this.renderStudentAnalysisDirectly(aiResult);
            
            // 生成完整报告
            const reportData = {
                totalRecords: summary.totalRecords,
                matchedRecords: summary.matchedRecords,
                unmatchedRecords: summary.unmatchedRecords || 0,
                totalClassSize: totalClassSize,
                activeStudents: summary.activeStudents,
                inactiveStudents: inactiveStudents,
                matchRate: summary.matchRate,
                model: this.apiConfigManager.getSelectedModel()
            };
            
            const fullReport = HTMLRenderer.renderFullReport(renderedOverallAnalysis, renderedStudentAnalysis, reportData);
            
            return {
                content: fullReport,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                model: this.apiConfigManager.getSelectedModel()
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
        const { integratedRecords, unmatchedRecords, nameMapping } = integratedData;
        
        // 构建学生表现数据
        const studentPerformance = this.buildStudentPerformanceData(integratedRecords);
        
        // 获取班级总人数（从学生名单映射表获取）
        const totalClassSize = Object.keys(nameMapping).length;
        const activeStudents = studentPerformance.studentList.length;
        const inactiveStudents = totalClassSize - activeStudents;
        
        // 获取未活跃学生名单
        const activeStudentNames = new Set(studentPerformance.studentList.map(s => s.name));
        const inactiveStudentNames = Object.values(nameMapping).filter(name => !activeStudentNames.has(name));
        
        // 构建提示词
        const prompt = `
# 学情分析任务

## 数据概览
- 总记录数: ${summary.totalRecords}
- 成功匹配: ${summary.matchedRecords}
- 活跃学生数: ${summary.activeStudents}
- 班级总人数: ${totalClassSize}
- 未活跃学生数: ${inactiveStudents}
- 涉及学科: ${summary.subjects.join('、')}
- 数据匹配率: ${summary.matchRate}%

## 活跃学生表现详情
${studentPerformance.studentList.map(student => this.generateStudentDescription(student)).join('\n\n')}

## 未活跃学生名单
${inactiveStudentNames.length > 0 ? 
    `以下${inactiveStudentNames.length}名学生未参与课堂活动：${inactiveStudentNames.join('、')}` : 
    '所有学生都有参与记录'
}

## 分析要求
请基于以上数据，生成一份详细的学情分析报告，包含以下内容：

### 1. 班级整体表现分析
- 课堂参与度分析
- 学科表现分布  
- 学习氛围评价
- 整体学习状态

### 2. 个别学生表现评价
请为数据中的每一个学生生成个性化评价，**必须严格遵守以下格式**：

**格式要求（绝对不允许违反）：**
- 每个学生的评价必须用以下标注格式包围，不得有任何例外：
- 开始标注：<!-- STUDENT_START:学生姓名 -->
- 结束标注：<!-- STUDENT_END:学生姓名 -->
- 绝对不允许出现未标注的学生评价
- 如果某个学生没有标注，整个分析将被视为无效
- 每个学生一段话，约150-200字
- 不要使用"学习积极性评价："、"课堂表现特点："等标题
- 直接写一段话，包含：学习积极性、表现特点、建议鼓励、关注问题
- 语言要积极正面，体现教育关怀
- 分析要具体、深入、有针对性

**示例格式（必须严格按照此格式）：**
<!-- STUDENT_START:张三 -->
张三同学这段时间表现积极，课堂参与度高，在数学和物理方面表现突出。他能够主动举手发言，思维敏捷，解题思路清晰。建议继续保持这种学习热情，可以尝试挑战更有难度的题目。需要注意的是，他在某些基础概念上还需要加强练习，建议多做一些基础题巩固。
<!-- STUDENT_END:张三 -->

**重要提醒：**
- 必须分析数据中出现的每一个学生（共${studentPerformance.studentList.length}名学生）
- 每个学生都要有完整的评价，且必须使用标注格式
- 根据学生的实际表现数据给出针对性建议
- **特别注意以下情况：**
  - 对于有"无积分记录"的学生，说明他们被点名了但可能回答错误，老师给予了安慰评语，需要特别关注其学习状态
  - 对于只有错误回答的学生，需要分析原因并给予鼓励
  - 对于混合表现的学生，要分析其学习波动原因
  - 对于全部正确的学生，要给予肯定并鼓励继续保持
- **完成所有学生个人评价后，必须添加分隔标识符：<!-- STUDENT_ANALYSIS_END -->**

### 3. 班级整体分析
- 针对班级整体的教学建议
- 个别学生的关注重点
- 改进措施和后续计划
- **个性化关注**: 针对${inactiveStudents}名未活跃学生，建议进行个别沟通，了解具体原因。未活跃学生名单：${inactiveStudentNames.join('、')}

## 输出格式
请以HTML格式输出报告，使用适当的标题、段落和样式，确保报告结构清晰、内容详实。

## 重要提醒
请确保在"个别学生表现评价"部分中，为数据中的每一个学生都提供详细的分析和评价，不要遗漏任何学生。
在"教学建议"部分的"个性化关注"中，必须具体列出所有未活跃学生的姓名。
        `;
        
        return prompt;
    }

    /**
     * 构建学生表现数据（优化版 - 过滤无效记录并合并重复数据）
     */
    buildStudentPerformanceData(integratedRecords) {
        console.log('🔍 开始构建学生表现数据...');
        
        // 第一步：过滤无效记录
        const validRecords = this.filterValidRecords(integratedRecords);
        console.log(`📊 过滤后有效记录: ${validRecords.length}/${integratedRecords.length}`);
        
        // 第二步：合并重复记录
        const mergedRecords = this.mergeDuplicateRecords(validRecords);
        console.log(`🔄 合并后记录数: ${mergedRecords.length}/${validRecords.length}`);
        
        const studentData = {};
        
        // 第三步：按学生分组统计
        mergedRecords.forEach(record => {
            const studentName = record.studentName;
            if (!studentData[studentName]) {
                studentData[studentName] = {
                    name: studentName,
                    studentId: record.studentId,
                    records: [],
                    subjects: new Set(),
                    dates: new Set(),
                    totalPoints: 0,
                    participationCount: 0,
                    correctAnswers: 0,      // 正确回答次数
                    incorrectAnswers: 0,    // 错误回答次数
                    noScoreRecords: 0,      // 无积分记录次数（可能是安慰评语）
                    hasCorrectAnswer: false, // 是否有正确回答
                    hasIncorrectAnswer: false, // 是否有错误回答
                    hasNoScoreRecord: false,   // 是否有无积分记录
                    // 新增：合并后的摘要数据
                    dailySummaries: new Map(), // 按日期分组的摘要
                    subjectSummaries: new Map() // 按学科分组的摘要
                };
            }
            
            // 添加记录
            studentData[studentName].records.push({
                subject: record.subject,
                date: record.date,
                points: record.points,
                originalData: record.originalData,
                isMerged: record.isMerged || false, // 标记是否为合并记录
                mergedCount: record.mergedCount || 1 // 合并的记录数
            });
            
            // 统计信息
            if (record.subject) studentData[studentName].subjects.add(record.subject);
            if (record.date) studentData[studentName].dates.add(record.date);
            
            // 分析回答情况
            if (record.points && record.points > 0) {
                studentData[studentName].totalPoints += record.points;
                studentData[studentName].correctAnswers++;
                studentData[studentName].hasCorrectAnswer = true;
            } else if (record.points === 0) {
                studentData[studentName].incorrectAnswers++;
                studentData[studentName].hasIncorrectAnswer = true;
            } else {
                // 没有积分记录，可能是安慰评语或其他情况
                studentData[studentName].noScoreRecords++;
                studentData[studentName].hasNoScoreRecord = true;
            }
            
            studentData[studentName].participationCount++;
        });
        
        // 第四步：生成摘要数据
        this.generateStudentSummaries(studentData);
        
        // 转换Set为Array
        Object.values(studentData).forEach(student => {
            student.subjects = Array.from(student.subjects);
            student.dates = Array.from(student.dates);
        });
        
        const students = Object.values(studentData);
        
        // 按参与度排序，确保所有学生都被包含
        students.sort((a, b) => b.participationCount - a.participationCount);
        
        console.log(`✅ 学生数据构建完成: ${students.length}名学生`);
        
        return {
            students: students,
            totalStudents: Object.keys(studentData).length,
            studentNames: Object.keys(studentData),
            summary: {
                totalRecords: integratedRecords.length,
                validRecords: validRecords.length,
                mergedRecords: mergedRecords.length,
                activeStudents: Object.keys(studentData).length,
                subjects: [...new Set(integratedRecords.map(r => r.subject).filter(Boolean))],
                dates: [...new Set(integratedRecords.map(r => r.date).filter(Boolean))]
            },
            // 添加学生列表，确保AI知道需要分析哪些学生
            studentList: Object.keys(studentData).map(name => ({
                name: name,
                studentId: studentData[name].studentId,
                participationCount: studentData[name].participationCount,
                subjects: studentData[name].subjects,
                totalPoints: studentData[name].totalPoints,
                correctAnswers: studentData[name].correctAnswers,
                incorrectAnswers: studentData[name].incorrectAnswers,
                noScoreRecords: studentData[name].noScoreRecords,
                hasCorrectAnswer: studentData[name].hasCorrectAnswer,
                hasIncorrectAnswer: studentData[name].hasIncorrectAnswer,
                hasNoScoreRecord: studentData[name].hasNoScoreRecord,
                records: studentData[name].records,  // 添加记录数据用于时间分析
                dailySummaries: studentData[name].dailySummaries, // 每日摘要
                subjectSummaries: studentData[name].subjectSummaries // 学科摘要
            }))
        };
    }

    /**
     * 过滤无效记录
     */
    filterValidRecords(records) {
        return records.filter(record => {
            // 过滤条件
            if (!record.studentName || record.studentName.trim() === '') {
                return false; // 无学生姓名
            }
            
            if (!record.studentId || record.studentId.trim() === '') {
                return false; // 无学生ID
            }
            
            // 过滤明显异常的数据
            if (record.points && (record.points < 0 || record.points > 100)) {
                console.warn(`⚠️ 异常积分数据: ${record.studentName} - ${record.points}分`);
                return false;
            }
            
            // 过滤重复的无效记录（同一学生同一时间同一科目）
            return true;
        });
    }
    
    /**
     * 合并重复记录
     */
    mergeDuplicateRecords(records) {
        const recordMap = new Map();
        
        records.forEach(record => {
            // 创建唯一键：学生+日期+学科
            const key = `${record.studentName}_${record.date}_${record.subject}`;
            
            if (recordMap.has(key)) {
                // 合并记录
                const existingRecord = recordMap.get(key);
                existingRecord.points = Math.max(existingRecord.points, record.points); // 取最高分
                existingRecord.mergedCount = (existingRecord.mergedCount || 1) + 1;
                existingRecord.isMerged = true;
                
                // 合并原始数据
                if (!existingRecord.originalData) {
                    existingRecord.originalData = [];
                }
                if (Array.isArray(existingRecord.originalData)) {
                    existingRecord.originalData.push(record.originalData);
                }
            } else {
                // 新记录
                recordMap.set(key, {
                    ...record,
                    mergedCount: 1,
                    isMerged: false
                });
            }
        });
        
        return Array.from(recordMap.values());
    }
    
    /**
     * 生成学生摘要数据
     */
    generateStudentSummaries(studentData) {
        Object.values(studentData).forEach(student => {
            // 按日期生成摘要
            student.records.forEach(record => {
                if (record.date) {
                    const dateKey = record.date;
                    if (!student.dailySummaries.has(dateKey)) {
                        student.dailySummaries.set(dateKey, {
                            date: record.date,
                            totalPoints: 0,
                            participationCount: 0,
                            subjects: new Set(),
                            performance: 'unknown'
                        });
                    }
                    
                    const dailySummary = student.dailySummaries.get(dateKey);
                    dailySummary.totalPoints += record.points || 0;
                    dailySummary.participationCount++;
                    if (record.subject) dailySummary.subjects.add(record.subject);
                    
                    // 判断当日表现
                    if (record.points > 0) {
                        dailySummary.performance = 'excellent';
                    } else if (record.points === 0) {
                        dailySummary.performance = 'needs_improvement';
                    }
                }
                
                // 按学科生成摘要
                if (record.subject) {
                    const subjectKey = record.subject;
                    if (!student.subjectSummaries.has(subjectKey)) {
                        student.subjectSummaries.set(subjectKey, {
                            subject: record.subject,
                            totalPoints: 0,
                            participationCount: 0,
                            averagePoints: 0,
                            performance: 'unknown'
                        });
                    }
                    
                    const subjectSummary = student.subjectSummaries.get(subjectKey);
                    subjectSummary.totalPoints += record.points || 0;
                    subjectSummary.participationCount++;
                    subjectSummary.averagePoints = subjectSummary.totalPoints / subjectSummary.participationCount;
                    
                    // 判断学科表现
                    if (subjectSummary.averagePoints >= 3) {
                        subjectSummary.performance = 'excellent';
                    } else if (subjectSummary.averagePoints >= 1) {
                        subjectSummary.performance = 'good';
                    } else {
                        subjectSummary.performance = 'needs_improvement';
                    }
                }
            });
        });
    }

    /**
     * 合并分批分析结果（优化版）
     */
    combineBatchAnalyses(overallAnalysis, studentAnalyses, summary) {
        // 使用HTML渲染器处理AI输出
        const renderedOverallAnalysis = HTMLRenderer.renderOverallAnalysis(overallAnalysis, summary);
        
        // 使用智能合并学生分析
        const renderedStudentAnalysis = this.smartCombineStudentAnalyses(studentAnalyses);
        
        // 生成完整报告
        const reportData = {
            totalRecords: summary.totalRecords,
            matchedRecords: summary.matchedRecords,
            unmatchedRecords: summary.unmatchedRecords || 0,
            totalClassSize: summary.totalClassSize,
            activeStudents: summary.activeStudents,
            inactiveStudents: summary.inactiveStudents || 0,
            matchRate: summary.matchRate,
            model: this.apiConfigManager.getSelectedModel()
        };
        
        return HTMLRenderer.renderFullReport(renderedOverallAnalysis, renderedStudentAnalysis, reportData);
    }
    
    /**
     * 智能合并学生分析结果
     * @param {Array} studentAnalyses - 所有批次的学生分析结果
     * @returns {string} 合并后的HTML
     */
    smartCombineStudentAnalyses(studentAnalyses) {
        console.log('🔄 开始智能合并学生分析结果...');
        
        // 提取每批中的学生评价
        const allStudentEvaluations = [];
        let totalBatches = studentAnalyses.length;
        let validBatches = 0;
        
        studentAnalyses.forEach((analysis, batchIndex) => {
            console.log(`📊 处理批次 ${batchIndex + 1}/${totalBatches}`);
            
            // 检查这一批是否包含正确的标注格式
            if (analysis.includes('<!-- STUDENT_START:') && analysis.includes('<!-- STUDENT_END:')) {
                const evaluations = StudentEvaluationParser.parseStudentEvaluations(analysis);
                allStudentEvaluations.push(...evaluations);
                validBatches++;
                console.log(`✅ 批次 ${batchIndex + 1} 解析出 ${evaluations.length} 个学生评价`);
            } else {
                console.warn(`⚠️ 批次 ${batchIndex + 1} 未包含正确的标注格式，跳过`);
            }
        });
        
        console.log(`📊 合并结果: ${validBatches}/${totalBatches} 批次有效，共 ${allStudentEvaluations.length} 个学生评价`);
        
        // 去重并合并
        const uniqueEvaluations = this.deduplicateStudentEvaluations(allStudentEvaluations);
        console.log(`📊 去重后: ${uniqueEvaluations.length} 个学生评价`);
        
        // 重新生成HTML
        const html = StudentEvaluationParser.renderStudentEvaluationsHTML(uniqueEvaluations);
        console.log('✅ 智能合并完成');
        
        return html;
    }
    
    /**
     * 去重学生评价
     * @param {Array} evaluations - 学生评价数组
     * @returns {Array} 去重后的评价数组
     */
    deduplicateStudentEvaluations(evaluations) {
        const seen = new Set();
        const unique = [];
        
        evaluations.forEach(evaluation => {
            if (!seen.has(evaluation.name)) {
                seen.add(evaluation.name);
                unique.push(evaluation);
            } else {
                console.log(`🔄 发现重复学生: ${evaluation.name}，保留第一个`);
            }
        });
        
        return unique;
    }
    
    /**
     * 直接渲染学生分析（优化版 - 支持标注解析）
     */
    renderStudentAnalysisDirectly(analysisText) {
        if (!analysisText || !analysisText.trim()) {
            return '<div class="student-analyses"><h4 class="analysis-title">个别学生表现评价</h4><p>暂无学生分析数据</p></div>';
        }
        
        // 首先尝试使用标注解析器
        if (analysisText.includes('<!-- STUDENT_START:') && analysisText.includes('<!-- STUDENT_END:')) {
            console.log('🔍 检测到标注格式，使用解析器处理学生评价');
            const result = StudentEvaluationParser.parseAndRenderStudentEvaluations(analysisText);
            
            // 检查解析结果的质量
            if (this.validateStudentAnalysisResult(result)) {
                return result;
            } else {
                console.warn('⚠️ 标注解析结果质量不佳，降级到传统方法');
                return this.renderStudentAnalysisDirectlyLegacy(analysisText);
            }
        }
        
        // 降级到传统方法
        console.log('⚠️ 未检测到标注格式，使用传统方法处理学生评价');
        return this.renderStudentAnalysisDirectlyLegacy(analysisText);
    }
    
    /**
     * 验证学生分析结果的质量
     * @param {string} result - 解析结果HTML
     * @returns {boolean} 结果是否有效
     */
    validateStudentAnalysisResult(result) {
        if (!result || result.includes('暂无学生分析数据')) {
            return false;
        }
        
        // 检查是否包含有效的学生评价
        const studentEvaluationCount = (result.match(/class="student-evaluation"/g) || []).length;
        if (studentEvaluationCount === 0) {
            return false;
        }
        
        // 检查是否包含明显错误的内容
        const errorPatterns = [
            /undefined/,
            /null/,
            /\[object Object\]/,
            /NaN/
        ];
        
        for (const pattern of errorPatterns) {
            if (pattern.test(result)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 验证批次分析结果
     * @param {string} analysis - 批次分析结果
     * @param {Array} batch - 批次学生数据
     * @returns {Object} 验证结果
     */
    validateBatchAnalysis(analysis, batch) {
        const expectedStudents = batch.map(s => s.name);
        const foundStudents = [];
        
        // 查找所有标注的学生
        const studentPattern = /<!--\s*STUDENT_START:\s*([^>]+)\s*-->/g;
        let match;
        while ((match = studentPattern.exec(analysis)) !== null) {
            foundStudents.push(match[1].trim());
        }
        
        const missingStudents = expectedStudents.filter(name => !foundStudents.includes(name));
        const extraStudents = foundStudents.filter(name => !expectedStudents.includes(name));
        
        // 检查是否有分隔标识符
        const hasSeparator = analysis.includes('<!-- STUDENT_ANALYSIS_END -->');
        
        const errors = [];
        if (missingStudents.length > 0) {
            errors.push(`缺少学生: ${missingStudents.join(', ')}`);
        }
        if (extraStudents.length > 0) {
            errors.push(`多余学生: ${extraStudents.join(', ')}`);
        }
        if (!hasSeparator) {
            errors.push('缺少分隔标识符');
        }
        
        return {
            isValid: missingStudents.length === 0 && extraStudents.length === 0 && hasSeparator,
            missingStudents,
            extraStudents,
            hasSeparator,
            expectedCount: expectedStudents.length,
            foundCount: foundStudents.length,
            errors
        };
    }
    
    /**
     * 传统的学生分析直接渲染方法（降级方案）
     */
    renderStudentAnalysisDirectlyLegacy(analysisText) {
        // 清理文本内容
        const cleanText = analysisText.replace(/\s+/g, ' ').trim();
        
        // 按段落分割（假设每个学生是一段话）
        const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
        
        let html = '<div class="student-analyses">';
        html += '<h4 class="analysis-title">个别学生表现评价</h4>';
        
        // 为每个段落创建学生评价块
        paragraphs.forEach((paragraph, index) => {
            if (paragraph.trim()) {
                // 尝试从段落中提取学生姓名（假设在开头）
                const studentName = this.extractStudentName(paragraph);
                html += this.renderSingleStudentAnalysis(studentName, paragraph);
            }
        });
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * 从文本中提取学生姓名
     */
    extractStudentName(text) {
        // 尝试匹配常见的学生姓名模式
        const namePatterns = [
            /^([^，。\s]+)同学/,  // "张三同学"
            /^([^，。\s]+)（/,    // "张三（"
            /^([^，。\s]+)同学/,  // "张三同学"
        ];
        
        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // 如果找不到，返回默认名称
        return '学生';
    }
    
    /**
     * 渲染单个学生的分析
     */
    renderSingleStudentAnalysis(studentName, analysisText) {
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
     * 清理AI输出内容
     */
    cleanAIOutput(content) {
        if (!content || typeof content !== 'string') {
            return '<div class="ai-report-content">AI输出内容为空</div>';
        }
        
        // 移除开头的```html标记
        content = content.replace(/^```html\s*/i, '');
        
        // 移除结尾的```标记
        content = content.replace(/\s*```\s*$/i, '');
        
        // 移除多余的换行符，但保留必要的段落结构
        content = content.replace(/\n{3,}/g, '\n\n');
        
        // 检查内容完整性
        const hasCompleteStructure = this.checkContentCompleteness(content);
        
        if (!hasCompleteStructure) {
            console.warn('⚠️ AI输出内容可能不完整，建议重新生成');
        }
        
        // 确保内容以HTML标签开始
        if (!content.trim().startsWith('<')) {
            // 如果内容不是HTML格式，包装成HTML
            content = `<div class="ai-report-content">${content}</div>`;
        }
        
        return content.trim();
    }

    /**
     * 更新Token使用情况
     */
    updateTokenUsage(usage) {
        // 通过全局事件通知ReportGenerator更新Token显示
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tokenUsageUpdate', {
                detail: usage
            }));
        }
        
        console.log('📊 Token使用情况已更新:', usage);
    }
    
    /**
     * 检查AI输出内容的完整性
     */
    checkContentCompleteness(content) {
        if (!content || content.length < 100) {
            return false;
        }
        
        // 检查基本结构
        const hasBasicStructure = content.includes('<') || content.includes('学生') || content.includes('分析');
        
        // 检查是否有实质内容（不只是标题）
        const hasSubstantialContent = content.length > 500;
        
        // 检查是否有学生相关分析
        const hasStudentContent = content.includes('学生') || content.includes('表现') || content.includes('评价');
        
        return hasBasicStructure && hasSubstantialContent && hasStudentContent;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalyzer;
} else {
    window.AIAnalyzer = AIAnalyzer;
}
