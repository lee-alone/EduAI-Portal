/**
 * 课堂核心管理模块
 * 负责课堂基础数据管理和状态维护
 */

export class ClassroomManager {
    constructor() {
        this.TOTAL_STUDENTS = 55;
        this.students = [];
        this.studentPoints = {};
        this.calledStudents = [];
        this.pointsLog = [];
        this.studentRoster = {};
        this.activityData = [];
    }

    /**
     * 初始化课堂数据
     */
    initializeClassroom() {
        console.log('initializeClassroom: 开始初始化课堂...');
        
        // 初始化学生数组
        for (let i = 1; i <= this.TOTAL_STUDENTS; i++) {
            this.students.push({ 
                id: i, 
                name: this.getStudentName(i) 
            });
            this.studentPoints[i] = 0;
        }
        
        // 从本地存储加载状态
        this.loadState();
        
        console.log('initializeClassroom: 课堂初始化完成。');
    }

    /**
     * 获取学生姓名
     * @param {number} id 学生ID
     * @returns {string} 学生姓名
     */
    getStudentName(id) {
        return this.studentRoster[id] || `学生${id}`;
    }

    /**
     * 保存状态到本地存储
     */
    saveState() {
        localStorage.setItem('classroomState', JSON.stringify({
            studentPoints: this.studentPoints,
            calledStudents: this.calledStudents,
            pointsLog: this.pointsLog
        }));
    }

    /**
     * 从本地存储加载状态
     */
    loadState() {
        const savedState = localStorage.getItem('classroomState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.studentPoints = state.studentPoints || {};
            this.calledStudents = state.calledStudents || [];
            this.pointsLog = state.pointsLog || [];
        }
    }

    /**
     * 添加学生积分
     * @param {number} studentId 学生ID
     * @param {number} points 积分
     * @param {string} reason 原因
     * @param {string} subject 学科
     */
    addPoints(studentId, points, reason, subject = '未指定学科') {
        this.studentPoints[studentId] = (this.studentPoints[studentId] || 0) + points;
        
        this.pointsLog.push({
            studentId: studentId,
            reason: reason,
            points: points,
            timestamp: new Date().toLocaleString(),
            subject: subject
        });
        
        this.saveState();
    }

    /**
     * 批量添加学生积分
     * @param {Array} studentIds 学生ID数组
     * @param {number} points 积分
     * @param {string} reason 原因
     * @param {string} subject 学科
     */
    addPointsToGroup(studentIds, points, reason, subject = '未指定学科') {
        studentIds.forEach(studentId => {
            this.addPoints(studentId, points, reason, subject);
        });
    }

    /**
     * 获取积分排行榜
     * @param {number} limit 显示数量限制
     * @returns {Array} 排行榜数据
     */
    getLeaderboard(limit = 10) {
        return Object.entries(this.studentPoints)
            .map(([id, points]) => ({ 
                id: parseInt(id), 
                name: this.getStudentName(parseInt(id)), 
                points 
            }))
            .filter(student => student.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const totalStudents = this.students.length;
        const studentsWithPoints = Object.values(this.studentPoints).filter(points => points > 0).length;
        const totalPoints = Object.values(this.studentPoints).reduce((sum, points) => sum + points, 0);
        const averagePoints = studentsWithPoints > 0 ? (totalPoints / studentsWithPoints).toFixed(1) : 0;
        const calledStudents = this.calledStudents.length;
        
        return {
            totalStudents,
            studentsWithPoints,
            totalPoints,
            averagePoints,
            calledStudents,
            participationRate: ((calledStudents / totalStudents) * 100).toFixed(1) + '%'
        };
    }

    /**
     * 设置学生名单
     * @param {Object} roster 学生名单对象
     */
    setStudentRoster(roster) {
        this.studentRoster = roster;
    }

    /**
     * 设置活动数据
     * @param {Array} data 活动数据
     */
    setActivityData(data) {
        this.activityData = data;
    }

    /**
     * 重置课堂数据
     */
    resetClassroom() {
        this.calledStudents = [];
        this.studentPoints = {};
        this.pointsLog = [];
        this.saveState();
    }
}

