/**
 * 学生管理核心模块
 * 负责学生数据管理、座号分配、学生选择等功能
 */

class StudentManager {
    constructor() {
        this.students = new Map(); // 存储学生数据
        this.selectedStudents = new Set(); // 当前选中的学生
        this.calledStudents = new Set(); // 已点名的学生
        this.studentRoster = {}; // 学生名单映射 (座号 -> 姓名)
        this.init();
    }

    /**
     * 初始化学生管理
     */
    init() {
        this.initializeStudents();
        // 延迟渲染，确保DOM已加载且班级人数已设置
        setTimeout(() => {
            this.renderGroupStudentSelection();
            this.renderCalledStudents();
        }, 200);
    }

    /**
     * 初始化学生数据
     */
    initializeStudents() {
        const classSize = window.classroomManager?.classSize || 55;
        
        // 清空现有数据
        this.students.clear();
        this.selectedStudents.clear();
        this.calledStudents.clear();
        
        // 生成学生座号
        for (let i = 1; i <= classSize; i++) {
            const studentId = i.toString();
            const studentName = this.studentRoster[studentId] || `学生${studentId}`;
            
            this.students.set(studentId, {
                id: studentId,
                name: studentName,
                points: 0,
                called: false,
                selected: false
            });
        }
    }

    /**
     * 获取学生姓名
     */
    getStudentName(id) {
        return this.studentRoster[id] || `学生${id}`;
    }

    /**
     * 设置学生名单
     */
    setStudentRoster(roster) {
        this.studentRoster = roster;
        this.initializeStudents();
        this.renderGroupStudentSelection();
        this.renderCalledStudents();
    }

    /**
     * 渲染学生选择界面
     */
    renderGroupStudentSelection() {
        const container = document.getElementById('group-student-selection');
        if (!container) return;

        // 优先使用studentManager的classSize，然后是classroomManager的classSize
        const classSize = this.classSize || window.classroomManager?.classSize || 55;
        container.innerHTML = '';

        for (let i = 1; i <= classSize; i++) {
            const studentId = i.toString();
            const studentName = this.getStudentName(studentId);
            const isSelected = this.selectedStudents.has(studentId);
            const isCalled = this.calledStudents.has(studentId);

            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center justify-center';
            checkbox.innerHTML = `
                <label class="relative flex items-center justify-center cursor-pointer w-14 h-14 rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                    isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-blue-200' 
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:scale-105'
                }">
                    <input type="checkbox" 
                           class="student-checkbox sr-only" 
                           data-student-id="${studentId}"
                           ${isSelected ? 'checked' : ''}>
                    ${isSelected ? `
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i class="fas fa-check text-white text-xs"></i>
                        </div>
                        <span class="text-base font-bold opacity-0">
                            ${studentId}
                        </span>
                    ` : `
                        <span class="text-base font-bold">
                            ${studentId}
                        </span>
                    `}
                </label>
            `;

            container.appendChild(checkbox);
        }

        // 绑定事件监听器
        this.bindStudentSelectionEvents();
    }

