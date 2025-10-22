/**
 * 点名功能模块
 * 负责点名相关的所有功能
 */

import { StudentManager } from '../core/students.js';

export class RollcallManager {
    constructor(classroomManager) {
        this.classroom = classroomManager;
        this.studentManager = new StudentManager(classroomManager);
    }

    /**
     * 随机点名单个学生
     * @returns {Object} 点名结果
     */
    randomCall() {
        const selectedStudents = this.studentManager.selectRandomStudents(1);
        
        if (selectedStudents.length === 0) {
            return {
                success: false,
                message: '所有学生都已被点名！',
                students: []
            };
        }

        return {
            success: true,
            message: `学生${selectedStudents[0].id}号 被点到！`,
            students: selectedStudents
        };
    }

    /**
     * 随机点名多个学生
     * @param {number} count 点名数量
     * @returns {Object} 点名结果
     */
    multiCall(count) {
        if (isNaN(count) || count <= 0) {
            return {
                success: false,
                message: '请输入有效的点名人数！',
                students: []
            };
        }

        const uncalledStudents = this.studentManager.getUncalledStudents();
        if (uncalledStudents.length === 0) {
            return {
                success: false,
                message: '所有学生都已被点名！',
                students: []
            };
        }

        const actualCount = Math.min(count, uncalledStudents.length);
        const selectedStudents = this.studentManager.selectRandomStudents(actualCount);

        let message = '';
        if (actualCount < count) {
            message = `剩余未点名学生不足${count}人，将点名${actualCount}人。`;
        } else {
            message = `成功点名 ${actualCount} 名学生！`;
        }

        return {
            success: true,
            message: message,
            students: selectedStudents,
            actualCount: actualCount
        };
    }

    /**
     * 重置点名记录
     */
    resetCall() {
        this.classroom.calledStudents = [];
        this.classroom.saveState();
    }

    /**
     * 获取点名统计信息
     * @returns {Object} 统计信息
     */
    getCallStatistics() {
        const totalStudents = this.classroom.students.length;
        const calledCount = this.classroom.calledStudents.length;
        const uncalledCount = totalStudents - calledCount;
        const callPercentage = ((calledCount / totalStudents) * 100).toFixed(1);

        return {
            totalStudents,
            calledCount,
            uncalledCount,
            callPercentage: callPercentage + '%'
        };
    }

    /**
     * 获取已点名的学生列表
     * @returns {Array} 已点名的学生数组
     */
    getCalledStudentsList() {
        return this.classroom.calledStudents.map(id => {
            const student = this.classroom.students.find(s => s.id === id);
            return {
                id: id,
                name: this.classroom.getStudentName(id),
                student: student
            };
        });
    }

    /**
     * 获取未点名的学生列表
     * @returns {Array} 未点名的学生数组
     */
    getUncalledStudentsList() {
        return this.studentManager.getUncalledStudents();
    }

    /**
     * 检查是否所有学生都已被点名
     * @returns {boolean} 是否全部点名
     */
    isAllStudentsCalled() {
        return this.classroom.calledStudents.length >= this.classroom.TOTAL_STUDENTS;
    }

    /**
     * 获取点名进度
     * @returns {Object} 进度信息
     */
    getCallProgress() {
        const total = this.classroom.TOTAL_STUDENTS;
        const called = this.classroom.calledStudents.length;
        const percentage = ((called / total) * 100).toFixed(1);

        return {
            total,
            called,
            remaining: total - called,
            percentage: parseFloat(percentage)
        };
    }
}

