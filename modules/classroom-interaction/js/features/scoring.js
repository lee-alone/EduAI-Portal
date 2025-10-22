/**
 * 评分功能模块
 * 负责快速评分和小组评分功能
 */

import { PointsManager } from '../core/points.js';

export class ScoringManager {
    constructor(classroomManager) {
        this.classroom = classroomManager;
        this.pointsManager = new PointsManager(classroomManager);
        this.currentScoringStudent = null;
        this.currentScoringGroup = [];
    }

    /**
     * 开始单人快速评分
     * @param {number} studentId 学生ID
     */
    startIndividualScoring(studentId) {
        this.currentScoringStudent = studentId;
        this.currentScoringGroup = [];
    }

    /**
     * 开始小组快速评分
     * @param {Array} studentIds 学生ID数组
     */
    startGroupScoring(studentIds) {
        this.currentScoringStudent = null;
        this.currentScoringGroup = studentIds;
    }

    /**
     * 处理答题表现
     * @param {boolean} isCorrect 是否正确
     * @returns {Object} 评分建议
     */
    handleAnswerPerformance(isCorrect) {
        if (isCorrect) {
            return {
                points: 0.5,
                reason: '回答正确'
            };
        } else {
            return {
                points: 0,
                reason: '回答错误'
            };
        }
    }

    /**
     * 处理小组表现
     * @param {string} performance 表现类型
     * @returns {Object} 评分建议
     */
    handleGroupPerformance(performance) {
        switch(performance) {
            case 'excellent':
                return {
                    points: 1,
                    reason: '小组表现优秀，答案正确'
                };
            case 'good':
                return {
                    points: 0.5,
                    reason: '小组表现良好'
                };
            case 'poor':
                return {
                    points: 0,
                    reason: '小组表现不佳'
                };
            default:
                return {
                    points: 0.5,
                    reason: '小组表现一般'
                };
        }
    }

    /**
     * 确认单人评分
     * @param {number} points 积分
     * @param {string} reason 原因
     * @param {string} subject 学科
     * @returns {Object} 评分结果
     */
    confirmIndividualScoring(points, reason, subject = '未指定学科') {
        if (!this.currentScoringStudent) {
            return {
                success: false,
                message: '没有正在评分的学生'
            };
        }

        if (!this.pointsManager.validatePoints(points)) {
            return {
                success: false,
                message: '积分值无效'
            };
        }

        const success = this.pointsManager.addIndividualPoints(
            this.currentScoringStudent, 
            points, 
            reason, 
            subject
        );

        if (success) {
            const studentName = this.classroom.getStudentName(this.currentScoringStudent);
            return {
                success: true,
                message: points > 0 
                    ? `学生${this.currentScoringStudent}号 已加 ${points} 分！`
                    : `学生${this.currentScoringStudent}号 未获得加分`,
                studentName: studentName,
                points: points
            };
        } else {
            return {
                success: false,
                message: '评分失败'
            };
        }
    }

    /**
     * 确认小组评分
     * @param {number} points 积分
     * @param {string} reason 原因
     * @param {string} subject 学科
     * @returns {Object} 评分结果
     */
    confirmGroupScoring(points, reason, subject = '未指定学科') {
        if (!this.currentScoringGroup || this.currentScoringGroup.length === 0) {
            return {
                success: false,
                message: '没有正在评分的小组'
            };
        }

        if (!this.pointsManager.validatePoints(points)) {
            return {
                success: false,
                message: '积分值无效'
            };
        }

        const success = this.pointsManager.addGroupPoints(
            this.currentScoringGroup, 
            points, 
            reason, 
            subject
        );

        if (success) {
            return {
                success: true,
                message: points > 0 
                    ? `小组 ${this.currentScoringGroup.length} 名学生各加 ${points} 分！`
                    : `小组 ${this.currentScoringGroup.length} 名学生未获得加分`,
                studentCount: this.currentScoringGroup.length,
                points: points
            };
        } else {
            return {
                success: false,
                message: '小组评分失败'
            };
        }
    }

    /**
     * 跳过评分
     */
    skipScoring() {
        this.currentScoringStudent = null;
        this.currentScoringGroup = [];
    }

    /**
     * 获取当前评分状态
     * @returns {Object} 评分状态
     */
    getScoringStatus() {
        return {
            isIndividualScoring: this.currentScoringStudent !== null,
            isGroupScoring: this.currentScoringGroup.length > 0,
            currentStudent: this.currentScoringStudent,
            currentGroup: this.currentScoringGroup
        };
    }

    /**
     * 获取评分建议
     * @param {string} type 评分类型 ('individual' | 'group')
     * @param {string} performance 表现类型
     * @returns {Object} 评分建议
     */
    getScoringSuggestion(type, performance) {
        if (type === 'individual') {
            return this.handleAnswerPerformance(performance === 'correct');
        } else if (type === 'group') {
            return this.handleGroupPerformance(performance);
        }
        
        return {
            points: 0.5,
            reason: '默认评分'
        };
    }
}

