/**
 * 评分系统功能模块
 * 负责个人加分、集体加分、评分模态框等功能
 */

class ScoringManager {
    constructor() {
        this.currentScoringMode = 'manual'; // manual, range
        this.init();
    }

    /**
     * 初始化评分系统
     */
    init() {
        this.bindEvents();
        this.initializeSelectionMode();
    }

    /**
     * 初始化选择模式
     */
    initializeSelectionMode() {
        // 确保初始状态正确
        this.switchSelectionMode('manual');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 选择方式切换
        this.bindSelectionModeEvents();
        
        // 范围选择
        this.bindRangeSelectionEvents();
        
        // 学生选择
        this.bindStudentSelectionEvents();
        
        // 评分类型选择
        this.bindScoringTypeEvents();
        
        // 模态框事件
        this.bindModalEvents();
    }

    /**
     * 绑定选择方式事件
     */
    bindSelectionModeEvents() {
        const manualBtn = document.getElementById('manual-selection-btn');
        const rangeBtn = document.getElementById('range-selection-btn');
        
        if (manualBtn) {
            manualBtn.addEventListener('click', () => this.switchSelectionMode('manual'));
        }
        
        if (rangeBtn) {
            rangeBtn.addEventListener('click', () => this.switchSelectionMode('range'));
        }
    }

    /**
     * 绑定范围选择事件
     */
    bindRangeSelectionEvents() {
        const previewBtn = document.getElementById('preview-range-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.generateRangeSelection());
        }
    }

