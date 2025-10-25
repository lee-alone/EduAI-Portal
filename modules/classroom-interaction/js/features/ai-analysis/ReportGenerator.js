/**
 * 报告生成模块
 * 负责生成HTML报告和显示
 */

class ReportGenerator {
    constructor(apiConfigManager) {
        this.apiConfigManager = apiConfigManager;
    }

    /**
     * 生成最终报告HTML
     */
    generateFinalReportHTML(integratedData, summary, aiReport) {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = this.apiConfigManager.getSelectedModel();
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">生成时间: ${currentDate}</p>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">使用模型: ${selectedModel}</p>
                <p style="color: #4a5568; margin-bottom: 0.5rem; font-weight: 500;">数据匹配率: ${summary.matchRate}%</p>
                <p style="color: #4a5568; margin-bottom: 2rem; font-weight: 500;">AI分析完成，Token使用: ${aiReport.usage?.total_tokens || 'N/A'}</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-database" style="color: #667eea;"></i>
                    数据处理结果
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #4299e1;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.totalRecords}</div>
                        <div style="color: #718096;">课堂活动记录数</div>
                    </div>
                    <div style="background: #f0fff4; padding: 1rem; border-radius: 8px; border-left: 4px solid #48bb78;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.matchedRecords}</div>
                        <div style="color: #718096;">成功匹配记录</div>
                    </div>
                    <div style="background: #fff5f5; padding: 1rem; border-radius: 8px; border-left: 4px solid #f56565;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.unmatchedRecords}</div>
                        <div style="color: #718096;">未匹配记录</div>
                    </div>
                    <div style="background: #faf5ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #9f7aea;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.totalClassSize}</div>
                        <div style="color: #718096;">班级总人数</div>
                    </div>
                    <div style="background: #e6fffa; padding: 1rem; border-radius: 8px; border-left: 4px solid #38b2ac;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.activeStudents}</div>
                        <div style="color: #718096;">参与活动学生</div>
                    </div>
                    <div style="background: #fef5e7; padding: 1rem; border-radius: 8px; border-left: 4px solid #ed8936;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.inactiveStudents}</div>
                        <div style="color: #718096;">未参与学生</div>
                    </div>
                </div>
            </div>
            
            <div class="ai-report-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="color: #4a5568; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-robot" style="color: #667eea;"></i>
                        AI智能分析报告
                    </h4>
                    <button id="export-report-btn" class="ai-export-btn" onclick="exportAIReport()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <i class="fas fa-download"></i>
                        导出PDF报告
                    </button>
                </div>
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea;">
                    ${aiReport.content}
                </div>
            </div>
            
            <div class="ai-report-footer" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 0.9rem; text-align: center;">
                    <i class="fas fa-robot mr-1"></i>
                    本报告由AI智能分析生成，基于真实课堂数据
                </p>
            </div>
        `;
    }

    /**
     * 生成报告HTML（预处理阶段）
     */
    generateReportHTML(integratedData, summary) {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = this.apiConfigManager.getSelectedModel();
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #718096; margin-bottom: 0.5rem;">生成时间: ${currentDate}</p>
                <p style="color: #718096; margin-bottom: 0.5rem;">使用模型: ${selectedModel}</p>
                <p style="color: #718096; margin-bottom: 2rem;">数据匹配率: ${summary.matchRate}%</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-database" style="color: #667eea;"></i>
                    数据处理结果
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #4299e1;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.totalRecords}</div>
                        <div style="color: #718096;">课堂活动记录数</div>
                    </div>
                    <div style="background: #f0fff4; padding: 1rem; border-radius: 8px; border-left: 4px solid #48bb78;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.matchedRecords}</div>
                        <div style="color: #718096;">成功匹配记录</div>
                    </div>
                    <div style="background: #fff5f5; padding: 1rem; border-radius: 8px; border-left: 4px solid #f56565;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.unmatchedRecords}</div>
                        <div style="color: #718096;">未匹配记录</div>
                    </div>
                    <div style="background: #faf5ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #9f7aea;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.totalClassSize}</div>
                        <div style="color: #718096;">班级总人数</div>
                    </div>
                    <div style="background: #e6fffa; padding: 1rem; border-radius: 8px; border-left: 4px solid #38b2ac;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.activeStudents}</div>
                        <div style="color: #718096;">参与活动学生</div>
                    </div>
                    <div style="background: #fef5e7; padding: 1rem; border-radius: 8px; border-left: 4px solid #ed8936;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${summary.inactiveStudents}</div>
                        <div style="color: #718096;">未参与学生</div>
                    </div>
                </div>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-users" style="color: #667eea;"></i>
                    班级整体表现
                </h4>
                <p style="line-height: 1.7; margin-bottom: 1rem;">
                    根据数据分析，本班共有 <strong>${summary.activeStudents}</strong> 名学生参与课堂活动，
                    总记录数 <strong>${summary.totalRecords}</strong> 条，数据匹配率 <strong>${summary.matchRate}%</strong>。
                    涉及学科：${summary.subjects.join('、')}。
                </p>
                <p style="line-height: 1.7; margin-bottom: 1.5rem;">
                    学生总积分：<strong>${summary.totalPoints}</strong> 分，平均积分：<strong>${summary.averagePoints}</strong> 分。
                </p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-user-friends" style="color: #667eea;"></i>
                    个别学生表现
                </h4>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="color: #718096; margin-bottom: 0.5rem;">数据整合成功，已为每个学生生成个性化评价：</p>
                    <ul style="color: #4a5568; line-height: 1.6;">
                        <li>✅ 学生姓名与座号匹配完成</li>
                        <li>✅ 课堂活动记录已整合</li>
                        <li>✅ 个人表现数据已提取</li>
                        <li>✅ 准备生成个性化评价</li>
                    </ul>
                </div>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-lightbulb" style="color: #667eea;"></i>
                    下一步建议
                </h4>
                <ul style="line-height: 1.7; margin-bottom: 1.5rem; padding-left: 1.5rem;">
                    <li>数据整合成功，可以调用AI生成详细的学情分析报告</li>
                    <li>建议为每个学生生成个性化的表现评价</li>
                    <li>可以基于数据生成班级整体表现趋势分析</li>
                </ul>
            </div>
            
            <div class="ai-report-footer" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 0.9rem; text-align: center;">
                    <i class="fas fa-robot mr-1"></i>
                    数据预处理完成，准备进行AI分析
                </p>
            </div>
        `;
    }

