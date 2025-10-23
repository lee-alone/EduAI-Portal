/**
 * 点名系统功能模块
 * 负责随机点名、多人点名、点名结果展示等功能
 */

class RollCallManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化点名系统
     */
    init() {
        this.bindEvents();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 随机点名按钮
        const randomCallBtn = document.getElementById('random-call-btn');
        if (randomCallBtn) {
            randomCallBtn.addEventListener('click', () => this.randomCall());
        }

        // 多人点名按钮
        const multiCallBtn = document.getElementById('multi-call-btn');
        if (multiCallBtn) {
            multiCallBtn.addEventListener('click', () => this.multiCall());
        }

        // 重置点名按钮
        const resetCallBtn = document.getElementById('reset-call-btn');
        if (resetCallBtn) {
            resetCallBtn.addEventListener('click', () => this.resetCall());
        }
    }

    /**
     * 随机点名
     */
    randomCall() {
        if (!window.classroomManager?.validateSubject()) {
            return;
        }

        const classSize = window.classroomManager?.classSize || 55;
        const calledStudents = window.studentManager?.getCalledStudentIds() || [];
        
        // 获取未被点名的学生
        const availableStudents = [];
        for (let i = 1; i <= classSize; i++) {
            const studentId = i.toString();
            if (!calledStudents.includes(studentId)) {
                availableStudents.push(studentId);
            }
        }

        if (availableStudents.length === 0) {
            window.classroomManager?.showMessage('所有学生都已被点名！', 'warning');
            return;
        }

        // 随机选择学生
        const randomIndex = Math.floor(Math.random() * availableStudents.length);
        const selectedStudentId = availableStudents[randomIndex];
        const selectedStudentName = window.studentManager?.getStudentName(selectedStudentId) || `学生${selectedStudentId}`;

        // 显示点名悬浮窗
        this.showNamingModal(selectedStudentId, selectedStudentName);
    }

    /**
     * 多人点名
     */
    multiCall() {
        if (!window.classroomManager?.validateSubject()) {
            return;
        }

        const multiCallNumInput = document.getElementById('multi-call-num');
        const num = parseInt(multiCallNumInput?.value) || 3;
        
        const classSize = window.classroomManager?.classSize || 55;
        const calledStudents = window.studentManager?.getCalledStudentIds() || [];
        
        // 获取未被点名的学生
        const availableStudents = [];
        for (let i = 1; i <= classSize; i++) {
            const studentId = i.toString();
            if (!calledStudents.includes(studentId)) {
                availableStudents.push(studentId);
            }
        }

        if (availableStudents.length === 0) {
            window.classroomManager?.showMessage('所有学生都已被点名！', 'warning');
            return;
        }

        if (availableStudents.length < num) {
            window.classroomManager?.showMessage(`剩余学生不足${num}人，将选择所有剩余学生`, 'warning');
        }

        // 随机选择指定数量的学生
        const selectedCount = Math.min(num, availableStudents.length);
        const selectedStudents = [];
        const selectedNames = [];
        
        for (let i = 0; i < selectedCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableStudents.length);
            const studentId = availableStudents.splice(randomIndex, 1)[0];
            const studentName = window.studentManager?.getStudentName(studentId) || `学生${studentId}`;
            
            selectedStudents.push(studentId);
            selectedNames.push(studentName);
        }

        // 直接将随机学生添加到选择区域
        this.addStudentsToSelection(selectedStudents, selectedNames);
        
        // 将多人点名的学生也添加到已点名学生列表
        selectedStudents.forEach(studentId => {
            window.studentManager?.addCalledStudent(studentId);
        });
    }

    /**
     * 将学生添加到选择区域
     */
    addStudentsToSelection(studentIds, studentNames) {
        // 先清理之前的选择
        window.studentManager?.clearSelection();
        
        // 添加到学生选择区域
        window.studentManager?.addStudentsToSelection(studentIds);
        
        // 更新选择显示
        window.scoringManager?.updateSelectionDisplay();
        
        // 显示多人点名结果悬浮窗
        this.showMultiCallModal(studentIds, studentNames);
        
        // 滚动到加分系统区域
        const scoringSection = document.getElementById('scoring-type-section');
        if (scoringSection) {
            scoringSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * 显示多人点名结果悬浮窗
     */
    showMultiCallModal(studentIds, studentNames) {
        const modal = document.getElementById('multi-call-modal');
        const modalResult = document.getElementById('modal-multi-call-result');
        
        if (!modal || !modalResult) return;

        // 更新多人点名结果显示
        const studentList = studentNames.map((name, index) => 
            `<span class="inline-block bg-blue-100 text-blue-800 px-3 py-2 rounded-lg mr-2 mb-2 text-lg font-semibold">${name}</span>`
        ).join('');
        
        modalResult.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 mb-4">多人点名结果</div>
                <div class="text-lg text-gray-600 mb-4">共${studentIds.length}人</div>
                <div class="flex flex-wrap justify-center">${studentList}</div>
            </div>
        `;

        // 显示悬浮窗
        modal.style.display = 'flex';
        modal.classList.add('show');

        // 绑定悬浮窗事件
        this.bindMultiCallModalEvents();
    }

    /**
     * 绑定多人点名悬浮窗事件
     */
    bindMultiCallModalEvents() {
        // 确定按钮
        const confirmBtn = document.getElementById('modal-multi-call-close-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.hideMultiCallModal();
        }

        // 关闭按钮
        const closeBtn = document.getElementById('close-multi-call-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideMultiCallModal();
        }

        // 点击背景关闭
        const modal = document.getElementById('multi-call-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideMultiCallModal();
                }
            });
        }
    }

    /**
     * 隐藏多人点名悬浮窗
     */
    hideMultiCallModal() {
        const modal = document.getElementById('multi-call-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    /**
     * 显示点名结果
     */
    showCallResult(studentIds, studentNames) {
        // 统一处理：直接将学生添加到选择区域
        this.addStudentsToSelection(studentIds, studentNames);
    }

    /**
     * 显示点名悬浮窗
     */
    showNamingModal(studentId, studentName) {
        const modal = document.getElementById('naming-modal');
        const modalResult = document.getElementById('modal-naming-result');
        
        if (!modal || !modalResult) return;

        // 更新点名结果显示
        modalResult.innerHTML = `
            <div class="text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">${studentName}</div>
                <div class="text-lg text-gray-600">${studentId}号</div>
            </div>
        `;

        // 显示悬浮窗
        modal.style.display = 'flex';
        modal.classList.add('show');

        // 绑定悬浮窗事件
        this.bindNamingModalEvents(studentId);
    }

    /**
     * 绑定点名悬浮窗事件
     */
    bindNamingModalEvents(studentId) {
        // 快速评分按钮
        const quickScoringBtn = document.getElementById('modal-quick-scoring-btn');
        if (quickScoringBtn) {
            quickScoringBtn.onclick = () => {
                this.hideNamingModal();
                this.showScoringModal(studentId);
            };
        }

        // 确定按钮
        const confirmBtn = document.getElementById('modal-close-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.hideNamingModal();
                // 添加到已点名学生列表
                window.studentManager?.addCalledStudent(studentId);
            };
        }

        // 关闭按钮
        const closeBtn = document.getElementById('close-naming-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideNamingModal();
        }

        // 点击背景关闭
        const modal = document.getElementById('naming-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideNamingModal();
                }
            });
        }
    }

    /**
     * 隐藏点名悬浮窗
     */
    hideNamingModal() {
        const modal = document.getElementById('naming-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    /**
     * 显示评分悬浮窗
     */
    showScoringModal(studentId) {
        const modal = document.getElementById('scoring-modal');
        const studentNameEl = document.getElementById('modal-student-name');
        const studentIdEl = document.getElementById('modal-student-id');
        
        if (!modal) return;

        const studentName = window.studentManager?.getStudentName(studentId) || `学生${studentId}`;
        
        if (studentNameEl) studentNameEl.textContent = studentName;
        if (studentIdEl) studentIdEl.textContent = `${studentId}号`;

        // 显示悬浮窗
        modal.style.display = 'flex';
        modal.classList.add('show');

        // 绑定评分悬浮窗事件
        this.bindScoringModalEvents(studentId);
    }

    /**
     * 绑定评分悬浮窗事件
     */
    bindScoringModalEvents(studentId) {
        // 答题表现按钮
        const correctBtn = document.getElementById('modal-correct-answer-btn');
        const incorrectBtn = document.getElementById('modal-incorrect-answer-btn');
        
        if (correctBtn) {
            correctBtn.onclick = () => this.handleModalAnswerPerformance(studentId, true);
        }
        if (incorrectBtn) {
            incorrectBtn.onclick = () => this.handleModalAnswerPerformance(studentId, false);
        }

        // 确认评分按钮
        const confirmBtn = document.getElementById('modal-confirm-scoring-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmModalScoring(studentId);
        }

        // 跳过按钮
        const skipBtn = document.getElementById('modal-skip-scoring-btn');
        if (skipBtn) {
            skipBtn.onclick = () => this.hideScoringModal();
        }

        // 关闭按钮
        const closeBtn = document.getElementById('close-scoring-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideScoringModal();
        }

        // 评分原因选择事件
        const reasonSelect = document.getElementById('modal-quick-reason-select');
        const reasonInput = document.getElementById('modal-quick-reason');
        
        if (reasonSelect && reasonInput) {
            reasonSelect.addEventListener('change', () => {
                const value = reasonSelect.value;
                if (value === 'custom') {
                    reasonInput.style.display = 'block';
                    reasonInput.focus();
                } else if (value) {
                    reasonInput.style.display = 'none';
                    reasonInput.value = value;
                } else {
                    reasonInput.style.display = 'none';
                    reasonInput.value = '';
                }
            });
        }
    }

    /**
     * 处理模态框答题表现
     */
    handleModalAnswerPerformance(studentId, isCorrect) {
        const pointsSelect = document.getElementById('modal-quick-points');
        if (pointsSelect) {
            pointsSelect.value = isCorrect ? '0.5' : '0';
        }
    }

    /**
     * 确认模态框评分
     */
    confirmModalScoring(studentId) {
        const pointsInput = document.getElementById('modal-quick-points');
        const reasonSelect = document.getElementById('modal-quick-reason-select');
        const reasonInput = document.getElementById('modal-quick-reason');
        
        const points = parseFloat(pointsInput?.value) || 0;
        let reason = reasonSelect?.value || '';
        
        if (reason === 'custom') {
            reason = reasonInput?.value?.trim() || '';
        }
        
        if (!reason) {
            reason = '课堂表现';
        }
        
        if (points > 0) {
            const subject = this.getCurrentSubject();
            window.pointsManager?.addPoints(studentId, points, reason, 'individual', subject);
            window.classroomManager?.showMessage(`已为${window.studentManager?.getStudentName(studentId)}添加${points}分`, 'success');
        }
        
        // 添加到已点名学生列表
        window.studentManager?.addCalledStudent(studentId);
        
        this.hideScoringModal();
    }

    /**
     * 获取当前选择的学科
     */
    getCurrentSubject() {
        const subjectSelect = document.getElementById('subject-select');
        const subjectInput = document.getElementById('subject-input');
        
        if (subjectInput && subjectInput.style.display !== 'none' && subjectInput.value.trim()) {
            return subjectInput.value.trim();
        }
        
        return subjectSelect?.value || '';
    }

    /**
     * 隐藏评分悬浮窗
     */
    hideScoringModal() {
        const modal = document.getElementById('scoring-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    /**
     * 显示快速评分选项
     */
    showQuickScoringOptions(studentIds) {
        if (studentIds.length === 1) {
            // 单人快速评分
            this.showIndividualQuickScoring(studentIds[0]);
        } else {
            // 多人快速评分
            this.showGroupQuickScoring(studentIds);
        }
    }

    /**
     * 显示单人快速评分
     */
    showIndividualQuickScoring(studentId) {
        const quickScoringSection = document.getElementById('quick-scoring-section');
        if (!quickScoringSection) return;

        const studentName = window.studentManager?.getStudentName(studentId) || `学生${studentId}`;
        
        // 更新学生信息显示
        const currentStudentName = document.getElementById('current-student-name');
        const currentStudentId = document.getElementById('current-student-id');
        
        if (currentStudentName) currentStudentName.textContent = studentName;
        if (currentStudentId) currentStudentId.textContent = `${studentId}号`;

        // 显示快速评分区域
        quickScoringSection.style.display = 'block';
        
        // 绑定快速评分事件
        this.bindQuickScoringEvents(studentId);
    }

    /**
     * 显示多人快速评分
     */
    showGroupQuickScoring(studentIds) {
        const groupQuickScoringSection = document.getElementById('group-quick-scoring-section');
        if (!groupQuickScoringSection) return;

        const studentNames = studentIds.map(id => 
            window.studentManager?.getStudentName(id) || `学生${id}`
        );
        
        // 更新小组信息显示
        const currentGroupStudents = document.getElementById('current-group-students');
        const currentGroupCount = document.getElementById('current-group-count');
        
        if (currentGroupStudents) currentGroupStudents.textContent = studentNames.join('、');
        if (currentGroupCount) currentGroupCount.textContent = `${studentIds.length}人`;

        // 显示小组快速评分区域
        groupQuickScoringSection.style.display = 'block';
        
        // 绑定小组快速评分事件
        this.bindGroupQuickScoringEvents(studentIds);
    }

    /**
     * 绑定快速评分事件
     */
    bindQuickScoringEvents(studentId) {
        // 答题表现按钮
        const correctBtn = document.getElementById('correct-answer-btn');
        const incorrectBtn = document.getElementById('incorrect-answer-btn');
        
        if (correctBtn) {
            correctBtn.onclick = () => this.handleAnswerPerformance(studentId, true);
        }
        if (incorrectBtn) {
            incorrectBtn.onclick = () => this.handleAnswerPerformance(studentId, false);
        }

        // 确认评分按钮
        const confirmBtn = document.getElementById('confirm-scoring-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmQuickScoring(studentId);
        }

        // 跳过按钮
        const skipBtn = document.getElementById('skip-scoring-btn');
        if (skipBtn) {
            skipBtn.onclick = () => this.skipQuickScoring();
        }
    }

    /**
     * 绑定小组快速评分事件
     */
    bindGroupQuickScoringEvents(studentIds) {
        // 小组表现按钮
        const correctBtn = document.getElementById('group-correct-btn');
        const partialBtn = document.getElementById('group-partial-btn');
        const poorBtn = document.getElementById('group-poor-btn');
        
        if (correctBtn) {
            correctBtn.onclick = () => this.handleGroupPerformance(studentIds, 'excellent');
        }
        if (partialBtn) {
            partialBtn.onclick = () => this.handleGroupPerformance(studentIds, 'average');
        }
        if (poorBtn) {
            poorBtn.onclick = () => this.handleGroupPerformance(studentIds, 'poor');
        }

        // 确认评分按钮
        const confirmBtn = document.getElementById('confirm-group-scoring-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmGroupQuickScoring(studentIds);
        }

        // 跳过按钮
        const skipBtn = document.getElementById('skip-group-scoring-btn');
        if (skipBtn) {
            skipBtn.onclick = () => this.skipGroupQuickScoring();
        }
    }

    /**
     * 处理答题表现
     */
    handleAnswerPerformance(studentId, isCorrect) {
        const pointsSelect = document.getElementById('quick-points');
        if (pointsSelect) {
            pointsSelect.value = isCorrect ? '0.5' : '0';
        }
    }

    /**
     * 处理小组表现
     */
    handleGroupPerformance(studentIds, performance) {
        const pointsSelect = document.getElementById('group-quick-points');
        if (pointsSelect) {
            switch (performance) {
                case 'excellent':
                    pointsSelect.value = '1';
                    break;
                case 'average':
                    pointsSelect.value = '0.5';
                    break;
                case 'poor':
                    pointsSelect.value = '0';
                    break;
            }
        }
    }

    /**
     * 确认快速评分
     */
    confirmQuickScoring(studentId) {
        const pointsInput = document.getElementById('quick-points');
        const reasonInput = document.getElementById('quick-reason');
        
        const points = parseFloat(pointsInput?.value) || 0;
        const reason = reasonInput?.value?.trim() || '课堂表现';
        
        if (points > 0) {
            const subject = this.getCurrentSubject();
            window.pointsManager?.addPoints(studentId, points, reason, 'individual', subject);
            window.classroomManager?.showMessage(`已为${window.studentManager?.getStudentName(studentId)}添加${points}分`, 'success');
        }
        
        this.hideQuickScoring();
    }

    /**
     * 确认小组快速评分
     */
    confirmGroupQuickScoring(studentIds) {
        const pointsInput = document.getElementById('group-quick-points');
        const reasonInput = document.getElementById('group-quick-reason');
        
        const points = parseFloat(pointsInput?.value) || 0;
        const reason = reasonInput?.value?.trim() || '小组表现';
        
        if (points > 0) {
            const subject = this.getCurrentSubject();
            window.pointsManager?.addPointsToMultiple(studentIds, points, reason, 'group', subject);
            window.classroomManager?.showMessage(`已为${studentIds.length}名学生添加${points}分`, 'success');
        }
        
        this.hideGroupQuickScoring();
    }

    /**
     * 跳过快速评分
     */
    skipQuickScoring() {
        this.hideQuickScoring();
    }

    /**
     * 跳过小组快速评分
     */
    skipGroupQuickScoring() {
        this.hideGroupQuickScoring();
    }

    /**
     * 隐藏快速评分
     */
    hideQuickScoring() {
        const quickScoringSection = document.getElementById('quick-scoring-section');
        if (quickScoringSection) {
            quickScoringSection.style.display = 'none';
        }
    }

    /**
     * 隐藏小组快速评分
     */
    hideGroupQuickScoring() {
        const groupQuickScoringSection = document.getElementById('group-quick-scoring-section');
        if (groupQuickScoringSection) {
            groupQuickScoringSection.style.display = 'none';
        }
    }

    /**
     * 重置点名
     */
    resetCall() {
        window.studentManager?.clearCalledStudents();
        
        this.hideQuickScoring();
        this.hideGroupQuickScoring();
        
        window.classroomManager?.showMessage('点名已重置', 'info');
    }
}

// 创建全局实例
window.rollCallManager = new RollCallManager();