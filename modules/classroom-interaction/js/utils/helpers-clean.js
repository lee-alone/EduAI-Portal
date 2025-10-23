/**
 * 辅助工具模块
 * 提供通用的辅助函数和工具方法
 */

class HelperManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化辅助工具
     */
    init() {
        // 延迟绑定全局事件，确保DOM已加载
        setTimeout(() => {
            this.bindGlobalEvents();
        }, 200);
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 模态框关闭事件
        this.bindModalCloseEvents();
        
        // 折叠面板事件
        this.bindCollapseEvents();
        
        // 导出功能事件
        this.bindExportEvents();
    }

    /**
     * 绑定模态框关闭事件
     */
    bindModalCloseEvents() {
        // 通用模态框关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.style.display = 'none';
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay[style*="flex"]');
                if (openModal) {
                    openModal.style.display = 'none';
                }
            }
        });
    }

    /**
     * 绑定折叠面板事件
     */
    bindCollapseEvents() {
        // 导出功能折叠
        const exportToggle = document.getElementById('export-toggle-header');
        const exportContent = document.getElementById('export-content');
        const exportChevron = document.getElementById('export-chevron');
        
        if (exportToggle && exportContent && exportChevron) {
            exportToggle.addEventListener('click', () => {
                const isHidden = exportContent.style.display === 'none';
                exportContent.style.display = isHidden ? 'block' : 'none';
                exportChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }

        // 最近加分记录折叠
        const recentLogToggle = document.getElementById('recent-log-toggle-header');
        const recentLogContent = document.getElementById('recent-log-content');
        const recentLogChevron = document.getElementById('recent-log-chevron');
        
        if (recentLogToggle && recentLogContent && recentLogChevron) {
            recentLogToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = recentLogContent.style.display === 'none';
                recentLogContent.style.display = isHidden ? 'block' : 'none';
                recentLogChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }
    }

    /**
     * 绑定导出功能事件
     */
    bindExportEvents() {
        // 导出时间范围选择
        const exportTimeBtns = document.querySelectorAll('.export-time-btn');
        exportTimeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                exportTimeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const timeRange = btn.id.replace('export-', '').replace('-btn', '');
                this.handleExportTimeRange(timeRange);
            });
        });

        // 导出按钮
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExportData());
        }

        // 班级人数设置
        const applyClassSizeBtn = document.getElementById('apply-class-size-btn');
        if (applyClassSizeBtn) {
            applyClassSizeBtn.addEventListener('click', () => this.handleClassSizeChange());
        }
    }

    /**
     * 处理导出时间范围
     */
    handleExportTimeRange(timeRange) {
        const customDateRange = document.getElementById('custom-date-range');
        
        if (timeRange === 'custom') {
            customDateRange.style.display = 'block';
        } else {
            customDateRange.style.display = 'none';
        }
    }

    /**
     * 处理导出数据
     */
    handleExportData() {
        try {
            // 获取时间范围
            const activeTimeBtn = document.querySelector('.export-time-btn.active');
            const timeRange = activeTimeBtn?.id.replace('export-', '').replace('-btn', '') || 'today';
            
            let startDate = null;
            let endDate = null;
            
            if (timeRange === 'custom') {
                startDate = document.getElementById('export-start-date')?.value;
                endDate = document.getElementById('export-end-date')?.value;
            } else {
                const dates = this.getTimeRangeDates(timeRange);
                startDate = dates.start;
                endDate = dates.end;
            }
            
            // 导出数据
            const exportData = window.pointsManager?.exportPointsData(startDate, endDate, true, true);
            
            if (!exportData) {
                window.classroomManager?.showMessage('导出数据失败', 'error');
                return;
            }
            
            // 生成Excel文件
            this.generateExcelFile(exportData);
            
            window.classroomManager?.showMessage('数据导出成功', 'success');
        } catch (error) {
            window.classroomManager?.showMessage('导出数据失败', 'error');
        }
    }

    /**
     * 获取时间范围日期
     */
    getTimeRangeDates(timeRange) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        switch (timeRange) {
            case 'today':
                return {
                    start: this.formatDate(startOfDay),
                    end: this.formatDate(today)
                };
            case 'week':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
                return {
                    start: this.formatDate(startOfWeek),
                    end: this.formatDate(today)
                };
            case 'month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    start: this.formatDate(startOfMonth),
                    end: this.formatDate(today)
                };
            default:
                return {
                    start: null,
                    end: null
                };
        }
    }

    /**
     * 格式化日期
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * 生成Excel文件
     */
    generateExcelFile(data) {
        try {
            const workbook = XLSX.utils.book_new();
            
            // 检查数据完整性
            if (!data) {
                throw new Error('导出数据为空');
            }
            
            // 1. 课堂表现记录表（主要数据，用于AI分析）
            if (data.detailedLog && data.detailedLog.length > 0) {
                const performanceData = this.formatPerformanceData(data.detailedLog);
                const performanceSheet = XLSX.utils.json_to_sheet(performanceData);
                XLSX.utils.book_append_sheet(workbook, performanceSheet, '课堂表现记录');
            } else {
                // 即使没有详细日志，也创建一个空的工作表
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无课堂表现记录数据' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '课堂表现记录');
            }
            
            // 2. 学生积分汇总表（增强版，包含时间和科目信息）
            if (data.detailedLog && data.detailedLog.length > 0) {
                const studentSummary = this.generateStudentSummary(data.detailedLog);
                const studentsSheet = XLSX.utils.json_to_sheet(studentSummary);
                XLSX.utils.book_append_sheet(workbook, studentsSheet, '学生积分汇总');
            } else {
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无学生积分数据' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '学生积分汇总');
            }
            
            // 3. 统计信息表
            if (data.statistics) {
                const statsSheet = XLSX.utils.json_to_sheet([data.statistics]);
                XLSX.utils.book_append_sheet(workbook, statsSheet, '统计信息');
            } else {
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无统计信息' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '统计信息');
            }
            
            // 4. 学科表现分析表
            if (data.detailedLog && data.detailedLog.length > 0) {
                const subjectAnalysis = this.generateSubjectAnalysis(data.detailedLog);
                const subjectSheet = XLSX.utils.json_to_sheet(subjectAnalysis);
                XLSX.utils.book_append_sheet(workbook, subjectSheet, '学科表现分析');
            } else {
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无学科表现数据' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '学科表现分析');
            }
            
            // 5. 学生表现趋势表
            if (data.detailedLog && data.detailedLog.length > 0) {
                const trendData = this.generateTrendData(data.detailedLog);
                const trendSheet = XLSX.utils.json_to_sheet(trendData);
                XLSX.utils.book_append_sheet(workbook, trendSheet, '学生表现趋势');
            } else {
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无学生表现趋势数据' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '学生表现趋势');
            }
            
            // 6. 时间段表现分析表
            if (data.detailedLog && data.detailedLog.length > 0) {
                const timeAnalysis = this.generateTimeAnalysis(data.detailedLog);
                const timeSheet = XLSX.utils.json_to_sheet(timeAnalysis);
                XLSX.utils.book_append_sheet(workbook, timeSheet, '时间段表现分析');
            } else {
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无时间段表现数据' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '时间段表现分析');
            }
            
            // 7. 学科优势分析表
            if (data.detailedLog && data.detailedLog.length > 0) {
                const subjectAdvantage = this.generateSubjectAdvantageAnalysis(data.detailedLog);
                const advantageSheet = XLSX.utils.json_to_sheet(subjectAdvantage);
                XLSX.utils.book_append_sheet(workbook, advantageSheet, '学科优势分析');
            } else {
                const emptySheet = XLSX.utils.json_to_sheet([{ '提示': '暂无学科优势数据' }]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, '学科优势分析');
            }
            
            // 导出文件
            const fileName = `课堂表现数据_${data.timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 格式化课堂表现数据（用于AI分析）
     */
    formatPerformanceData(detailedLog) {
        return detailedLog.map(log => {
            // 解析时间戳
            const timestamp = new Date(log.timestamp);
            const date = timestamp.toLocaleDateString('zh-CN');
            const time = timestamp.toLocaleTimeString('zh-CN', { hour12: false });
            
            // 分析时间段
            const timePeriod = this.analyzeTimePeriod(timestamp);
            
            // 分析表现类型
            const performanceType = this.analyzePerformanceType(log.reason);
            
            // 分析参与方式
            const participationMethod = this.analyzeParticipationMethod(log.reason, log.type);
            
            // 分析学习状态
            const learningState = this.analyzeLearningState(log.reason, log.points);
            
            // 分析学科优势
            const subjectAdvantage = this.analyzeSubjectAdvantage(log.subject, log.points);
            
            return {
                '学生座号': parseInt(log.studentId),
                '课堂日期': date,
                '点评时间': time,
                '时间段': timePeriod,
                '科目': log.subject || '未指定',
                '表现分数': log.points,
                '表现内容': log.reason,
                '表现类型': performanceType,
                '参与方式': participationMethod,
                '学习状态': learningState,
                '学科优势': subjectAdvantage,
                '加分类型': log.type === 'individual' ? '个人' : '集体',
                '累计积分': log.totalPoints,
                '星期': this.getWeekDay(timestamp),
                '课堂阶段': this.analyzeClassStage(timestamp)
            };
        });
    }

    /**
     * 分析表现类型
     */
    analyzePerformanceType(reason) {
        const reasonLower = reason.toLowerCase();
        
        if (reasonLower.includes('回答') || reasonLower.includes('答题')) {
            return '答题表现';
        } else if (reasonLower.includes('发言') || reasonLower.includes('讨论')) {
            return '课堂参与';
        } else if (reasonLower.includes('帮助') || reasonLower.includes('互助')) {
            return '互助行为';
        } else if (reasonLower.includes('创新') || reasonLower.includes('独特')) {
            return '创新表现';
        } else if (reasonLower.includes('认真') || reasonLower.includes('专注')) {
            return '学习态度';
        } else {
            return '其他表现';
        }
    }

    /**
     * 分析参与方式
     */
    analyzeParticipationMethod(reason, type) {
        const reasonLower = reason.toLowerCase();
        
        if (reasonLower.includes('主动') || reasonLower.includes('举手')) {
            return '主动参与';
        } else if (reasonLower.includes('点名') || reasonLower.includes('提问')) {
            return '点名回答';
        } else if (type === 'group' || reasonLower.includes('小组') || reasonLower.includes('集体')) {
            return '小组合作';
        } else {
            return '其他方式';
        }
    }

    /**
     * 分析学习状态
     */
    analyzeLearningState(reason, points) {
        const reasonLower = reason.toLowerCase();
        
        if (points >= 1) {
            return '优秀';
        } else if (points >= 0.5) {
            return '良好';
        } else if (points > 0) {
            return '一般';
        } else {
            return '需改进';
        }
    }

    /**
     * 分析时间段
     */
    analyzeTimePeriod(timestamp) {
        const hour = timestamp.getHours();
        
        if (hour >= 6 && hour < 12) {
            return '上午';
        } else if (hour >= 12 && hour < 14) {
            return '中午';
        } else if (hour >= 14 && hour < 18) {
            return '下午';
        } else if (hour >= 18 && hour < 22) {
            return '晚上';
        } else {
            return '其他时间';
        }
    }

    /**
     * 分析学科优势
     */
    analyzeSubjectAdvantage(subject, points) {
        if (!subject || subject === '未指定') {
            return '未分类';
        }
        
        if (points >= 1) {
            return '优势学科';
        } else if (points >= 0.5) {
            return '表现良好';
        } else if (points > 0) {
            return '有待提高';
        } else {
            return '需要关注';
        }
    }

    /**
     * 获取星期
     */
    getWeekDay(timestamp) {
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return weekDays[timestamp.getDay()];
    }

    /**
     * 分析课堂阶段
     */
    analyzeClassStage(timestamp) {
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        
        // 根据时间判断课堂阶段
        if (hour >= 8 && hour < 9) {
            return '第一节课';
        } else if (hour >= 9 && hour < 10) {
            return '第二节课';
        } else if (hour >= 10 && hour < 11) {
            return '第三节课';
        } else if (hour >= 11 && hour < 12) {
            return '第四节课';
        } else if (hour >= 14 && hour < 15) {
            return '第五节课';
        } else if (hour >= 15 && hour < 16) {
            return '第六节课';
        } else if (hour >= 16 && hour < 17) {
            return '第七节课';
        } else {
            return '其他时间';
        }
    }

    /**
     * 生成学科表现分析
     */
    generateSubjectAnalysis(detailedLog) {
        const subjectStats = {};
        
        detailedLog.forEach(log => {
            const subject = log.subject || '未指定';
            if (!subjectStats[subject]) {
                subjectStats[subject] = {
                    '学科': subject,
                    '总参与次数': 0,
                    '总积分': 0,
                    '平均积分': 0,
                    '优秀表现次数': 0,
                    '良好表现次数': 0,
                    '一般表现次数': 0,
                    '上午表现次数': 0,
                    '下午表现次数': 0,
                    '上午平均分': 0,
                    '下午平均分': 0,
                    '学科优势等级': ''
                };
            }
            
            subjectStats[subject].总参与次数++;
            subjectStats[subject].总积分 += log.points;
            
            // 分析时间段表现
            const timestamp = new Date(log.timestamp);
            const hour = timestamp.getHours();
            if (hour >= 6 && hour < 12) {
                subjectStats[subject].上午表现次数++;
                subjectStats[subject].上午平均分 += log.points;
            } else if (hour >= 14 && hour < 18) {
                subjectStats[subject].下午表现次数++;
                subjectStats[subject].下午平均分 += log.points;
            }
            
            if (log.points >= 1) {
                subjectStats[subject].优秀表现次数++;
            } else if (log.points >= 0.5) {
                subjectStats[subject].良好表现次数++;
            } else {
                subjectStats[subject].一般表现次数++;
            }
        });
        
        // 计算平均积分和时间段表现
        Object.values(subjectStats).forEach(stat => {
            stat.平均积分 = stat.总参与次数 > 0 ? (stat.总积分 / stat.总参与次数).toFixed(2) : 0;
            stat.上午平均分 = stat.上午表现次数 > 0 ? (stat.上午平均分 / stat.上午表现次数).toFixed(2) : 0;
            stat.下午平均分 = stat.下午表现次数 > 0 ? (stat.下午平均分 / stat.下午表现次数).toFixed(2) : 0;
            
            // 分析学科优势等级
            const avgScore = parseFloat(stat.平均积分);
            if (avgScore >= 0.8) {
                stat.学科优势等级 = '优势学科';
            } else if (avgScore >= 0.5) {
                stat.学科优势等级 = '表现良好';
            } else if (avgScore >= 0.3) {
                stat.学科优势等级 = '有待提高';
            } else {
                stat.学科优势等级 = '需要关注';
            }
        });
        
        return Object.values(subjectStats);
    }

    /**
     * 生成学生表现趋势数据
     */
    generateTrendData(detailedLog) {
        const studentTrends = {};
        
        detailedLog.forEach(log => {
            const studentId = log.studentId;
            if (!studentTrends[studentId]) {
                studentTrends[studentId] = {
                    '学生座号': parseInt(studentId),
                    '总参与次数': 0,
                    '总积分': 0,
                    '平均积分': 0,
                    '上午参与次数': 0,
                    '下午参与次数': 0,
                    '上午平均分': 0,
                    '下午平均分': 0,
                    '优势学科': '',
                    '待提高学科': '',
                    '最近表现': '',
                    '表现趋势': '',
                    '学科分布': {},
                    '时间段表现': ''
                };
            }
            
            studentTrends[studentId].总参与次数++;
            studentTrends[studentId].总积分 += log.points;
            
            // 分析时间段表现
            const timestamp = new Date(log.timestamp);
            const hour = timestamp.getHours();
            if (hour >= 6 && hour < 12) {
                studentTrends[studentId].上午参与次数++;
                studentTrends[studentId].上午平均分 += log.points;
            } else if (hour >= 14 && hour < 18) {
                studentTrends[studentId].下午参与次数++;
                studentTrends[studentId].下午平均分 += log.points;
            }
            
            // 记录学科分布
            const subject = log.subject || '未指定';
            if (!studentTrends[studentId].学科分布[subject]) {
                studentTrends[studentId].学科分布[subject] = {
                    count: 0,
                    totalPoints: 0,
                    avgPoints: 0
                };
            }
            studentTrends[studentId].学科分布[subject].count++;
            studentTrends[studentId].学科分布[subject].totalPoints += log.points;
        });
        
        // 计算平均积分和趋势
        Object.values(studentTrends).forEach(trend => {
            trend.平均积分 = trend.总参与次数 > 0 ? (trend.总积分 / trend.总参与次数).toFixed(2) : 0;
            trend.上午平均分 = trend.上午参与次数 > 0 ? (trend.上午平均分 / trend.上午参与次数).toFixed(2) : 0;
            trend.下午平均分 = trend.下午参与次数 > 0 ? (trend.下午平均分 / trend.下午参与次数).toFixed(2) : 0;
            
            // 分析学科优势
            const subjectStats = Object.entries(trend.学科分布).map(([subject, data]) => ({
                subject,
                avgPoints: data.count > 0 ? (data.totalPoints / data.count).toFixed(2) : 0,
                count: data.count
            })).sort((a, b) => parseFloat(b.avgPoints) - parseFloat(a.avgPoints));
            
            if (subjectStats.length > 0) {
                const bestSubject = subjectStats[0];
                const worstSubject = subjectStats[subjectStats.length - 1];
                
                trend.优势学科 = bestSubject.avgPoints >= 0.5 ? bestSubject.subject : '无明显优势';
                trend.待提高学科 = worstSubject.avgPoints < 0.5 ? worstSubject.subject : '表现均衡';
            }
            
            // 分析时间段表现
            const morningAvg = parseFloat(trend.上午平均分);
            const afternoonAvg = parseFloat(trend.下午平均分);
            if (morningAvg > afternoonAvg + 0.2) {
                trend.时间段表现 = '上午表现更好';
            } else if (afternoonAvg > morningAvg + 0.2) {
                trend.时间段表现 = '下午表现更好';
            } else {
                trend.时间段表现 = '表现均衡';
            }
            
            // 分析趋势（简化版）
            if (trend.平均积分 >= 0.8) {
                trend.表现趋势 = '持续优秀';
            } else if (trend.平均积分 >= 0.5) {
                trend.表现趋势 = '稳步提升';
            } else if (trend.平均积分 >= 0.3) {
                trend.表现趋势 = '有待提高';
            } else {
                trend.表现趋势 = '需要关注';
            }
            
            // 最近表现
            if (trend.总积分 >= 5) {
                trend.最近表现 = '表现积极';
            } else if (trend.总积分 >= 2) {
                trend.最近表现 = '表现一般';
            } else {
                trend.最近表现 = '参与较少';
            }
        });
        
        return Object.values(studentTrends);
    }

    /**
     * 生成时间段表现分析
     */
    generateTimeAnalysis(detailedLog) {
        const timeStats = {
            '上午': { 参与次数: 0, 总积分: 0, 平均积分: 0, 优秀次数: 0, 良好次数: 0 },
            '下午': { 参与次数: 0, 总积分: 0, 平均积分: 0, 优秀次数: 0, 良好次数: 0 },
            '中午': { 参与次数: 0, 总积分: 0, 平均积分: 0, 优秀次数: 0, 良好次数: 0 },
            '晚上': { 参与次数: 0, 总积分: 0, 平均积分: 0, 优秀次数: 0, 良好次数: 0 }
        };
        
        detailedLog.forEach(log => {
            const timestamp = new Date(log.timestamp);
            const hour = timestamp.getHours();
            let timePeriod = '';
            
            if (hour >= 6 && hour < 12) {
                timePeriod = '上午';
            } else if (hour >= 12 && hour < 14) {
                timePeriod = '中午';
            } else if (hour >= 14 && hour < 18) {
                timePeriod = '下午';
            } else if (hour >= 18 && hour < 22) {
                timePeriod = '晚上';
            }
            
            if (timePeriod && timeStats[timePeriod]) {
                timeStats[timePeriod].参与次数++;
                timeStats[timePeriod].总积分 += log.points;
                
                if (log.points >= 1) {
                    timeStats[timePeriod].优秀次数++;
                } else if (log.points >= 0.5) {
                    timeStats[timePeriod].良好次数++;
                }
            }
        });
        
        // 计算平均积分
        Object.values(timeStats).forEach(stat => {
            stat.平均积分 = stat.参与次数 > 0 ? (stat.总积分 / stat.参与次数).toFixed(2) : 0;
        });
        
        return Object.entries(timeStats).map(([period, stats]) => ({
            '时间段': period,
            ...stats
        }));
    }

    /**
     * 生成学科优势分析
     */
    generateSubjectAdvantageAnalysis(detailedLog) {
        const studentSubjectStats = {};
        
        detailedLog.forEach(log => {
            const studentId = log.studentId;
            const subject = log.subject || '未指定';
            const key = `${studentId}_${subject}`;
            
            if (!studentSubjectStats[key]) {
                studentSubjectStats[key] = {
                    '学生座号': parseInt(studentId),
                    '学科': subject,
                    '参与次数': 0,
                    '总积分': 0,
                    '平均积分': 0,
                    '学科优势等级': '',
                    '时间段表现': ''
                };
            }
            
            studentSubjectStats[key].参与次数++;
            studentSubjectStats[key].总积分 += log.points;
        });
        
        // 计算平均积分和优势等级
        Object.values(studentSubjectStats).forEach(stat => {
            stat.平均积分 = stat.参与次数 > 0 ? (stat.总积分 / stat.参与次数).toFixed(2) : 0;
            
            const avgScore = parseFloat(stat.平均积分);
            if (avgScore >= 0.8) {
                stat.学科优势等级 = '优势学科';
            } else if (avgScore >= 0.5) {
                stat.学科优势等级 = '表现良好';
            } else if (avgScore >= 0.3) {
                stat.学科优势等级 = '有待提高';
            } else {
                stat.学科优势等级 = '需要关注';
            }
        });
        
        return Object.values(studentSubjectStats);
    }

    /**
     * 生成学生积分汇总（包含时间和科目信息）
     */
    generateStudentSummary(detailedLog) {
        const studentSummary = {};
        
        detailedLog.forEach(log => {
            const studentId = log.studentId;
            if (!studentSummary[studentId]) {
                studentSummary[studentId] = {
                    '学生座号': parseInt(studentId),
                    '总积分': 0,
                    '总参与次数': 0,
                    '平均积分': 0,
                    '上午积分': 0,
                    '下午积分': 0,
                    '上午参与次数': 0,
                    '下午参与次数': 0,
                    '优势学科': '',
                    '待提高学科': '',
                    '最近表现时间': '',
                    '最近表现科目': '',
                    '学科分布': {},
                    '时间段表现': '',
                    '表现趋势': ''
                };
            }
            
            studentSummary[studentId].总积分 += log.points;
            studentSummary[studentId].总参与次数++;
            
            // 分析时间段
            const timestamp = new Date(log.timestamp);
            const hour = timestamp.getHours();
            if (hour >= 6 && hour < 12) {
                studentSummary[studentId].上午积分 += log.points;
                studentSummary[studentId].上午参与次数++;
            } else if (hour >= 14 && hour < 18) {
                studentSummary[studentId].下午积分 += log.points;
                studentSummary[studentId].下午参与次数++;
            }
            
            // 记录学科分布
            const subject = log.subject || '未指定';
            if (!studentSummary[studentId].学科分布[subject]) {
                studentSummary[studentId].学科分布[subject] = {
                    count: 0,
                    totalPoints: 0,
                    avgPoints: 0,
                    lastTime: ''
                };
            }
            studentSummary[studentId].学科分布[subject].count++;
            studentSummary[studentId].学科分布[subject].totalPoints += log.points;
            studentSummary[studentId].学科分布[subject].lastTime = log.timestamp;
            
            // 更新最近表现信息
            if (!studentSummary[studentId].最近表现时间 || 
                new Date(log.timestamp) > new Date(studentSummary[studentId].最近表现时间)) {
                studentSummary[studentId].最近表现时间 = log.timestamp;
                studentSummary[studentId].最近表现科目 = subject;
            }
        });
        
        // 计算统计信息
        Object.values(studentSummary).forEach(student => {
            student.平均积分 = student.总参与次数 > 0 ? (student.总积分 / student.总参与次数).toFixed(2) : 0;
            
            // 分析学科优势
            const subjectStats = Object.entries(student.学科分布).map(([subject, data]) => ({
                subject,
                avgPoints: data.count > 0 ? (data.totalPoints / data.count).toFixed(2) : 0,
                count: data.count,
                lastTime: data.lastTime
            })).sort((a, b) => parseFloat(b.avgPoints) - parseFloat(a.avgPoints));
            
            if (subjectStats.length > 0) {
                const bestSubject = subjectStats[0];
                const worstSubject = subjectStats[subjectStats.length - 1];
                
                student.优势学科 = bestSubject.avgPoints >= 0.5 ? bestSubject.subject : '无明显优势';
                student.待提高学科 = worstSubject.avgPoints < 0.5 ? worstSubject.subject : '表现均衡';
            }
            
            // 分析时间段表现
            const morningAvg = student.上午参与次数 > 0 ? (student.上午积分 / student.上午参与次数).toFixed(2) : 0;
            const afternoonAvg = student.下午参与次数 > 0 ? (student.下午积分 / student.下午参与次数).toFixed(2) : 0;
            
            if (parseFloat(morningAvg) > parseFloat(afternoonAvg) + 0.2) {
                student.时间段表现 = '上午表现更好';
            } else if (parseFloat(afternoonAvg) > parseFloat(morningAvg) + 0.2) {
                student.时间段表现 = '下午表现更好';
            } else {
                student.时间段表现 = '表现均衡';
            }
            
            // 分析表现趋势
            const avgScore = parseFloat(student.平均积分);
            if (avgScore >= 0.8) {
                student.表现趋势 = '持续优秀';
            } else if (avgScore >= 0.5) {
                student.表现趋势 = '稳步提升';
            } else if (avgScore >= 0.3) {
                student.表现趋势 = '有待提高';
            } else {
                student.表现趋势 = '需要关注';
            }
            
            // 格式化最近表现时间
            if (student.最近表现时间) {
                const lastTime = new Date(student.最近表现时间);
                student.最近表现时间 = lastTime.toLocaleString('zh-CN');
            }
            
            // 将学科分布转换为字符串格式，便于Excel显示
            const subjectDistribution = Object.entries(student.学科分布)
                .map(([subject, data]) => `${subject}:${data.count}次(${data.count > 0 ? (data.totalPoints / data.count).toFixed(2) : 0}分)`)
                .join('; ');
            student.学科分布 = subjectDistribution;
        });
        
        return Object.values(studentSummary);
    }

    /**
     * 处理班级人数变更
     */
    handleClassSizeChange() {
        const classSizeInput = document.getElementById('class-size-input');
        const newSize = parseInt(classSizeInput?.value) || 55;
        
        if (newSize < 1 || newSize > 100) {
            window.classroomManager?.showMessage('班级人数必须在1-100之间', 'warning');
            return;
        }
        
        const currentSize = window.classroomManager?.classSize || 55;
        if (newSize === currentSize) {
            window.classroomManager?.showMessage('班级人数未发生变化', 'info');
            return;
        }
        
        // 如果新人数小于现有人数，显示数据安全警告
        if (newSize < currentSize) {
            this.showDataSafetyWarning(currentSize, newSize);
        }
        
        window.classroomManager?.showClassSizeChangeDialog(newSize);
    }

    /**
     * 显示数据保留策略说明
     */
    showDataSafetyWarning(currentSize, newSize) {
        const warningMessage = `
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-info-circle text-blue-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-blue-800">班级人数变更说明</h3>
                        <div class="mt-2 text-sm text-blue-700">
                            <p>您即将将班级人数从 <strong>${currentSize} 人</strong> 调整为 <strong>${newSize} 人</strong>。</p>
                            <p class="mt-1"><strong>数据保留策略：</strong></p>
                            <ul class="list-disc list-inside mt-2">
                                <li>历史积分数据完整保留，不受影响</li>
                                <li>超出范围学生的历史记录保持不变</li>
                                <li>新操作将使用新的班级人数设置</li>
                                <li>当前会话的已点名学生将被清理</li>
                            </ul>
                            <p class="mt-2 text-blue-600 font-medium">✓ 数据安全，历史记录完整保留</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 在页面上显示说明（临时显示）
        const existingWarning = document.getElementById('data-safety-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        const warningDiv = document.createElement('div');
        warningDiv.id = 'data-safety-warning';
        warningDiv.innerHTML = warningMessage;
        warningDiv.className = 'fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto';
        
        document.body.appendChild(warningDiv);
        
        // 5秒后自动移除说明
        setTimeout(() => {
            if (document.body.contains(warningDiv)) {
                document.body.removeChild(warningDiv);
            }
        }, 5000);
    }

    /**
     * 显示消息
     */
    showMessage(message, type = "info", duration = 4000) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // 根据类型设置样式
        const typeStyles = {
            success: 'bg-green-100 border-green-400 text-green-700',
            error: 'bg-red-100 border-red-400 text-red-700',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700'
        };
        
        messageEl.className += ` ${typeStyles[type] || typeStyles.info}`;
        messageEl.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            messageEl.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(messageEl)) {
                    document.body.removeChild(messageEl);
                }
            }, 300);
        }, duration);
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 生成随机ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 格式化时间
     */
    formatTime(date = new Date()) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * 深拷贝对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
}