    /**
     * 生成模拟报告
     */
    generateMockReport() {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const selectedModel = this.apiConfigManager.getSelectedModel();
        const apiEndpoint = this.apiConfigManager.getAPIEndpoint();
        const apiProvider = apiEndpoint.includes('deepseek') ? 'DeepSeek' : 
                           apiEndpoint.includes('bigmodel') ? '智谱AI' : 
                           apiEndpoint.includes('dashscope') ? '通义千问' : '自定义API';
        
        return `
            <div class="ai-report-header">
                <h3 style="color: #2d3748; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line" style="color: #667eea;"></i>
                    AI学情分析报告
                </h3>
                <p style="color: #718096; margin-bottom: 0.5rem;">生成时间: ${currentDate}</p>
                <p style="color: #718096; margin-bottom: 0.5rem;">使用模型: ${selectedModel}</p>
                <p style="color: #718096; margin-bottom: 2rem;">API提供商: ${apiProvider}</p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-users" style="color: #667eea;"></i>
                    班级整体表现
                </h4>
                <p style="line-height: 1.7; margin-bottom: 1.5rem;">
                    根据课堂活动数据分析，本班学生在课堂参与度方面表现良好，平均参与率达到85%。大部分学生能够积极参与课堂讨论，展现出良好的学习热情。
                </p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-star" style="color: #667eea;"></i>
                    优秀表现学生
                </h4>
                <p style="line-height: 1.7; margin-bottom: 1.5rem;">
                    张三、李四、王五等同学在课堂表现中脱颖而出，他们不仅积极参与讨论，还能提出有深度的问题，展现出较强的学习能力和创新思维。
                </p>
            </div>
            
            <div class="ai-report-section">
                <h4 style="color: #4a5568; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-lightbulb" style="color: #667eea;"></i>
                    改进建议
                </h4>
                <ul style="line-height: 1.7; margin-bottom: 1.5rem; padding-left: 1.5rem;">
                    <li>建议增加小组合作活动，提升学生协作能力</li>
                    <li>对于参与度较低的学生，可以给予更多关注和鼓励</li>
                    <li>适当增加互动环节，保持学生学习的积极性</li>
                </ul>
            </div>
            
            <div class="ai-report-footer" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 0.9rem; text-align: center;">
                    <i class="fas fa-robot mr-1"></i>
                    本报告由AI智能分析生成，仅供参考
                </p>
            </div>
        `;
    }

