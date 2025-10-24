/**
 * Excel文件读取器工具
 * 用于解析和分析Excel文件内容
 */

class ExcelReader {
    constructor() {
        this.workbook = null;
        this.data = {};
    }

    /**
     * 读取Excel文件
     * @param {File} file - Excel文件
     * @returns {Promise<Object>} 解析后的数据
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: 'array' });
                    this.parseWorkbook();
                    resolve(this.data);
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
     * 解析工作簿
     */
    parseWorkbook() {
        this.data = {
            sheetNames: this.workbook.SheetNames,
            sheets: {}
        };

        // 解析每个工作表
        this.workbook.SheetNames.forEach(sheetName => {
            const worksheet = this.workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            this.data.sheets[sheetName] = {
                raw: jsonData,
                json: XLSX.utils.sheet_to_json(worksheet),
                range: worksheet['!ref']
            };
        });
    }

    /**
     * 获取指定工作表的数据
     * @param {string} sheetName - 工作表名称
     * @returns {Array} 工作表数据
     */
    getSheetData(sheetName) {
        return this.data.sheets[sheetName] || null;
    }

    /**
     * 获取所有工作表名称
     * @returns {Array} 工作表名称列表
     */
    getSheetNames() {
        return this.data.sheetNames || [];
    }

    /**
     * 分析课堂活动数据结构
     * @returns {Object} 分析结果
     */
    analyzeActivityData() {
        const analysis = {
            hasData: false,
            studentRecords: [],
            subjects: new Set(),
            dates: new Set(),
            totalRecords: 0,
            studentCount: 0,
            structure: {
                columns: [],
                sampleRow: null
            }
        };

        // 查找可能包含课堂活动数据的工作表
        const possibleSheets = this.findActivitySheets();
        
        if (possibleSheets.length === 0) {
            return analysis;
        }

        const mainSheet = possibleSheets[0];
        const sheetData = this.getSheetData(mainSheet);
        
        if (!sheetData || !sheetData.json || sheetData.json.length === 0) {
            return analysis;
        }

        analysis.hasData = true;
        analysis.totalRecords = sheetData.json.length;
        
        // 分析数据结构
        if (sheetData.json.length > 0) {
            analysis.structure.columns = Object.keys(sheetData.json[0]);
            analysis.structure.sampleRow = sheetData.json[0];
        }

        // 分析学生记录
        sheetData.json.forEach(row => {
            // 尝试识别学生ID/座号
            const studentId = this.extractStudentId(row);
            if (studentId) {
                analysis.studentRecords.push({
                    studentId: studentId,
                    studentName: this.extractStudentName(row),
                    subject: this.extractSubject(row),
                    date: this.extractDate(row),
                    points: this.extractPoints(row),
                    activity: this.extractActivity(row),
                    raw: row
                });

                if (studentId) analysis.studentCount++;
                if (row.学科) analysis.subjects.add(row.学科);
                if (row.日期) analysis.dates.add(row.日期);
            }
        });

        analysis.subjects = Array.from(analysis.subjects);
        analysis.dates = Array.from(analysis.dates);

        return analysis;
    }

    /**
     * 分析学生名单数据结构
     * @returns {Object} 分析结果
     */
    analyzeRosterData() {
        const analysis = {
            hasData: false,
            students: [],
            totalStudents: 0,
            structure: {
                columns: [],
                sampleRow: null
            }
        };

        // 查找可能包含学生名单数据的工作表
        const possibleSheets = this.findRosterSheets();
        
        if (possibleSheets.length === 0) {
            return analysis;
        }

        const mainSheet = possibleSheets[0];
        const sheetData = this.getSheetData(mainSheet);
        
        if (!sheetData || !sheetData.json || sheetData.json.length === 0) {
            return analysis;
        }

        analysis.hasData = true;
        analysis.totalStudents = sheetData.json.length;
        
        // 分析数据结构
        if (sheetData.json.length > 0) {
            analysis.structure.columns = Object.keys(sheetData.json[0]);
            analysis.structure.sampleRow = sheetData.json[0];
        }

        // 分析学生信息
        sheetData.json.forEach(row => {
            const studentId = this.extractStudentId(row);
            const studentName = this.extractStudentName(row);
            
            if (studentId && studentName) {
                analysis.students.push({
                    studentId: studentId,
                    studentName: studentName,
                    raw: row
                });
            }
        });

        return analysis;
    }

