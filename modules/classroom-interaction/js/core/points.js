/**
 * 积分系统核心模块
 * 负责学生积分管理、积分统计、积分排行榜等功能
 */

class PointsManager {
    constructor() {
        this.pointsData = new Map(); // 存储学生积分数据
        this.pointsLog = []; // 积分变更日志
        this.chart = null; // 积分分布图表
        this.init();
        
        // 页面卸载时清理图表
        window.addEventListener('beforeunload', () => {
            this.destroyChart();
        });
    }

    /**
     * 初始化积分系统
     */
    init() {
        this.loadPointsData();
        // 延迟渲染，确保DOM已加载
        setTimeout(() => {
            this.renderTopStudents();
            this.renderPointsDistributionChart();
            this.renderPointsLog();
        }, 100);
    }

    /**
     * 加载积分数据
     */
    loadPointsData() {
        try {
            const savedData = localStorage.getItem('pointsData');
            const savedLog = localStorage.getItem('pointsLog');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                this.pointsData = new Map(Object.entries(data));
            }
            
            if (savedLog) {
                this.pointsLog = JSON.parse(savedLog);
            }
        } catch (error) {
            // 加载积分数据失败
        }
    }

    /**
     * 保存积分数据
     */
    savePointsData() {
        try {
            const data = Object.fromEntries(this.pointsData);
            localStorage.setItem('pointsData', JSON.stringify(data));
            localStorage.setItem('pointsLog', JSON.stringify(this.pointsLog));
        } catch (error) {
            // 保存积分数据失败
        }
    }

    /**
     * 添加积分
     */
    addPoints(studentId, points, reason, type = 'individual', subject = '') {
        const studentName = window.studentManager?.getStudentName(studentId) || `学生${studentId}`;
        const currentPoints = this.pointsData.get(studentId) || 0;
        const newPoints = currentPoints + points;
        
        this.pointsData.set(studentId, newPoints);
        
        // 记录积分变更日志
        const logEntry = {
            id: Date.now(),
            studentId,
            studentName,
            points,
            reason,
            type,
            subject,
            timestamp: new Date().toLocaleString('zh-CN'),
            totalPoints: newPoints
        };
        
        this.pointsLog.unshift(logEntry);
        
        // 限制日志数量，保留最近100条
        if (this.pointsLog.length > 100) {
            this.pointsLog = this.pointsLog.slice(0, 100);
        }
        
        this.savePointsData();
        this.renderTopStudents();
        this.renderPointsDistributionChart();
        this.renderPointsLog();
        
        // 当学生获得加分时，自动添加到已点名学生列表
        if (points > 0) {
            window.studentManager?.addCalledStudent(studentId);
        }
        
        return newPoints;
    }

    /**
     * 批量添加积分
     */
    addPointsToMultiple(studentIds, points, reason, type = 'group', subject = '') {
        const results = [];
        
        studentIds.forEach(studentId => {
            const newPoints = this.addPoints(studentId, points, reason, type, subject);
            results.push({
                studentId,
                studentName: window.studentManager?.getStudentName(studentId) || `学生${studentId}`,
                points: newPoints
            });
        });
        
        // 批量加分时，为所有获得加分的学生添加到已点名学生列表
        if (points > 0) {
            studentIds.forEach(studentId => {
                window.studentManager?.addCalledStudent(studentId);
            });
        }
        
        return results;
    }

    /**
     * 获取学生积分
     */
    getStudentPoints(studentId) {
        return this.pointsData.get(studentId) || 0;
    }

    /**
     * 获取所有学生积分数据
     */
    getAllPointsData() {
        return Array.from(this.pointsData.entries()).map(([studentId, points]) => ({
            studentId,
            studentName: window.studentManager?.getStudentName(studentId) || `学生${studentId}`,
            points
        }));
    }

    /**
     * 渲染积分排行榜
     */
    renderTopStudents() {
        const container = document.getElementById('top-students-list');
        const statsContainer = document.getElementById('leaderboard-stats');
        
        if (!container) return;

        const allStudents = this.getAllPointsData();
        const sortedStudents = allStudents
            .filter(student => student.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 3);

        if (sortedStudents.length === 0) {
            container.innerHTML = '<li class="text-gray-500 text-center py-4">暂无积分数据</li>';
            if (statsContainer) {
                statsContainer.innerHTML = '';
            }
            return;
        }

        container.innerHTML = '';
        sortedStudents.forEach((student, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-2';
            
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const rankClass = index < 3 ? 'text-yellow-600 font-bold' : 'text-gray-600';
            
            li.innerHTML = `
                <div class="flex items-center">
                    <span class="text-lg mr-3 ${rankClass}">${rankIcon}</span>
                    <div>
                        <div class="font-medium text-gray-800">${student.studentName}</div>
                        <div class="text-sm text-gray-500">${student.studentId}号</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-blue-600">${student.points}分</div>
                </div>
            `;
            
            container.appendChild(li);
        });

        // 更新统计信息
        if (statsContainer) {
            const totalStudents = allStudents.length;
            const studentsWithPoints = allStudents.filter(s => s.points > 0).length;
            const totalPoints = allStudents.reduce((sum, s) => sum + s.points, 0);
            const averagePoints = studentsWithPoints > 0 ? (totalPoints / studentsWithPoints).toFixed(1) : 0;
            
            statsContainer.innerHTML = `
                <div class="text-xs text-gray-500">
                    共${totalStudents}人，${studentsWithPoints}人有积分，平均${averagePoints}分
                </div>
            `;
        }
    }

    /**
     * 销毁图表实例
     */
    destroyChart() {
        try {
            // 销毁当前实例的图表
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            
            // 检查并销毁canvas上可能存在的其他图表实例
            const canvas = document.getElementById('points-distribution-chart');
            if (canvas) {
                // 检查canvas是否有chart属性
                if (canvas.chart) {
                    canvas.chart.destroy();
                    canvas.chart = null;
                }
                
                // 检查Chart.js的全局注册表
                if (typeof Chart !== 'undefined' && Chart.getChart) {
                    const existingChart = Chart.getChart(canvas);
                    if (existingChart) {
                        existingChart.destroy();
                    }
                }
            }
        } catch (error) {
            // 静默处理销毁错误，避免影响其他功能
        }
    }

    /**
     * 渲染学科积分分布图表
     */
    renderPointsDistributionChart() {
        const canvas = document.getElementById('points-distribution-chart');
        const noDataDiv = document.getElementById('chart-no-data');
        
        if (!canvas) return;

        // 统计各学科的积分分布
        const subjectStats = {};
        this.pointsLog.forEach(log => {
            if (log.subject && log.points > 0) {
                if (!subjectStats[log.subject]) {
                    subjectStats[log.subject] = {
                        totalPoints: 0,
                        studentCount: new Set(),
                        logCount: 0
                    };
                }
                subjectStats[log.subject].totalPoints += log.points;
                subjectStats[log.subject].studentCount.add(log.studentId);
                subjectStats[log.subject].logCount++;
            }
        });
        
        if (Object.keys(subjectStats).length === 0) {
            // 销毁现有图表
            this.destroyChart();
            canvas.style.display = 'none';
            if (noDataDiv) {
                noDataDiv.style.display = 'flex';
            }
            return;
        }

        canvas.style.display = 'block';
        if (noDataDiv) {
            noDataDiv.style.display = 'none';
        }

        // 销毁现有图表
        this.destroyChart();
        
        // 完全清理canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 准备学科数据
        const subjects = Object.keys(subjectStats);
        const subjectData = subjects.map(subject => ({
            subject,
            totalPoints: subjectStats[subject].totalPoints,
            studentCount: subjectStats[subject].studentCount.size,
            logCount: subjectStats[subject].logCount
        })).sort((a, b) => b.totalPoints - a.totalPoints);
        
        // 确保canvas完全清理
        try {
            // 重置canvas尺寸以强制重新初始化
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            canvas.width = originalWidth;
            canvas.height = originalHeight;
        } catch (error) {
            // 静默处理
        }
        
        // 创建新的Chart实例
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjectData.map(s => s.subject),
                datasets: [{
                    label: '总积分',
                    data: subjectData.map(s => s.totalPoints),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(34, 197, 94, 0.6)',
                        'rgba(245, 158, 11, 0.6)',
                        'rgba(239, 68, 68, 0.6)',
                        'rgba(147, 51, 234, 0.6)',
                        'rgba(236, 72, 153, 0.6)',
                        'rgba(14, 165, 233, 0.6)',
                        'rgba(16, 185, 129, 0.6)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(147, 51, 234, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(14, 165, 233, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                const data = subjectData[index];
                                return [
                                    `参与学生: ${data.studentCount}人`,
                                    `加分次数: ${data.logCount}次`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * 渲染积分日志
     */
    renderPointsLog() {
        const container = document.getElementById('recent-points-log');
        if (!container) return;

        if (this.pointsLog.length === 0) {
            container.innerHTML = '<li class="text-gray-500 text-center py-4">暂无积分记录</li>';
            return;
        }

        container.innerHTML = '';
        this.pointsLog.slice(0, 10).forEach(log => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-2 bg-white rounded mb-1 text-sm';
            
            const pointsClass = log.points > 0 ? 'text-green-600' : 'text-red-600';
            const pointsText = log.points > 0 ? `+${log.points}` : log.points;
            
            // 学科标签样式
            const subjectTag = log.subject ? 
                `<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium mr-2">${log.subject}</span>` : 
                '';
            
            li.innerHTML = `
                <div class="flex-1">
                    <div class="font-medium text-gray-800 flex items-center">
                        ${log.studentName}
                        ${subjectTag}
                    </div>
                    <div class="text-gray-500 text-xs">${log.reason}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold ${pointsClass}">${pointsText}分</div>
                    <div class="text-gray-400 text-xs">${log.timestamp}</div>
                </div>
            `;
            
            container.appendChild(li);
        });
    }

    /**
     * 清空积分数据
     */
    clearPointsData() {
        // 先销毁图表
        this.destroyChart();
        
        this.pointsData.clear();
        this.pointsLog = [];
        this.savePointsData();
        this.renderTopStudents();
        this.renderPointsDistributionChart();
        this.renderPointsLog();
    }

    /**
     * 导出积分数据
     */
    exportPointsData(startDate = null, endDate = null, includeDetails = true, includeStats = true) {
        const allStudents = this.getAllPointsData();
        const filteredLog = this.filterLogByDate(startDate, endDate);
        
        const exportData = {
            exportTime: new Date().toLocaleString('zh-CN'),
            timeRange: this.getTimeRangeText(startDate, endDate),
            students: allStudents,
            statistics: includeStats ? this.calculateStatistics(allStudents) : null,
            detailedLog: includeDetails ? filteredLog : null
        };
        
        return exportData;
    }

    /**
     * 按日期过滤日志
     */
    filterLogByDate(startDate, endDate) {
        if (!startDate && !endDate) {
            return this.pointsLog;
        }
        
        const filtered = this.pointsLog.filter(log => {
            const logDate = new Date(log.timestamp);
            
            if (startDate) {
                // 修复开始日期比较：使用日期字符串比较，避免时区问题
                const logDateStr = logDate.toISOString().split('T')[0];
                const startDateStr = new Date(startDate).toISOString().split('T')[0];
                if (logDateStr < startDateStr) return false;
            }
            if (endDate) {
                // 修复结束日期比较：使用日期字符串比较，避免时区问题
                const logDateStr = logDate.toISOString().split('T')[0];
                const endDateStr = new Date(endDate).toISOString().split('T')[0];
                if (logDateStr > endDateStr) return false;
            }
            return true;
        });
        
        return filtered;
    }

    /**
     * 获取时间范围文本
     */
    getTimeRangeText(startDate, endDate) {
        if (!startDate && !endDate) return '全部时间';
        if (startDate && endDate) return `${startDate} 至 ${endDate}`;
        if (startDate) return `从 ${startDate} 开始`;
        if (endDate) return `到 ${endDate} 结束`;
        return '全部时间';
    }

    /**
     * 计算统计信息
     */
    calculateStatistics(students) {
        const studentsWithPoints = students.filter(s => s.points > 0);
        const totalStudents = students.length;
        const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
        const averagePoints = studentsWithPoints.length > 0 ? (totalPoints / studentsWithPoints.length).toFixed(1) : 0;
        const maxPoints = Math.max(...students.map(s => s.points));
        const minPoints = Math.min(...students.map(s => s.points));
        
        return {
            totalStudents,
            studentsWithPoints: studentsWithPoints.length,
            totalPoints,
            averagePoints,
            maxPoints,
            minPoints,
            participationRate: totalStudents > 0 ? ((studentsWithPoints.length / totalStudents) * 100).toFixed(1) : 0
        };
    }
}

// 创建全局实例
window.pointsManager = new PointsManager();