/**
 * 主入口文件
 * 负责初始化所有模块和协调各模块之间的交互
 */

import { ClassroomManager } from './core/classroom.js';
import { StudentManager } from './core/students.js';
import { PointsManager } from './core/points.js';
import { RollcallManager } from './features/rollcall.js';
import { ScoringManager } from './features/scoring.js';
import { StorageManager } from './utils/storage.js';
import { showMessage } from './utils/helpers.js';

/**
 * 课堂互动应用主类
 */
export class ClassroomApp {
    constructor() {
        this.classroom = new ClassroomManager();
        this.studentManager = new StudentManager(this.classroom);
        this.pointsManager = new PointsManager(this.classroom);
        this.rollcallManager = new RollcallManager(this.classroom);
        this.scoringManager = new ScoringManager(this.classroom);
        this.storage = new StorageManager();
        
        this.isInitialized = false;
    }

    /**
     * 初始化应用
     */
    async initialize() {
        try {
            console.log('开始初始化课堂互动应用...');
            
            // 初始化课堂数据
            this.classroom.initializeClassroom();
            
            // 从本地存储加载数据
            this.loadStoredData();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 初始化UI
            this.initializeUI();
            
            this.isInitialized = true;
            console.log('课堂互动应用初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            showMessage('应用初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 从本地存储加载数据
     */
    loadStoredData() {
        // 加载课堂状态
        const classroomState = this.storage.loadClassroomState();
        this.classroom.studentPoints = classroomState.studentPoints;
        this.classroom.calledStudents = classroomState.calledStudents;
        this.classroom.pointsLog = classroomState.pointsLog;

        // 加载学生名单
        const studentRoster = this.storage.loadStudentRoster();
        this.classroom.setStudentRoster(studentRoster);

        // 加载活动数据
        const activityData = this.storage.loadActivityData();
        this.classroom.setActivityData(activityData);
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 页面加载完成事件
        document.addEventListener('DOMContentLoaded', () => {
            this.onDOMContentLoaded();
        });

        // 页面卸载前保存数据
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * DOM内容加载完成处理
     */
    onDOMContentLoaded() {
        // 初始化UI组件
        this.initializeUI();
        
        // 渲染初始数据
        this.renderInitialData();
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        // 这里可以添加UI初始化逻辑
        console.log('UI初始化完成');
    }

    /**
     * 渲染初始数据
     */
    renderInitialData() {
        // 渲染积分榜
        this.renderLeaderboard();
        
        // 渲染积分分布图
        this.renderPointsChart();
        
        // 渲染最近记录
        this.renderRecentLog();
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} e 键盘事件
     */
    handleKeyboardShortcuts(e) {
        // Ctrl + Enter: 随机点名
        if (e.ctrlKey && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleRandomCall();
        }
        
        // Ctrl + Shift + Enter: 多人点名
        if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            this.handleMultiCall();
        }
        
        // Escape: 关闭模态框
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    /**
     * 处理随机点名
     */
    handleRandomCall() {
        const result = this.rollcallManager.randomCall();
        if (result.success) {
            showMessage(result.message, 'success');
            this.renderCalledStudents();
        } else {
            showMessage(result.message, 'warning');
        }
    }

    /**
     * 处理多人点名
     */
    handleMultiCall() {
        const countInput = document.getElementById('multi-call-num');
        const count = parseInt(countInput?.value) || 3;
        
        const result = this.rollcallManager.multiCall(count);
        if (result.success) {
            showMessage(result.message, 'success');
            this.renderCalledStudents();
        } else {
            showMessage(result.message, 'warning');
        }
    }

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }

    /**
     * 渲染积分榜
     */
    renderLeaderboard() {
        const leaderboard = this.pointsManager.getPointsLeaderboard(3);
        const topStudentsList = document.getElementById('top-students-list');
        
        if (!topStudentsList) return;

        if (leaderboard.length === 0) {
            topStudentsList.innerHTML = '<li class="text-gray-500 text-center py-4"><i class="fas fa-chart-bar mr-2"></i>暂无积分记录</li>';
            return;
        }

        topStudentsList.innerHTML = leaderboard.map((student, index) => {
            const rankClass = index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            index === 2 ? 'text-orange-500' : 'text-gray-500';
            
            return `
                <li class="flex items-center py-3 px-4 my-2 bg-white rounded-lg shadow-sm border">
                    <div class="flex items-center flex-1">
                        <span class="font-bold text-lg mr-3 ${rankClass}">${index + 1}.</span>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-800">${student.name}</div>
                            <div class="text-sm text-gray-500">${student.id}号</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-blue-600 text-lg">${student.points}分</div>
                    </div>
                </li>
            `;
        }).join('');
    }

    /**
     * 渲染积分分布图
     */
    renderPointsChart() {
        // 这里可以添加图表渲染逻辑
        console.log('渲染积分分布图');
    }

    /**
     * 渲染最近记录
     */
    renderRecentLog() {
        const recentLog = this.pointsManager.getRecentPointsLog(3);
        const recentPointsLog = document.getElementById('recent-points-log');
        
        if (!recentPointsLog) return;

        if (recentLog.length === 0) {
            recentPointsLog.innerHTML = '<li class="text-gray-500">暂无加分记录</li>';
            return;
        }

        recentPointsLog.innerHTML = recentLog.map(log => `
            <li class="py-2 border-b last:border-b-0 text-sm text-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <span class="font-medium text-blue-600">${log.timestamp}</span>
                        <span class="text-gray-500 mx-1">-</span>
                        <span class="font-semibold">${log.studentId}号 ${this.classroom.getStudentName(log.studentId)}</span>
                    </div>
                    <div class="text-right">
                        <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">${log.subject || '未指定学科'}</span>
                        <span class="font-bold text-green-600">+${log.points}分</span>
                    </div>
                </div>
                <div class="mt-1 text-gray-600">
                    <i class="fas fa-comment mr-1"></i>${log.reason}
                </div>
            </li>
        `).join('');
    }

    /**
     * 渲染已点名学生
     */
    renderCalledStudents() {
        const calledStudents = this.rollcallManager.getCalledStudentsList();
        const calledStudentsList = document.getElementById('called-students-list');
        
        if (!calledStudentsList) return;

        if (calledStudents.length === 0) {
            calledStudentsList.innerHTML = '<li class="text-gray-500">暂无点名记录</li>';
            return;
        }

        const statistics = this.rollcallManager.getCallStatistics();
        const studentsList = calledStudents.map(s => `学生${s.id}号`).join('、');
        
        calledStudentsList.innerHTML = `
            <div class="mb-2 text-sm text-gray-600">
                已点名 ${statistics.calledCount}/${statistics.totalStudents} 人 (${statistics.callPercentage})
            </div>
            <div class="text-gray-700 text-sm leading-relaxed">
                ${studentsList}
            </div>
        `;
    }

    /**
     * 保存所有数据
     */
    saveAllData() {
        // 保存课堂状态
        this.storage.saveClassroomState({
            studentPoints: this.classroom.studentPoints,
            calledStudents: this.classroom.calledStudents,
            pointsLog: this.classroom.pointsLog
        });

        // 保存学生名单
        this.storage.saveStudentRoster(this.classroom.studentRoster);

        // 保存活动数据
        this.storage.saveActivityData(this.classroom.activityData);
    }

    /**
     * 获取应用实例
     * @returns {ClassroomApp} 应用实例
     */
    static getInstance() {
        if (!ClassroomApp.instance) {
            ClassroomApp.instance = new ClassroomApp();
        }
        return ClassroomApp.instance;
    }
}

// 创建全局应用实例
const app = ClassroomApp.getInstance();

// 自动初始化应用
app.initialize();

// 导出应用实例
export default app;