    /**
     * 显示报告
     */
    displayReport(report) {
        // 停止Token跟踪
        this.stopTokenTracking();
        
        const output = document.getElementById('ai-report-output');
        output.innerHTML = `
            <div class="ai-report-content">
                ${report}
            </div>
        `;
        
        // 添加学生评价导航
        this.addStudentEvaluationNavigation();
        
        // 添加淡入动画
        output.style.opacity = '0';
        output.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            output.style.transition = 'all 0.6s ease-out';
            output.style.opacity = '1';
            output.style.transform = 'translateY(0)';
        }, 100);
    }

    /**
     * 添加学生评价导航
     */
    addStudentEvaluationNavigation() {
        const reportContent = document.querySelector('.ai-report-content');
        if (!reportContent) return;

        // 查找所有学生评价
        const studentEvaluations = reportContent.querySelectorAll('.student-evaluation');
        if (studentEvaluations.length === 0) return;

        // 创建导航
        const nav = document.createElement('div');
        nav.className = 'student-evaluation-nav';
        nav.innerHTML = `
            <h5>学生评价导航</h5>
            <div class="student-evaluation-links">
                ${Array.from(studentEvaluations).map((evaluation, index) => {
                    const studentName = evaluation.querySelector('.student-name')?.textContent || `学生${index + 1}`;
                    const studentId = `student-${index + 1}`;
                    evaluation.id = studentId;
                    return `<a href="#${studentId}" class="student-evaluation-link">${studentName}</a>`;
                }).join('')}
            </div>
        `;

        // 将导航插入到第一个学生评价之前
        const firstStudentEvaluation = studentEvaluations[0];
        if (firstStudentEvaluation) {
            firstStudentEvaluation.parentNode.insertBefore(nav, firstStudentEvaluation);
        }

        // 添加平滑滚动
        nav.addEventListener('click', (e) => {
            if (e.target.classList.contains('student-evaluation-link')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        const output = document.getElementById('ai-report-output');
        output.innerHTML = `
            <div class="ai-report-loading">
                <div class="loading-header">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span id="loading-message">正在初始化AI分析...</span>
                </div>
                <div class="token-usage-display">
                    <div class="token-stats">
                        <div class="token-item">
                            <span class="token-label">已使用Token:</span>
                            <span id="current-tokens" class="token-value">0</span>
                        </div>
                        <div class="token-item">
                            <span class="token-label">预估成本:</span>
                            <span id="estimated-cost" class="token-value">¥0.00</span>
                        </div>
                        <div class="token-item">
                            <span class="token-label">处理状态:</span>
                            <span id="processing-status" class="token-value">准备中</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        this.addTokenDisplayStyles();
        
        // 启动Token跟踪
        this.startTokenTracking();
    }

    /**
     * 更新加载消息
     */
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }

    /**
     * 更新生成按钮状态
     */
    updateGenerateButton(isGenerating) {
        const btn = document.getElementById('generate-ai-report-btn');
        
        if (isGenerating) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>正在生成报告...';
            btn.disabled = true;
            btn.classList.add('ai-generate-btn:disabled');
        } else {
            btn.innerHTML = '<i class="fas fa-robot mr-2"></i>生成AI学情报告';
            btn.disabled = false;
            btn.classList.remove('ai-generate-btn:disabled');
        }
    }

    /**
     * 添加Token显示样式
     */
    addTokenDisplayStyles() {
        if (document.getElementById('token-display-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'token-display-styles';
        style.textContent = `
            .ai-report-loading {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
            }
            
            .loading-header {
                margin-bottom: 1.5rem;
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .loading-header i {
                margin-right: 0.5rem;
                font-size: 1.5rem;
            }
            
            .token-usage-display {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 1.5rem;
                backdrop-filter: blur(10px);
            }
            
            .token-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .token-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .token-label {
                font-weight: 500;
                opacity: 0.9;
            }
            
            .token-value {
                font-weight: 700;
                color: #ffd700;
                font-size: 1.1rem;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                overflow: hidden;
                margin-top: 1rem;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ade80, #22c55e);
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .token-value.updating {
                animation: pulse 1s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 启动Token跟踪
     */
    startTokenTracking() {
        this.tokenTracker = {
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            startTime: Date.now(),
            updateInterval: null
        };
        
        // 每3秒更新一次显示
        this.tokenTracker.updateInterval = setInterval(() => {
            this.updateTokenDisplay();
        }, 3000);
        
        // 监听Token使用情况更新事件
        this.tokenUsageListener = (event) => {
            this.updateActualTokenUsage(event.detail);
        };
        window.addEventListener('tokenUsageUpdate', this.tokenUsageListener);
        
        console.log('🔄 Token跟踪已启动，每3秒更新一次');
    }

    /**
     * 更新Token显示
     */
    updateTokenDisplay() {
        if (!this.tokenTracker) return;
        
        const currentTokensEl = document.getElementById('current-tokens');
        const estimatedCostEl = document.getElementById('estimated-cost');
        const processingStatusEl = document.getElementById('processing-status');
        const progressFillEl = document.getElementById('progress-fill');
        
        if (currentTokensEl) {
            // 如果有实际Token数据，使用实际数据；否则使用估算值
            if (this.tokenTracker.totalTokens > 0) {
                // 使用实际Token数据，不设上限
                currentTokensEl.textContent = this.tokenTracker.totalTokens.toLocaleString();
            } else {
                // 模拟Token增长，移除5000限制
                const elapsedSeconds = Math.floor((Date.now() - this.tokenTracker.startTime) / 1000);
                const estimatedTokens = elapsedSeconds * 50; // 移除5000限制
                this.tokenTracker.totalTokens = estimatedTokens;
                currentTokensEl.textContent = this.tokenTracker.totalTokens.toLocaleString();
            }
            
            currentTokensEl.classList.add('updating');
            setTimeout(() => {
                currentTokensEl.classList.remove('updating');
            }, 1000);
        }
        
        if (estimatedCostEl) {
            // 估算成本（基于GPT-4价格：$0.03/1K tokens）
            const cost = (this.tokenTracker.totalTokens / 1000) * 0.03 * 7.2; // 转换为人民币
            estimatedCostEl.textContent = `¥${cost.toFixed(2)}`;
        }
        
        if (processingStatusEl) {
            const statuses = [
                '正在分析数据...',
                '生成班级整体分析...',
                '处理学生个别评价...',
                '优化报告格式...',
                '最终整合中...'
            ];
            const statusIndex = Math.floor((Date.now() - this.tokenTracker.startTime) / 10000) % statuses.length;
            processingStatusEl.textContent = statuses[statusIndex];
        }
        
        if (progressFillEl) {
            // 动态计算进度，不固定基于5000
            const maxEstimatedTokens = 10000; // 提高预估上限
            const progress = Math.min((this.tokenTracker.totalTokens / maxEstimatedTokens) * 100, 95);
            progressFillEl.style.width = `${progress}%`;
        }
    }

    /**
     * 更新实际Token使用情况
     */
    updateActualTokenUsage(usage) {
        if (!this.tokenTracker) return;
        
        // 累积Token使用情况，而不是覆盖
        this.tokenTracker.totalTokens += usage.total_tokens || 0;
        this.tokenTracker.promptTokens += usage.prompt_tokens || 0;
        this.tokenTracker.completionTokens += usage.completion_tokens || 0;
        
        console.log('📊 更新实际Token使用情况:', usage);
        console.log('📊 累积Token总数:', this.tokenTracker.totalTokens);
        this.updateTokenDisplay();
    }

    /**
     * 停止Token跟踪
     */
    stopTokenTracking() {
        if (this.tokenTracker && this.tokenTracker.updateInterval) {
            clearInterval(this.tokenTracker.updateInterval);
            this.tokenTracker = null;
        }
        
        // 移除事件监听器
        if (this.tokenUsageListener) {
            window.removeEventListener('tokenUsageUpdate', this.tokenUsageListener);
            this.tokenUsageListener = null;
        }
        
        console.log('⏹️ Token跟踪已停止');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportGenerator;
} else {
    window.ReportGenerator = ReportGenerator;
}
