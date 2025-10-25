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
        this.init();
    }

    /**
     * 初始化文件上传功能
     */
    init() {
        this.setupFileUploads();
        this.bindEvents();
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
        // 文件上传事件
        document.getElementById('activity-excel-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'activity');
        });

        document.getElementById('roster-excel-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'roster');
        });
    }

    /**
     * 处理文件上传
     */
    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型
        const allowedTypes = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            if (window.notificationManager) {
                window.notificationManager.error('请上传Excel文件 (.xlsx 或 .xls 格式)');
            }
            event.target.value = '';
            return;
        }

        // 验证文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            if (window.notificationManager) {
                window.notificationManager.error('文件大小不能超过10MB');
            }
            event.target.value = '';
            return;
        }

        this.uploadedFiles[type] = file;
        this.updateFileUploadDisplay(event.target);
        if (window.notificationManager) {
            window.notificationManager.success(`${type === 'activity' ? '课堂活动' : '学生名单'}文件上传成功`);
        }
    }

    /**
     * 更新文件上传显示
     */
    updateFileUploadDisplay(input) {
        const file = input.files[0];
        const label = input.nextElementSibling;
        const content = label.querySelector('.ai-file-upload-content');
        
        if (file) {
            // 更新显示为已选择状态
            content.innerHTML = `
                <i class="fas fa-check-circle ai-file-upload-icon" style="color: #48bb78;"></i>
                <div class="ai-file-upload-text">${file.name}</div>
                <div class="ai-file-upload-hint">文件大小: ${this.formatFileSize(file.size)}</div>
            `;
            label.style.borderColor = '#48bb78';
            label.style.background = 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)';
        } else {
            // 恢复默认状态
            const icon = input.id.includes('activity') ? 'fas fa-file-excel' : 'fas fa-users';
            const text = input.id.includes('activity') ? '上传课堂活动Excel文件' : '上传学生名单Excel (座号-姓名对照)';
            
            content.innerHTML = `
                <i class="${icon} ai-file-upload-icon"></i>
                <div class="ai-file-upload-text">${text}</div>
                <div class="ai-file-upload-hint">支持 .xlsx 和 .xls 格式</div>
            `;
            label.style.borderColor = '#cbd5e0';
            label.style.background = 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)';
        }
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
