class ClassMeetingGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.generatedContent = '';
    }

    initializeElements() {
        this.timeInput = document.getElementById('timeInput');
        this.classInput = document.getElementById('classInput');
        this.teacherInput = document.getElementById('teacherInput');
        this.hostInput = document.getElementById('hostInput');
        this.themeInput = document.getElementById('themeInput');
        this.customRequirements = document.getElementById('customRequirements');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.aiModel = document.getElementById('ai-model');
        this.temperature = document.getElementById('temperature');
        this.generateBtn = document.getElementById('generateBtn');
        this.loading = document.getElementById('loading');
        this.actionButtons = document.getElementById('actionButtons');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // 预览元素
        this.previewTime = document.getElementById('previewTime');
        this.previewClass = document.getElementById('previewClass');
        this.previewTeacher = document.getElementById('previewTeacher');
        this.previewHost = document.getElementById('previewHost');
        this.previewTheme = document.getElementById('previewTheme');
        this.previewGoals = document.getElementById('previewGoals');
        this.previewProcess = document.getElementById('previewProcess');
        this.previewReflection = document.getElementById('previewReflection');

        // 帮助模态框元素
        this.helpBtn = document.getElementById('help-btn');
        this.helpModal = document.getElementById('help-modal');
        this.closeHelp = document.getElementById('close-help');

        // 高级设置元素
        this.advancedToggle = document.getElementById('advanced-toggle');
        this.advancedContent = document.getElementById('advanced-content');
        this.advancedIcon = document.getElementById('advanced-icon');

        // 设置默认API密钥
        this.setDefaultApiKey();
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateClassMeeting());
        this.copyBtn.addEventListener('click', () => this.copyContent());
        this.downloadBtn.addEventListener('click', () => this.downloadWordDocument());

        // 帮助模态框事件
        this.helpBtn.addEventListener('click', () => this.showHelpModal());
        this.closeHelp.addEventListener('click', () => this.hideHelpModal());
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelpModal();
            }
        });

        // 高级设置切换事件
        this.advancedToggle.addEventListener('click', () => this.toggleAdvancedSettings());

        // 实时预览更新
        [this.timeInput, this.classInput, this.teacherInput, this.hostInput, this.themeInput].forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    validateInputs() {
        const inputs = [
            { element: this.timeInput, name: '时间' },
            { element: this.classInput, name: '班级' },
            { element: this.teacherInput, name: '班主任' },
            { element: this.hostInput, name: '主持人' },
            { element: this.themeInput, name: '主题' }
        ];

        for (let input of inputs) {
            if (!input.element.value.trim()) {
                alert(`请输入${input.name}`);
                input.element.focus();
                return false;
            }
        }
        return true;
    }

    async generateClassMeeting() {
        if (!this.validateInputs()) return;

        this.generateBtn.disabled = true;
        this.loading.classList.remove('hidden');
        this.actionButtons.classList.add('hidden');

        try {
            const formData = {
                time: this.timeInput.value,
                className: this.classInput.value,
                teacher_info: this.teacherInput.value,
                hostName: this.hostInput.value,
                topic_2025: this.themeInput.value,
                customRequirements: this.customRequirements.value
            };

            // 获取API密钥（用户输入或使用默认值）
            const apiKey = this.apiKeyInput.value.trim() || this.defaultApiKey;
            const selectedModel = this.aiModel.value;
            const selectedTemperature = parseFloat(this.temperature.value);
            let generatedContent;
            
            // 根据选择的模型调用相应的API
            generatedContent = await this.callAIAPI(formData, selectedModel, apiKey, selectedTemperature);
            
            this.generatedContent = generatedContent;
            
            // 更新预览
            this.updatePreviewWithGeneratedContent(generatedContent);
            
            // 显示预览区域
            const previewSection = document.getElementById('preview-section');
            if (previewSection) {
                previewSection.classList.remove('hidden');
            }
            
            // 显示操作按钮
            this.actionButtons.classList.remove('hidden');

        } catch (error) {
            alert('生成失败，请重试');
            console.error('生成错误:', error);
        } finally {
            this.generateBtn.disabled = false;
            this.loading.classList.add('hidden');
        }
    }

    generateLocalTemplate(formData) {
        // 根据Coze工作流提示词生成HTML模板
        const formattedTime = this.formatDateTime(formData.time);
        
        // 生成教育目标
        const goals = this.generateEducationGoals(formData.className, formData.topic_2025);
        
        // 生成过程内容
        const process = this.generateProcessContent(formData.hostName, formData.teacher_info, formData.topic_2025);
        
        // 生成收获反思
        const reflection = this.generateReflection(formData.teacher_info, formData.topic_2025);

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>厦门市第九中学主题班会课记录表</title>
    <style>
        body { font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th, td { border: 1px solid #ddd; padding: 15px; text-align: left; vertical-align: top; }
        th { background-color: #f8f9fa; font-weight: bold; color: #495057; width: 20%; }
        td { color: #212529; min-height: 60px; }
        .footer { text-align: right; margin-top: 30px; font-size: 14px; color: #6c757d; font-style: italic; }
        .content-cell { white-space: pre-line; line-height: 1.8; }
    </style>
</head>
<body>
    <div class="container">
        <center><h1>厦门市第九中学主题班会课记录表</h1></center>
        <table>
            <tr>
                <th>时 间</th>
                <td>${formattedTime}</td>
                <th>班 级</th>
                <td>${formData.className}</td>
            </tr>
            <tr>
                <th>班主任</th>
                <td>${formData.teacher_info}</td>
                <th>主持人</th>
                <td>${formData.hostName}</td>
            </tr>
            <tr>
                <th>主 题</th>
                <td colspan="3">${formData.topic_2025}</td>
            </tr>
            <tr>
                <th>教育目标</th>
                <td colspan="3" class="content-cell">${goals}</td>
            </tr>
            <tr>
                <th>过程内容</th>
                <td colspan="3" class="content-cell">${process}</td>
            </tr>
            <tr>
                <th>收获反思</th>
                <td colspan="3" class="content-cell">${reflection}</td>
            </tr>
        </table>
        <div class="footer">厦门市第九中学制</div>
    </div>
</body>
</html>`;
    }

    generateEducationGoals(className, topic) {
        // 根据班级和主题生成教育目标
        const gradeLevel = this.extractGradeLevel(className);
        
        const goalTemplates = {
            '初一': [
                `认知目标：通过${topic}主题班会，使学生全面了解相关基础知识，掌握核心概念和基本原理，建立正确的认知框架，为后续深入学习奠定坚实基础`,
                `能力目标：培养学生在${topic}方面的基本实践能力和初步分析判断能力，提升观察、思考、表达和合作能力，增强解决简单问题的综合素质`,
                `情感目标：引导学生在${topic}方面形成正确的价值观念和行为习惯，培养积极向上的学习态度，增强班级凝聚力和集体荣誉感，促进身心健康发展`
            ],
            '初二': [
                `认知目标：深化学生对${topic}的系统理解，掌握相关知识的内在联系和发展规律，提升理论认知水平，形成较为完整的知识体系和思维框架`,
                `能力目标：培养学生在${topic}方面的实践操作能力和独立思考能力，提升分析问题、解决问题的综合素质，增强自主学习和自我管理能力`,
                `情感目标：强化学生的责任意识和担当精神，培养正确的人生观和价值观，促进个性健康发展，增强社会适应能力和人际交往能力`
            ],
            '初三': [
                `认知目标：全面提升学生对${topic}的深层认知水平，形成系统性、批判性思维，掌握知识迁移和综合运用的方法，为升学和终身学习做好准备`,
                `能力目标：培养学生在${topic}方面的创新思维和综合实践能力，提升解决复杂问题的能力，增强学习策略运用和知识整合能力`,
                `情感目标：帮助学生树立远大理想和人生目标，培养坚韧不拔的意志品质，增强社会责任感，为升学和未来发展奠定良好的品格基础`
            ],
            '高一': [
                `认知目标：通过${topic}教育，帮助学生建立科学的世界观、人生观和价值观，深入理解相关理论知识，形成独立思考和批判分析的能力`,
                `能力目标：培养学生的自主学习能力、创新思维能力和实践操作能力，提升信息获取、处理和运用能力，增强适应高中学习和未来发展的综合素质`,
                `情感目标：增强学生的社会责任感和公民意识，培养积极向上的人生态度，促进身心健康发展，为成为德智体美劳全面发展的社会主义建设者做好准备`
            ],
            '高二': [
                `认知目标：深入探讨${topic}相关的理论问题和实践问题，提升学生的理论思维水平和学术素养，形成较为成熟的知识结构和思维体系`,
                `能力目标：培养学生的领导组织能力、团队协作能力和沟通表达能力，提升创新实践能力和综合分析能力，增强面向未来的核心竞争力`,
                `情感目标：引导学生关注社会热点和时代发展，增强历史使命感和时代责任感，培养服务社会、奉献国家的崇高品格和远大志向`
            ],
            '高三': [
                `认知目标：结合${topic}主题，帮助学生形成成熟的人生观和价值观，深入思考人生规划和职业选择，为步入社会做好充分的思想准备`,
                `能力目标：培养学生面对挑战和压力的应对能力，提升自我调节和心理承受能力，增强适应社会变化和终身学习的综合素质`,
                `情感目标：激发学生的奋斗精神和进取意识，培养坚韧不拔的意志品质和积极乐观的人生态度，为实现人生理想和社会价值奠定坚实基础`
            ]
        };

        const goals = goalTemplates[gradeLevel] || goalTemplates['高一'];
        return '<ul>' + goals.map(goal => `<li>${goal}</li>`).join('') + '</ul>';
    }

    generateProcessContent(hostName, teacherInfo, topic) {
        // 生成详细的班会过程内容
        const processes = [
            `开场导入环节（8分钟）：${hostName}通过精心设计的开场白正式开始班会，首先播放与${topic}相关的短视频或展示图片资料，创设情境氛围。随后简要介绍本次班会的主题背景、目标意义和活动安排，通过提问互动的方式了解学生对${topic}的初步认知，激发学生的学习兴趣和参与热情，为后续环节做好铺垫`,
            `知识学习环节（12分钟）：${hostName}运用多媒体课件、实物展示、案例分析等多种教学手段，系统介绍${topic}的核心概念、基本原理和相关知识要点。通过具体的事例和数据，帮助学生深入理解${topic}的重要性和现实意义。期间穿插提问和小测试，及时检验学生的理解程度，确保知识传授的有效性`,
            `互动讨论环节（15分钟）：${hostName}将全班学生分成4-6个小组，每组5-7人，围绕${topic}的不同角度和层面展开深入讨论。各小组结合自身经历和观察，分享对${topic}的认识和感悟，讨论相关问题的解决方案。${hostName}巡回指导，适时参与讨论，引导学生深入思考。最后每组选派代表进行成果汇报，促进思维碰撞和观点交流`,
            `专业指导环节（10分钟）：${teacherInfo}结合多年的教育教学经验和专业知识，对学生的讨论成果进行点评和指导。从理论高度和实践角度，深入阐释${topic}的内涵和外延，分享相关的教育智慧和人生感悟。通过具体的案例和故事，帮助学生加深理解，树立正确的认知和态度`,
            `实践延伸环节（8分钟）：${hostName}和${teacherInfo}共同设计与${topic}相关的实践活动方案，包括课后调研、社会实践、志愿服务等形式。明确活动的具体要求、时间安排和评价标准，鼓励学生将所学知识转化为实际行动。同时建立跟踪反馈机制，确保实践活动的有效开展`,
            `总结提升环节（7分钟）：${hostName}引导学生回顾本次班会的主要内容和收获，总结关键知识点和核心观念。${teacherInfo}从教育者的角度，强调${topic}对学生成长发展的重要意义，提出具体的行动建议和期望要求。最后全班齐声朗读班会主题口号，在庄重的氛围中结束本次班会`
        ];

        return '<ol>' + processes.map(process => `<li>${process}</li>`).join('') + '</ol>';
    }

    generateReflection(teacherInfo, topic) {
        // 生成收获反思内容
        const studentGains = [
            `知识层面收获：通过本次${topic}主题班会，学生们系统学习了相关的理论知识和实践要点，对${topic}的核心概念、基本原理和现实意义有了全面深入的理解。学生们能够准确把握知识要点，建立了较为完整的认知体系，为后续的学习和实践奠定了坚实的理论基础`,
            `能力层面提升：班会过程中，学生们积极参与讨论交流，主动思考分析问题，展现出了良好的思辨能力、表达能力和合作能力。通过小组讨论和成果汇报，学生们的组织协调能力、沟通交流能力和团队合作精神得到了有效锻炼和显著提升`,
            `情感态度转变：学生们对${topic}的重要性有了更加深刻的认识，学习态度更加积极主动，参与热情明显提高。通过真实案例和深入讨论，学生们的价值观念得到了正确引导，社会责任感和使命感得到了有效增强，为形成正确的人生观和世界观奠定了良好基础`,
            `行为实践意愿：班会结束后，学生们纷纷表示要将所学知识转化为实际行动，主动参与相关的实践活动和社会服务。学生们制定了具体的行动计划，体现了较强的实践意识和行动自觉性`
        ];

        const teacherReflection = [
            `教学效果评估：本次${topic}主题班会准备充分，内容丰富，形式多样，学生参与度高，互动效果良好，圆满完成了预设的教育目标。通过观察学生的课堂表现和课后反馈，可以看出学生们对主题内容有了深入的理解和认识，教育效果显著。班会的组织形式和教学方法得到了学生的普遍认可，达到了预期的教育效果`,
            `改进提升方向：在今后的班会组织中，需要进一步关注学生的个体差异和个性化需求，设计更加多元化的活动形式，为不同特点的学生提供更多的展示机会和参与平台。同时要加强与家长的沟通联系，形成家校合力，确保教育效果的持续性和深入性。还要建立更加完善的跟踪评价机制，及时了解学生的思想动态和行为变化，为后续的教育工作提供有力支撑`
        ];

        return `<h3>学生收获</h3>
<ul>${studentGains.map(gain => `<li>${gain}</li>`).join('')}</ul>
<h3>${teacherInfo}的反思</h3>
<ul>${teacherReflection.map(reflection => `<li>${reflection}</li>`).join('')}</ul>`;
    }

    extractGradeLevel(className) {
        // 从班级名称中提取年级信息
        if (className.includes('初一') || className.includes('七年')) return '初一';
        if (className.includes('初二') || className.includes('八年')) return '初二';
        if (className.includes('初三') || className.includes('九年')) return '初三';
        if (className.includes('高一')) return '高一';
        if (className.includes('高二')) return '高二';
        if (className.includes('高三')) return '高三';
        return '高一'; // 默认值
    }

    async callAIAPI(formData, model, apiKey, temperature) {
        const prompt = this.generateCozePrompt(formData);
        
        // 根据模型选择API端点
        const apiConfig = this.getAPIConfig(model);
        
        try {
            const response = await fetch(apiConfig.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的班会记录生成助手，严格按照厦门市第九中学的格式要求生成班会记录表。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 3000
                })
            });

            if (!response.ok) {
                throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error(`${model} API调用错误:`, error);
            // 如果API调用失败，回退到本地模板
            return this.generateLocalTemplate(formData);
        }
    }

    getAPIConfig(model) {
        const configs = {
            'deepseek-chat': {
                url: 'https://api.deepseek.com/v1/chat/completions',
                name: 'DeepSeek Chat'
            },
            'deepseek-coder': {
                url: 'https://api.deepseek.com/v1/chat/completions',
                name: 'DeepSeek Coder'
            },
            'qwen-turbo': {
                url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                name: '通义千问 Turbo'
            },
            'glm-4': {
                url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                name: '智谱 GLM-4'
            }
        };
        
        return configs[model] || configs['deepseek-chat'];
    }

    generateCozePrompt(formData) {
        const customReq = formData.customRequirements ? `\n\n特殊要求：${formData.customRequirements}` : '';
        
        return `根据以下输入变量生成一份厦门市第九中学主题班会课记录表，使用 HTML 格式，严格按照指定的布局和样式生成。最终输出一个完整的、纯粹的 HTML 字符串，并将占位符（{{variable}}）替换为提供的变量值。确保生成的 HTML 能够在浏览器中完美渲染，并且在转换为 Word (DOCX) 文档时，能够保持表格结构的完整性、内容逻辑的清晰性以及样式的准确性。

输入变量：
{{className}}：${formData.className}
{{topic_2025}}：${formData.topic_2025}
{{teacher_info}}：${formData.teacher_info}
{{hostName}}：${formData.hostName}
{{time}}：${this.formatDateTimeForCoze(formData.time)}${customReq}

内容生成要求：
标题："厦门市第九中学主题班会课记录表"
时间：使用{{time}}
班级：使用 {{className}}。
班主任：使用 {{teacher_info}}。
主持人：使用 {{hostName}}。
主题：使用 {{topic_2025}}。

教育目标：必须生成3个具体、详实的目标，使用 HTML 无序列表（<ul><li>...</li></ul>）。要求：
- 每个目标至少80-120字，内容详实但无废话
- 必须包含认知目标、能力目标、情感目标三个维度
- 结合{{className}}的年级特点制定相应深度的目标
- 与{{topic_2025}}主题紧密结合，具有针对性和可操作性
- 目标表述要规范专业，体现教育学理论基础

过程内容：必须详细描述班会进行的6个完整环节，使用 HTML 有序列表（<ol><li>...</li></ol>）。要求：
- 每个环节至少100-150字，包含具体的时间安排、活动形式、实施步骤
- 环节设计要科学合理，体现教育教学规律
- 突出{{hostName}}的主持引导作用和具体操作方法
- 体现{{teacher_info}}在关键环节的专业指导和经验分享
- 包含师生互动、小组讨论、成果展示等多种形式
- 每个环节要有明确的教育目的和预期效果

收获反思：必须包含两个部分，内容详实深入。使用 <h3> 子标题进行区分：
<h3>学生收获</h3>：列出4项学生的具体收获，使用无序列表（<ul><li>...</li></ul>）。要求：
- 每项收获至少60-80字，从知识、能力、情感、行为四个层面分析
- 内容要具体可观测，避免空洞的表述
- 体现学生在班会中的真实表现和实际变化

<h3>{{teacher_info}}的反思</h3>：列出2项班主任的深度反思，使用无序列表（<ul><li>...</li></ul>）。要求：
- 每项反思至少80-100字，包含效果评估和改进方向
- 体现教师的专业素养和教育智慧
- 为后续教育工作提供有价值的思考和建议

HTML 结构与样式要求：

生成的 HTML 必须是一个完整的 <!DOCTYPE html> 文档，包含 <head> 和 <body>。

1. <head> 部分：必须包含以下完整的 CSS 样式，以确保视觉效果与模板一致。

<style>
body { font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; line-height: 1.6; }
.container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 15px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
th, td { border: 1px solid #ddd; padding: 15px; text-align: left; vertical-align: top; }
th { background-color: #f8f9fa; font-weight: bold; color: #495057; width: 20%; }
td { color: #212529; min-height: 60px; }
.footer { text-align: right; margin-top: 30px; font-size: 14px; color: #6c757d; font-style: italic; }
.content-cell { white-space: pre-line; line-height: 1.8; }
</style>

2. <body> 部分：主体内容必须严格按照以下层级嵌套：

一个 <div class="container"> 作为最外层容器。
容器内包含一个 <center><h1>厦门市第九中学主题班会课记录表</h1></center>作为主标题。
紧接着是核心的 <table>。
最后是一个 <div class="footer">厦门市第九中学制</div>作为页脚。

HTML 表格布局要求：

表格（<table>）必须严格遵循以下 6 行结构：

第一行: 包含"时 间"及其{{time}}，"班 级"及其 {{className}} 值。
<tr>
<th>时 间</th>
<td>{{time}}</td>
<th>班 级</th>
<td>{{className}}</td>
</tr>

第二行: 包含"班主任"及其 {{teacher_info}} 值，"主持人"及其 {{hostName}} 值。
<tr>
<th>班主任</th>
<td>{{teacher_info}}</td>
<th>主持人</th>
<td>{{hostName}}</td>
</tr>

第三行: 包含"主 题"，其内容单元格需横跨三列 (colspan="3")。
<tr>
<th>主 题</th>
<td colspan="3">{{topic_2025}}</td>
</tr>

第四行: 包含"教育目标"，其内容单元格需横跨三列 (colspan="3") 并包含 HTML 无序列表。
<tr>
<th>教育目标</th>
<td colspan="3" class="content-cell">...</td>
</tr>

第五行: 包含"过程内容"，其内容单元格需横跨三列 (colspan="3") 并包含 HTML 有序列表。
<tr>
<th>过程内容</th>
<td colspan="3" class="content-cell">...</td>
</tr>

第六行: 包含"收获反思"，其内容单元格需横跨三列 (colspan="3") 并包含 <h3> 子标题和无序列表。
<tr>
<th>收获反思</th>
<td colspan="3" class="content-cell">...</td>
</tr>

Word 转换兼容性要求：

为了确保转换为 Word 文档时列表项能正确换行，每个 <li> 标签内的文本结束后请不要额外添加 <br>。CSS 中的 white-space: pre-line 和列表元素的块级特性足以处理换行。
在"收获反思"单元格内，<h3> 标题和紧随其后的 <ul> 列表之间不需要 <br>，以保持语义结构的清晰性。
确保所有动态生成的内容（特别是列表）都完全嵌套在指定的 <td> 单元格内。

请仅输出完整的HTML代码，不要包含任何其他说明文字。`;
    }

    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDateTimeForCoze(dateTimeString) {
        const date = new Date(dateTimeString);
        return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
    }

    setDefaultApiKey() {
        // 不再在页面中设置API密钥值，保持输入框空白
        // 默认API密钥将在代码中自动使用
        this.defaultApiKey = 'sk-0560c9a849694436a71c1ef4c053505a';
    }

    updatePreview() {
        this.previewTime.textContent = this.timeInput.value ? this.formatDateTime(this.timeInput.value) : '-';
        this.previewClass.textContent = this.classInput.value || '-';
        this.previewTeacher.textContent = this.teacherInput.value || '-';
        this.previewHost.textContent = this.hostInput.value || '-';
        this.previewTheme.textContent = this.themeInput.value || '-';
    }

    updatePreviewWithGeneratedContent(content) {
        console.log('开始更新预览内容...');
        console.log('生成的内容长度:', content.length);
        
        // 解析生成的HTML内容并更新预览
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        const table = doc.querySelector('table');
        if (table) {
            console.log('找到表格，开始解析...');
            const rows = table.querySelectorAll('tr');
            console.log('表格行数:', rows.length);
            
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('th, td');
                console.log(`第${index + 1}行，单元格数量:`, cells.length);
                
                if (cells.length >= 2) {
                    const header = cells[0].textContent.trim();
                    console.log(`处理标题: "${header}"`);
                    
                    // 处理基本信息行（四列结构：th-td-th-td）
                    if (cells.length === 4) {
                        // 第一行：时间和班级
                        if (header === '时 间') {
                            const timeValue = cells[1].textContent.trim();
                            const classValue = cells[3].textContent.trim();
                            console.log('更新时间:', timeValue, '班级:', classValue);
                            this.previewTime.textContent = timeValue;
                            this.previewClass.textContent = classValue;
                        }
                        // 第二行：班主任和主持人
                        else if (header === '班主任') {
                            const teacherValue = cells[1].textContent.trim();
                            const hostValue = cells[3].textContent.trim();
                            console.log('更新班主任:', teacherValue, '主持人:', hostValue);
                            this.previewTeacher.textContent = teacherValue;
                            this.previewHost.textContent = hostValue;
                        }
                    }
                    // 处理跨列内容（两列结构：th + td with colspan="3"）
                    else if (cells.length === 2) {
                        const contentCell = cells[1];
                        
                        switch (header) {
                            case '主 题':
                                const themeValue = contentCell.textContent.trim();
                                console.log('更新主题:', themeValue);
                                this.previewTheme.textContent = themeValue;
                                break;
                            case '教育目标':
                                console.log('更新教育目标，内容:', contentCell.innerHTML);
                                this.previewGoals.innerHTML = contentCell.innerHTML;
                                break;
                            case '过程内容':
                                console.log('更新过程内容，内容:', contentCell.innerHTML);
                                this.previewProcess.innerHTML = contentCell.innerHTML;
                                break;
                            case '收获反思':
                                console.log('更新收获反思，内容:', contentCell.innerHTML);
                                this.previewReflection.innerHTML = contentCell.innerHTML;
                                break;
                        }
                    }
                }
            });
        } else {
            console.error('未找到表格元素');
        }

        console.log('预览内容更新完成');
    }

    copyContent() {
        if (this.generatedContent) {
            navigator.clipboard.writeText(this.generatedContent).then(() => {
                alert('HTML内容已复制到剪贴板');
            }).catch(err => {
                alert('复制失败，请手动复制');
                console.error('复制错误:', err);
            });
        } else {
            alert('没有可复制的内容');
        }
    }

    downloadWordDocument() {
        if (!this.generatedContent) {
            alert('请先生成班会记录');
            return;
        }

        try {
            // 创建一个包含完整HTML的Blob
            const htmlContent = this.generatedContent;
            
            // 创建Word兼容的HTML文档
            const wordCompatibleHtml = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>厦门市第九中学主题班会课记录表</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page { margin: 1in; }
        body { font-family: "Microsoft YaHei", "宋体", Arial, sans-serif; font-size: 12pt; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #000; padding: 8pt; text-align: left; vertical-align: top; }
        th { background-color: #f0f0f0; font-weight: bold; }
        h1 { text-align: center; font-size: 18pt; margin-bottom: 20pt; }
        h3 { font-size: 14pt; margin: 10pt 0 5pt 0; }
        ul, ol { margin: 5pt 0; padding-left: 20pt; }
        li { margin: 3pt 0; }
        .footer { text-align: right; margin-top: 20pt; font-style: italic; }
    </style>
</head>
${htmlContent.substring(htmlContent.indexOf('<body>'))}
</html>`;

            // 创建Blob并下载
            const blob = new Blob(['\ufeff', wordCompatibleHtml], { 
                type: 'application/msword;charset=utf-8' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `班会记录_${this.classInput.value}_${this.themeInput.value}_${new Date().toLocaleDateString().replace(/\//g, '-')}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Word文档已开始下载');

        } catch (error) {
            console.error('Word文档生成错误:', error);
            alert('Word文档生成出错，请重试');
        }
    }

    // 帮助模态框方法
    showHelpModal() {
        this.helpModal.classList.remove('hidden');
        this.helpModal.classList.add('flex');
    }

    hideHelpModal() {
        this.helpModal.classList.add('hidden');
        this.helpModal.classList.remove('flex');
    }

    // 高级设置切换方法
    toggleAdvancedSettings() {
        const isHidden = this.advancedContent.classList.contains('hidden');
        
        if (isHidden) {
            this.advancedContent.classList.remove('hidden');
            this.advancedIcon.style.transform = 'rotate(180deg)';
        } else {
            this.advancedContent.classList.add('hidden');
            this.advancedIcon.style.transform = 'rotate(0deg)';
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ClassMeetingGenerator();
});
