/**
 * AI提示词配置管理器
 * 提供统一的配置接口和预设模板
 */

class PromptConfig {
    constructor() {
        this.config = {
            // 输出格式配置
            outputFormat: {
                useHTML: false,           // 是否使用HTML格式
                useAnnotations: true,     // 是否使用学生标注格式
                maxLength: 200,          // 每个学生评价最大长度
                minLength: 150,          // 每个学生评价最小长度
                includeExamples: true    // 是否包含示例格式
            },
            
            // 分析深度配置
            analysisDepth: {
                includeTrends: true,     // 包含学习趋势
                includeSubjects: true,    // 包含学科分析
                includeDaily: true,       // 包含每日表现
                includePatterns: true,   // 包含表现模式
                includeInactiveStudents: true  // 包含未活跃学生分析
            },
            
            // 模板配置
            templates: {
                // 班级整体分析配置
                overallAnalysis: {
                    minWordCount: 800,    // 最小字数要求
                    requiredSections: [    // 必需的分析部分
                        '课堂参与度分析',
                        '学科表现分布',
                        '学习氛围评价',
                        '整体学习状态',
                        '教学建议',
                        '个性化关注'
                    ]
                },
                
                // 学生个别分析配置
                studentAnalysis: {
                    wordCountRange: [150, 200],  // 字数范围
                    requiredElements: [          // 必需的评价要素
                        '学习积极性',
                        '表现特点',
                        '建议鼓励',
                        '关注问题'
                    ]
                },
                
                // 完整分析配置
                fullAnalysis: {
                    includeOverall: true,        // 包含班级整体分析
                    includeStudents: true,      // 包含学生个别分析
                    includeSuggestions: true    // 包含教学建议
                }
            },
            
            // 预设模板
            presets: {
                // 班主任风格
                headTeacher: {
                    tone: '亲切关怀',
                    focus: '学生成长',
                    style: '鼓励为主',
                    template: '以班主任的口吻，对学生的课堂表现进行总结和鼓励。分析学生的学习状态，提供个性化的建议和鼓励。'
                },
                
                // 学科老师风格
                subjectTeacher: {
                    tone: '专业严谨',
                    focus: '学科表现',
                    style: '分析为主',
                    template: '以学科老师的角度，重点分析学生在各学科的表现情况，提供针对性的学习建议。'
                },
                
                // 数据分析风格
                dataAnalyst: {
                    tone: '客观理性',
                    focus: '数据统计',
                    style: '分析为主',
                    template: '基于数据统计，客观分析学生的课堂表现和学习状态，提供数据驱动的教学建议。'
                }
            }
        };
    }

    /**
     * 获取完整配置
     */
    getConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = this.deepMerge(this.config, newConfig);
    }

    /**
     * 获取输出格式配置
     */
    getOutputFormat() {
        return { ...this.config.outputFormat };
    }

    /**
     * 获取分析深度配置
     */
    getAnalysisDepth() {
        return { ...this.config.analysisDepth };
    }

    /**
     * 获取模板配置
     */
    getTemplateConfig(templateType) {
        return { ...this.config.templates[templateType] };
    }

    /**
     * 获取预设模板
     */
    getPreset(presetName) {
        return { ...this.config.presets[presetName] };
    }

    /**
     * 获取所有预设名称
     */
    getPresetNames() {
        return Object.keys(this.config.presets);
    }

    /**
     * 设置输出格式
     */
    setOutputFormat(format) {
        this.config.outputFormat = { ...this.config.outputFormat, ...format };
    }

    /**
     * 设置分析深度
     */
    setAnalysisDepth(depth) {
        this.config.analysisDepth = { ...this.config.analysisDepth, ...depth };
    }

    /**
     * 设置模板配置
     */
    setTemplateConfig(templateType, config) {
        if (this.config.templates[templateType]) {
            this.config.templates[templateType] = { ...this.config.templates[templateType], ...config };
        }
    }

    /**
     * 添加自定义预设
     */
    addPreset(name, preset) {
        this.config.presets[name] = { ...preset };
    }

    /**
     * 删除预设
     */
    removePreset(name) {
        delete this.config.presets[name];
    }

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptConfig;
} else {
    window.PromptConfig = PromptConfig;
}