    /**
     * 绑定学生选择事件
     */
    bindStudentSelectionEvents() {
        const clearBtn = document.getElementById('clear-selection-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSelection());
        }
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllStudents());
        }
    }

    /**
     * 绑定评分类型事件
     */
    bindScoringTypeEvents() {
        const individualBtn = document.getElementById('individual-scoring-btn');
        const groupBtn = document.getElementById('group-scoring-btn');
        
        if (individualBtn) {
            individualBtn.addEventListener('click', () => this.showIndividualScoring());
        }
        
        if (groupBtn) {
            groupBtn.addEventListener('click', () => this.showGroupScoring());
        }
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents() {
        // 新个人加分模态框
        this.bindNewIndividualScoringEvents();
        
        // 新集体加分模态框
        this.bindNewGroupScoringEvents();
    }

    /**
     * 切换选择模式
     */
    switchSelectionMode(mode) {
        this.currentScoringMode = mode;
        
        // 更新按钮状态
        const manualBtn = document.getElementById('manual-selection-btn');
        const rangeBtn = document.getElementById('range-selection-btn');
        const manualMode = document.getElementById('manual-selection-mode');
        const rangeMode = document.getElementById('range-selection-mode');
        
        // 先清除所有按钮的active状态
        manualBtn?.classList.remove('active');
        rangeBtn?.classList.remove('active');
        
        if (mode === 'manual') {
            manualBtn?.classList.add('active');
            manualMode?.style.setProperty('display', 'block');
            rangeMode?.style.setProperty('display', 'none');
        } else {
            rangeBtn?.classList.add('active');
            manualMode?.style.setProperty('display', 'none');
            rangeMode?.style.setProperty('display', 'block');
        }
    }

    /**
     * 生成范围选择
     */
    generateRangeSelection() {
        const startInput = document.getElementById('range-start');
        const endInput = document.getElementById('range-end');
        const stepSelect = document.getElementById('range-step');
        
        const start = parseInt(startInput?.value) || 1;
        const end = parseInt(endInput?.value) || 10;
        const step = parseInt(stepSelect?.value) || 1;
        
        if (start > end) {
            window.classroomManager?.showMessage('起始座号不能大于结束座号', 'warning');
            return;
        }
        
        const classSize = window.classroomManager?.classSize || 55;
        if (end > classSize) {
            window.classroomManager?.showMessage(`结束座号不能大于班级人数${classSize}`, 'warning');
            return;
        }
        
        // 生成座号范围
        const studentIds = [];
        for (let i = start; i <= end; i += step) {
            studentIds.push(i.toString());
        }
        
        // 过滤掉已点名的学生
        const calledStudents = window.studentManager?.getCalledStudentIds() || [];
        const availableStudents = studentIds.filter(id => !calledStudents.includes(id));
        
        if (availableStudents.length === 0) {
            window.classroomManager?.showMessage('该范围内的学生都已被点名', 'warning');
            return;
        }
        
        // 显示范围选择结果悬浮窗
        this.showRangeSelectionModal(availableStudents);
    }

    /**
     * 显示范围选择结果悬浮窗
     */
    showRangeSelectionModal(studentIds) {
        const modal = document.getElementById('range-selection-modal');
        const modalResult = document.getElementById('modal-range-selection-result');
        
        if (!modal || !modalResult) return;

        // 获取学生姓名
        const studentNames = studentIds.map(id => 
            window.studentManager?.getStudentName(id) || `学生${id}`
        );

        // 更新范围选择结果显示
        const studentList = studentNames.map((name, index) => 
            `<span class="inline-block bg-green-100 text-green-800 px-3 py-2 rounded-lg mr-2 mb-2 text-lg font-semibold">${name}</span>`
        ).join('');
        
        modalResult.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-green-600 mb-4">范围选择结果</div>
                <div class="text-lg text-gray-600 mb-4">共${studentIds.length}人</div>
                <div class="flex flex-wrap justify-center">${studentList}</div>
            </div>
        `;

        // 显示悬浮窗
        modal.style.display = 'flex';
        modal.classList.add('show');

        // 绑定悬浮窗事件
        this.bindRangeSelectionModalEvents(studentIds);
    }

    /**
     * 绑定范围选择悬浮窗事件
     */
    bindRangeSelectionModalEvents(studentIds) {
        // 确定按钮
        const confirmBtn = document.getElementById('modal-range-selection-confirm-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.hideRangeSelectionModal();
                // 添加到选择区域
                window.studentManager?.addStudentsToSelection(studentIds);
                this.updateSelectionDisplay();
                // 滚动到加分系统区域
                const scoringSection = document.getElementById('scoring-type-section');
                if (scoringSection) {
                    scoringSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };
        }

        // 关闭按钮
        const closeBtn = document.getElementById('close-range-selection-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideRangeSelectionModal();
        }

        // 点击背景关闭
        const modal = document.getElementById('range-selection-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideRangeSelectionModal();
                }
            });
        }
    }

    /**
     * 隐藏范围选择悬浮窗
     */
    hideRangeSelectionModal() {
        const modal = document.getElementById('range-selection-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    /**
     * 更新选择显示
     */
    updateSelectionDisplay() {
        const selectedStudents = window.studentManager?.getSelectedStudentIds() || [];
        const resultContainer = document.getElementById('selection-result');
        
        if (!resultContainer) return;
        
        if (selectedStudents.length === 0) {
            resultContainer.style.display = 'none';
            return;
        }
        
        resultContainer.style.display = 'block';
        
        const displayContainer = document.getElementById('selected-students-display');
        if (displayContainer) {
            const studentTags = selectedStudents.map(id => {
                return `
                    <span class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-3 rounded-xl text-lg font-semibold cursor-pointer hover:bg-blue-200 transition-colors duration-200 min-h-[48px] min-w-[48px] justify-center" 
                          data-student-id="${id}"
                          onclick="window.studentManager?.removeFromSelection('${id}')">
                        ${id}
                        <i class="fas fa-times text-blue-600 hover:text-blue-800 text-sm"></i>
                    </span>
                `;
            }).join(' ');
            
            displayContainer.innerHTML = `
                <div class="text-sm text-gray-700">
                    <div class="font-medium mb-2">已选择 ${selectedStudents.length} 名学生：</div>
                    <div class="flex flex-wrap gap-3">${studentTags}</div>
                </div>
            `;
        }
    }

    /**
     * 清空选择
     */
    clearSelection() {
        window.studentManager?.clearSelection();
        this.updateSelectionDisplay();
    }

    /**
     * 全选学生
     */
    selectAllStudents() {
        window.studentManager?.selectAllStudents();
        this.updateSelectionDisplay();
    }

    /**
     * 显示个人评分
     */
    showIndividualScoring() {
        // 验证学科设置
        if (!window.classroomManager?.validateSubject()) {
            return;
        }
        
        const selectedStudents = window.studentManager?.getSelectedStudentIds() || [];
        
        if (selectedStudents.length === 0) {
            window.classroomManager?.showMessage('请先选择学生', 'warning');
            return;
        }
        
        // 支持多个学生，显示批量个人加分悬浮窗
        this.showBatchIndividualScoringModal(selectedStudents);
    }

    /**
     * 显示批量个人加分悬浮窗
     */
    showBatchIndividualScoringModal(studentIds) {
        const modal = document.getElementById('scoring-modal');
        const studentNameEl = document.getElementById('modal-student-name');
        const studentIdEl = document.getElementById('modal-student-id');
        
        if (!modal) return;

        // 更新学生信息显示
        if (studentIds.length === 1) {
            const studentName = window.studentManager?.getStudentName(studentIds[0]) || `学生${studentIds[0]}`;
            if (studentNameEl) studentNameEl.textContent = studentName;
            if (studentIdEl) studentIdEl.textContent = `${studentIds[0]}号`;
        } else {
            const studentNames = studentIds.map(id => 
                window.studentManager?.getStudentName(id) || `学生${id}`
            );
            if (studentNameEl) studentNameEl.textContent = `${studentNames.join('、')} 等${studentIds.length}名学生`;
            if (studentIdEl) studentIdEl.textContent = `共${studentIds.length}人`;
        }

        // 显示悬浮窗
        modal.style.display = 'flex';
        modal.classList.add('show');

        // 绑定批量个人加分事件
        this.bindBatchIndividualScoringEvents(studentIds);
    }

    /**
     * 绑定批量个人加分事件
     */
    bindBatchIndividualScoringEvents(studentIds) {
        // 答题表现按钮
        const correctBtn = document.getElementById('modal-correct-answer-btn');
        const incorrectBtn = document.getElementById('modal-incorrect-answer-btn');
        
        if (correctBtn) {
            correctBtn.onclick = () => this.handleModalAnswerPerformance(studentIds, true);
        }
        if (incorrectBtn) {
            incorrectBtn.onclick = () => this.handleModalAnswerPerformance(studentIds, false);
        }

        // 确认评分按钮
        const confirmBtn = document.getElementById('modal-confirm-scoring-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmBatchIndividualScoring(studentIds);
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
     * 处理模态框答题表现（批量）
     */
    handleModalAnswerPerformance(studentIds, isCorrect) {
        const pointsSelect = document.getElementById('modal-quick-points');
        if (pointsSelect) {
            pointsSelect.value = isCorrect ? '0.5' : '0';
        }
    }

    /**
     * 确认批量个人评分
     */
    confirmBatchIndividualScoring(studentIds) {
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
            // 获取当前学科
            const subject = this.getCurrentSubject();
            // 为每个学生单独加分
            studentIds.forEach(studentId => {
                window.pointsManager?.addPoints(studentId, points, reason, 'individual', subject);
            });
            window.classroomManager?.showMessage(`已为${studentIds.length}名学生添加${points}分`, 'success');
        }
        
        this.hideScoringModal();
        this.clearSelection();
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
     * 显示集体评分
     */
    showGroupScoring() {
        // 验证学科设置
        if (!window.classroomManager?.validateSubject()) {
            return;
        }
        
        const selectedStudents = window.studentManager?.getSelectedStudentIds() || [];
        
        if (selectedStudents.length === 0) {
            window.classroomManager?.showMessage('请先选择学生', 'warning');
            return;
        }
        
        this.showNewGroupScoringModal(selectedStudents);
    }

    /**
     * 显示新个人加分模态框
     */
    showNewIndividualScoringModal(studentId) {
        const modal = document.getElementById('new-individual-scoring-modal');
        if (!modal) return;
        
        const studentName = window.studentManager?.getStudentName(studentId) || `学生${studentId}`;
        
        // 更新学生信息
        const nameEl = document.getElementById('new-modal-student-name');
        const idEl = document.getElementById('new-modal-student-id');
        
        if (nameEl) nameEl.textContent = studentName;
        if (idEl) idEl.textContent = `${studentId}号`;
        
        // 显示模态框
        modal.style.display = 'flex';
        
        // 绑定确认事件
        const confirmBtn = document.getElementById('new-modal-confirm-individual-scoring-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmIndividualScoring(studentId);
        }
        
        // 绑定取消事件
        const cancelBtn = document.getElementById('new-modal-cancel-individual-scoring-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.hideNewIndividualScoringModal();
        }
    }

    /**
     * 显示新集体加分模态框
     */
    showNewGroupScoringModal(studentIds) {
        const modal = document.getElementById('new-group-scoring-modal');
        if (!modal) return;
        
        const studentNames = studentIds.map(id => 
            window.studentManager?.getStudentName(id) || `学生${id}`
        );
        
        // 更新小组信息
        const studentsEl = document.getElementById('new-modal-group-students');
        const countEl = document.getElementById('new-modal-group-count');
        
        if (studentsEl) studentsEl.textContent = studentNames.join('、');
        if (countEl) countEl.textContent = `${studentIds.length}人`;
        
        // 显示模态框
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // 绑定确认事件
        const confirmBtn = document.getElementById('new-modal-confirm-group-scoring-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmGroupScoring(studentIds);
        }
        
        // 绑定取消事件
        const cancelBtn = document.getElementById('new-modal-cancel-group-scoring-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.hideNewGroupScoringModal();
        }
        
        // 绑定关闭按钮事件
        const closeBtn = document.getElementById('close-new-group-scoring-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideNewGroupScoringModal();
        }
    }

    /**
     * 绑定新个人加分事件
     */
    bindNewIndividualScoringEvents() {
        const reasonSelect = document.getElementById('new-modal-individual-reason-select');
        const reasonInput = document.getElementById('new-modal-individual-reason');
        
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
     * 绑定新集体加分事件
     */
    bindNewGroupScoringEvents() {
        const reasonSelect = document.getElementById('new-modal-group-reason-select');
        const reasonInput = document.getElementById('new-modal-group-reason');
        
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
     * 确认个人评分
     */
    confirmIndividualScoring(studentId) {
        const pointsInput = document.getElementById('new-modal-individual-points');
        const reasonSelect = document.getElementById('new-modal-individual-reason-select');
        const reasonInput = document.getElementById('new-modal-individual-reason');
        
        const points = parseFloat(pointsInput?.value) || 0;
        let reason = reasonSelect?.value || '';
        
        if (reason === 'custom') {
            reason = reasonInput?.value?.trim() || '';
        }
        
        if (!reason) {
            window.classroomManager?.showMessage('请填写评分原因', 'warning');
            return;
        }
        
        if (points <= 0) {
            window.classroomManager?.showMessage('加分值必须大于0', 'warning');
            return;
        }
        
        const subject = this.getCurrentSubject();
        window.pointsManager?.addPoints(studentId, points, reason, 'individual', subject);
        window.classroomManager?.showMessage(`已为${window.studentManager?.getStudentName(studentId)}添加${points}分`, 'success');
        
        this.hideNewIndividualScoringModal();
        this.clearSelection();
    }

    /**
     * 确认集体评分
     */
    confirmGroupScoring(studentIds) {
        const pointsInput = document.getElementById('new-modal-group-points');
        const reasonSelect = document.getElementById('new-modal-group-reason-select');
        const reasonInput = document.getElementById('new-modal-group-reason');
        
        const points = parseFloat(pointsInput?.value) || 0;
        let reason = reasonSelect?.value || '';
        
        if (reason === 'custom') {
            reason = reasonInput?.value?.trim() || '';
        }
        
        if (!reason) {
            window.classroomManager?.showMessage('请填写评分原因', 'warning');
            return;
        }
        
        if (points <= 0) {
            window.classroomManager?.showMessage('加分值必须大于0', 'warning');
            return;
        }
        
        const subject = this.getCurrentSubject();
        window.pointsManager?.addPointsToMultiple(studentIds, points, reason, 'group', subject);
        window.classroomManager?.showMessage(`已为${studentIds.length}名学生添加${points}分`, 'success');
        
        this.hideNewGroupScoringModal();
        this.clearSelection();
    }

    /**
     * 隐藏新个人评分模态框
     */
    hideNewIndividualScoringModal() {
        const modal = document.getElementById('new-individual-scoring-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 隐藏新集体评分模态框
     */
    hideNewGroupScoringModal() {
        const modal = document.getElementById('new-group-scoring-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
}

// 创建全局实例
window.scoringManager = new ScoringManager();