// 创建全局实例
window.helperManager = new HelperManager();

// 全局折叠函数（备用方案）
function toggleRecentLog() {
    const recentLogContent = document.getElementById('recent-log-content');
    const recentLogChevron = document.getElementById('recent-log-chevron');
    
    if (recentLogContent && recentLogChevron) {
        const isHidden = recentLogContent.style.display === 'none';
        recentLogContent.style.display = isHidden ? 'block' : 'none';
        recentLogChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function toggleExport() {
    const exportContent = document.getElementById('export-content');
    const exportChevron = document.getElementById('export-chevron');
    
    if (exportContent && exportChevron) {
        const isHidden = exportContent.style.display === 'none';
        exportContent.style.display = isHidden ? 'block' : 'none';
        exportChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function toggleAdvancedSettings() {
    const advancedSettingsContent = document.getElementById('advanced-settings-content');
    const advancedSettingsChevron = document.getElementById('advanced-settings-chevron');
    
    if (advancedSettingsContent && advancedSettingsChevron) {
        const isHidden = advancedSettingsContent.style.display === 'none';
        advancedSettingsContent.style.display = isHidden ? 'block' : 'none';
        advancedSettingsChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function toggleAIAdvancedSettings() {
    const aiAdvancedSettingsContent = document.getElementById('ai-advanced-settings-content');
    const aiAdvancedSettingsChevron = document.getElementById('ai-advanced-settings-chevron');
    
    if (aiAdvancedSettingsContent && aiAdvancedSettingsChevron) {
        const isHidden = aiAdvancedSettingsContent.style.display === 'none';
        aiAdvancedSettingsContent.style.display = isHidden ? 'block' : 'none';
        aiAdvancedSettingsChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}