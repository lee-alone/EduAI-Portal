/**
 * 数据处理模块
 * 负责Excel文件解析、数据整合和预处理
 */

class DataProcessor {
    constructor() {
        this.init();
    }

    /**
     * 初始化数据处理功能
     */
    init() {
        this.checkDependencies();
    }

    /**
     * 检查依赖库加载状态
     */
    checkDependencies() {
        console.log('🔍 检查依赖库加载状态...');
        
        // 检查XLSX库
        if (typeof XLSX !== 'undefined') {
            console.log('✅ XLSX库已加载');
        } else {
            console.warn('⚠️ XLSX库未加载，Excel处理功能可能受限');
        }
    }

    /**
     * 处理Excel文件
     */
    async processExcelFiles(activityFile, rosterFile) {
        console.log('📊 开始处理Excel文件...');
        
        // 读取课堂活动数据
        const activityData = await this.readExcelFile(activityFile);
        console.log('✅ 课堂活动数据读取完成');
        
        // 读取学生名单数据
        const rosterData = await this.readExcelFile(rosterFile);
        console.log('✅ 学生名单数据读取完成');
        
        // 整合数据：座号替换为姓名
        const integratedData = this.integrateData(activityData, rosterData);
        console.log('✅ 数据整合完成');
        
        return integratedData;
    }

