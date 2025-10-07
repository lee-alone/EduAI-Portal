document.addEventListener('DOMContentLoaded', () => {

    // ==================== DOM Elements ====================
    const getElem = (id) => document.getElementById(id);
    const output = getElem("output");
    const generateBtn = getElem("generateBtn");
    const backToTopBtn = getElem("backToTopBtn");

    // ==================== Application State ====================
    const AppState = {
        isGenerating: false,
        isEvaluating: false,
        solutions: [],
        questions: [],
    };

    // ==================== Configurations ====================
    const API_CONFIG = {
        deepseek: { url: "https://api.deepseek.com/v1/chat/completions", models: ["deepseek-chat", "deepseek-reasoner"] },
        glm: { url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", models: ["glm-4"] },
        qwen: { url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", models: ["qwen-turbo"] }
    };

    const COMPREHENSIVE_PAPER_CONFIG = {
        '语文': {
            structure: [
                { type: '选择题', count: 6, topic: '字音字形、词语运用、病句修改、标点、名著阅读' },
                { type: '填空题', count: 2, topic: '古诗文默写' },
                { type: '文言文阅读', count: 3 },
                { type: '古诗词鉴赏', count: 2 },
                { type: '现代文阅读', count: 7, topic: '议论文或说明文或记叙文' },
                { type: '写作', count: 1 }
            ]
        },
        '数学': {
            structure: [
                { type: '选择题', count: 10 },
                { type: '填空题', count: 6 },
                { type: '解答题', count: 8 }
            ]
        },
        '英语': {
            structure: [
                { type: '单项选择', count: 15 },
                { type: '完形填空', count: 1, cloze_count: 15 },
                { type: '阅读理解', count: 3 },
                { type: '写作', count: 1 }
            ]
        },
        '物理': {
            structure: [
                { type: '选择题', count: 6 },
                { type: '填空题', count: 5 },
                { type: '作图题', count: 2 },
                { type: '实验与探究题', count: 2 },
                { type: '计算题', count: 2 }
            ]
        },
        '化学': {
            structure: [
                { type: '选择题', count: 5 },
                { type: '填空与简答题', count: 4 },
                { type: '实验与探究题', count: 2 },
                { type: '计算题', count: 1 }
            ]
        },
        '道德与法治': {
            structure: [
                { type: '选择题', count: 16 },
                { type: '非选择题', count: 4, topic: '判断说理、材料分析、情境探究等' }
            ]
        },
        '历史': {
            structure: [
                { type: '选择题', count: 16 },
                { type: '非选择题', count: 4, topic: '材料解析、简答、探究等' }
            ]
        }
    };

    // ==================== Event Listeners ====================
    generateBtn.addEventListener("click", generateQuestions);
    getElem("exportPaperBtn").addEventListener("click", () => exportContent("题卷"));
    getElem("exportAnswerBtn").addEventListener("click", () => exportContent("答案卷"));

    window.addEventListener('scroll', () => {
        backToTopBtn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ==================== Utility Functions ====================
    function showMessage(message, type = "info", duration = 4000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `user-message message-${type}`;
        messageDiv.innerHTML = message;
        document.body.appendChild(messageDiv);
        messageDiv.style.animation = 'slideInDown 0.5s ease-out';
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutUp 0.3s ease-in forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, duration);
    }

    function getApiConfig(model) {
        return Object.values(API_CONFIG).find(config => config.models.includes(model)) || API_CONFIG.deepseek;
    }

    async function safeApiCall(apiUrl, apiKey, payload) {
        try {
            const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${await response.text()}`);
            }
            return await response.json();
        } catch (error) {
            console.error("API call failed:", error);
            throw new Error(`Network or API call failed: ${error.message}`);
        }
    }

    function extractJsonFromText(text) {
        if (!text) return null;
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        try {
            return JSON.parse(match ? match[1] : text);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            return null;
        }
    }

    function renderMathInElement(element) {
        if (window.renderMathInElement) {
            window.renderMathInElement(element, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], throwOnError: false });
        }
    }

    // ==================== Core Logic: Question Generation ====================
    async function generateQuestions() {
        if (AppState.isGenerating) return showMessage("⏳ 正在生成中，请稍候...", "warning");

        const userInputs = {
            title: getElem("title").value.trim() || "综合练习",
            topic: getElem("topic").value.trim(),
            type: getElem("type").value,
            difficulty: getElem("difficulty").value,
            num: getElem("num").value,
            model: getElem("model").value,
            apiKey: getElem("apiKey").value.trim() || "sk-0560c9a849694436a71c1ef4c053505a",
            customPrompt: getElem("customPrompt").value.trim(),
            creativity: getElem("creativity").value
        };

        if (!userInputs.topic) return showMessage("💡 请输入学习主题！", "warning");

        setGenerationState(true);

        try {
            let prompt;
            if (userInputs.type.includes('综合卷')) {
                const subject = Object.keys(COMPREHENSIVE_PAPER_CONFIG).find(key => userInputs.title.includes(key));
                if (!subject) {
                    throw new Error("未找到匹配的综合卷配置，请在'学习领域'中明确指定学科，如'初中语文'");
                }
                prompt = buildComprehensivePrompt(COMPREHENSIVE_PAPER_CONFIG[subject], userInputs);
            } else {
                prompt = buildSingleTypePrompt(userInputs);
            }

            const apiConfig = getApiConfig(userInputs.model);
            const payload = { 
                model: userInputs.model, 
                messages: [
                    { role: "system", content: "你是一位经验丰富的义务教育阶段教师，专门为中小学生设计练习题。请严格按照要求以JSON格式输出。" }, 
                    { role: "user", content: prompt }
                ], 
                temperature: parseFloat(userInputs.creativity) 
            };

            const data = await safeApiCall(apiConfig.url, userInputs.apiKey, payload);
            const responseText = data.choices?.[0]?.message?.content?.trim() || data.result || data.output?.[0]?.content || '';
            const parsedData = extractJsonFromText(responseText);

            if (!parsedData || !parsedData.questions || !parsedData.solutions) {
                throw new Error("AI返回的结构化数据不完整或格式不正确。");
            }

            AppState.questions = parsedData.questions;
            AppState.solutions = parsedData.solutions;
            renderStructuredQuestionInterface(parsedData.questions);
            showMessage("🎉 练习题已生成！", "success");

        } catch (error) {
            output.innerHTML = `<div class="text-center py-8 text-red-500"><h3>生成失败</h3><p>${error.message}</p></div>`;
            showMessage(error.message, 'error');
        } finally {
            setGenerationState(false);
        }
    }

    function setGenerationState(isGenerating) {
        AppState.isGenerating = isGenerating;
        generateBtn.innerHTML = isGenerating ? '<span class="loading"></span> 正在生成中...' : '🚀 开启我的学习冒险';
        generateBtn.disabled = isGenerating;
        if (isGenerating) {
            output.innerHTML = `<div class="text-center py-8"><div class="loading mx-auto mb-4"></div><h3 class="text-xl font-semibold text-gray-700">AI老师正在为您出题...</h3></div>`;
        }
    }

    function buildSingleTypePrompt({ type, title, topic, difficulty, num, customPrompt }) {
        const quantityLabel = type.includes('完形填空') ? '【挖空数量】' : '【数量】';
        return `
        【任务要求】: 请为中小学生生成练习题，并严格按照下面的JSON格式输出。
        【试卷科目】：${title}
        【知识点】：${topic}
        【题型】：${type}
        【难度】：${difficulty}
        ${quantityLabel}：${num}
        【个性化要求】：${customPrompt || "无"}
        【随机种子】: ${Math.random()}
        ${getJsonFormatInstruction()}`;
    }

    function buildComprehensivePrompt(config, { title, topic, difficulty, customPrompt }) {
        const structure_prompt = config.structure.map(item => 
            `- ${item.type} (${item.count}题${item.topic ? `, 重点考察: ${item.topic}` : ''}${item.cloze_count ? `, 每个包含${item.cloze_count}个填空` : ''})`
        ).join('\n');

        return `
        【任务要求】: 请为中小学生生成一套完整的综合试卷，并严格按照下面的JSON格式输出。
        【试卷科目】：${title}
        【核心主题】：${topic}
        【难度】：${difficulty}
        【试卷结构】:
        ${structure_prompt}
        【个性化要求】：${customPrompt || "无"}
        【随机种子】: ${Math.random()}
        ${getJsonFormatInstruction()}`;
    }

    function getJsonFormatInstruction() {
        return `
        【输出格式】: 请严格遵循以下JSON结构，将所有题目按顺序放在一个JSON对象中，不要输出任何额外文本。
        {
          "questions": [
            {
              "question_number": <题号，从1开始连续递增>,
              "type": "<题型>",
              "question_text": "<题目文本>",
              "options": ["<选项A>", "<选项B>", ...], // (仅选择题)
              "cloze_questions": [ { "blank_number": <空号>, "options": [...] } ] // (仅完形填空)
            }
          ],
          "solutions": [
            {
              "question_number": <题号>,
              "answer": "<正确答案>", // 完形填空为数组
              "explanation": "<详细解析>"
            }
          ]
        }`;
    }

    function renderStructuredQuestionInterface(questions) {
        let questionsHtml = questions.map(q => {
            let blank_counter = 0;
            const formatted_text = q.question_text.replace(/__.*?__/g, () => `__(${++blank_counter})__`);
            let questionBody = `<div class="mb-4 p-4 border-b"><p class="font-semibold">${q.question_number}. ${formatted_text}</p>`;
            
            const type = q.type || '';
            const inputName = `answer_${q.question_number}`;

            if (type.includes('选择题')) {
                questionBody += `<div class="flex flex-col gap-2 mt-2">${(q.options || []).map((opt, i) => `<label class="choice-option"><input type="radio" name="${inputName}" value="${String.fromCharCode(65 + i)}" class="mr-2"> ${opt}</label>`).join('')}</div>`;
            } else if (type.includes('判断题')) {
                questionBody += `<div class="flex flex-col gap-2 mt-2">${['正确', '错误'].map(opt => `<label class="choice-option"><input type="radio" name="${inputName}" value="${opt}" class="mr-2"> ${opt}</label>`).join('')}</div>`;
            } else if (type.includes('完形填空')) {
                questionBody += (q.cloze_questions || []).map(cq => `<div class="mt-4 ml-4"><p class="font-semibold">(${cq.blank_number})</p><div class="flex flex-row gap-4 mt-2">${(cq.options || []).map((opt, i) => `<label class="choice-option"><input type="radio" name="${inputName}_${cq.blank_number}" value="${String.fromCharCode(65 + i)}" class="mr-2"> ${opt}</label>`).join('')}</div></div>`).join('');
            } else {
                const rows = type.includes('写作') ? 10 : (type.includes('阅读理解') || type.includes('探究') || type.includes('解析')) ? 8 : 4;
                questionBody += `<div class="mt-2"><textarea name="${inputName}" rows="${rows}" class="w-full border rounded p-2" placeholder="请在此输入您的解答..."></textarea></div>`;
            }
            return questionBody + `</div>`;
        }).join('');

        output.innerHTML = `<div id="questions-tab">${questionsHtml}</div>`;
        
        const submitBtn = document.createElement('div');
        submitBtn.className = 'text-center mt-8';
        submitBtn.innerHTML = `<button id="submitAllAnswers" class="btn btn-success text-lg px-8 py-3">🚀 提交所有答案</button>`;
        output.appendChild(submitBtn);
        getElem('submitAllAnswers').addEventListener('click', submitAllAnswers);

        renderMathInElement(output);
    }

    // ... (The rest of the evaluation and export functions remain largely the same) ...

    async function submitAllAnswers() {
        if (AppState.isEvaluating) return;
        AppState.isEvaluating = true;

        const submitBtn = getElem('submitAllAnswers');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 正在智能批改...';

        try {
            const results = await evaluateStructuredAnswers();
            displayResults(results);
        } catch (error) {
            showMessage(`批改时出错: ${error.message}`, 'error');
            console.error(error);
        } finally {
            AppState.isEvaluating = false;
            submitBtn.innerHTML = '🎉 批改完成';
        }
    }

    async function evaluateStructuredAnswers() {
        const results = [];
        const apiKey = getElem("apiKey").value.trim() || "sk-0560c9a849694436a71c1ef4c053505a";

        for (const solution of AppState.solutions) {
            const questionInfo = AppState.questions.find(q => q.question_number === solution.question_number);
            const questionType = questionInfo ? (questionInfo.type || '') : '';
            const inputNameBase = `answer_${solution.question_number}`;

            if (questionType.includes('完形填空')) {
                const fullExplanation = solution.explanation;
                solution.answer.forEach((correctAnswer, index) => {
                    const blankNum = index + 1;
                    const studentAns = getStudentAnswer(`${inputNameBase}_${blankNum}`);
                    const isCorrect = studentAns.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
                    
                    results.push({
                        isCorrect,
                        score: isCorrect ? 100 : 0,
                        feedback: isCorrect ? "回答正确！" : `回答错误，正确答案是 ${correctAnswer}`,
                        explanation: fullExplanation,
                        questionIndex: `${solution.question_number}_${blankNum}`,
                        studentAnswer: studentAns || "未作答",
                        standardAnswer: correctAnswer
                    });
                });
            } else {
                let result;
                const studentAnswer = getStudentAnswer(inputNameBase);

                if (['写作', '简答题', '阅读理解', '作图题', '实验与探究题', '非选择题'].some(t => questionType.includes(t))) {
                    result = await evaluateSubjective(questionInfo, studentAnswer, solution.answer, apiKey);
                } else {
                    const isCorrect = studentAnswer.trim().toUpperCase() === (solution.answer || '').trim().toUpperCase();
                    result = {
                        isCorrect,
                        score: isCorrect ? 100 : 0,
                        feedback: isCorrect ? "回答正确！" : `回答错误，正确答案是 ${solution.answer}`,
                        explanation: solution.explanation,
                        studentAnswer: studentAnswer
                    };
                }
                results.push({
                    ...result,
                    questionIndex: solution.question_number,
                    studentAnswer: result.studentAnswer || studentAnswer || "未作答",
                    standardAnswer: solution.answer
                });
            }
        }
        return results;
    }

    async function evaluateSubjective(questionInfo, studentAnswer, standardAnswer, apiKey) {
        const isWriting = questionInfo.type.includes('写作');
        const prompt = `
        你是一位严格而富有洞察力的AI教师。请根据以下信息，以循循善诱的口吻评判学生的答案。
        【题目】: ${questionInfo.question_text}
        【${isWriting ? '写作要求' : '标准答案参考'}】: ${standardAnswer}
        【学生答案】: ${studentAnswer}

        请严格按照以下JSON格式返回，不要添加任何额外描述：
        {
          "isCorrect": false, 
          "score": <0-100之间的整数得分>,
          "feedback": "(简短反馈，${isWriting ? '从文章结构、逻辑、语法等角度总结核心问题' : '直接指出学生回答中知识点的不足或缺失之处'}",
          "explanation": "(详细解析，${isWriting ? '分点说明文章的优点和缺点，并提供改进建议' : '首先总结一个优秀答案应包含的答题要点，然后再对学生的答案进行详细分析和指导'}"
        }`;
        try {
            const model = getElem("model").value;
            const apiConfig = getApiConfig(model);
            const payload = { model, messages: [{ role: "system", content: "You are an AI teacher." }, { role: "user", content: prompt }], temperature: 0.3 };
            const data = await safeApiCall(apiConfig.url, apiKey, payload);
            const result = extractJsonFromText(data.choices?.[0]?.message?.content?.trim() || '');
            return result || { isCorrect: false, score: 0, feedback: "AI批改失败", explanation: "AI返回格式错误。" };
        } catch (error) {
            console.error("Subjective evaluation failed:", error);
            return { isCorrect: false, score: 0, feedback: "AI批改失败", explanation: "无法连接到AI服务进行批改。" };
        }
    }

    function getStudentAnswer(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        if (radio) return radio.value;
        const textInput = document.querySelector(`input[type="text"][name="${name}"], textarea[name="${name}"]`);
        return textInput ? textInput.value.trim() : "";
    }

    function displayResults(results) {
        let totalScore = 0;
        let clozePassageExplanation = '';

        results.forEach(res => {
            totalScore += res.score || 0;
            const inputElement = document.querySelector(`[name="answer_${res.questionIndex}"]`);
            if (!inputElement) return;

            const questionContainer = inputElement.closest(res.questionIndex.toString().includes('_') ? '.mt-4.ml-4' : '.mb-4');
            if (!questionContainer) return;

            const resultBlock = document.createElement('div');
            const scoreColor = (res.score || 0) >= 80 ? 'green' : (res.score || 0) >= 60 ? 'orange' : 'red';
            resultBlock.className = `result-feedback mt-3 p-3 border-t ${res.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`;
            
            let explanationHtml = '';
            if (res.questionIndex.toString().includes('_')) {
                if (!clozePassageExplanation) clozePassageExplanation = res.explanation;
            } else {
                explanationHtml = `<div class="mt-2 pt-2 border-t"><strong class="text-gray-800">解题思路:</strong><p class="text-gray-700">${res.explanation}</p></div>`;
            }

            resultBlock.innerHTML = `
                <div class="flex justify-between items-center font-bold"><span>${res.isCorrect ? '✓ 回答正确' : '✗ 回答错误'}</span><span style="color: ${scoreColor}">本题得分: ${res.score || 0} / 100</span></div>
                <p><strong>你的答案:</strong> ${res.studentAnswer || '未作答'}</p>
                <p><strong>AI反馈:</strong> ${res.feedback}</p>
                ${explanationHtml}`;
            questionContainer.appendChild(resultBlock);
            questionContainer.querySelectorAll('input, textarea').forEach(input => input.disabled = true);
        });

        const outputContainer = getElem('questions-tab');
        if (clozePassageExplanation) {
            const clozeExplanationBlock = document.createElement('div');
            clozeExplanationBlock.className = 'mt-6 p-4 bg-gray-100 rounded-lg';
            clozeExplanationBlock.innerHTML = `<h4 class="font-bold text-lg">完形填空综合解析</h4><p>${clozePassageExplanation}</p>`;
            outputContainer.appendChild(clozeExplanationBlock);
        }

        const finalCorrectCount = results.filter(r => r.isCorrect).length;
        const averageScore = Math.round(totalScore / results.length);
        const summaryHtml = `
            <div class="text-center my-6 p-4 bg-blue-100 rounded-lg">
                <h3 class="text-2xl font-bold">批改完成！</h3>
                <p class="text-xl">你答对了 ${finalCorrectCount} / ${results.length} 个小题</p>
                <p class="text-xl font-semibold">综合得分: ${averageScore} / 100</p>
            </div>`;
        outputContainer.insertAdjacentHTML('afterbegin', summaryHtml);

        getElem('submitAllAnswers')?.remove();
    }

    function exportContent(type) {
        const title = getElem("title").value.trim() || "练习题";
        const filename = `${title}_${type}.docx`;
        let contentElement;

        if (type === '题卷') {
            const questionsTab = document.querySelector('#questions-tab');
            if (!questionsTab || !questionsTab.innerHTML.trim()) return showMessage("💡 请先生成题目！", "warning");
            contentElement = questionsTab.cloneNode(true);
            contentElement.querySelectorAll('.result-feedback, .text-center.my-6, #submitAllAnswers').forEach(el => el.remove());
        } else { // "答案卷"
            if (AppState.solutions.length === 0) return showMessage("💡 解析数据不存在。", "warning");
            contentElement = document.createElement('div');
            let html = '<h2>参考答案与解析</h2>';
            AppState.solutions.forEach(sol => {
                html += `<div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;"><p><strong>第${sol.question_number}题</strong></p><p><strong>正确答案:</strong> ${Array.isArray(sol.answer) ? sol.answer.join(', ') : sol.answer}</p><p><strong>解题思路:</strong> ${sol.explanation}</p></div>`;
            });
            contentElement.innerHTML = html;
        }

        const doc = new docx.Document({ sections: [{ children: convertHtmlToDocx(contentElement) }] });

        docx.Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage(`✅ ${type}已成功导出！`, 'success');
        }).catch(err => {
            console.error("Export failed", err);
            showMessage("❌ 导出失败。", 'error');
        });
    }

    function convertHtmlToDocx(element) {
        const children = [];
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                children.push(new docx.Paragraph({ text: node.textContent.trim() }));
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const style = {};
                if (node.tagName.startsWith('H')) {
                    style.heading = docx.HeadingLevel[`HEADING_${node.tagName.substring(1)}`];
                }
                if (node.tagName === 'STRONG' || node.tagName === 'B') {
                    style.bold = true;
                }
                const textContent = node.textContent || '';
                if (textContent.trim()) {
                     children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: textContent, ...style })] }));
                }
            }
        });
        return children;
    }
});