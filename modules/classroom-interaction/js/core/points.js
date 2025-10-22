/**
 * 积分系统模块
 * 负责积分管理和计算
 */

export class PointsManager {
    constructor(classroomManager) {
        this.classroom = classroomManager;
    }

    /**
     * 添加个人积分
     * @param {number} studentId 学生ID
     * @param {number} points 积分
     * @param {string} reason 原因
     * @param {string} subject 学科
     * @returns {boolean} 是否成功
     */
    addIndividualPoints(studentId, points, reason, subject = '未指定学科') {
        if (!this.validatePoints(points)) {
            return false;
        }

        if (!this.classroom.validateStudentId) {
            return false;
        }

        this.classroom.addPoints(studentId, points, reason, subject);
        return true;
    }

    /**
     * 添加小组积分
     * @param {Array} studentIds 学生ID数组
     * @param {number} points 积分
     * @param {string} reason 原因
     * @param {string} subject 学科
     * @returns {boolean} 是否成功
     */
    addGroupPoints(studentIds, points, reason, subject = '未指定学科') {
        if (!this.validatePoints(points)) {
            return false;
        }

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return false;
        }

        this.classroom.addPointsToGroup(studentIds, points, reason, subject);
        return true;
    }

    /**
     * 验证积分值
     * @param {number} points 积分值
     * @returns {boolean} 是否有效
     */
    validatePoints(points) {
        return !isNaN(points) && 
               points >= 0 && 
               points % 0.5 === 0;
    }

    /**
     * 获取学生总积分
     * @param {number} studentId 学生ID
     * @returns {number} 总积分
     */
    getTotalPoints(studentId) {
        return this.classroom.studentPoints[studentId] || 0;
    }

    /**
     * 获取积分排行榜
     * @param {number} limit 显示数量
     * @returns {Array} 排行榜数据
     */
    getPointsLeaderboard(limit = 10) {
        return this.classroom.getLeaderboard(limit);
    }

    /**
     * 获取积分分布数据
     * @returns {Object} 分布数据
     */
    getPointsDistribution() {
        const studentsWithPoints = Object.entries(this.classroom.studentPoints)
            .map(([id, points]) => ({ 
                id: parseInt(id), 
                name: this.classroom.getStudentName(parseInt(id)), 
                points 
            }))
            .filter(student => student.points > 0)
            .sort((a, b) => b.points - a.points);

        return {
            totalStudents: studentsWithPoints.length,
            students: studentsWithPoints,
            totalPoints: studentsWithPoints.reduce((sum, s) => sum + s.points, 0),
            averagePoints: studentsWithPoints.length > 0 
                ? (studentsWithPoints.reduce((sum, s) => sum + s.points, 0) / studentsWithPoints.length).toFixed(1)
                : 0
        };
    }

    /**
     * 获取最近的积分记录
     * @param {number} limit 显示数量
     * @returns {Array} 积分记录数组
     */
    getRecentPointsLog(limit = 5) {
        return this.classroom.pointsLog
            .slice(-limit)
            .reverse();
    }

    /**
     * 根据时间范围过滤积分记录
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {Array} 过滤后的积分记录
     */
    getPointsLogByDateRange(startDate, endDate) {
        return this.classroom.pointsLog.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }

    /**
     * 获取积分统计信息
     * @returns {Object} 统计信息
     */
    getPointsStatistics() {
        const allPoints = Object.values(this.classroom.studentPoints);
        const studentsWithPoints = allPoints.filter(points => points > 0);
        
        return {
            totalStudents: this.classroom.students.length,
            studentsWithPoints: studentsWithPoints.length,
            totalPoints: allPoints.reduce((sum, points) => sum + points, 0),
            averagePoints: studentsWithPoints.length > 0 
                ? (studentsWithPoints.reduce((sum, points) => sum + points, 0) / studentsWithPoints.length).toFixed(1)
                : 0,
            maxPoints: Math.max(...allPoints, 0),
            minPoints: Math.min(...allPoints.filter(p => p > 0), 0)
        };
    }

    /**
     * 重置积分数据
     */
    resetPoints() {
        this.classroom.studentPoints = {};
        this.classroom.pointsLog = [];
        this.classroom.saveState();
    }
}

