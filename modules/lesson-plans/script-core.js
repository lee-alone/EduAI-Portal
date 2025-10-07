/**
 * AI智能教案生成器 - 核心功能模块
 * 负责界面交互、数据管理、本地存储等基础功能
 */

class LessonPlanCore {
    constructor() {
        this.currentStep = 1;
        this.init();
        this.bindEvents();
        this.loadSavedData();
    }

    /**
     * 初始化应用
     */
    init() {
        this.setupStepNavigation();
        this.setupAdvancedSettings();
        this.setupFormValidation();
        this.showStep(1);
    }

    /**
     * 设置步骤导航
     */
    setupStepNavigation() {
        // 步骤导航按钮
        const nextToStep2 = document.getElementById('next-to-step-2');
        const nextToStep3 = document.getElementById('next-to-step-3');
        const backToStep1 = document.getElementById('back-to-step-1');
        const backToStep2 = document.getElementById('back-to-step-2');
        const restartBtn = document.getElementById('restart-btn');

        if (nextToStep2) {
            nextToStep2.addEventListener('click', () => {
                if (this.validateStep1()) {
                    this.showStep(2);
                }
            });
        }

        if (nextToStep3) {
            nextToStep3.addEventListener('click', () => {
                this.showStep(3);
            });
        }

        if (backToStep1) {
            backToStep1.addEventListener('click', () => {
                this.showStep(1);
            });
        }

        if (backToStep2) {
            backToStep2.addEventListener('click', () => {
                this.showStep(2);
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartProcess();
            });
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 帮助按钮
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeHelp = document.getElementById('close-help');

        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                helpModal.classList.remove('hidden');
            });
        }

        if (closeHelp) {
            closeHelp.addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });
        }

        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.classList.add('hidden');
                }
            });
        }

        // 高级设置折叠/展开
        const advancedToggle = document.getElementById('advanced-toggle');
        const advancedContent = document.getElementById('advanced-content');
        const advancedIcon = document.getElementById('advanced-icon');

        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                const isHidden = advancedContent.classList.contains('hidden');
                
                if (isHidden) {
                    advancedContent.classList.remove('hidden');
                    advancedContent.classList.add('show');
                    advancedIcon.classList.add('rotated');
                } else {
                    advancedContent.classList.add('hidden');
                    advancedContent.classList.remove('show');
                    advancedIcon.classList.remove('rotated');
                }
            });
        }


        // 清空按钮
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFields();
            });
        }

        // 设置按钮
        const settingsToggle = document.getElementById('settings-toggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                this.showStep(3);
                // 展开高级设置
                setTimeout(() => {
                    if (advancedContent && advancedContent.classList.contains('hidden')) {
                        advancedToggle.click();
                    }
                }, 300);
            });
        }

        // 表单字段自动保存
        this.setupAutoSave();

        // 键盘快捷键
        this.setupKeyboardShortcuts();

        // 实时更新确认信息
        this.setupConfirmationUpdates();

        // 融合比例交互
        this.setupFusionRatioInteraction();
    }

    /**
     * 显示指定步骤
     */
    showStep(stepNumber) {
        this.currentStep = stepNumber;
        
        // 隐藏所有步骤
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) {
                step.classList.add('hidden');
            }
        }
        
        // 显示当前步骤
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.remove('hidden');
        }
        
        // 更新进度指示器
        this.updateProgressIndicator(stepNumber);
        
        // 如果是步骤3，更新确认信息
        if (stepNumber === 3) {
            this.updateConfirmationInfo();
        }
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 更新进度指示器
     */
    updateProgressIndicator(currentStep) {
        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`step-${i}-indicator`);
            const label = indicator?.nextElementSibling;
            
            if (i < currentStep) {
                // 已完成的步骤
                indicator?.classList.remove('bg-gray-300', 'text-gray-600', 'bg-blue-500', 'text-white');
                indicator?.classList.add('bg-green-500', 'text-white');
                label?.classList.remove('text-gray-500', 'text-blue-600');
                label?.classList.add('text-green-600');
            } else if (i === currentStep) {
                // 当前步骤
                indicator?.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500');
                indicator?.classList.add('bg-blue-500', 'text-white');
                label?.classList.remove('text-gray-500', 'text-green-600');
                label?.classList.add('text-blue-600');
            } else {
                // 未完成的步骤
                indicator?.classList.remove('bg-blue-500', 'text-white', 'bg-green-500');
                indicator?.classList.add('bg-gray-300', 'text-gray-600');
                label?.classList.remove('text-blue-600', 'text-green-600');
                label?.classList.add('text-gray-500');
            }
        }
        
        // 更新进度条
        const progress12 = document.getElementById('progress-1-2');
        const progress23 = document.getElementById('progress-2-3');
        
        if (progress12) {
            progress12.style.width = currentStep >= 2 ? '100%' : '0%';
            progress12.classList.toggle('bg-green-500', currentStep > 2);
            progress12.classList.toggle('bg-blue-500', currentStep === 2);
        }
        
        if (progress23) {
            progress23.style.width = currentStep >= 3 ? '100%' : '0%';
            progress23.classList.toggle('bg-green-500', currentStep > 3);
            progress23.classList.toggle('bg-blue-500', currentStep === 3);
        }
    }

    /**
     * 验证步骤1
     */
    validateStep1() {
        const courseName = document.getElementById('course-name')?.value?.trim();
        const teacher = document.getElementById('teacher')?.value?.trim();
        
        if (!courseName) {
            this.showFieldError(document.getElementById('course-name'), '请输入课程名称');
            return false;
        }
        
        if (!teacher) {
            this.showFieldError(document.getElementById('teacher'), '请输入教师姓名');
            return false;
        }
        
        return true;
    }

    /**
     * 设置融合比例交互功能
     */
    setupFusionRatioInteraction() {
        const ratioRadios = document.querySelectorAll('input[name="fusion-ratio"]');
        const customRatioContainer = document.getElementById('custom-ratio-container');
        const customRatioInput = document.getElementById('custom-ratio');

        ratioRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'custom') {
                    customRatioContainer.classList.remove('hidden');
                    customRatioInput.focus();
                } else {
                    customRatioContainer.classList.add('hidden');
                }
                this.updateConfirmationInfo();
            });
        });

        // 自定义比例输入验证
        if (customRatioInput) {
            customRatioInput.addEventListener('blur', () => {
                this.validateCustomRatio(customRatioInput);
            });
            customRatioInput.addEventListener('input', () => {
                this.updateConfirmationInfo();
            });
        }
    }

    /**
     * 验证自定义比例格式
     */
    validateCustomRatio(input) {
        const value = input.value.trim();
        if (!value) return true;

        // 简单验证：检查是否包含百分号和加号
        const hasPercentage = value.includes('%');
        
        if (hasPercentage) {
            // 提取所有百分比数字
            const percentages = value.match(/(\d+)%/g);
            if (percentages) {
                const total = percentages.reduce((sum, p) => {
                    return sum + parseInt(p.replace('%', ''));
                }, 0);
                
                if (total !== 100) {
                    this.showFieldError(input, '所有比例相加必须等于100%');
                    return false;
                }
            }
        }
        
        this.clearFieldError(input);
        return true;
    }

    /**
     * 设置确认信息更新
     */
    setupConfirmationUpdates() {
        const fields = ['course-name', 'teacher', 'grade-level', 'fusion-subjects', 'fusion-approach'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    this.updateConfirmationInfo();
                });
            }
        });
    }

    /**
     * 更新确认信息
     */
    updateConfirmationInfo() {
        const courseName = document.getElementById('course-name')?.value?.trim() || '-';
        const teacher = document.getElementById('teacher')?.value?.trim() || '-';
        const gradeLevel = document.getElementById('grade-level')?.value || 'AI自动判断';
        const fusionSubjects = document.getElementById('fusion-subjects')?.value?.trim() || 'AI自动推荐';
        const fusionApproach = document.getElementById('fusion-approach')?.value || 'AI自动选择';
        
        // 获取融合比例
        const selectedRatio = document.querySelector('input[name="fusion-ratio"]:checked')?.value || '70:30';
        let ratioDisplay = '';
        
        switch (selectedRatio) {
            case '70:30':
                ratioDisplay = '主导型(70:30)';
                break;
            case '60:40':
                ratioDisplay = '偏重型(60:40)';
                break;
            case '50:50':
                ratioDisplay = '均衡型(50:50)';
                break;
            case 'custom':
                const customRatio = document.getElementById('custom-ratio')?.value?.trim();
                ratioDisplay = customRatio ? `自定义(${customRatio})` : '自定义';
                break;
            default:
                ratioDisplay = '主导型(70:30)';
        }
        
        // 获取教学方式显示名称
        const approachNames = {
            'project-based': '项目式学习',
            'problem-based': '问题导向学习',
            'theme-based': '主题式融合',
            'case-study': '案例研究',
            'inquiry-based': '探究式学习'
        };
        const approachDisplay = approachNames[fusionApproach] || 'AI自动选择';
        
        const classHours = document.getElementById('class-hours')?.value?.trim() || 'AI自动确定';
        
        const confirmCourseName = document.getElementById('confirm-course-name');
        const confirmTeacher = document.getElementById('confirm-teacher');
        const confirmGrade = document.getElementById('confirm-grade');
        const confirmClassHours = document.getElementById('confirm-class-hours');
        const confirmSubjects = document.getElementById('confirm-subjects');
        const confirmRatio = document.getElementById('confirm-ratio');
        const confirmApproach = document.getElementById('confirm-approach');
        
        if (confirmCourseName) confirmCourseName.textContent = courseName;
        if (confirmTeacher) confirmTeacher.textContent = teacher;
        if (confirmGrade) confirmGrade.textContent = gradeLevel;
        if (confirmClassHours) confirmClassHours.textContent = classHours === '' ? 'AI自动确定' : `${classHours}课时`;
        if (confirmSubjects) confirmSubjects.textContent = fusionSubjects;
        if (confirmRatio) confirmRatio.textContent = ratioDisplay;
        if (confirmApproach) confirmApproach.textContent = approachDisplay;
    }

    /**
     * 重启流程
     */
    restartProcess() {
        // 隐藏结果区域
        const resultSection = document.getElementById('result-section');
        if (resultSection) {
            resultSection.classList.add('hidden');
        }
        
        // 禁用导出按钮
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const exportWordBtn = document.getElementById('export-word-btn');
        if (exportPdfBtn) {
            exportPdfBtn.disabled = true;
        }
        if (exportWordBtn) {
            exportWordBtn.disabled = true;
        }
        
        // 回到步骤1
        this.showStep(1);
        
        // 清空表单（可选）
        // this.clearAllFields();
    }

    /**
     * 显示结果
     */
    showResult() {
        // 隐藏所有步骤
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) {
                step.classList.add('hidden');
            }
        }
        
        // 显示结果区域
        const resultSection = document.getElementById('result-section');
        if (resultSection) {
            resultSection.classList.remove('hidden');
        }
        
        // 启用导出按钮
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const exportWordBtn = document.getElementById('export-word-btn');
        if (exportPdfBtn) {
            exportPdfBtn.disabled = false;
        }
        if (exportWordBtn) {
            exportWordBtn.disabled = false;
        }
        
        // 更新进度指示器显示全部完成
        this.updateProgressIndicator(4);
    }

    /**
     * 设置高级设置默认状态
     */
    setupAdvancedSettings() {
        // 默认折叠高级设置
        const advancedContent = document.getElementById('advanced-content');
        if (advancedContent) {
            advancedContent.classList.add('hidden');
        }

        // 所有可折叠模块默认收起（除了必填的课程信息）

        // 设置默认模型
        const modelSelect = document.getElementById('ai-model');
        
        if (modelSelect && !modelSelect.value) {
            modelSelect.value = 'deepseek-chat';
        }
    }


    /**
     * 设置表单验证
     */
    setupFormValidation() {
        const requiredFields = ['course-name', 'teacher'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
                
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                });
            }
        });
    }

    /**
     * 验证单个字段
     */
    validateField(field) {
        const value = field.value.trim();
        const isRequired = ['course-name', 'teacher'].includes(field.id);
        
        if (isRequired && !value) {
            this.showFieldError(field, '此字段为必填项');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    /**
     * 显示字段错误
     */
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('border-red-500', 'bg-red-50');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * 清除字段错误
     */
    clearFieldError(field) {
        field.classList.remove('border-red-500', 'bg-red-50');
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * 验证所有必填字段
     */
    validateAllFields() {
        const requiredFields = ['course-name', 'teacher'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * 设置自动保存功能
     */
    setupAutoSave() {
        const fields = [
            'course-name', 'teacher', 'grade-level', 'fusion-subjects', 
            'fusion-approach', 'lesson-content', 'real-world-context', 'custom-requirements', 'custom-ratio'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    this.saveFieldData(fieldId, field.value);
                });
            }
        });

        // 保存融合比例选择
        const ratioRadios = document.querySelectorAll('input[name="fusion-ratio"]');
        ratioRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.saveFieldData('fusion-ratio', radio.value);
            });
        });
    }

    /**
     * 保存字段数据到本地存储
     */
    saveFieldData(fieldId, value) {
        try {
            localStorage.setItem(`lessonPlan_${fieldId}`, value);
            } catch (error) {
                // 静默处理本地存储错误
            }
    }

    /**
     * 从本地存储加载保存的数据
     */
    loadSavedData() {
        const fields = [
            'course-name', 'teacher', 'grade-level', 'fusion-subjects', 
            'fusion-approach', 'lesson-content', 'real-world-context', 'custom-requirements', 'custom-ratio'
        ];
        
        fields.forEach(fieldId => {
            try {
                const savedValue = localStorage.getItem(`lessonPlan_${fieldId}`);
                if (savedValue) {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = savedValue;
                    }
                }
            } catch (error) {
                // 静默处理本地存储错误
            }
        });

        // 加载融合比例选择
        try {
            const savedRatio = localStorage.getItem('lessonPlan_fusion-ratio');
            if (savedRatio) {
                const ratioRadio = document.querySelector(`input[name="fusion-ratio"][value="${savedRatio}"]`);
                if (ratioRadio) {
                    ratioRadio.checked = true;
                    // 如果是自定义比例，显示输入框
                    if (savedRatio === 'custom') {
                        const customRatioContainer = document.getElementById('custom-ratio-container');
                        if (customRatioContainer) {
                            customRatioContainer.classList.remove('hidden');
                        }
                    }
                }
            }
        } catch (error) {
            // 静默处理本地存储错误
        }
    }

    /**
     * 清空所有字段
     */
    clearAllFields() {
        if (confirm('确定要重置所有内容吗？此操作不可撤销。')) {
            // 清空表单字段
            const fields = [
                'course-name', 'teacher', 'grade-level', 'fusion-subjects', 
                'fusion-approach', 'lesson-content', 'real-world-context', 'custom-requirements'
            ];
            
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                    this.clearFieldError(field);
                }
            });
            
            // 清空预览内容
            const previewContent = document.getElementById('preview-content');
            if (previewContent) {
                previewContent.innerHTML = `
                    <div class="text-center text-gray-500 py-20">
                        <i class="fas fa-file-alt text-6xl mb-4 opacity-30"></i>
                        <p class="text-lg">生成的教学方案将在这里显示</p>
                    </div>
                `;
            }
            
            // 禁用导出按钮
            const exportBtn = document.getElementById('export-word-btn');
            if (exportBtn) {
                exportBtn.disabled = true;
            }
            
            // 清空本地存储
            this.clearSavedData();
            
            // 回到步骤1
            this.showStep(1);
            
            this.showNotification('已重置所有内容', 'success');
        }
    }

    /**
     * 清空本地存储的数据
     */
    clearSavedData() {
        const fields = [
            'course-name', 'teacher', 'grade-level', 'fusion-subjects', 
            'fusion-approach', 'lesson-content', 'real-world-context', 'custom-requirements', 'custom-ratio', 'fusion-ratio'
        ];
        
        fields.forEach(fieldId => {
            try {
                localStorage.removeItem(`lessonPlan_${fieldId}`);
            } catch (error) {
                // 静默处理本地存储错误
            }
        });
    }

    /**
     * 获取表单数据
     */
    getFormData() {
        // 获取融合比例
        const selectedRatio = document.querySelector('input[name="fusion-ratio"]:checked')?.value || '70:30';
        let fusionRatio = selectedRatio;
        
        if (selectedRatio === 'custom') {
            const customRatio = document.getElementById('custom-ratio')?.value?.trim();
            fusionRatio = customRatio || '主学科70%+融合学科30%';
        }

        return {
            courseName: document.getElementById('course-name')?.value?.trim() || '',
            teacher: document.getElementById('teacher')?.value?.trim() || '',
            gradeLevel: document.getElementById('grade-level')?.value?.trim() || '',
            classHours: document.getElementById('class-hours')?.value?.trim() || '',
            fusionSubjects: document.getElementById('fusion-subjects')?.value?.trim() || '',
            fusionGoals: document.getElementById('fusion-goals')?.value?.trim() || '',
            fusionApproach: document.getElementById('fusion-approach')?.value?.trim() || '',
            fusionRatio: fusionRatio,
            lessonContent: document.getElementById('lesson-content')?.value?.trim() || '',
            realWorldContext: document.getElementById('real-world-context')?.value?.trim() || '',
            customRequirements: document.getElementById('custom-requirements')?.value?.trim() || '',
            aiModel: document.getElementById('ai-model')?.value || 'deepseek-chat',
            apiKey: document.getElementById('api-key')?.value?.trim() || getSharedApiKey()
        };
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter 生成教案
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const generateBtn = document.getElementById('generate-btn');
                if (generateBtn && !generateBtn.disabled) {
                    generateBtn.click();
                }
            }
            
            // Ctrl+R 清空内容
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.clearAllFields();
            }
            
            // Ctrl+S 保存（导出Word）
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const exportBtn = document.getElementById('export-word-btn');
                if (exportBtn && !exportBtn.disabled) {
                    exportBtn.click();
                }
            }
        });
    }

    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 移除已存在的通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
        
        // 根据类型设置样式
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500', 'text-white');
                break;
            default:
                notification.classList.add('bg-blue-500', 'text-white');
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * 显示加载状态
     */
    showLoading(show = true) {
        const loadingDiv = document.getElementById('loading');
        const generateBtn = document.getElementById('generate-btn');
        
        if (show) {
            if (loadingDiv) loadingDiv.classList.remove('hidden');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>设计中...';
            }
        } else {
            if (loadingDiv) loadingDiv.classList.add('hidden');
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-project-diagram mr-2"></i>生成融合教学设计';
            }
        }
    }

    /**
     * 显示串流界面 - 优化版本（进度条模式）
     */
    showStreamingInterface() {
        // 创建或显示串流预览区域
        let streamingPreview = document.getElementById('streaming-preview');
        if (!streamingPreview) {
            streamingPreview = document.createElement('div');
            streamingPreview.id = 'streaming-preview';
            streamingPreview.className = 'hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6';
            
            // 插入到步骤3后面
            const step3 = document.getElementById('step-3');
            if (step3) {
                step3.parentNode.insertBefore(streamingPreview, step3.nextSibling);
            }
        }

        streamingPreview.innerHTML = `
            <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i class="fas fa-magic text-white animate-pulse"></i>
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-gray-900">AI正在生成教学设计</h3>
                    <p class="text-gray-600">请稍候，AI正在为您精心设计教学方案...</p>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <!-- 进度条区域 -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">生成进度</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div id="streaming-progress-bar" class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
                    </div>
                    <div class="mt-2 text-xs text-gray-500 text-center">
                        <span id="streaming-status">AI正在分析课程需求...</span>
                    </div>
                </div>
                
                <!-- 隐藏的内容预览区域（仅用于字数统计） -->
                <div id="streaming-content" class="hidden">
                    <div class="text-gray-500 text-center py-8">
                        <i class="fas fa-stream text-2xl mb-2 opacity-50"></i>
                        <p>AI生成的内容正在后台处理...</p>
                    </div>
                </div>
                
                <div class="mt-4 flex justify-center">
                    <button id="stop-streaming-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                        <i class="fas fa-stop mr-2"></i> 停止生成
                    </button>
                </div>
            </div>
        `;

        streamingPreview.classList.remove('hidden');
        
        // 绑定停止按钮事件
        const stopBtn = document.getElementById('stop-streaming-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopStreaming();
            });
        }

        // 滚动到串流界面
        streamingPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * 隐藏串流界面
     */
    hideStreamingInterface() {
        const streamingPreview = document.getElementById('streaming-preview');
        if (streamingPreview) {
            streamingPreview.classList.add('hidden');
        }
    }

    /**
     * 更新串流内容 - 优化版本（进度条模式）
     */
    updateStreamingContent(content) {
        const streamingProgressBar = document.getElementById('streaming-progress-bar');
        const streamingStatus = document.getElementById('streaming-status');
        
        if (streamingProgressBar && streamingStatus) {
            // 使用节流来优化性能
            if (this.streamingUpdateTimeout) {
                clearTimeout(this.streamingUpdateTimeout);
            }
            
            this.streamingUpdateTimeout = setTimeout(() => {
                const contentLength = content.length;
                const maxLength = 1000; // 预期最大长度
                const progressPercentage = Math.min((contentLength / maxLength) * 100, 100);
                
                // 更新进度条
                streamingProgressBar.style.width = `${progressPercentage}%`;
                
                // 根据进度更新状态文本
                let statusText = '';
                if (progressPercentage < 20) {
                    statusText = 'AI正在分析课程需求...';
                } else if (progressPercentage < 40) {
                    statusText = 'AI正在设计教学目标...';
                } else if (progressPercentage < 60) {
                    statusText = 'AI正在规划教学过程...';
                } else if (progressPercentage < 80) {
                    statusText = 'AI正在完善教学细节...';
                } else if (progressPercentage < 95) {
                    statusText = 'AI正在优化教学方案...';
                } else {
                    statusText = '即将完成，正在生成最终预览...';
                }
                
                streamingStatus.textContent = statusText;
                
                // 如果超过1000字符，动态调整进度条
                if (contentLength > maxLength) {
                    const adjustedPercentage = Math.min(((contentLength - maxLength) / maxLength) * 50 + 100, 150);
                    streamingProgressBar.style.width = `${adjustedPercentage}%`;
                }
                
            }, 100); // 100ms节流，减少频繁更新
        }
        
        // 仍然保存内容用于最终渲染
        this.currentStreamingContent = content;
    }

    /**
     * 停止串流生成
     */
    stopStreaming() {
        // 这里可以添加停止串流的逻辑
        // 目前只是隐藏界面
        this.hideStreamingInterface();
        this.showLoading(false);
        this.showNotification('已停止生成', 'warning');
    }

    /**
     * 更新预览内容 - 优化版本（最终格式化显示）
     */
    updatePreview(content) {
        const previewContent = document.getElementById('preview-content');
        if (previewContent) {
            // 隐藏串流界面
            this.hideStreamingInterface();
            
            // 显示最终格式化的内容
            previewContent.innerHTML = content;
            
            // 添加一个平滑的显示动画
            previewContent.style.opacity = '0';
            previewContent.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                previewContent.style.transition = 'all 0.5s ease-out';
                previewContent.style.opacity = '1';
                previewContent.style.transform = 'translateY(0)';
            }, 100);
            
            // 启用导出按钮
            const exportPdfBtn = document.getElementById('export-pdf-btn');
            const exportWordBtn = document.getElementById('export-word-btn');
            if (exportPdfBtn) {
                exportPdfBtn.disabled = false;
            }
            if (exportWordBtn) {
                exportWordBtn.disabled = false;
            }
            
            // 显示结果页面
            this.showResult();
            
            // 显示完成通知
            this.showNotification('教学方案生成完成！', 'success');
        }
    }

    /**
     * 获取当前时间字符串
     */
    getCurrentDateTime() {
        const now = new Date();
        return now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 格式化文件名
     */
    formatFileName(baseName) {
        const formData = this.getFormData();
        const timestamp = new Date().toISOString().slice(0, 10);
        return `${baseName}_${formData.courseName}_${formData.teacher}_${timestamp}`.replace(/[^\w\u4e00-\u9fa5]/g, '_');
    }
}

// 初始化核心功能
document.addEventListener('DOMContentLoaded', () => {
    window.lessonPlanCore = new LessonPlanCore();
});
