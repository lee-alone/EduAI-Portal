/**
 * 文件上传管理模块
 * 负责处理Excel文件上传、验证和显示
 */

class FileUploadManager {
    constructor() {
        this.uploadedFiles = {
            activity: null,
            roster: null
        };
        // 延迟初始化，确保DOM元素存在
        setTimeout(() => {
            this.init();
        }, 200);
    }

    /**
     * 初始化文件上传功能
     */
    init() {
        console.log('🚀 FileUploadManager 开始初始化');
        this.setupFileUploads();
        this.bindEvents();
        this.debugDOMState();
        console.log('✅ FileUploadManager 初始化完成');
    }

    /**
     * 调试DOM状态
     */
    debugDOMState() {
        console.log('🔍 调试DOM状态:');
        
        const activityInput = document.getElementById('activity-excel-upload');
        const rosterInput = document.getElementById('roster-excel-upload');
        
        if (activityInput) {
            const label = activityInput.nextElementSibling;
            const content = label ? label.querySelector('.ai-file-upload-content') : null;
            console.log('📁 课堂活动上传区域:');
            console.log('  - Input:', activityInput);
            console.log('  - Label:', label);
            console.log('  - Content:', content);
            if (content) {
                console.log('  - Content innerHTML:', content.innerHTML);
                console.log('  - Content computed style:', window.getComputedStyle(content));
            }
        }
        
        if (rosterInput) {
            const label = rosterInput.nextElementSibling;
            const content = label ? label.querySelector('.ai-file-upload-content') : null;
            console.log('👥 学生名单上传区域:');
            console.log('  - Input:', rosterInput);
            console.log('  - Label:', label);
            console.log('  - Content:', content);
            if (content) {
                console.log('  - Content innerHTML:', content.innerHTML);
                console.log('  - Content computed style:', window.getComputedStyle(content));
            }
        }
    }

    /**
     * 设置文件上传组件
     */
    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateFileUploadDisplay(e.target);
            });
        });
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        console.log('🔗 开始绑定文件上传事件');
        
        // 文件上传事件 - 使用事件委托确保元素存在
        const activityInput = document.getElementById('activity-excel-upload');
        const rosterInput = document.getElementById('roster-excel-upload');
        
        console.log('📁 Activity input:', activityInput);
        console.log('👥 Roster input:', rosterInput);
        
        if (activityInput) {
            console.log('✅ 绑定课堂活动文件上传事件');
            activityInput.addEventListener('change', (e) => {
                this.handleFileUpload(e, 'activity');
            });
        } else {
            console.error('❌ 找不到课堂活动文件上传元素');
        }
        
        if (rosterInput) {
            console.log('✅ 绑定学生名单文件上传事件');
            rosterInput.addEventListener('change', (e) => {
                this.handleFileUpload(e, 'roster');
            });
        } else {
            console.error('❌ 找不到学生名单文件上传元素');
        }
        
        console.log('🔗 文件上传事件绑定完成');
    }

    /**
     * 处理文件上传
     */
    handleFileUpload(event, type) {
        console.log('📁 文件上传事件触发:', type, event.target.files[0]);
        
        const file = event.target.files[0];
        if (!file) {
            console.log('❌ 没有选择文件');
            return;
        }

        // 验证文件类型
        const allowedTypes = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            console.log('❌ 文件类型不支持:', fileExtension);
            if (window.notificationManager) {
                window.notificationManager.error('请上传Excel文件 (.xlsx 或 .xls 格式)');
            }
            event.target.value = '';
            return;
        }

        // 验证文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            console.log('❌ 文件过大:', file.size);
            if (window.notificationManager) {
                window.notificationManager.error('文件大小不能超过10MB');
            }
            event.target.value = '';
            return;
        }

        console.log('✅ 文件验证通过，开始处理');
        this.uploadedFiles[type] = file;
        this.updateFileUploadDisplay(event.target);
        
        if (window.notificationManager) {
            window.notificationManager.success(`${type === 'activity' ? '课堂活动' : '学生名单'}文件上传成功`);
        } else {
            console.log('⚠️ NotificationManager 未初始化');
        }
    }

    /**
     * 更新文件上传显示
     */
    updateFileUploadDisplay(input) {
        console.log('🔄 开始更新文件上传显示:', input);
        
        const file = input.files[0];
        const label = input.nextElementSibling;
        
        console.log('📄 文件信息:', file);
        console.log('🏷️ Label元素:', label);
        
        if (!label) {
            console.error('❌ 找不到label元素');
            return;
        }
        
        const content = label.querySelector('.ai-file-upload-content');
        console.log('📦 Content元素:', content);
        
        if (!content) {
            console.error('❌ 找不到content元素');
            return;
        }
        
        if (file) {
            console.log('✅ 更新为已选择状态');
            console.log('📄 文件名:', file.name);
            console.log('📏 文件大小:', this.formatFileSize(file.size));
            
            // 更新显示为已选择状态
            content.innerHTML = `
                <i class="fas fa-check-circle ai-file-upload-icon" style="color: #48bb78 !important; font-size: 2.5rem !important;"></i>
                <div class="ai-file-upload-text" style="color: #2d3748 !important; font-size: 1.1rem !important; font-weight: 600 !important;">${file.name}</div>
                <div class="ai-file-upload-hint" style="color: #718096 !important; font-size: 0.9rem !important;">文件大小: ${this.formatFileSize(file.size)}</div>
            `;
            label.style.borderColor = '#48bb78';
            label.style.background = 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)';
            
            // 强制显示内容
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.alignItems = 'center';
            content.style.gap = '0.5rem';
            content.style.pointerEvents = 'auto';
            
            console.log('🎨 样式已应用，内容应该可见');
        } else {
            console.log('🔄 恢复默认状态');
            // 恢复默认状态
            const icon = input.id.includes('activity') ? 'fas fa-file-excel' : 'fas fa-users';
            const text = input.id.includes('activity') ? '上传课堂活动Excel文件' : '上传学生名单Excel (座号-姓名对照)';
            
            content.innerHTML = `
                <i class="${icon} ai-file-upload-icon" style="color: #667eea !important; font-size: 2.5rem !important;"></i>
                <div class="ai-file-upload-text" style="color: #2d3748 !important; font-size: 1.1rem !important; font-weight: 600 !important;">${text}</div>
                <div class="ai-file-upload-hint" style="color: #718096 !important; font-size: 0.9rem !important;">支持 .xlsx 和 .xls 格式</div>
            `;
            label.style.borderColor = '#cbd5e0';
            label.style.background = 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)';
            
            // 确保内容可见
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.alignItems = 'center';
            content.style.gap = '0.5rem';
            content.style.pointerEvents = 'auto';
        }
        
        console.log('✅ 文件上传显示更新完成');
    }

    /**
     * 获取上传的文件
     */
    getUploadedFiles() {
        return this.uploadedFiles;
    }

    /**
     * 检查文件是否已上传
     */
    hasRequiredFiles() {
        return this.uploadedFiles.activity && this.uploadedFiles.roster;
    }


    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
} else {
    window.FileUploadManager = FileUploadManager;
}