    /**
     * 绑定学生选择事件
     */
    bindStudentSelectionEvents() {
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(checkbox => {
            // 绑定到label点击事件
            const label = checkbox.closest('label');
            if (label) {
                label.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const studentId = checkbox.dataset.studentId;
                    if (checkbox.checked) {
                        this.selectedStudents.delete(studentId);
                        checkbox.checked = false;
                    } else {
                        this.selectedStudents.add(studentId);
                        checkbox.checked = true;
                    }
                    this.updateSelectedStudentsFromCheckboxes();
                });
            }
            
            // 也保留原有的change事件作为备用
            checkbox.addEventListener('change', (e) => {
                const studentId = e.target.dataset.studentId;
                if (e.target.checked) {
                    this.selectedStudents.add(studentId);
                } else {
                    this.selectedStudents.delete(studentId);
                }
                this.updateSelectedStudentsFromCheckboxes();
            });
        });
    }

    /**
     * 从复选框更新选中学生
     */
    updateSelectedStudentsFromCheckboxes() {
        // 重新渲染选择界面以更新视觉状态
        this.renderGroupStudentSelection();
        
        // 更新选择显示
        if (window.scoringManager) {
            window.scoringManager.updateSelectionDisplay();
        }
    }

    /**
     * 渲染已点名学生列表
     */
    renderCalledStudents() {
        const container = document.getElementById('called-students-list');
        if (!container) return;

        if (this.calledStudents.size === 0) {
            container.innerHTML = '<li class="text-gray-500 text-center py-4">暂无已点名学生</li>';
            return;
        }

        container.innerHTML = '';
        this.calledStudents.forEach(studentId => {
            const studentName = this.getStudentName(studentId);
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 bg-white rounded-lg mb-2 shadow-sm border border-gray-200';
            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">${studentId}</span>
                    <span class="text-gray-700 font-medium">${studentName}</span>
                </div>
                <button class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors duration-200" onclick="window.studentManager.removeCalledStudent('${studentId}')" title="移除">
                    <i class="fas fa-times text-sm"></i>
                </button>
            `;
            container.appendChild(li);
        });
    }

    /**
     * 添加已点名学生
     */
    addCalledStudent(studentId) {
        this.calledStudents.add(studentId);
        this.renderCalledStudents();
    }

    /**
     * 移除已点名学生
     */
    removeCalledStudent(studentId) {
        this.calledStudents.delete(studentId);
        this.renderCalledStudents();
        this.renderGroupStudentSelection(); // 重新渲染以更新禁用状态
    }

    /**
     * 清空已点名学生
     */
    clearCalledStudents() {
        this.calledStudents.clear();
        this.renderCalledStudents();
        this.renderGroupStudentSelection();
    }

    /**
     * 更新选择显示
     */
    updateSelectionDisplay() {
        const resultContainer = document.getElementById('selection-result');
        const displayContainer = document.getElementById('selected-students-display');
        
        if (!resultContainer || !displayContainer) return;

        if (this.selectedStudents.size === 0) {
            resultContainer.style.display = 'none';
            return;
        }

        resultContainer.style.display = 'block';
        
        const selectedList = Array.from(this.selectedStudents).map(studentId => {
            const studentName = this.getStudentName(studentId);
            return `${studentId}号 ${studentName}`;
        }).join(', ');

        displayContainer.innerHTML = `
            <div class="text-sm text-gray-700">
                <div class="font-medium mb-1">已选择 ${this.selectedStudents.size} 名学生：</div>
                <div class="text-gray-600">${selectedList}</div>
            </div>
        `;
    }

    /**
     * 添加学生到选择
     */
    addStudentsToSelection(studentIds) {
        studentIds.forEach(id => {
            this.selectedStudents.add(id);
        });
        this.updateSelectionDisplay();
        this.renderGroupStudentSelection();
    }

    /**
     * 移除学生
     */
    removeStudent(studentId) {
        this.selectedStudents.delete(studentId);
        this.updateSelectionDisplay();
        this.renderGroupStudentSelection();
    }

    /**
     * 从选择中移除单个学生（公共方法）
     */
    removeFromSelection(studentId) {
        this.removeStudent(studentId);
        if (window.scoringManager) {
            window.scoringManager.updateSelectionDisplay();
        }
    }

    /**
     * 清空选择
     */
    clearSelection() {
        this.selectedStudents.clear();
        this.updateSelectionDisplay();
        this.renderGroupStudentSelection();
    }

    /**
     * 全选学生
     */
    selectAllStudents() {
        const classSize = window.classroomManager?.classSize || 55;
        this.selectedStudents.clear();
        
        for (let i = 1; i <= classSize; i++) {
            const studentId = i.toString();
            this.selectedStudents.add(studentId);
        }
        
        this.updateSelectionDisplay();
        this.renderGroupStudentSelection();
    }

    /**
     * 获取选中的学生ID列表
     */
    getSelectedStudentIds() {
        return Array.from(this.selectedStudents);
    }

    /**
     * 获取已点名的学生ID列表
     */
    getCalledStudentIds() {
        return Array.from(this.calledStudents);
    }

    /**
     * 检查学生是否已被点名
     */
    isStudentCalled(studentId) {
        return this.calledStudents.has(studentId);
    }

    /**
     * 检查学生是否被选中
     */
    isStudentSelected(studentId) {
        return this.selectedStudents.has(studentId);
    }

    /**
     * 获取学生信息
     */
    getStudent(studentId) {
        return this.students.get(studentId);
    }

    /**
     * 更新学生信息
     */
    updateStudent(studentId, updates) {
        const student = this.students.get(studentId);
        if (student) {
            Object.assign(student, updates);
            this.students.set(studentId, student);
        }
    }
}

// 创建全局实例
window.studentManager = new StudentManager();