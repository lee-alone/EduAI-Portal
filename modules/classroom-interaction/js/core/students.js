/**
 * 学生管理模块
 * 负责学生数据管理和操作
 */

export class StudentManager {
    constructor(classroomManager) {
        this.classroom = classroomManager;
    }

    /**
     * 随机选择学生
     * @param {number} count 选择数量
     * @returns {Array} 选中的学生数组
     */
    selectRandomStudents(count = 1) {
        const uncalledStudents = this.classroom.students.filter(
            s => !this.classroom.calledStudents.includes(s.id)
        );
        
        if (uncalledStudents.length === 0) {
            return [];
        }

        const actualCount = Math.min(count, uncalledStudents.length);
        const selectedStudents = [];
        const studentsToChoose = [...uncalledStudents];

        for (let i = 0; i < actualCount; i++) {
            const randomIndex = Math.floor(Math.random() * studentsToChoose.length);
            const selectedStudent = studentsToChoose[randomIndex];
            selectedStudents.push(selectedStudent);
            this.classroom.calledStudents.push(selectedStudent.id);
            studentsToChoose.splice(randomIndex, 1);
        }

        this.classroom.saveState();
        return selectedStudents;
    }

    /**
     * 根据范围选择学生
     * @param {number} start 起始座号
     * @param {number} end 结束座号
     * @param {number} step 间隔
     * @returns {Array} 选中的学生ID数组
     */
    selectStudentsByRange(start, end, step = 1) {
        const students = [];
        for (let i = start; i <= end; i += step) {
            if (i <= this.classroom.TOTAL_STUDENTS) {
                students.push(i);
            }
        }
        return students;
    }

    /**
     * 根据模板选择学生
     * @param {string} template 模板名称
     * @returns {Array} 选中的学生ID数组
     */
    selectStudentsByTemplate(template) {
        const students = [];
        
        switch(template) {
            case 'front-row':
                for (let i = 1; i <= 10; i++) students.push(i);
                break;
            case 'back-row':
                for (let i = 46; i <= 55; i++) students.push(i);
                break;
            case 'left-side':
                for (let i = 1; i <= 55; i += 5) students.push(i);
                break;
            case 'right-side':
                for (let i = 5; i <= 55; i += 5) students.push(i);
                break;
            case 'odd-numbers':
                for (let i = 1; i <= 55; i += 2) students.push(i);
                break;
            case 'even-numbers':
                for (let i = 2; i <= 55; i += 2) students.push(i);
                break;
        }
        
        return students;
    }

    /**
     * 验证学生ID是否有效
     * @param {number} studentId 学生ID
     * @returns {boolean} 是否有效
     */
    validateStudentId(studentId) {
        return !isNaN(studentId) && 
               studentId > 0 && 
               studentId <= this.classroom.TOTAL_STUDENTS;
    }

    /**
     * 检查学生是否已被点名
     * @param {number} studentId 学生ID
     * @returns {boolean} 是否已被点名
     */
    isStudentCalled(studentId) {
        return this.classroom.calledStudents.includes(studentId);
    }

    /**
     * 获取学生积分
     * @param {number} studentId 学生ID
     * @returns {number} 学生积分
     */
    getStudentPoints(studentId) {
        return this.classroom.studentPoints[studentId] || 0;
    }

    /**
     * 获取学生的加分记录
     * @param {number} studentId 学生ID
     * @returns {Array} 加分记录数组
     */
    getStudentPointsLog(studentId) {
        return this.classroom.pointsLog.filter(log => log.studentId === studentId);
    }

    /**
     * 获取未点名的学生
     * @returns {Array} 未点名的学生数组
     */
    getUncalledStudents() {
        return this.classroom.students.filter(
            s => !this.classroom.calledStudents.includes(s.id)
        );
    }

    /**
     * 获取已点名的学生
     * @returns {Array} 已点名的学生数组
     */
    getCalledStudents() {
        return this.classroom.students.filter(
            s => this.classroom.calledStudents.includes(s.id)
        );
    }
}