    /**
     * 读取Excel文件
     */
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 解析所有工作表
                    const sheets = {};
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        sheets[sheetName] = jsonData;
                    });
                    
                    resolve({
                        workbook: workbook,
                        sheets: sheets,
                        sheetNames: workbook.SheetNames
                    });
                } catch (error) {
                    reject(new Error(`Excel文件解析失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 整合数据：将座号替换为姓名
     */
    integrateData(activityData, rosterData) {
        console.log('🔄 开始整合数据...');
        
        // 创建座号-姓名映射表
        const nameMapping = this.createNameMapping(rosterData);
        console.log('📋 姓名映射表创建完成，共', Object.keys(nameMapping).length, '名学生');
        
        // 找到主要的课堂活动数据工作表
        const mainActivitySheet = this.findMainActivitySheet(activityData);
        
        if (!mainActivitySheet) {
            throw new Error('未找到有效的课堂活动数据');
        }
        
        // 整合数据
        const integratedRecords = [];
        const unmatchedRecords = [];
        
        mainActivitySheet.data.forEach(record => {
            const studentId = this.extractStudentId(record);
            const studentName = nameMapping[studentId];
            
            if (studentName) {
                // 成功匹配，创建整合记录
                const integratedRecord = {
                    ...record,
                    studentName: studentName,
                    studentId: studentId,
                    subject: this.extractSubject(record),
                    date: this.extractDate(record),
                    points: this.extractPoints(record),
                    originalData: record
                };
                integratedRecords.push(integratedRecord);
            } else {
                // 未匹配到姓名
                unmatchedRecords.push({
                    ...record,
                    studentId: studentId,
                    reason: '未找到对应姓名'
                });
            }
        });
        
        // 计算班级总人数（从学生名单映射表获取）
        const totalClassSize = Object.keys(nameMapping).length;
        
        return {
            integratedRecords: integratedRecords,
            unmatchedRecords: unmatchedRecords,
            nameMapping: nameMapping,
            totalRecords: mainActivitySheet.data.length,  // 课堂活动记录数
            matchedRecords: integratedRecords.length,    // 成功匹配的活动记录数
            totalClassSize: totalClassSize,             // 班级总人数
            matchRate: (integratedRecords.length / mainActivitySheet.data.length * 100).toFixed(1)
        };
    }

    /**
     * 创建座号-姓名映射表
     */
    createNameMapping(rosterData) {
        const mapping = {};
        
        // 尝试从所有工作表中找到学生名单
        Object.values(rosterData.sheets).forEach(sheetData => {
            if (Array.isArray(sheetData)) {
                sheetData.forEach(row => {
                    const studentId = this.extractStudentId(row);
                    const studentName = this.extractStudentName(row);
                    
                    if (studentId && studentName) {
                        mapping[studentId] = studentName;
                    }
                });
            }
        });
        
        return mapping;
    }

    /**
     * 找到主要的课堂活动数据工作表
     */
    findMainActivitySheet(activityData) {
        const activityKeywords = ['课堂表现', '活动记录', '表现记录', '课堂活动'];
        
        // 按优先级查找工作表
        for (const sheetName of activityData.sheetNames) {
            if (activityKeywords.some(keyword => sheetName.includes(keyword))) {
                const data = activityData.sheets[sheetName];
                if (data && data.length > 0) {
                    return {
                        name: sheetName,
                        data: data
                    };
                }
            }
        }
        
        // 如果没有找到明确的工作表，使用第一个有数据的工作表
        for (const sheetName of activityData.sheetNames) {
            const data = activityData.sheets[sheetName];
            if (data && data.length > 0) {
                return {
                    name: sheetName,
                    data: data
                };
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取学生ID
     */
    extractStudentId(record) {
        const idFields = ['学生座号', '座号', '学号', 'ID', 'id', 'studentId', '学生ID'];
        
        for (const field of idFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取学生姓名
     */
    extractStudentName(record) {
        const nameFields = ['学生姓名', '姓名', 'name', 'studentName', '学生名字'];
        
        for (const field of nameFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取学科信息
     */
    extractSubject(record) {
        const subjectFields = ['科目', '学科', '课程', 'subject', '课程名称'];
        
        for (const field of subjectFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取日期信息
     */
    extractDate(record) {
        const dateFields = ['课堂日期', '日期', 'date', '时间', '上课日期'];
        
        for (const field of dateFields) {
            if (record[field] && record[field].toString().trim()) {
                return record[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从记录中提取积分信息
     */
    extractPoints(record) {
        const pointsFields = ['积分', '分数', 'points', 'score', '加分', '得分'];
        
        for (const field of pointsFields) {
            if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
                const points = parseFloat(record[field]);
                if (!isNaN(points)) {
                    return points;
                }
            }
        }
        
        return null;
    }

    /**
     * 构建学生表现数据
     */
    buildStudentPerformanceData(integratedRecords) {
        const studentData = {};
        
        // 按学生分组统计
        integratedRecords.forEach(record => {
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
                    hasNoScoreRecord: false   // 是否有无积分记录
                };
            }
            
            // 添加记录
            studentData[studentName].records.push({
                subject: record.subject,
                date: record.date,
                points: record.points,
                originalData: record.originalData
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
        
        // 转换Set为Array
        Object.values(studentData).forEach(student => {
            student.subjects = Array.from(student.subjects);
            student.dates = Array.from(student.dates);
        });
        
        const students = Object.values(studentData);
        
        // 按参与度排序，确保所有学生都被包含
        students.sort((a, b) => b.participationCount - a.participationCount);
        
        return {
            students: students,
            totalStudents: Object.keys(studentData).length,
            studentNames: Object.keys(studentData),
            summary: {
                totalRecords: integratedRecords.length,
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
                records: studentData[name].records  // 添加记录数据用于时间分析
            }))
        };
    }

    /**
     * 生成数据摘要
     */
    generateDataSummary(integratedData) {
        const { integratedRecords, unmatchedRecords, totalRecords, matchedRecords, matchRate, totalClassSize } = integratedData;
        
        // 统计学生信息
        const students = new Set();
        const subjects = new Set();
        const dates = new Set();
        let totalPoints = 0;
        
        integratedRecords.forEach(record => {
            if (record.studentName) students.add(record.studentName);
            if (record.subject) subjects.add(record.subject);
            if (record.date) dates.add(record.date);
            if (record.points) totalPoints += parseFloat(record.points) || 0;
        });
        
        return {
            totalRecords: totalRecords,           // 课堂活动记录数
            matchedRecords: matchedRecords,       // 成功匹配的活动记录数
            unmatchedRecords: unmatchedRecords.length,
            matchRate: matchRate,
            totalClassSize: totalClassSize,       // 班级总人数
            activeStudents: students.size,        // 参与活动的学生数
            inactiveStudents: totalClassSize - students.size, // 未参与活动的学生数
            subjects: Array.from(subjects),
            dates: Array.from(dates),
            totalPoints: totalPoints,
            averagePoints: matchedRecords > 0 ? (totalPoints / matchedRecords).toFixed(2) : 0
        };
    }

    /**
     * 调试数据处理结果
     */
    debugDataProcessing(integratedData, summary) {
        console.group('🔍 AI学情分析 - 数据处理结果');
        
        // 统计不同类型的学生表现
        const studentPerformance = this.buildStudentPerformanceData(integratedData.integratedRecords);
        const allCorrectStudents = studentPerformance.studentList.filter(s => s.hasCorrectAnswer && !s.hasIncorrectAnswer && !s.hasNoScoreRecord);
        const allIncorrectStudents = studentPerformance.studentList.filter(s => !s.hasCorrectAnswer && s.hasIncorrectAnswer && !s.hasNoScoreRecord);
        const mixedPerformanceStudents = studentPerformance.studentList.filter(s => s.hasCorrectAnswer && s.hasIncorrectAnswer);
        const noScoreStudents = studentPerformance.studentList.filter(s => s.hasNoScoreRecord);
        
        console.log('📊 数据统计:', {
            课堂活动记录数: summary.totalRecords,
            成功匹配记录数: summary.matchedRecords,
            未匹配记录数: summary.unmatchedRecords,
            匹配率: summary.matchRate + '%',
            班级总人数: summary.totalClassSize,
            参与活动学生数: summary.activeStudents,
            未参与学生数: summary.inactiveStudents,
            涉及学科: summary.subjects,
            总积分: summary.totalPoints,
            平均积分: summary.averagePoints
        });
        
        console.log('🎯 学生表现类型分析:', {
            全部正确学生: allCorrectStudents.length,
            全部错误学生: allIncorrectStudents.length,
            混合表现学生: mixedPerformanceStudents.length,
            无积分记录学生: noScoreStudents.length,
            全部正确学生名单: allCorrectStudents.map(s => s.name),
            全部错误学生名单: allIncorrectStudents.map(s => s.name),
            混合表现学生名单: mixedPerformanceStudents.map(s => s.name),
            无积分记录学生名单: noScoreStudents.map(s => s.name)
        });
        
        console.log('👥 学生名单映射:', integratedData.nameMapping);
        
        console.log('✅ 成功匹配的记录 (前5条):', integratedData.integratedRecords.slice(0, 5));
        
        if (integratedData.unmatchedRecords.length > 0) {
            console.log('❌ 未匹配的记录:', integratedData.unmatchedRecords);
        }
        
        console.log('📋 整合后的数据结构示例:', {
            学生姓名: integratedData.integratedRecords[0]?.studentName,
            学生座号: integratedData.integratedRecords[0]?.studentId,
            学科: integratedData.integratedRecords[0]?.subject,
            日期: integratedData.integratedRecords[0]?.date,
            积分: integratedData.integratedRecords[0]?.points,
            原始数据: integratedData.integratedRecords[0]?.originalData
        });
        
        console.groupEnd();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataProcessor;
} else {
    window.DataProcessor = DataProcessor;
}