    /**
     * 查找可能包含课堂活动数据的工作表
     * @returns {Array} 工作表名称列表
     */
    findActivitySheets() {
        const activityKeywords = ['课堂', '表现', '活动', '记录', '积分', '点名'];
        const possibleSheets = [];

        this.data.sheetNames.forEach(sheetName => {
            if (activityKeywords.some(keyword => sheetName.includes(keyword))) {
                possibleSheets.push(sheetName);
            }
        });

        // 如果没有找到明确的工作表，返回第一个工作表
        if (possibleSheets.length === 0 && this.data.sheetNames.length > 0) {
            possibleSheets.push(this.data.sheetNames[0]);
        }

        return possibleSheets;
    }

    /**
     * 查找可能包含学生名单数据的工作表
     * @returns {Array} 工作表名称列表
     */
    findRosterSheets() {
        const rosterKeywords = ['名单', '学生', '座号', '姓名', '名册'];
        const possibleSheets = [];

        this.data.sheetNames.forEach(sheetName => {
            if (rosterKeywords.some(keyword => sheetName.includes(keyword))) {
                possibleSheets.push(sheetName);
            }
        });

        // 如果没有找到明确的工作表，返回第一个工作表
        if (possibleSheets.length === 0 && this.data.sheetNames.length > 0) {
            possibleSheets.push(this.data.sheetNames[0]);
        }

        return possibleSheets;
    }

    /**
     * 从行数据中提取学生ID
     * @param {Object} row - 行数据
     * @returns {string|null} 学生ID
     */
    extractStudentId(row) {
        const idFields = ['学生座号', '座号', '学号', 'ID', 'id', 'studentId', '学生ID'];
        
        for (const field of idFields) {
            if (row[field] && row[field].toString().trim()) {
                return row[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从行数据中提取学生姓名
     * @param {Object} row - 行数据
     * @returns {string|null} 学生姓名
     */
    extractStudentName(row) {
        const nameFields = ['学生姓名', '姓名', 'name', 'studentName', '学生名字'];
        
        for (const field of nameFields) {
            if (row[field] && row[field].toString().trim()) {
                return row[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从行数据中提取学科
     * @param {Object} row - 行数据
     * @returns {string|null} 学科
     */
    extractSubject(row) {
        const subjectFields = ['学科', '科目', 'subject', '课程'];
        
        for (const field of subjectFields) {
            if (row[field] && row[field].toString().trim()) {
                return row[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从行数据中提取日期
     * @param {Object} row - 行数据
     * @returns {string|null} 日期
     */
    extractDate(row) {
        const dateFields = ['日期', 'date', '时间', 'time'];
        
        for (const field of dateFields) {
            if (row[field] && row[field].toString().trim()) {
                return row[field].toString().trim();
            }
        }
        
        return null;
    }

    /**
     * 从行数据中提取积分
     * @param {Object} row - 行数据
     * @returns {number|null} 积分
     */
    extractPoints(row) {
        const pointsFields = ['积分', '分数', 'points', 'score', '加分'];
        
        for (const field of pointsFields) {
            if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                const points = parseFloat(row[field]);
                if (!isNaN(points)) {
                    return points;
                }
            }
        }
        
        return null;
    }

    /**
     * 从行数据中提取活动描述
     * @param {Object} row - 行数据
     * @returns {string|null} 活动描述
     */
    extractActivity(row) {
        const activityFields = ['活动', '表现', 'activity', '行为', '描述', '备注'];
        
        for (const field of activityFields) {
            if (row[field] && row[field].toString().trim()) {
                return row[field].toString().trim();
            }
        }
        
        return null;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelReader;
} else {
    window.ExcelReader = ExcelReader;
}
