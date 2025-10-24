/**
 * 课堂管理核心模块
 * 负责课堂基础设置、学科管理、班级人数等核心功能
 */

class ClassroomManager {
    constructor() {
        this.currentSubject = '';
        this.classSize = 55; // 默认值，会被loadState()覆盖
        this.isInitialized = false;
        
        // 添加班级人数变更监听
        this.trackClassSizeChanges();
        
        this.init();
    }

    /**
     * 跟踪班级人数变更
     */
    trackClassSizeChanges() {
        let lastClassSize = this.classSize;
        const originalClassSize = this.classSize;
        
        // 使用Object.defineProperty来监听classSize的变更
        Object.defineProperty(this, 'classSize', {
            get() {
                return this._classSize;
            },
            set(value) {
                this._classSize = value;
            }
        });
        
        this._classSize = originalClassSize;
    }

    /**
     * 初始化课堂管理
     */
    init() {
        // 延迟初始化，确保DOM已加载
        setTimeout(() => {
            this.initializeSubjectInput();
            this.initializeClassroom();
            this.initializeStudents();
            this.initializeRangeSelection();
            this.isInitialized = true;
        }, 50);
    }

    /**
     * 初始化学科输入
     */
    initializeSubjectInput() {
        const subjectSelect = document.getElementById('subject-select');
        const subjectCustomBtn = document.getElementById('subject-custom-btn');
        const subjectInput = document.getElementById('subject-input');

        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => {
                this.currentSubject = subjectSelect.value;
                this.validateSubject();
            });
        }

        if (subjectCustomBtn && subjectInput) {
            subjectCustomBtn.addEventListener('click', () => {
                subjectInput.style.display = subjectInput.style.display === 'none' ? 'block' : 'none';
                if (subjectInput.style.display === 'block') {
                    subjectInput.focus();
                }
            });

            subjectInput.addEventListener('blur', () => {
                if (subjectInput.value.trim()) {
                    this.currentSubject = subjectInput.value.trim();
                    this.validateSubject();
                }
            });

            subjectInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (subjectInput.value.trim()) {
                        this.currentSubject = subjectInput.value.trim();
                        this.validateSubject();
                        subjectInput.style.display = 'none';
                    }
                }
            });
        }
    }

    /**
     * 初始化课堂环境
     */
    initializeClassroom() {
        // 设置当前日期
        const dateDisplay = document.getElementById('date-display');
        if (dateDisplay) {
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = today.toLocaleDateString('zh-CN', options);
        }

        // 加载保存的状态
        this.loadState();
        
        // 确保班级人数正确设置
    }

    /**
     * 初始化学生数据
     */
    initializeStudents() {
        // 不要在这里调用applyClassSize()，因为会覆盖从localStorage加载的值
        // this.applyClassSize();
    }

    /**
     * 初始化范围选择
     */
    initializeRangeSelection() {
        // 设置范围选择的初始限制
        this.updateRangeSelectionLimits(this.classSize);
    }

    /**
     * 应用班级人数设置
     */
    applyClassSize() {
        const classSizeInput = document.getElementById('class-size-input');
        if (classSizeInput) {
            // 如果HTML输入框有值，使用HTML输入框的值
            // 否则使用当前的classSize值
            const inputValue = parseInt(classSizeInput.value);
            if (inputValue && inputValue > 0) {
                this.classSize = inputValue;
            }
            // 确保HTML输入框显示正确的值
            classSizeInput.value = this.classSize;
        }
    }

    /**
     * 显示班级人数变更对话框
     */
    showClassSizeChangeDialog(newSize) {
        // 直接使用confirm确认对话框
        const confirmed = confirm(`您确定要将班级人数从 ${this.classSize} 人调整为 ${newSize} 人吗？\n\n此操作将影响学生座号范围和统计计算。`);
        
        if (confirmed) {
            this.confirmClassSizeChange(newSize);
        }
    }

    /**
     * 确认班级人数变更
     */
    confirmClassSizeChange(newSize) {
        const oldSize = this.classSize;
        
        // 先更新HTML输入框的值
        const classSizeInput = document.getElementById('class-size-input');
        if (classSizeInput) {
            classSizeInput.value = newSize;
        }
        
        // 然后应用班级人数设置
        this.classSize = newSize;
        this.applyClassSize();
        
        // 数据安全检查
        this.performDataSafetyCheck(oldSize, newSize);
        
        this.saveState();
        
        // 重新渲染相关组件
        this.refreshAllComponents();
        
        // 验证班级人数是否正确设置
        setTimeout(() => {
            // 验证班级人数设置是否成功
        }, 100);
        
        this.showMessage(`班级人数已从 ${oldSize} 人调整为 ${newSize} 人`, 'success');
    }

    /**
     * 执行数据安全检查
     */
    performDataSafetyCheck(oldSize, newSize) {
        // 如果新人数小于旧人数，需要处理超出范围的学生数据
        if (newSize < oldSize) {
            this.handleDataTruncation(oldSize, newSize);
        }
        
        // 更新所有相关组件的班级人数
        this.updateGlobalClassSize(newSize);
    }

    /**
     * 处理数据截断（当班级人数减少时）
     */
    handleDataTruncation(oldSize, newSize) {
        
        // 检查积分数据中是否有超出新范围的学生
        if (window.pointsManager) {
            const pointsData = window.pointsManager.getAllPointsData();
            const affectedStudents = pointsData.filter(student => {
                const studentId = parseInt(student.studentId);
                return studentId > newSize && student.points > 0;
            });
            
            if (affectedStudents.length > 0) {
                this.showDataPreservationNotice(affectedStudents, newSize);
            }
        }
        
        // 检查已点名学生中是否有超出范围的学生
        if (window.studentManager) {
            const calledStudents = window.studentManager.getCalledStudentIds();
            const affectedCalledStudents = calledStudents.filter(id => {
                const studentId = parseInt(id);
                return studentId > newSize;
            });
            
            if (affectedCalledStudents.length > 0) {
                // 自动移除超出范围的学生（只影响当前会话，不影响历史数据）
                affectedCalledStudents.forEach(id => {
                    window.studentManager.removeCalledStudent(id);
                });
                this.showMessage(`已移除超出当前班级范围的已点名学生：${affectedCalledStudents.join(', ')}号（历史数据已保留）`, 'info');
            }
        }
    }

    /**
     * 显示数据保留通知
     */
    showDataPreservationNotice(affectedStudents, newSize) {
        const studentList = affectedStudents.map(s => `${s.studentName}(${s.studentId}号)`).join(', ');
        this.showMessage(
            `数据保留通知：以下学生有历史积分但超出新的班级范围(${newSize}人)：${studentList}。历史数据已完整保留，新操作将使用新的班级人数设置。`,
            'info',
            8000
        );
    }

    /**
     * 更新全局班级人数
     */
    updateGlobalClassSize(newSize) {
        // 更新所有相关组件的班级人数引用
        if (window.studentManager) {
            window.studentManager.classSize = newSize;
        }
        
        // 更新HTML输入框的值
        const classSizeInput = document.getElementById('class-size-input');
        if (classSizeInput) {
            classSizeInput.value = newSize;
        }
        
        // 更新范围选择的max属性
        this.updateRangeSelectionLimits(newSize);
    }

    /**
     * 更新范围选择的限制
     */
    updateRangeSelectionLimits(newSize) {
        const rangeStart = document.getElementById('range-start');
        const rangeEnd = document.getElementById('range-end');
        
        if (rangeStart) {
            rangeStart.max = newSize;
        }
        
        if (rangeEnd) {
            rangeEnd.max = newSize;
        }
        
    }

    /**
     * 刷新所有相关组件
     */
    refreshAllComponents() {
        
        // 强制更新全局班级人数引用
        if (window.studentManager) {
            window.studentManager.classSize = this.classSize;
        }
        
        // 刷新学生管理组件
        if (window.studentManager) {
            window.studentManager.renderGroupStudentSelection();
            window.studentManager.renderCalledStudents();
        }
        
        // 刷新积分管理组件
        if (window.pointsManager) {
            window.pointsManager.renderTopStudents();
            window.pointsManager.renderPointsDistributionChart();
            window.pointsManager.renderPointsLog();
        }
        
        // 刷新评分管理组件
        if (window.scoringManager) {
            window.scoringManager.updateSelectionDisplay();
        }
        
        // 更新范围选择限制
        this.updateRangeSelectionLimits(this.classSize);
    }

    /**
     * 获取当前学科
     */
    getCurrentSubject() {
        return this.currentSubject;
    }

    /**
     * 验证学科设置
     */
    validateSubject() {
        if (!this.currentSubject) {
            this.showMessage('⚠️ 请先选择或输入学科！', 'error');
            return false;
        }
        return true;
    }

    /**
     * 保存状态到本地存储
     */
    saveState() {
        const state = {
            // 不保存学科信息，每次刷新后清空
            classSize: this.classSize,
            timestamp: Date.now()
        };
        localStorage.setItem('classroomState', JSON.stringify(state));
    }

    /**
     * 从本地存储加载状态
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('classroomState');
            if (savedState) {
                const state = JSON.parse(savedState);
                // 不恢复学科信息，每次刷新后从空白开始
                this.currentSubject = '';
                this.classSize = state.classSize || 55;
                
                // 只恢复班级大小，不恢复学科选择
                const classSizeInput = document.getElementById('class-size-input');
                if (classSizeInput) {
                    classSizeInput.value = this.classSize;
                }
                
                // 清空学科选择
                const subjectSelect = document.getElementById('subject-select');
                const subjectInput = document.getElementById('subject-input');
                if (subjectSelect) {
                    subjectSelect.value = '';
                }
                if (subjectInput) {
                    subjectInput.value = '';
                }
            } else {
                // 如果没有保存的状态，确保学科为空
                this.currentSubject = '';
                const subjectSelect = document.getElementById('subject-select');
                const subjectInput = document.getElementById('subject-input');
                if (subjectSelect) {
                    subjectSelect.value = '';
                }
                if (subjectInput) {
                    subjectInput.value = '';
                }
            }
        } catch (error) {
            // 加载课堂状态失败
        }
    }

    /**
     * 显示消息
     */
    showMessage(message, type = "info", duration = 4000) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-[99999] p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        messageEl.style.zIndex = '99999'; // 强制设置z-index
        messageEl.style.position = 'fixed'; // 确保固定定位
        
        // 根据类型设置样式
        const typeStyles = {
            success: 'bg-green-100 border-green-400 text-green-700',
            error: 'bg-red-100 border-red-400 text-red-700 border-2',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700'
        };
        
        messageEl.className += ` ${typeStyles[type] || typeStyles.info}`;
        
        // 为错误类型添加特殊样式
        if (type === 'error') {
            messageEl.className += ' animate-pulse';
            messageEl.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.5)'; // 添加红色阴影
            duration = 6000; // 错误消息显示更长时间
        }
        
        messageEl.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle mr-2"></i>
                <span class="font-semibold">${message}</span>
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
}

// 创建全局实例
window.classroomManager = new ClassroomManager();