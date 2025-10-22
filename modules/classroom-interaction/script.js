document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Auto-populate current date
    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = today.toLocaleDateString('zh-CN', options);
    }

    // 导出功能相关变量
    let currentExportTimeRange = 'today'; // 当前选择的时间范围
    let exportStartDate = null;
    let exportEndDate = null;

    // Placeholder for AI report generation button
    const generateAiReportBtn = document.getElementById('generate-ai-report-btn');
    if (generateAiReportBtn) {
        generateAiReportBtn.addEventListener('click', () => {
            alert('AI学情报告生成功能待实现！');
            // TODO: Implement AI report generation
        });
    }

    // --- Excel Parsing Logic ---
    let activityData = []; // Stores parsed activity data
    let studentRoster = {}; // Stores parsed student roster (seat_no -> name)

    const activityExcelUpload = document.getElementById('activity-excel-upload');
    const rosterExcelUpload = document.getElementById('roster-excel-upload');

    if (activityExcelUpload) {
        activityExcelUpload.addEventListener('change', (event) => {
            handleFileUpload(event.target.files[0], 'activity');
        });
    }

    if (rosterExcelUpload) {
        rosterExcelUpload.addEventListener('change', (event) => {
            handleFileUpload(event.target.files[0], 'roster');
        });
    }

    function handleFileUpload(file, type) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (type === 'activity') {
                activityData = json;
                console.log('课堂活动数据:', activityData);
                showMessage('课堂活动Excel上传成功！', 'success');
            } else if (type === 'roster') {
                studentRoster = parseRoster(json);
                console.log('学生名单数据:', studentRoster);
                showMessage('学生名单Excel上传成功！', 'success');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function parseRoster(json) {
        const roster = {};
        // Assuming roster Excel has columns like '座号' and '姓名'
        json.forEach(row => {
            if (row['座号'] && row['姓名']) {
                roster[row['座号']] = row['姓名'];
            }
        });
        return roster;
    }

    // ==================== Utility Functions ====================
    function showMessage(message, type = "info", duration = 4000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-alert ${type}`;
        messageDiv.innerHTML = message;
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.remove();
        }, duration);
    }

    // --- Classroom Interaction Logic ---
    const TOTAL_STUDENTS = 55; // 假设班级总人数
    let students = []; // { id: 1, name: '学生1' }
    let studentPoints = {}; // { 1: 0, 2: 10, ... }
    let calledStudents = []; // [1, 5, 10]
    let pointsLog = []; // [{ studentId: 1, reason: '回答正确', points: 0.5, timestamp: '...', subject: '数学' }]
    
    // 快速评分相关变量
    let currentScoringStudent = null; // 当前正在评分的学生
    let currentScoringGroup = []; // 当前正在评分的小组
    let scoringQueue = []; // 评分队列
    
    // 小组选择相关变量
    let selectedStudents = []; // 当前选中的学生ID列表
    let currentSelectionMode = 'range'; // 当前选择模式：range, template, manual
    
    // 模态框相关变量
    let currentModalStudents = []; // 当前模态框中显示的学生
    let isModalOpen = false; // 模态框是否打开
    
    // 图表相关变量
    let pointsChart = null; // Chart.js实例

    const getStudentName = (id) => studentRoster[id] || `学生${id}`;

    // DOM Elements for Live Interaction
    const singleCallResult = document.getElementById('single-call-result');
    const multiCallResult = document.getElementById('multi-call-result');
    const calledStudentsList = document.getElementById('called-students-list');
    const groupStudentSelection = document.getElementById('group-student-selection');
    const topStudentsList = document.getElementById('top-students-list');
    const recentPointsLog = document.getElementById('recent-points-log');
    
    // 模态框相关元素
    const namingModal = document.getElementById('naming-modal');
    const modalNamingResult = document.getElementById('modal-naming-result');
    const modalQuickScoringBtn = document.getElementById('modal-quick-scoring-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const closeNamingModal = document.getElementById('close-naming-modal');
    
    // 评分模态框相关元素
    const scoringModal = document.getElementById('scoring-modal');
    const groupScoringModal = document.getElementById('group-scoring-modal');
    const modalStudentName = document.getElementById('modal-student-name');
    const modalStudentId = document.getElementById('modal-student-id');
    const modalGroupStudents = document.getElementById('modal-group-students');
    const modalGroupCount = document.getElementById('modal-group-count');
    const modalCorrectAnswerBtn = document.getElementById('modal-correct-answer-btn');
    const modalIncorrectAnswerBtn = document.getElementById('modal-incorrect-answer-btn');
    const modalQuickPoints = document.getElementById('modal-quick-points');
    const modalQuickReason = document.getElementById('modal-quick-reason');
    const modalConfirmScoringBtn = document.getElementById('modal-confirm-scoring-btn');
    const modalSkipScoringBtn = document.getElementById('modal-skip-scoring-btn');
    const modalGroupCorrectBtn = document.getElementById('modal-group-correct-btn');
    const modalGroupPartialBtn = document.getElementById('modal-group-partial-btn');
    const modalGroupPoorBtn = document.getElementById('modal-group-poor-btn');
    const modalGroupQuickPoints = document.getElementById('modal-group-quick-points');
    const modalGroupQuickReason = document.getElementById('modal-group-quick-reason');
    const modalConfirmGroupScoringBtn = document.getElementById('modal-confirm-group-scoring-btn');
    const modalSkipGroupScoringBtn = document.getElementById('modal-skip-group-scoring-btn');
    const closeScoringModal = document.getElementById('close-scoring-modal');
    const closeGroupScoringModal = document.getElementById('close-group-scoring-modal');
    
    // 学科输入相关元素
    const subjectSelect = document.getElementById('subject-select');
    const subjectInput = document.getElementById('subject-input');
    const subjectCustomBtn = document.getElementById('subject-custom-btn');

    // 快速评分相关DOM元素
    const quickScoringSection = document.getElementById('quick-scoring-section');
    const currentStudentName = document.getElementById('current-student-name');
    const currentStudentId = document.getElementById('current-student-id');
    const correctAnswerBtn = document.getElementById('correct-answer-btn');
    const incorrectAnswerBtn = document.getElementById('incorrect-answer-btn');
    const quickPointsSelect = document.getElementById('quick-points');
    const quickReasonInput = document.getElementById('quick-reason');
    const confirmScoringBtn = document.getElementById('confirm-scoring-btn');
    const skipScoringBtn = document.getElementById('skip-scoring-btn');

    // 小组快速评分相关DOM元素
    const groupQuickScoringSection = document.getElementById('group-quick-scoring-section');
    const currentGroupStudents = document.getElementById('current-group-students');
    const currentGroupCount = document.getElementById('current-group-count');
    const groupCorrectBtn = document.getElementById('group-correct-btn');
    const groupPartialBtn = document.getElementById('group-partial-btn');
    const groupPoorBtn = document.getElementById('group-poor-btn');
    const groupQuickPointsSelect = document.getElementById('group-quick-points');
    const groupQuickReasonInput = document.getElementById('group-quick-reason');
    const confirmGroupScoringBtn = document.getElementById('confirm-group-scoring-btn');
    const skipGroupScoringBtn = document.getElementById('skip-group-scoring-btn');

    // 小组选择相关DOM元素
    const rangeSelectionBtn = document.getElementById('range-selection-btn');
    const templateSelectionBtn = document.getElementById('template-selection-btn');
    const manualSelectionBtn = document.getElementById('manual-selection-btn');
    const rangeSelectionMode = document.getElementById('range-selection-mode');
    const templateSelectionMode = document.getElementById('template-selection-mode');
    const manualSelectionMode = document.getElementById('manual-selection-mode');
    const rangeStartInput = document.getElementById('range-start');
    const rangeEndInput = document.getElementById('range-end');
    const rangeStepSelect = document.getElementById('range-step');
    const previewRangeBtn = document.getElementById('preview-range-btn');
    const selectionResult = document.getElementById('selection-result');
    const selectedStudentsDisplay = document.getElementById('selected-students-display');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const selectAllBtn = document.getElementById('select-all-btn');

    function initializeClassroom() {
        console.log('initializeClassroom: 开始初始化课堂...');
        // Initialize students array
        for (let i = 1; i <= TOTAL_STUDENTS; i++) {
            students.push({ id: i, name: getStudentName(i) });
            studentPoints[i] = 0;
        }
        // Load state from localStorage if available
        loadState();
        // Initial render
        console.log('initializeClassroom: 渲染小组学生选择...');
        renderGroupStudentSelection();
        console.log('initializeClassroom: 渲染已点名学生...');
        renderCalledStudents();
        console.log('initializeClassroom: 渲染今日之星...');
        renderTopStudents();
        console.log('initializeClassroom: 渲染积分分布图表...');
        renderPointsDistributionChart();
        console.log('initializeClassroom: 渲染最近加分记录...');
        renderPointsLog();
        console.log('initializeClassroom: 课堂初始化完成。');
    }
    
    // 学科输入切换功能
    function initializeSubjectInput() {
        if (subjectCustomBtn) {
            subjectCustomBtn.addEventListener('click', () => {
                if (subjectInput.style.display === 'none') {
                    subjectInput.style.display = 'block';
                    subjectSelect.style.display = 'none';
                    subjectCustomBtn.innerHTML = '<i class="fas fa-list"></i>';
                    subjectInput.focus();
                } else {
                    subjectInput.style.display = 'none';
                    subjectSelect.style.display = 'block';
                    subjectCustomBtn.innerHTML = '<i class="fas fa-edit"></i>';
                }
            });
        }
        
        // 学科选择变化时同步到输入框
        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => {
                if (subjectSelect.value) {
                    subjectInput.value = subjectSelect.value;
                }
            });
        }
        
        // 输入框变化时同步到选择框
        if (subjectInput) {
            subjectInput.addEventListener('input', () => {
                // 如果输入的内容在选择框中存在，则选中它
                const options = subjectSelect.querySelectorAll('option');
                for (let option of options) {
                    if (option.value === subjectInput.value) {
                        subjectSelect.value = option.value;
                        break;
                    }
                }
            });
        }
    }
    
    // 获取当前学科
    function getCurrentSubject() {
        const selectValue = subjectSelect?.value?.trim();
        const inputValue = subjectInput?.value?.trim();
        return selectValue || inputValue || '';
    }
    
    // 验证学科是否已填写
    function validateSubject() {
        const subject = getCurrentSubject();
        if (!subject) {
            showMessage('请先选择或输入学科！', 'warning');
            return false;
        }
        return true;
    }

    function saveState() {
        localStorage.setItem('classroomState', JSON.stringify({
            studentPoints,
            calledStudents,
            pointsLog
        }));
    }

    function loadState() {
        const savedState = localStorage.getItem('classroomState');
        if (savedState) {
            const state = JSON.parse(savedState);
            studentPoints = state.studentPoints;
            calledStudents = state.calledStudents;
            pointsLog = state.pointsLog;
        }
    }

    function renderGroupStudentSelection() {
        if (!groupStudentSelection) return;
        groupStudentSelection.innerHTML = students.map(s => `
            <label for="group-student-${s.id}" class="inline-flex items-center">
                <input type="checkbox" id="group-student-${s.id}" name="group-student-selection" class="form-checkbox text-blue-600" value="${s.id}">
                <span class="ml-2 text-gray-700">${s.id}号 ${s.name}</span>
            </label>
        `).join('');
    }

    function renderCalledStudents() {
        if (!calledStudentsList) return;
        if (calledStudents.length === 0) {
            calledStudentsList.innerHTML = '<li class="text-gray-500">暂无点名记录</li>';
            return;
        }
        const calledPercentage = Math.round((calledStudents.length / TOTAL_STUDENTS) * 100);
        const studentsList = calledStudents.map(id => `学生${id}号`).join('、');
        calledStudentsList.innerHTML = `
            <div class="mb-2 text-sm text-gray-600">
                已点名 ${calledStudents.length}/${TOTAL_STUDENTS} 人 (${calledPercentage}%)
            </div>
            <div class="text-gray-700 text-sm leading-relaxed">
                ${studentsList}
            </div>
        `;
    }

    function renderTopStudents() {
        if (!topStudentsList) return;
        
        // 只显示有积分的学生（过滤掉0分学生）
        const sortedStudents = Object.entries(studentPoints)
            .map(([id, points]) => ({ id: parseInt(id), name: getStudentName(parseInt(id)), points }))
            .filter(student => student.points > 0) // 只显示有积分的学生
            .sort((a, b) => b.points - a.points)
            .slice(0, 3); // 显示前3名有积分的学生

        // 更新统计信息
        const leaderboardStats = document.getElementById('leaderboard-stats');
        if (leaderboardStats) {
            const totalStudents = Object.keys(studentPoints).length;
            const studentsWithPoints = sortedStudents.length;
            const totalPoints = sortedStudents.reduce((sum, s) => sum + s.points, 0);
            const avgPoints = studentsWithPoints > 0 ? (totalPoints / studentsWithPoints).toFixed(1) : 0;
            
            leaderboardStats.innerHTML = `
                <span>
                    <i class="fas fa-users mr-1"></i>${studentsWithPoints}/${totalStudents}人
                </span>
                <span>
                    <i class="fas fa-chart-line mr-1"></i>平均${avgPoints}分
                </span>
                <span>
                    <i class="fas fa-trophy mr-1"></i>总计${totalPoints}分
                </span>
            `;
        }

        if (sortedStudents.length === 0) {
            topStudentsList.innerHTML = '<li class="text-gray-500 text-center py-4"><i class="fas fa-chart-bar mr-2"></i>暂无积分记录</li>';
            return;
        }

        topStudentsList.innerHTML = sortedStudents.map((s, index) => {
            const rankClass = index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            index === 2 ? 'text-orange-500' : 'text-gray-500';
            const bgClass = index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' :
                            index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' :
                            index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' :
                            'bg-white border-gray-200';
            
            return `
                <li class="flex items-center py-3 px-4 my-2 ${bgClass} rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
                    <div class="flex items-center flex-1">
                        <span class="font-bold text-lg mr-3 ${rankClass}">${index + 1}.</span>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-800">${s.name}</div>
                            <div class="text-sm text-gray-500">${s.id}号</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-blue-600 text-lg">${s.points}分</div>
                        ${index < 3 ? `<div class="text-xs text-gray-500">${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>` : ''}
                    </div>
                </li>
            `;
        }).join('');
    }

    function renderPointsDistributionChart() {
        const chartCanvas = document.getElementById('points-distribution-chart');
        const chartNoData = document.getElementById('chart-no-data');
        
        if (!chartCanvas) return;
        
        // 获取有积分的学生数据
        const studentsWithPoints = Object.entries(studentPoints)
            .map(([id, points]) => ({ id: parseInt(id), name: getStudentName(parseInt(id)), points }))
            .filter(student => student.points > 0)
            .sort((a, b) => b.points - a.points);
        
        if (studentsWithPoints.length === 0) {
            chartCanvas.style.display = 'none';
            chartNoData.style.display = 'flex';
            return;
        }
        
        chartCanvas.style.display = 'block';
        chartNoData.style.display = 'none';
        
        // 销毁现有图表
        if (pointsChart) {
            pointsChart.destroy();
        }
        
        // 准备图表数据
        const labels = studentsWithPoints.slice(0, 10).map(s => `学生${s.id}号`);
        const data = studentsWithPoints.slice(0, 10).map(s => s.points);
        
        // 创建图表
        const ctx = chartCanvas.getContext('2d');
        pointsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '积分',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 215, 0, 0.8)',   // 金色
                        'rgba(192, 192, 192, 0.8)', // 银色
                        'rgba(205, 127, 50, 0.8)',  // 铜色
                        'rgba(59, 130, 246, 0.8)',  // 蓝色
                        'rgba(16, 185, 129, 0.8)', // 绿色
                        'rgba(245, 158, 11, 0.8)', // 橙色
                        'rgba(139, 92, 246, 0.8)', // 紫色
                        'rgba(239, 68, 68, 0.8)',  // 红色
                        'rgba(107, 114, 128, 0.8)', // 灰色
                        'rgba(34, 197, 94, 0.8)'   // 绿色
                    ],
                    borderColor: [
                        'rgba(255, 215, 0, 1)',
                        'rgba(192, 192, 192, 1)',
                        'rgba(205, 127, 50, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(107, 114, 128, 1)',
                        'rgba(34, 197, 94, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '学生积分排行榜',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#6B7280',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#6B7280',
                            font: {
                                size: 10
                            },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    function renderPointsLog() {
        if (!recentPointsLog) return;
        if (pointsLog.length === 0) {
            recentPointsLog.innerHTML = '<li class="text-gray-500">暂无加分记录</li>';
            return;
        }
        // Display last 3 entries
        const displayLog = pointsLog.slice(-3).reverse(); 
        recentPointsLog.innerHTML = displayLog.map(log => `
            <li class="py-2 border-b last:border-b-0 text-sm text-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <span class="font-medium text-blue-600">${log.timestamp}</span>
                        <span class="text-gray-500 mx-1">-</span>
                        <span class="font-semibold">${log.studentId}号 ${getStudentName(log.studentId)}</span>
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

    // ==================== 模态框功能 ====================
    
    // 显示点名结果模态框
    function showNamingModal(students, isMultiple = false) {
        currentModalStudents = students;
        isModalOpen = true;
        
        // 添加页面模糊效果
        document.body.classList.add('modal-open');
        
        // 构建模态框内容
        let modalContent = '';
        if (isMultiple) {
            modalContent = `
                <div class="naming-result-display multiple">
                    <div class="student-list">
                        ${students.map(student => `
                            <div class="student-item">学生${student.id}号</div>
                        `).join('')}
                    </div>
                    <div class="naming-status">${students.length}名学生被点到</div>
                </div>
            `;
        } else {
            const student = students[0];
            modalContent = `
                <div class="naming-result-display">
                    <div class="student-name">学生${student.id}号</div>
                    <div class="student-info">座号：${student.id}</div>
                    <div class="naming-status">被点到</div>
                </div>
            `;
        }
        
        modalNamingResult.innerHTML = modalContent;
        
        // 显示模态框
        namingModal.style.display = 'flex';
        setTimeout(() => {
            namingModal.classList.add('show');
        }, 10);
        
        // 更新快速评分按钮显示
        if (isMultiple) {
            modalQuickScoringBtn.innerHTML = '<i class="fas fa-users mr-2"></i>小组快速评分';
        } else {
            modalQuickScoringBtn.innerHTML = '<i class="fas fa-star mr-2"></i>快速评分';
        }
    }
    
    // 隐藏点名结果模态框
    function hideNamingModal() {
        isModalOpen = false;
        namingModal.classList.remove('show');
        
        // 移除页面模糊效果
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            namingModal.style.display = 'none';
        }, 300);
    }
    
    // 模态框快速评分
    function modalQuickScoring() {
        hideNamingModal();
        
        if (currentModalStudents.length === 1) {
            // 单人快速评分
            showModalQuickScoring(currentModalStudents[0].id);
        } else {
            // 小组快速评分
            const studentIds = currentModalStudents.map(s => s.id);
            showModalGroupQuickScoring(studentIds);
        }
    }
    
    // 显示单人快速评分模态框
    function showModalQuickScoring(studentId) {
        currentScoringStudent = studentId;
        const studentName = getStudentName(studentId);
        
        modalStudentName.textContent = studentName;
        modalStudentId.textContent = `学生${studentId}号`;
        
        // 重置表单
        modalQuickPoints.value = '0.5';
        modalQuickReason.value = '';
        
        // 显示模态框
        scoringModal.style.display = 'flex';
        setTimeout(() => {
            scoringModal.classList.add('show');
        }, 10);
        
        // 自动聚焦到原因输入框
        modalQuickReason.focus();
        
        showMessage(`请为学生${studentId}号 进行评分`, 'info');
    }
    
    // 显示小组快速评分模态框
    function showModalGroupQuickScoring(studentIds) {
        currentScoringGroup = studentIds;
        const studentNames = studentIds.map(id => `学生${id}号`).join('、');
        
        modalGroupStudents.textContent = studentNames;
        modalGroupCount.textContent = `${studentIds.length}人`;
        
        // 重置表单
        modalGroupQuickPoints.value = '0.5';
        modalGroupQuickReason.value = '';
        
        // 显示模态框
        groupScoringModal.style.display = 'flex';
        setTimeout(() => {
            groupScoringModal.classList.add('show');
        }, 10);
        
        // 自动聚焦到原因输入框
        modalGroupQuickReason.focus();
        
        showMessage(`请为小组 ${studentNames} 进行评分`, 'info');
    }
    
    // 隐藏评分模态框
    function hideScoringModal() {
        scoringModal.classList.remove('show');
        setTimeout(() => {
            scoringModal.style.display = 'none';
        }, 300);
    }
    
    // 隐藏小组评分模态框
    function hideGroupScoringModal() {
        groupScoringModal.classList.remove('show');
        setTimeout(() => {
            groupScoringModal.style.display = 'none';
        }, 300);
    }
    
    // ==================== 小组选择功能 ====================
    
    // 切换选择模式
    function switchSelectionMode(mode) {
        currentSelectionMode = mode;
        
        // 隐藏所有模式
        rangeSelectionMode.style.display = 'none';
        templateSelectionMode.style.display = 'none';
        manualSelectionMode.style.display = 'none';
        
        // 更新按钮状态
        document.querySelectorAll('.selection-mode-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
        });
        
        // 显示对应模式
        switch(mode) {
            case 'range':
                rangeSelectionMode.style.display = 'block';
                rangeSelectionBtn.classList.add('active', 'btn-primary');
                rangeSelectionBtn.classList.remove('btn-secondary');
                break;
            case 'template':
                templateSelectionMode.style.display = 'block';
                templateSelectionBtn.classList.add('active', 'btn-primary');
                templateSelectionBtn.classList.remove('btn-secondary');
                break;
            case 'manual':
                manualSelectionMode.style.display = 'block';
                manualSelectionBtn.classList.add('active', 'btn-primary');
                manualSelectionBtn.classList.remove('btn-secondary');
                break;
        }
    }
    
    // 范围选择功能
    function generateRangeSelection() {
        const start = parseInt(rangeStartInput.value) || 1;
        const end = parseInt(rangeEndInput.value) || TOTAL_STUDENTS;
        const step = parseInt(rangeStepSelect.value) || 1;
        
        const students = [];
        for (let i = start; i <= end; i += step) {
            if (i <= TOTAL_STUDENTS) {
                students.push(i);
            }
        }
        
        return students;
    }
    
    // 模板选择功能
    function generateTemplateSelection(template) {
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
    
    // 更新选择结果显示
    function updateSelectionDisplay() {
        if (selectedStudents.length === 0) {
            selectionResult.style.display = 'none';
            return;
        }
        
        selectionResult.style.display = 'block';
        selectedStudentsDisplay.innerHTML = selectedStudents.map(id => `
            <span class="student-tag">
                学生${id}号
                <button class="remove-btn" onclick="removeStudent(${id})">×</button>
            </span>
        `).join('');
    }
    
    // 添加学生到选择列表
    function addStudentsToSelection(studentIds) {
        studentIds.forEach(id => {
            if (!selectedStudents.includes(id)) {
                selectedStudents.push(id);
            }
        });
        selectedStudents.sort((a, b) => a - b);
        updateSelectionDisplay();
    }
    
    // 从选择列表中移除学生
    function removeStudent(studentId) {
        selectedStudents = selectedStudents.filter(id => id !== studentId);
        updateSelectionDisplay();
    }
    
    // 清空选择
    function clearSelection() {
        selectedStudents = [];
        updateSelectionDisplay();
    }
    
    // 全选
    function selectAllStudents() {
        selectedStudents = Array.from({length: TOTAL_STUDENTS}, (_, i) => i + 1);
        updateSelectionDisplay();
    }
    
    // ==================== 快速评分功能 ====================
    
    // 显示单人快速评分界面（使用模态框）
    function showQuickScoring(studentId) {
        showModalQuickScoring(studentId);
    }

    // 显示小组快速评分界面（使用模态框）
    function showGroupQuickScoring(studentIds) {
        showModalGroupQuickScoring(studentIds);
    }

    // 隐藏快速评分界面
    function hideQuickScoring() {
        quickScoringSection.style.display = 'none';
        groupQuickScoringSection.style.display = 'none';
        currentScoringStudent = null;
        currentScoringGroup = [];
    }

    // 处理答题表现按钮点击
    function handleAnswerPerformance(isCorrect) {
        if (isCorrect) {
            quickPointsSelect.value = '0.5';
            quickReasonInput.value = '回答正确';
            quickReasonInput.focus();
        } else {
            quickPointsSelect.value = '0';
            quickReasonInput.value = '回答错误';
            quickReasonInput.focus();
        }
    }

    // 处理小组表现按钮点击
    function handleGroupPerformance(performance) {
        switch(performance) {
            case 'excellent':
                groupQuickPointsSelect.value = '1';
                groupQuickReasonInput.value = '小组表现优秀，答案正确';
                break;
            case 'good':
                groupQuickPointsSelect.value = '0.5';
                groupQuickReasonInput.value = '小组表现良好';
                break;
            case 'poor':
                groupQuickPointsSelect.value = '0';
                groupQuickReasonInput.value = '小组表现不佳';
                break;
        }
        groupQuickReasonInput.focus();
    }

    // Initialize classroom on load
    initializeClassroom();

    // 初始化学科输入功能
    initializeSubjectInput();

    // 初始化小组选择模式
    switchSelectionMode('range');

    // 添加键盘快捷键支持
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter: 随机点名（仅点名，不自动评分）
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            // 验证学科是否已填写
            if (!validateSubject()) {
                return;
            }
            
            const uncalledStudents = students.filter(s => !calledStudents.includes(s.id));
            if (uncalledStudents.length === 0) {
                singleCallResult.textContent = '所有学生都已被点名！';
                showMessage('所有学生都已被点名！', 'info');
                return;
            }
            const randomIndex = Math.floor(Math.random() * uncalledStudents.length);
            const selectedStudent = uncalledStudents[randomIndex];

            calledStudents.push(selectedStudent.id);
            singleCallResult.textContent = `学生${selectedStudent.id}号 被点到！`;
            renderCalledStudents();
            saveState();
            showMessage(`学生${selectedStudent.id}号 被成功点名！`, 'success');
            
            // 显示点名结果模态框
            showNamingModal([selectedStudent], false);
        }
        // Ctrl + Shift + Enter: 多人点名（仅点名，不自动评分）
        if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            // 验证学科是否已填写
            if (!validateSubject()) {
                return;
            }
            
            const numToCall = parseInt(multiCallNumInput.value);
            if (isNaN(numToCall) || numToCall <= 0) {
                multiCallResult.textContent = '请输入有效的点名人数！';
                showMessage('请输入有效的点名人数！', 'warning');
                return;
            }

            let uncalledStudents = students.filter(s => !calledStudents.includes(s.id));
            if (uncalledStudents.length === 0) {
                multiCallResult.textContent = '所有学生都已被点名！';
                showMessage('所有学生都已被点名！', 'info');
                return;
            }

            // 修正逻辑：使用实际可点名人数
            const actualNumToCall = Math.min(numToCall, uncalledStudents.length);
            if (actualNumToCall < numToCall) {
                showMessage(`剩余未点名学生不足${numToCall}人，将点名${actualNumToCall}人。`, 'warning');
            }

            const selectedStudents = [];
            const studentsToChoose = [...uncalledStudents]; // 创建副本避免修改原数组
            
            for (let i = 0; i < actualNumToCall; i++) {
                const randomIndex = Math.floor(Math.random() * studentsToChoose.length);
                const selectedStudent = studentsToChoose[randomIndex];
                selectedStudents.push(selectedStudent);
                calledStudents.push(selectedStudent.id);
                studentsToChoose.splice(randomIndex, 1); // 从副本中移除，避免重复选择
            }

            const resultText = selectedStudents.map(s => `学生${s.id}号`).join('、');
            multiCallResult.textContent = `${resultText} 被点到！`;
            renderCalledStudents();
            saveState();
            showMessage(`成功点名 ${actualNumToCall} 名学生！`, 'success');
            
            // 显示点名结果模态框
            showNamingModal(selectedStudents, true);
        }
        // Enter: 确认评分（在快速评分界面）
        if (e.key === 'Enter' && (quickScoringSection.style.display !== 'none' || groupQuickScoringSection.style.display !== 'none')) {
            e.preventDefault();
            if (quickScoringSection.style.display !== 'none' && confirmScoringBtn) {
                confirmScoringBtn.click();
            } else if (groupQuickScoringSection.style.display !== 'none' && confirmGroupScoringBtn) {
                confirmGroupScoringBtn.click();
            }
        }
        // Escape: 跳过评分
        if (e.key === 'Escape' && (quickScoringSection.style.display !== 'none' || groupQuickScoringSection.style.display !== 'none')) {
            e.preventDefault();
            if (quickScoringSection.style.display !== 'none' && skipScoringBtn) {
                skipScoringBtn.click();
            } else if (groupQuickScoringSection.style.display !== 'none' && skipGroupScoringBtn) {
                skipGroupScoringBtn.click();
            }
        }
    });

    // ==================== 触屏优化功能 ====================
    
    // 触屏手势支持
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // 水平滑动切换选择模式
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // 向右滑动，切换到上一个模式
                switch(currentSelectionMode) {
                    case 'range':
                        switchSelectionMode('manual');
                        break;
                    case 'template':
                        switchSelectionMode('range');
                        break;
                    case 'manual':
                        switchSelectionMode('template');
                        break;
                }
            } else {
                // 向左滑动，切换到下一个模式
                switch(currentSelectionMode) {
                    case 'range':
                        switchSelectionMode('template');
                        break;
                    case 'template':
                        switchSelectionMode('manual');
                        break;
                    case 'manual':
                        switchSelectionMode('range');
                        break;
                }
            }
        }
    });
    
    // 双击快速选择
    let lastClickTime = 0;
    document.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        if (currentTime - lastClickTime < 300) {
            // 双击事件
            if (e.target.classList.contains('template-btn')) {
                const template = e.target.dataset.template;
                const students = generateTemplateSelection(template);
                addStudentsToSelection(students);
                showMessage(`双击快速选择：已选择 ${students.length} 名学生`, 'success');
            }
        }
        lastClickTime = currentTime;
    });
    
    // 长按显示详细信息
    let longPressTimer = null;
    document.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('template-btn')) {
            longPressTimer = setTimeout(() => {
                const template = e.target.dataset.template;
                const students = generateTemplateSelection(template);
                showMessage(`模板预览：将选择 ${students.length} 名学生 (${students.join('、')})`, 'info');
            }, 1000);
        }
    });
    
    document.addEventListener('touchend', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    document.addEventListener('touchmove', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });

    // --- Roll Call System Logic ---
    const randomCallBtn = document.getElementById('random-call-btn');
    const multiCallBtn = document.getElementById('multi-call-btn');
    const multiCallNumInput = document.getElementById('multi-call-num');
    const resetCallBtn = document.getElementById('reset-call-btn');

    // 添加输入验证
    if (multiCallNumInput) {
        multiCallNumInput.addEventListener('input', () => {
            const value = parseInt(multiCallNumInput.value);
            if (isNaN(value) || value <= 0) {
                multiCallNumInput.style.borderColor = 'var(--color-error)';
            } else if (value > TOTAL_STUDENTS) {
                multiCallNumInput.style.borderColor = 'var(--color-warning)';
                showMessage(`建议点名人数不超过班级总人数 ${TOTAL_STUDENTS} 人`, 'warning');
            } else {
                multiCallNumInput.style.borderColor = 'var(--color-gray-300)';
            }
        });
    }

    if (randomCallBtn) {
        randomCallBtn.addEventListener('click', () => {
            // 验证学科是否已填写
            if (!validateSubject()) {
                return;
            }
            
            const uncalledStudents = students.filter(s => !calledStudents.includes(s.id));
            if (uncalledStudents.length === 0) {
                singleCallResult.textContent = '所有学生都已被点名！';
                showMessage('所有学生都已被点名！', 'info');
                return;
            }
            const randomIndex = Math.floor(Math.random() * uncalledStudents.length);
            const selectedStudent = uncalledStudents[randomIndex];

            calledStudents.push(selectedStudent.id);
            singleCallResult.textContent = `学生${selectedStudent.id}号 被点到！`;
            renderCalledStudents();
            saveState();
            showMessage(`学生${selectedStudent.id}号 被成功点名！`, 'success');
            
            // 显示点名结果模态框
            showNamingModal([selectedStudent], false);
        });
    }

    if (multiCallBtn) {
        multiCallBtn.addEventListener('click', () => {
            // 验证学科是否已填写
            if (!validateSubject()) {
                return;
            }
            
            const numToCall = parseInt(multiCallNumInput.value);
            if (isNaN(numToCall) || numToCall <= 0) {
                multiCallResult.textContent = '请输入有效的点名人数！';
                showMessage('请输入有效的点名人数！', 'warning');
                return;
            }

            let uncalledStudents = students.filter(s => !calledStudents.includes(s.id));
            if (uncalledStudents.length === 0) {
                multiCallResult.textContent = '所有学生都已被点名！';
                showMessage('所有学生都已被点名！', 'info');
                return;
            }

            // 修正逻辑：使用实际可点名人数
            const actualNumToCall = Math.min(numToCall, uncalledStudents.length);
            if (actualNumToCall < numToCall) {
                showMessage(`剩余未点名学生不足${numToCall}人，将点名${actualNumToCall}人。`, 'warning');
            }

            const selectedStudents = [];
            const studentsToChoose = [...uncalledStudents]; // 创建副本避免修改原数组
            
            for (let i = 0; i < actualNumToCall; i++) {
                const randomIndex = Math.floor(Math.random() * studentsToChoose.length);
                const selectedStudent = studentsToChoose[randomIndex];
                selectedStudents.push(selectedStudent);
                calledStudents.push(selectedStudent.id);
                studentsToChoose.splice(randomIndex, 1); // 从副本中移除，避免重复选择
            }

            const resultText = selectedStudents.map(s => `学生${s.id}号`).join('、');
            multiCallResult.textContent = `${resultText} 被点到！`;
            renderCalledStudents();
            saveState();
            showMessage(`成功点名 ${actualNumToCall} 名学生！`, 'success');
            
            // 显示点名结果模态框
            showNamingModal(selectedStudents, true);
        });
    }

    if (resetCallBtn) {
        resetCallBtn.addEventListener('click', () => {
            calledStudents = [];
            singleCallResult.textContent = '点名结果将显示在这里';
            multiCallResult.textContent = '点名结果将显示在这里';
            renderCalledStudents();
            saveState();
            hideQuickScoring(); // 隐藏快速评分界面
            showMessage('点名记录已重置！', 'info');
        });
    }

    // ==================== 快速评分事件监听器 ====================
    
    // 单人快速评分事件监听器
    if (correctAnswerBtn) {
        correctAnswerBtn.addEventListener('click', () => handleAnswerPerformance(true));
    }

    if (incorrectAnswerBtn) {
        incorrectAnswerBtn.addEventListener('click', () => handleAnswerPerformance(false));
    }

    if (confirmScoringBtn) {
        confirmScoringBtn.addEventListener('click', () => {
            if (!currentScoringStudent) return;
            
            const points = parseFloat(quickPointsSelect.value);
            const reason = quickReasonInput.value.trim() || '快速评分';
            
            if (points > 0) {
                studentPoints[currentScoringStudent] = (studentPoints[currentScoringStudent] || 0) + points;
                const subject = getCurrentSubject() || '未指定学科';
                pointsLog.push({
                    studentId: currentScoringStudent,
                    reason: reason,
                    points: points,
                    timestamp: new Date().toLocaleString(),
                    subject: subject
                });
                
                renderTopStudents();
                renderPointsDistributionChart();
                renderPointsLog();
                saveState();
                showMessage(`学生${currentScoringStudent}号 已加 ${points} 分！`, 'success');
            } else {
                showMessage(`学生${currentScoringStudent}号 未获得加分`, 'info');
            }
            
            hideQuickScoring();
        });
    }

    if (skipScoringBtn) {
        skipScoringBtn.addEventListener('click', () => {
            hideQuickScoring();
            showMessage('已跳过评分', 'info');
        });
    }

    // 小组快速评分事件监听器
    if (groupCorrectBtn) {
        groupCorrectBtn.addEventListener('click', () => handleGroupPerformance('excellent'));
    }

    if (groupPartialBtn) {
        groupPartialBtn.addEventListener('click', () => handleGroupPerformance('good'));
    }

    if (groupPoorBtn) {
        groupPoorBtn.addEventListener('click', () => handleGroupPerformance('poor'));
    }

    if (confirmGroupScoringBtn) {
        confirmGroupScoringBtn.addEventListener('click', () => {
            if (!currentScoringGroup || currentScoringGroup.length === 0) return;
            
            const points = parseFloat(groupQuickPointsSelect.value);
            const reason = groupQuickReasonInput.value.trim() || '小组快速评分';
            
            const subject = getCurrentSubject() || '未指定学科';
            currentScoringGroup.forEach(studentId => {
                if (points > 0) {
                    studentPoints[studentId] = (studentPoints[studentId] || 0) + points;
                }
                pointsLog.push({
                    studentId: studentId,
                    reason: reason,
                    points: points,
                    timestamp: new Date().toLocaleString(),
                    subject: subject
                });
            });
            
            renderTopStudents();
            renderPointsDistributionChart();
            renderPointsLog();
            saveState();
            
            if (points > 0) {
                showMessage(`小组 ${currentScoringGroup.length} 名学生各加 ${points} 分！`, 'success');
            } else {
                showMessage(`小组 ${currentScoringGroup.length} 名学生未获得加分`, 'info');
            }
            
            hideQuickScoring();
        });
    }

    if (skipGroupScoringBtn) {
        skipGroupScoringBtn.addEventListener('click', () => {
            hideQuickScoring();
            showMessage('已跳过小组评分', 'info');
        });
    }

    // ==================== 小组选择事件监听器 ====================
    
    // 选择模式切换
    if (rangeSelectionBtn) {
        rangeSelectionBtn.addEventListener('click', () => switchSelectionMode('range'));
    }
    
    if (templateSelectionBtn) {
        templateSelectionBtn.addEventListener('click', () => switchSelectionMode('template'));
    }
    
    if (manualSelectionBtn) {
        manualSelectionBtn.addEventListener('click', () => switchSelectionMode('manual'));
    }
    
    // 范围选择预览
    if (previewRangeBtn) {
        previewRangeBtn.addEventListener('click', () => {
            const students = generateRangeSelection();
            if (students.length === 0) {
                showMessage('请设置有效的范围！', 'warning');
                return;
            }
            addStudentsToSelection(students);
            showMessage(`已选择 ${students.length} 名学生`, 'success');
        });
    }
    
    // 模板选择
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('template-btn')) {
            const template = e.target.dataset.template;
            const students = generateTemplateSelection(template);
            addStudentsToSelection(students);
            showMessage(`已选择 ${students.length} 名学生`, 'success');
        }
    });
    
    // 清空选择
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearSelection);
    }
    
    // 全选
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllStudents);
    }
    
    // 范围输入验证
    if (rangeStartInput) {
        rangeStartInput.addEventListener('input', () => {
            const value = parseInt(rangeStartInput.value);
            if (value < 1) rangeStartInput.value = 1;
            if (value > TOTAL_STUDENTS) rangeStartInput.value = TOTAL_STUDENTS;
        });
    }
    
    if (rangeEndInput) {
        rangeEndInput.addEventListener('input', () => {
            const value = parseInt(rangeEndInput.value);
            if (value < 1) rangeEndInput.value = 1;
            if (value > TOTAL_STUDENTS) rangeEndInput.value = TOTAL_STUDENTS;
        });
    }

    // --- Points System Logic ---
    const addIndividualPointsBtn = document.getElementById('add-individual-points-btn');
    const individualStudentIdInput = document.getElementById('individual-student-id');
    const individualPointsInput = document.getElementById('individual-points');
    const individualReasonInput = document.getElementById('individual-reason');

    // 添加座号输入验证
    if (individualStudentIdInput) {
        individualStudentIdInput.addEventListener('input', () => {
            const value = parseInt(individualStudentIdInput.value);
            if (isNaN(value) || value <= 0) {
                individualStudentIdInput.style.borderColor = 'var(--color-error)';
            } else if (value > TOTAL_STUDENTS) {
                individualStudentIdInput.style.borderColor = 'var(--color-warning)';
            } else {
                individualStudentIdInput.style.borderColor = 'var(--color-gray-300)';
            }
        });
    }

    // 添加加分值输入验证
    if (individualPointsInput) {
        individualPointsInput.addEventListener('input', () => {
            const value = parseFloat(individualPointsInput.value);
            if (isNaN(value) || value <= 0) {
                individualPointsInput.style.borderColor = 'var(--color-error)';
            } else if (value % 0.5 !== 0) {
                individualPointsInput.style.borderColor = 'var(--color-warning)';
            } else {
                individualPointsInput.style.borderColor = 'var(--color-gray-300)';
            }
        });
    }

    const addGroupPointsBtn = document.getElementById('add-group-points-btn');
    const groupPointsInput = document.getElementById('group-points');
    const groupReasonInput = document.getElementById('group-reason');

    // 添加小组加分值输入验证
    if (groupPointsInput) {
        groupPointsInput.addEventListener('input', () => {
            const value = parseFloat(groupPointsInput.value);
            if (isNaN(value) || value <= 0) {
                groupPointsInput.style.borderColor = 'var(--color-error)';
            } else if (value % 0.5 !== 0) {
                groupPointsInput.style.borderColor = 'var(--color-warning)';
            } else {
                groupPointsInput.style.borderColor = 'var(--color-gray-300)';
            }
        });
    }

    if (addIndividualPointsBtn) {
        addIndividualPointsBtn.addEventListener('click', () => {
            // 验证学科是否已填写
            if (!validateSubject()) {
                return;
            }
            
            const studentId = parseInt(individualStudentIdInput.value);
            const points = parseFloat(individualPointsInput.value);
            const reason = individualReasonInput.value.trim();

            // 验证座号
            if (isNaN(studentId) || studentId <= 0 || studentId > TOTAL_STUDENTS) {
                showMessage(`请输入有效的学生座号（1-${TOTAL_STUDENTS}）！`, 'warning');
                individualStudentIdInput.focus();
                return;
            }

            // 验证加分值
            if (isNaN(points) || points <= 0) {
                showMessage('请输入有效的加分值（必须大于0）！', 'warning');
                individualPointsInput.focus();
                return;
            }

            // 验证加分值精度（最多保留1位小数）
            if (points % 0.5 !== 0) {
                showMessage('加分值必须是0.5的倍数！', 'warning');
                individualPointsInput.focus();
                return;
            }

            // 验证加分原因
            if (!reason) {
                showMessage('请输入加分原因！', 'warning');
                individualReasonInput.focus();
                return;
            }

            // 检查座号是否在已上传的学生名单中
            if (Object.keys(studentRoster).length > 0 && !studentRoster[studentId]) {
                showMessage(`座号 ${studentId} 不在学生名单中，请检查座号是否正确！`, 'warning');
                individualStudentIdInput.focus();
                return;
            }

            // 确认加分操作
            const studentName = getStudentName(studentId);
            const currentPoints = studentPoints[studentId] || 0;
            const newTotalPoints = currentPoints + points;
            
            if (!confirm(`确认给 ${studentName} (${studentId}号) 加 ${points} 分吗？\n当前积分：${currentPoints}分\n加分后：${newTotalPoints}分`)) {
                return;
            }

            studentPoints[studentId] = newTotalPoints;
            const subject = getCurrentSubject() || '未指定学科';
            pointsLog.push({
                studentId: studentId,
                reason: reason,
                points: points,
                timestamp: new Date().toLocaleString(),
                subject: subject
            });

            renderTopStudents();
            renderPointsDistributionChart();
            renderPointsLog();
            saveState();
            showMessage(`${studentName} (${studentId}号) 已加 ${points} 分！当前总分：${newTotalPoints}分`, 'success');

            // Clear inputs
            individualStudentIdInput.value = '';
            individualPointsInput.value = '0.5';
            individualReasonInput.value = '';
        });
    }

    if (addGroupPointsBtn) {
        addGroupPointsBtn.addEventListener('click', () => {
            // 验证学科是否已填写
            if (!validateSubject()) {
                return;
            }
            
            const points = parseFloat(groupPointsInput.value);
            const reason = groupReasonInput.value.trim();

            // 验证选择的学生
            if (selectedStudents.length === 0) {
                showMessage('请选择至少一名学生！', 'warning');
                return;
            }

            // 验证加分值
            if (isNaN(points) || points <= 0) {
                showMessage('请输入有效的加分值（必须大于0）！', 'warning');
                groupPointsInput.focus();
                return;
            }

            // 验证加分值精度
            if (points % 0.5 !== 0) {
                showMessage('加分值必须是0.5的倍数！', 'warning');
                groupPointsInput.focus();
                return;
            }

            // 验证加分原因
            if (!reason) {
                showMessage('请输入加分原因！', 'warning');
                groupReasonInput.focus();
                return;
            }

            // 检查选中的学生是否在已上传的学生名单中
            if (Object.keys(studentRoster).length > 0) {
                const invalidStudents = selectedStudents.filter(id => !studentRoster[id]);
                if (invalidStudents.length > 0) {
                    showMessage(`座号 ${invalidStudents.join('、')} 不在学生名单中，请检查座号是否正确！`, 'warning');
                    return;
                }
            }

            // 显示确认信息
            const studentNames = selectedStudents.map(id => `学生${id}号`).join('、');
            const currentPoints = selectedStudents.map(id => studentPoints[id] || 0);
            const newTotalPoints = currentPoints.map(cp => cp + points);
            
            const confirmMessage = `确认给以下 ${selectedStudents.length} 名学生各加 ${points} 分吗？\n\n${studentNames}\n\n当前积分：${currentPoints.join('、')}分\n加分后：${newTotalPoints.join('、')}分`;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            // 执行加分操作
            const subject = getCurrentSubject() || '未指定学科';
            selectedStudents.forEach(studentId => {
                studentPoints[studentId] = (studentPoints[studentId] || 0) + points;
                pointsLog.push({
                    studentId: studentId,
                    reason: reason,
                    points: points,
                    timestamp: new Date().toLocaleString(),
                    subject: subject
                });
            });

            renderTopStudents();
            renderPointsDistributionChart();
            renderPointsLog();
            saveState();
            showMessage(`已为 ${selectedStudents.length} 名学生各加 ${points} 分！`, 'success');

            // 清空选择
            clearSelection();
            groupPointsInput.value = '0.5';
            groupReasonInput.value = '';
        });
    }

    // --- Data Export Logic ---
    const topicInput = document.getElementById('topic-input');
    // dateDisplay is already declared globally

    // 旧的导出功能已移除，新的导出功能在文件末尾

    // ==================== AI Analytics Logic ====================
    const aiModelInput = document.getElementById('ai-model-input');
    const customPromptTextarea = document.getElementById('custom-prompt-textarea');
    // generateAiReportBtn is already declared globally
    const aiReportOutput = document.getElementById('ai-report-output');

    // Function to get API key (copied from js/config.js for direct use)
    function getSharedApiKey() {
        const keyParts = ["sk-0560c9a8", "49694436a71c", "1ef4c053505a"];
        return keyParts.join('');
    }

    // Placeholder for API_CONFIG (will be more detailed later)
    const API_CONFIG = {
        deepseek: { url: "https://api.deepseek.com/v1/chat/completions", models: ["deepseek-chat", "deepseek-reasoner"] },
        glm: { url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", models: ["glm-4"] },
        qwen: { url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", models: ["qwen-turbo"] }
    };

    function getApiConfig(model) {
        return Object.values(API_CONFIG).find(config => config.models.includes(model)) || API_CONFIG.deepseek;
    }

    async function safeApiCall(apiUrl, apiKey, payload) {
        try {
            const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${await response.text()}`);
            }
            return await response.json();
        } catch (error) {
            console.error("API call failed:", error);
            throw new Error(`Network or API call failed: ${error.message}`);
        }
    }

    function mergeActivityAndRoster(activityData, studentRoster) {
        const studentReports = {};

        // Initialize reports for all students in the roster
        for (const seatNo in studentRoster) {
            studentReports[seatNo] = {
                seatNo: parseInt(seatNo),
                name: studentRoster[seatNo],
                totalPoints: 0,
                calledCount: 0,
                pointsBreakdown: []
            };
        }

        // Process activity data
        activityData.forEach(row => {
            const seatNo = row['座号']; // Assuming '座号' column in activity Excel
            if (studentReports[seatNo]) {
                studentReports[seatNo].totalPoints = row['总积分'] || 0; // Assuming '总积分' column
                studentReports[seatNo].calledCount = (row['是否被点名'] === '是' ? 1 : 0); // Assuming '是否被点名'
                // For detailed points breakdown, we'd need the points log from the activity Excel
                // For now, we'll just use total points and called status
            }
        });

        // Convert to array and sort by seat number
        return Object.values(studentReports).sort((a, b) => a.seatNo - b.seatNo);
    }

    async function generateAiReport() {
        if (activityData.length === 0) {
            showMessage('请先上传课堂活动Excel！', 'warning');
            return;
        }
        if (Object.keys(studentRoster).length === 0) {
            showMessage('请先上传学生名单Excel！', 'warning');
            return;
        }

        aiReportOutput.innerHTML = '<p class="text-gray-700"><i class="fas fa-spinner fa-spin mr-2"></i>AI正在生成学情报告，请稍候...</p>';
        generateAiReportBtn.disabled = true;

        try {
            const mergedData = mergeActivityAndRoster(activityData, studentRoster);
            const aiModel = aiModelInput.value.trim();
            const customPrompt = customPromptTextarea.value.trim();

            const subject = document.getElementById('subject-input').value.trim();
            const topic = document.getElementById('topic-input').value.trim();
            const date = document.getElementById('date-display').textContent.trim();

            let prompt = `你是一位资深班主任，请根据以下课堂活动数据，为班级生成一份详细的学情报告。报告应包含对整体表现的总结，对表现突出学生的表扬，以及对需要改进学生的建议。请结合学科、课题和日期信息，使报告更具针对性。`;

            if (subject) prompt += `\n学科: ${subject}`;
            if (topic) prompt += `\n课题: ${topic}`;
            if (date) prompt += `\n日期: ${date}`;
            prompt += `\n\n课堂活动数据:\n`;

            mergedData.forEach(student => {
                prompt += `- ${student.name} (${student.seatNo}号): 总积分 ${student.totalPoints} 分, 被点名 ${student.calledCount} 次.\n`;
            });

            if (customPrompt) {
                prompt += `\n\n用户自定义要求: ${customPrompt}`;
            }

            const apiConfig = getApiConfig(aiModel);
            const apiKey = getSharedApiKey(); // Using shared key for now, can add user API key input later

            const payload = {
                model: aiModel,
                messages: [
                    { role: "system", content: "你是一位经验丰富的教育专家，擅长根据学生数据生成学情报告。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7 // Can be made configurable
            };

            const data = await safeApiCall(apiConfig.url, apiKey, payload);
            const aiResponse = data.choices?.[0]?.message?.content?.trim() || data.result || data.output?.[0]?.content || '未能生成报告。';

            aiReportOutput.innerHTML = `<p class="text-gray-700 whitespace-pre-wrap">${aiResponse}</p>`;
            showMessage('AI学情报告生成成功！', 'success');

        } catch (error) {
            console.error('生成AI报告失败:', error);
            aiReportOutput.innerHTML = `<p class="text-red-500">生成AI报告失败: ${error.message}</p>`;
            showMessage(`生成AI报告失败: ${error.message}`, 'error');
        } finally {
            generateAiReportBtn.disabled = false;
        }
    }

    if (generateAiReportBtn) {
        console.log('Found generateAiReportBtn, attaching listener.');
        generateAiReportBtn.addEventListener('click', generateAiReport);
    } else {
        console.log('generateAiReportBtn not found.');
    }

    // ==================== 导出功能逻辑 ====================
    
    // 导出时间范围选择
    const exportTimeButtons = document.querySelectorAll('.export-time-btn');
    const customDateRange = document.getElementById('custom-date-range');
    const exportStartDateInput = document.getElementById('export-start-date');
    const exportEndDateInput = document.getElementById('export-end-date');
    
    // 初始化导出时间范围
    function initializeExportTimeRange() {
        console.log('Initializing export time range...');
        const today = new Date();
        if (exportStartDateInput) {
            exportStartDateInput.value = today.toISOString().split('T')[0];
        }
        if (exportEndDateInput) {
            exportEndDateInput.value = today.toISOString().split('T')[0];
        }
        console.log('Export time range initialized.');
    }
    
    // 切换导出时间范围
    function switchExportTimeRange(range, targetButton) {
        currentExportTimeRange = range;
        
        // 更新按钮状态
        exportTimeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // 计算时间范围
        const today = new Date();
        let startDate, endDate;
        
        switch(range) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                customDateRange.style.display = 'none';
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay()); // 本周一
                endDate = new Date(today);
                customDateRange.style.display = 'none';
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                customDateRange.style.display = 'none';
                break;
            case 'custom':
                customDateRange.style.display = 'block';
                return;
        }
        
        exportStartDate = startDate;
        exportEndDate = endDate;
        
        // 更新自定义日期输入框
        if (exportStartDateInput && exportEndDateInput) {
            exportStartDateInput.value = startDate.toISOString().split('T')[0];
            exportEndDateInput.value = endDate.toISOString().split('T')[0];
        }
    }
    
    // 绑定导出时间范围按钮事件
    exportTimeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const range = e.target.id.replace('export-', '').replace('-btn', '');
            switchExportTimeRange(range, e.target);
        });
    });
    
    // 自定义日期范围变化
    if (exportStartDateInput) {
        exportStartDateInput.addEventListener('change', (e) => {
            exportStartDate = new Date(e.target.value);
        });
    }
    
    if (exportEndDateInput) {
        exportEndDateInput.addEventListener('change', (e) => {
            exportEndDate = new Date(e.target.value);
        });
    }
    
    // 过滤数据根据时间范围
    function filterDataByTimeRange(data, startDate, endDate) {
        if (!startDate || !endDate) return data;
        
        return data.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= startDate && itemDate <= endDate;
        });
    }
    
    // 获取学生姓名（支持隐私保护）
    function getStudentNameForExport(studentId) {
        const includeNames = document.getElementById('include-student-names')?.checked;
        if (includeNames && Object.keys(studentRoster).length > 0) {
            return studentRoster[studentId] || `学生${studentId}`;
        }
        return `学生${studentId}`;
    }
    
    // 生成导出数据
    function generateExportData() {
        const subject = getCurrentSubject() || '未指定学科';
        const topic = document.getElementById('topic-input').value.trim() || '未指定课题';
        const includeDetailedLog = document.getElementById('include-detailed-log')?.checked;
        const includeStatistics = document.getElementById('include-statistics')?.checked;
        
        // 过滤加分记录
        const filteredPointsLog = filterDataByTimeRange(pointsLog, exportStartDate, exportEndDate);
        
        // 基础数据
        const exportData = {
            basicInfo: {
                subject: subject,
                topic: topic,
                exportTime: new Date().toLocaleString(),
                timeRange: currentExportTimeRange,
                startDate: exportStartDate?.toLocaleDateString() || '',
                endDate: exportEndDate?.toLocaleDateString() || ''
            },
            students: [],
            pointsLog: filteredPointsLog,
            statistics: {}
        };
        
        // 学生数据
        students.forEach(student => {
            const studentTotalPoints = studentPoints[student.id] || 0;
            const calledCount = calledStudents.includes(student.id) ? 1 : 0;
            const studentLogs = filteredPointsLog.filter(log => log.studentId === student.id);
            
            exportData.students.push({
                id: student.id,
                name: getStudentNameForExport(student.id),
                totalPoints: studentTotalPoints,
                calledCount: calledCount,
                pointsLog: studentLogs
            });
        });
        
        // 统计信息
        if (includeStatistics) {
            const totalStudents = students.length;
            const studentsWithPoints = exportData.students.filter(s => s.totalPoints > 0).length;
            const totalPoints = exportData.students.reduce((sum, s) => sum + s.totalPoints, 0);
            const averagePoints = studentsWithPoints > 0 ? (totalPoints / studentsWithPoints).toFixed(2) : 0;
            const calledStudents = exportData.students.filter(s => s.calledCount > 0).length;
            
            exportData.statistics = {
                totalStudents,
                studentsWithPoints,
                totalPoints,
                averagePoints,
                calledStudents,
                participationRate: ((calledStudents / totalStudents) * 100).toFixed(1) + '%'
            };
        }
        
        return exportData;
    }
    
    // 创建Excel工作簿
    function createExcelWorkbook(exportData) {
        const wb = XLSX.utils.book_new();
        
        // 1. 基础信息工作表
        const basicInfoData = [
            ['课堂数据导出报告'],
            [''],
            ['学科', exportData.basicInfo.subject],
            ['课题', exportData.basicInfo.topic],
            ['导出时间', exportData.basicInfo.exportTime],
            ['时间范围', exportData.basicInfo.timeRange],
            ['开始日期', exportData.basicInfo.startDate],
            ['结束日期', exportData.basicInfo.endDate],
            ['']
        ];
        
        if (exportData.statistics && Object.keys(exportData.statistics).length > 0) {
            basicInfoData.push(['统计信息']);
            basicInfoData.push(['总学生数', exportData.statistics.totalStudents]);
            basicInfoData.push(['有积分学生数', exportData.statistics.studentsWithPoints]);
            basicInfoData.push(['总积分', exportData.statistics.totalPoints]);
            basicInfoData.push(['平均积分', exportData.statistics.averagePoints]);
            basicInfoData.push(['被点名学生数', exportData.statistics.calledStudents]);
            basicInfoData.push(['参与率', exportData.statistics.participationRate]);
        }
        
        const ws1 = XLSX.utils.aoa_to_sheet(basicInfoData);
        XLSX.utils.book_append_sheet(wb, ws1, '基础信息');
        
        // 2. 学生积分汇总工作表
        const studentSummaryData = [
            ['座号', '姓名', '总积分', '被点名次数', '加分次数', '最后加分时间']
        ];
        
        exportData.students.forEach(student => {
            const lastPointsTime = student.pointsLog.length > 0 
                ? student.pointsLog[student.pointsLog.length - 1].timestamp 
                : '无';
            
            studentSummaryData.push([
                student.id,
                student.name,
                student.totalPoints,
                student.calledCount,
                student.pointsLog.length,
                lastPointsTime
            ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(studentSummaryData);
        XLSX.utils.book_append_sheet(wb, ws2, '学生积分汇总');
        
        // 3. 详细加分记录工作表（如果启用）
        if (document.getElementById('include-detailed-log')?.checked) {
            const detailedLogData = [
                ['时间', '座号', '姓名', '学科', '加分值', '加分原因']
            ];
            
            exportData.pointsLog.forEach(log => {
                detailedLogData.push([
                    log.timestamp,
                    log.studentId,
                    getStudentNameForExport(log.studentId),
                    log.subject || '未指定',
                    log.points,
                    log.reason
                ]);
            });
            
            const ws3 = XLSX.utils.aoa_to_sheet(detailedLogData);
            XLSX.utils.book_append_sheet(wb, ws3, '详细加分记录');
        }
        
        return wb;
    }
    
    // 导出数据按钮事件
    const exportDataBtn = document.getElementById('export-data-btn');
    console.log('Export button found:', exportDataBtn);
    if (exportDataBtn) {
        console.log('Adding click event listener to export button');
        exportDataBtn.addEventListener('click', (e) => {
            console.log('Export button clicked!', e);
            e.preventDefault();
            e.stopPropagation();
            
            try {
                console.log('Starting export process...');
                
                // 验证必要信息
                const subject = getCurrentSubject();
                const topic = document.getElementById('topic-input').value.trim();
                
                console.log('Subject:', subject, 'Topic:', topic);
                
                if (!subject) {
                    showMessage('请先选择或输入学科，以便导出完整数据！', 'warning');
                    return;
                }
                
                // 检查学生名单（如果启用姓名显示）
                const includeNames = document.getElementById('include-student-names')?.checked;
                console.log('Include names:', includeNames, 'Roster length:', Object.keys(studentRoster).length);
                
                if (includeNames && Object.keys(studentRoster).length === 0) {
                    const proceed = confirm('未上传学生名单，将使用"学生X号"格式导出。是否继续？');
                    if (!proceed) return;
                }
                
                console.log('Generating export data...');
                
                // 生成导出数据
                const exportData = generateExportData();
                
                console.log('Export data generated:', exportData);
                
                // 检查XLSX库
                if (typeof XLSX === 'undefined') {
                    throw new Error('XLSX库未加载，请刷新页面重试！');
                }
                
                console.log('Creating Excel workbook...');
                
                // 创建Excel工作簿
                const wb = createExcelWorkbook(exportData);
                
                console.log('Workbook created:', wb);
                
                // 生成文件名
                const dateStr = exportData.basicInfo.startDate || new Date().toLocaleDateString('zh-CN');
                const filename = `${dateStr}_${subject}_${topic}_课堂数据.xlsx`;
                
                console.log('Filename:', filename);
                console.log('Writing file...');
                
                // 下载Excel文件
                XLSX.writeFile(wb, filename);
                
                console.log('File written successfully!');
                
                showMessage(`课堂数据已成功导出为Excel！文件名：${filename}`, 'success');
                
            } catch (error) {
                console.error('导出失败:', error);
                console.error('Error stack:', error.stack);
                showMessage(`导出失败：${error.message}`, 'error');
            }
        });
    } else {
        console.error('Export button not found!');
    }
    
    // 初始化导出功能
    console.log('Initializing export functionality...');
    console.log('XLSX library available:', typeof XLSX !== 'undefined');
    
    // 测试导出按钮是否存在
    const testExportBtn = document.getElementById('export-data-btn');
    console.log('Export button element:', testExportBtn);
    
    initializeExportTimeRange();
    console.log('Export functionality initialized.');
    
    // ==================== 模态框事件监听器 ====================
    
    // 关闭模态框按钮
    if (closeNamingModal) {
        closeNamingModal.addEventListener('click', hideNamingModal);
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', hideNamingModal);
    }
    
    // 快速评分按钮
    if (modalQuickScoringBtn) {
        modalQuickScoringBtn.addEventListener('click', modalQuickScoring);
    }
    
    // 点击遮罩层关闭模态框
    if (namingModal) {
        namingModal.addEventListener('click', (e) => {
            if (e.target === namingModal) {
                hideNamingModal();
            }
        });
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isModalOpen) {
            hideNamingModal();
        }
    });
    
    // ==================== 评分模态框事件监听器 ====================
    
    // 关闭评分模态框按钮
    if (closeScoringModal) {
        closeScoringModal.addEventListener('click', hideScoringModal);
    }
    
    if (closeGroupScoringModal) {
        closeGroupScoringModal.addEventListener('click', hideGroupScoringModal);
    }
    
    // 跳过评分按钮
    if (modalSkipScoringBtn) {
        modalSkipScoringBtn.addEventListener('click', () => {
            hideScoringModal();
            showMessage('已跳过评分', 'info');
        });
    }
    
    if (modalSkipGroupScoringBtn) {
        modalSkipGroupScoringBtn.addEventListener('click', () => {
            hideGroupScoringModal();
            showMessage('已跳过小组评分', 'info');
        });
    }
    
    // 答题表现按钮
    if (modalCorrectAnswerBtn) {
        modalCorrectAnswerBtn.addEventListener('click', () => {
            modalQuickPoints.value = '0.5';
            modalQuickReason.value = '回答正确';
            modalQuickReason.focus();
        });
    }
    
    if (modalIncorrectAnswerBtn) {
        modalIncorrectAnswerBtn.addEventListener('click', () => {
            modalQuickPoints.value = '0';
            modalQuickReason.value = '回答错误';
            modalQuickReason.focus();
        });
    }
    
    // 小组表现按钮
    if (modalGroupCorrectBtn) {
        modalGroupCorrectBtn.addEventListener('click', () => {
            modalGroupQuickPoints.value = '1';
            modalGroupQuickReason.value = '小组表现优秀，答案正确';
            modalGroupQuickReason.focus();
        });
    }
    
    if (modalGroupPartialBtn) {
        modalGroupPartialBtn.addEventListener('click', () => {
            modalGroupQuickPoints.value = '0.5';
            modalGroupQuickReason.value = '小组表现良好';
            modalGroupQuickReason.focus();
        });
    }
    
    if (modalGroupPoorBtn) {
        modalGroupPoorBtn.addEventListener('click', () => {
            modalGroupQuickPoints.value = '0';
            modalGroupQuickReason.value = '小组表现不佳';
            modalGroupQuickReason.focus();
        });
    }
    
    // 确认评分按钮
    if (modalConfirmScoringBtn) {
        modalConfirmScoringBtn.addEventListener('click', () => {
            if (!currentScoringStudent) return;
            
            const points = parseFloat(modalQuickPoints.value);
            const reason = modalQuickReason.value.trim() || '快速评分';
            
            if (points > 0) {
                studentPoints[currentScoringStudent] = (studentPoints[currentScoringStudent] || 0) + points;
                const subject = getCurrentSubject() || '未指定学科';
                pointsLog.push({
                    studentId: currentScoringStudent,
                    reason: reason,
                    points: points,
                    timestamp: new Date().toLocaleString(),
                    subject: subject
                });
                
                renderTopStudents();
                renderPointsDistributionChart();
                renderPointsLog();
                saveState();
                showMessage(`学生${currentScoringStudent}号 已加 ${points} 分！`, 'success');
            } else {
                showMessage(`学生${currentScoringStudent}号 未获得加分`, 'info');
            }
            
            hideScoringModal();
        });
    }
    
    if (modalConfirmGroupScoringBtn) {
        modalConfirmGroupScoringBtn.addEventListener('click', () => {
            if (!currentScoringGroup || currentScoringGroup.length === 0) return;
            
            const points = parseFloat(modalGroupQuickPoints.value);
            const reason = modalGroupQuickReason.value.trim() || '小组快速评分';
            
            const subject = getCurrentSubject() || '未指定学科';
            currentScoringGroup.forEach(studentId => {
                if (points > 0) {
                    studentPoints[studentId] = (studentPoints[studentId] || 0) + points;
                }
                pointsLog.push({
                    studentId: studentId,
                    reason: reason,
                    points: points,
                    timestamp: new Date().toLocaleString(),
                    subject: subject
                });
            });
            
            renderTopStudents();
            renderPointsDistributionChart();
            renderPointsLog();
            saveState();
            
            if (points > 0) {
                showMessage(`小组 ${currentScoringGroup.length} 名学生各加 ${points} 分！`, 'success');
            } else {
                showMessage(`小组 ${currentScoringGroup.length} 名学生未获得加分`, 'info');
            }
            
            hideGroupScoringModal();
        });
    }
    
    // 点击遮罩层关闭评分模态框
    if (scoringModal) {
        scoringModal.addEventListener('click', (e) => {
            if (e.target === scoringModal) {
                hideScoringModal();
            }
        });
    }
    
    if (groupScoringModal) {
        groupScoringModal.addEventListener('click', (e) => {
            if (e.target === groupScoringModal) {
                hideGroupScoringModal();
            }
        });
    }
    
    // ESC键关闭评分模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (scoringModal.style.display !== 'none') {
                hideScoringModal();
            }
            if (groupScoringModal.style.display !== 'none') {
                hideGroupScoringModal();
            }
        }
    });
});