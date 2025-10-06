document.addEventListener('DOMContentLoaded', () => {

    // ==================== DOM Elements ====================
    const getElem = (id) => document.getElementById(id);
    const output = getElem("output");
    const progressIndicator = getElem("progressIndicator");
    const currentQuestionSpan = getElem("currentQuestion");
    const totalQuestionsSpan = getElem("totalQuestions");
    const generateBtn = getElem("generateBtn");

    // ==================== Application State ====================
    const AppState = {
        isGenerating: false,
        isEvaluating: false,
        solutions: [], // To store structured solutions from the AI
        currentFormat: 'markdown', // 'markdown' or 'structured'
    };

    // ==================== API Configuration ====================
    const API_CONFIG = {
        deepseek: {
            url: "https://api.deepseek.com/v1/chat/completions",
            models: ["deepseek-chat", "deepseek-reasoner"]
        },
        glm: {
            url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            models: ["glm-4"]
        },
        qwen: {
            url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            models: ["qwen-turbo"]
        }
    };

    // ==================== Event Listeners ====================
    generateBtn.addEventListener("click", generateQuestions);
    getElem("exportPaperBtn").addEventListener("click", () => exportContent("题卷"));
    getElem("exportAnswerBtn").addEventListener("click", () => exportContent("答案卷"));

    // ==================== Utility Functions ====================

    function showMessage(message, type = "info", duration = 4000) {
        const existingMessages = document.querySelectorAll('.user-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `user-message message-${type}`;
        messageDiv.innerHTML = message;
        output.parentNode.insertBefore(messageDiv, output);

        messageDiv.style.animation = 'slideInDown 0.5s ease-out';
        if (duration > 0) {
            setTimeout(() => {
                messageDiv.style.animation = 'slideOutUp 0.3s ease-in forwards';
                setTimeout(() => messageDiv.remove(), 300);
            }, duration);
        }
    }

    function getApiConfig(model) {
        for (const config of Object.values(API_CONFIG)) {
            if (config.models.includes(model)) return config;
        }
        return API_CONFIG.deepseek; // Fallback
    }

    async function safeApiCall(apiUrl, apiKey, payload) {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
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
        const jsonString = match ? match[1] : text;
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON:", jsonString);
            return null;
        }
    }

    function renderMathInElement(element) {
        if (window.renderMathInElement) {
            window.renderMathInElement(element, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                    { left: "\\[", right: "\\]", display: true }
                ],
                throwOnError: false
            });
        }
    }

    // ==================== Core Logic: Question Generation ====================

    async function generateQuestions() {
        if (AppState.isGenerating) {
            return showMessage("⏳ 正在生成中，请稍候...", "warning");
        }

        const userInputs = {
            title: getElem("title").value.trim() || "综合练习",
            topic: getElem("topic").value.trim(),
            type: getElem("type").value,
            difficulty: getElem("difficulty").value,
            num: getElem("num").value,
            model: getElem("model").value,
            apiKey: getElem("apiKey").value.trim() || "sk-0560c9a849694436a71c1ef4c053505a",
            customPrompt: getElem("customPrompt").value.trim(),
        };

        if (!userInputs.topic) {
            return showMessage("💡 请输入学习主题！", "warning");
        }

        AppState.currentFormat = 'structured'; // Always use structured format now

        AppState.isGenerating = true;
        generateBtn.innerHTML = '<span class="loading"></span> 正在生成中...';
        generateBtn.disabled = true;
        output.innerHTML = `<div class="text-center py-8"><div class="loading mx-auto mb-4"></div><h3 class="text-xl font-semibold text-gray-700">AI老师正在为您出题...</h3></div>`;

        try {
            const prompt = buildQuestionPrompt(userInputs);
            const apiConfig = getApiConfig(userInputs.model);
            const payload = {
                model: userInputs.model,
                messages: [
                    { role: "system", content: "你是一位经验丰富的义务教育阶段教师，专门为中小学生设计练习题。请严格按照要求以JSON格式输出。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            };

            const data = await safeApiCall(apiConfig.url, userInputs.apiKey, payload);
            const responseText = data.choices?.[0]?.message?.content?.trim() || data.result || data.output?.[0]?.content || '';
            const parsedData = extractJsonFromText(responseText);

            if (!parsedData || !parsedData.questions || !parsedData.solutions) {
                throw new Error("AI返回的结构化数据不完整或格式不正确。");
            }
            
            AppState.questions = parsedData.questions; // Save questions to state
            AppState.solutions = parsedData.solutions; // Save solutions for evaluation
            renderStructuredQuestionInterface(parsedData.questions);

            showMessage("🎉 练习题已生成！", "success");

        } catch (error) {
            output.innerHTML = `<div class="text-center py-8 text-red-500"><h3>生成失败</h3><p>${error.message}</p></div>`;
            showMessage(error.message, 'error');
        } finally {
            AppState.isGenerating = false;
            generateBtn.innerHTML = '🚀 开启我的学习冒险';
            generateBtn.disabled = false;
        }
    }

    function buildQuestionPrompt({ type, title, topic, difficulty, num, customPrompt }) {
        const quantityLabel = type.includes('完形填空') ? '【挖空数量】' : '【数量】';

        // Always use the new structured JSON prompt
        return `
        【任务要求】: 请为中小学生生成练习题，并严格按照下面的JSON格式输出。
        【试卷科目】：${title}
        【知识点】：${topic}
        【题型】：${type}
        【难度】：${difficulty}
        ${quantityLabel}：${num}
        【个性化要求】：${customPrompt || "无"}

        【输出格式】: 请严格遵循以下JSON结构，不要输出任何额外文本。
        {
          "questions": [
            {
              "question_number": <题号>,
              "type": "<题型>",
              "question_text": "<题目文本，对于完形填空，请为每个空都使用完全相同的 __BLANK__ 占位符>",
              "options": ["<选项A>", "<选项B>", "<选项C>", "<选项D>"], // (仅选择题需要此字段)
              "cloze_questions": [ // (仅完形填空需要此字段)
                {
                  "blank_number": <完形填空题号，从1开始顺序递增>,
                  "options": ["<选项A>", "<选项B>", "<选项C>", "<选项D>"]
                }
              ]
            }
          ],
          "solutions": [
            {
              "question_number": <题号>,
              "answer": "<正确答案>", // 对于完形填空，这里是所有正确选项组成的数组，例如 ["A", "C", "B", ...]
              "explanation": "<该题的详细解析>"
            }
          ]
        }
        `;
    }

    function renderMarkdownQuestionInterface(questionsMd, answersMd) {
        const qHtml = marked.parse(questionsMd || '');
        const aHtml = marked.parse(answersMd || '');

        output.innerHTML = `
            <div class="content-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="questions">题目部分</button>
                    <button class="tab-btn" data-tab="answers">答案解析</button>
                </div>
                <div id="questions-tab" class="tab-content active">${qHtml}</div>
                <div id="answers-tab" class="tab-content" style="display:none;">${aHtml}</div>
            </div>
        `;

        renderMathInElement(output);
        setupTabEvents();
        addAnswerInterface(); // This is for the old markdown format
    }

    function renderStructuredQuestionInterface(questions) {
        let questionsHtml = '';
        questions.forEach(q => {
            // For cloze tests, find and replace any placeholder with a sequential number.
            let blank_counter = 0;
            const formatted_text = q.question_text.replace(/__.*?__/g, () => {
                blank_counter++;
                return `__(${blank_counter})__`;
            });

            questionsHtml += `<div class="mb-4 p-4 border-b"><p class="font-semibold">${q.question_number}. ${formatted_text}</p>`;
            
            const type = q.type || '';
            // Render inputs based on question type using .includes() for resilience
            if (type.includes('选择题')) {
                if (q.options && q.options.length > 0) {
                    questionsHtml += `<div class="flex flex-col gap-2 mt-2">`;
                    q.options.forEach((opt, index) => {
                        const letter = String.fromCharCode(65 + index);
                        questionsHtml += `<label class="choice-option"><input type="radio" name="answer_${q.question_number}" value="${letter}" class="mr-2"> ${opt}</label>`;
                    });
                    questionsHtml += `</div>`;
                }
            } else if (type.includes('判断题')) {
                questionsHtml += `<div class="flex flex-col gap-2 mt-2">`;
                ['正确', '错误'].forEach(opt => {
                    questionsHtml += `<label class="choice-option"><input type="radio" name="answer_${q.question_number}" value="${opt}" class="mr-2"> ${opt}</label>`;
                });
                questionsHtml += `</div>`;
            } else if (type.includes('完形填空')) {
                if (q.cloze_questions && q.cloze_questions.length > 0) {
                    q.cloze_questions.forEach(cq => {
                        questionsHtml += `<div class="mt-4 ml-4"><p class="font-semibold">(${cq.blank_number})</p><div class="flex flex-row gap-4 mt-2">`;
                        cq.options.forEach((opt, index) => {
                            const letter = String.fromCharCode(65 + index);
                            questionsHtml += `<label class="choice-option"><input type="radio" name="answer_${q.question_number}_${cq.blank_number}" value="${letter}" class="mr-2"> ${opt}</label>`;
                        });
                        questionsHtml += `</div></div>`;
                    });
                }
            } else if (type.includes('写作')) {
                questionsHtml += `<div class="mt-2"><textarea name="answer_${q.question_number}" rows="10" class="w-full border rounded p-2" placeholder="请在此处开始你的写作..."></textarea></div>`;
            } else if (type.includes('简答题')) {
                questionsHtml += `<div class="mt-2"><textarea name="answer_${q.question_number}" rows="4" class="w-full border rounded p-2" placeholder="请在此输入您的解答"></textarea></div>`;
            } else { // Default to fill-in-the-blank
                questionsHtml += `<div class="mt-2"><input type="text" name="answer_${q.question_number}" class="w-full border rounded p-2" placeholder="请在此输入答案"></div>`;
            }
            questionsHtml += `</div>`;
        });

        output.innerHTML = `
            <div id="questions-tab" class="tab-content active">${questionsHtml}</div>
        `;
        
        const finalSubmitBtn = document.createElement('div');
        finalSubmitBtn.className = 'text-center mt-8';
        finalSubmitBtn.innerHTML = `<button id="submitAllAnswers" class="btn btn-success text-lg px-8 py-3">🚀 提交所有答案</button>`;
        output.appendChild(finalSubmitBtn);
        getElem('submitAllAnswers').addEventListener('click', submitAllAnswers);

        renderMathInElement(output);
    }

    function setupTabEvents() {
        output.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                output.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                output.querySelectorAll('.tab-content').forEach(tc => {
                    tc.style.display = tc.id === `${tabId}-tab` ? 'block' : 'none';
                });
            });
        });
    }

    // ==================== Core Logic: Answering and Evaluation ====================

    function addAnswerInterface() {
        const questionsContainer = getElem('questions-tab');
        const questionElements = questionsContainer.querySelectorAll('p, li');
        let questionIndex = 0;

        questionElements.forEach(el => {
            if (el.textContent.match(/^第\s*\d+\s*题[:：]?/)) {
                questionIndex++;
                const questionType = detectQuestionType(el.parentElement.innerHTML);
                const answerSection = createAnswerSection(questionIndex, questionType);
                el.insertAdjacentElement('afterend', answerSection);
            }
        });

        if (questionIndex > 0) {
            const finalSubmitBtn = document.createElement('div');
            finalSubmitBtn.className = 'text-center mt-8';
            finalSubmitBtn.innerHTML = `<button id="submitAllAnswers" class="btn btn-success text-lg px-8 py-3">🚀 提交所有答案</button>`;
            questionsContainer.appendChild(finalSubmitBtn);
            getElem('submitAllAnswers').addEventListener('click', submitAllAnswers);
        }
    }

    function createAnswerSection(index, type) {
        const section = document.createElement('div');
        section.className = 'answer-section my-4 p-4 border-l-4 border-blue-200 bg-blue-50';
        let inputHtml = '';
        switch (type) {
            case '选择题':
                inputHtml = `
                    <div class="flex flex-wrap gap-2">${['A', 'B', 'C', 'D'].map(opt => `
                        <label class="choice-option"><input type="radio" name="answer_${index}" value="${opt}" class="mr-2">${opt}</label>`).join('')}
                    </div>`;
                break;
            case '填空题':
                inputHtml = `<input type="text" name="answer_${index}" class="w-full border rounded p-2" placeholder="请在此输入答案">`;
                break;
            case '判断题':
                inputHtml = `
                    <div class="flex gap-4">${['正确', '错误'].map(opt => `
                        <label class="choice-option"><input type="radio" name="answer_${index}" value="${opt}" class="mr-2">${opt}</label>`).join('')}
                    </div>`;
                break;
            default: // 简答题
                inputHtml = `<textarea name="answer_${index}" rows="4" class="w-full border rounded p-2" placeholder="请在此输入您的解答"></textarea>`;
        }
        section.innerHTML = `<label class="font-semibold block mb-2">第${index}题作答区：</label>${inputHtml}`;
        return section;
    }

    function detectQuestionType(htmlContent) {
        if (htmlContent.includes('A.') && htmlContent.includes('B.')) return '选择题';
        if (htmlContent.includes('___')) return '填空题';
        if (htmlContent.includes('判断')) return '判断题';
        return '简答题';
    }

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

            if (questionType.includes('完形填空')) {
                const fullExplanation = solution.explanation;
                // Create a separate result for each blank in the cloze test
                solution.answer.forEach((correctAnswer, index) => {
                    const blankNum = index + 1;
                    const studentAns = getStudentAnswer(`${solution.question_number}_${blankNum}`);
                    const isCorrect = studentAns.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
                    
                    results.push({
                        isCorrect,
                        score: isCorrect ? 100 : 0,
                        feedback: isCorrect ? "回答正确！" : `回答错误，正确答案是 ${correctAnswer}`,
                        explanation: fullExplanation, // The explanation is for the whole passage
                        questionIndex: `${solution.question_number}_${blankNum}`, // Unique index like "1_1"
                        studentAnswer: studentAns || "未作答",
                        standardAnswer: correctAnswer
                    });
                });
            } else {
                let result;
                if (questionType.includes('写作') || questionType.includes('简答题')) {
                    const studentAnswer = getStudentAnswer(solution.question_number);
                    result = await evaluateSubjective(questionInfo, studentAnswer, solution.answer, apiKey);
                } else {
                    const studentAnswer = getStudentAnswer(solution.question_number);
                    const isCorrect = studentAnswer.trim().toUpperCase() === solution.answer.trim().toUpperCase();
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
                    studentAnswer: result.studentAnswer || "未作答",
                    standardAnswer: solution.answer
                });
            }
        }
        return results;
    }

    async function evaluateSubjective(questionInfo, studentAnswer, standardAnswer, apiKey) {
        const isWriting = questionInfo.type === '写作';
        const prompt = `
        你是一位严格而富有洞察力的AI教师。请根据以下信息，以循循善诱的口吻评判学生的答案。
        
        【题目】: ${questionInfo.question_text}
        【${isWriting ? '写作要求' : '标准答案参考'}】: ${standardAnswer}
        【学生答案】: ${studentAnswer}

        请严格按照以下JSON格式返回，不要添加任何额外描述：
        {
          "isCorrect": false, // 对于写作题，如果学生基本完成了写作要求，请返回true
          "score": <0-100之间的整数得分>,
          "feedback": "(简短反馈，${isWriting ? '从文章结构、逻辑、语法等角度总结核心问题' : '直接指出学生回答中知识点的不足或缺失之处'})",
          "explanation": "(详细解析，${isWriting ? '分点说明文章的优点和缺点，并提供改进建议' : '首先总结一个优秀答案应包含的答题要点，然后再对学生的答案进行详细分析和指导'})"
        }
        `;
        try {
            const model = getElem("model").value;
            const apiConfig = getApiConfig(model);
            const payload = { model, messages: [{ role: "system", content: "You are an AI teacher." }, { role: "user", content: prompt }], temperature: 0.3 };
            const data = await safeApiCall(apiConfig.url, apiKey, payload);
            const responseText = data.choices?.[0]?.message?.content?.trim() || '';
            const result = extractJsonFromText(responseText);
            if (!result) throw new Error("AI evaluation response format error.");
            return result;
        } catch (error) {
            console.error("Subjective evaluation failed:", error);
            return { isCorrect: false, score: 0, feedback: "AI批改失败", explanation: "无法连接到AI服务进行批改，请参考标准答案。" };
        }
    }

    function getStudentAnswer(name) {
        const radio = document.querySelector(`input[name="answer_${name}"]:checked`);
        if (radio) return radio.value;
        const textInput = document.querySelector(`input[type="text"][name="answer_${name}"], textarea[name="answer_${name}"]`);
        return textInput ? textInput.value.trim() : "";
    }

    function displayResults(results) {
        let correctCount = 0;
        let totalScore = 0;
        let clozePassageExplanation = '';
        let clozeQuestionsCount = 0;

        results.forEach(res => {
            if (res.isCorrect) correctCount++;
            totalScore += res.score || 0;

            const inputElement = document.querySelector(`[name="answer_${res.questionIndex}"]`);
            if (!inputElement) return;

            // For cloze tests, find the sub-container; otherwise, find the main question container.
            const questionContainer = inputElement.closest(res.questionIndex.toString().includes('_') ? '.mt-4.ml-4' : '.mb-4');
            if (!questionContainer) return;

            const resultBlock = document.createElement('div');
            const scoreColor = (res.score || 0) >= 80 ? 'green' : (res.score || 0) >= 60 ? 'orange' : 'red';
            resultBlock.className = `result-feedback mt-3 p-3 border-t ${res.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`;
            
            let explanationHtml = '';
            if (res.questionIndex.toString().includes('_')) {
                // For cloze tests, we only show the full explanation once at the end.
                if (!clozePassageExplanation) clozePassageExplanation = res.explanation;
                clozeQuestionsCount++;
            } else {
                explanationHtml = `
                <div class="mt-2 pt-2 border-t border-gray-200">
                    <strong class="text-gray-800">解题思路:</strong>
                    <p class="text-gray-700">${res.explanation}</p>
                </div>`;
            }

            resultBlock.innerHTML = `
                <div class="flex justify-between items-center font-bold">
                    <span>${res.isCorrect ? '✓ 回答正确' : '✗ 回答错误'}</span>
                    <span style="color: ${scoreColor}">本题得分: ${res.score || 0} / 100</span>
                </div>
                <p><strong>你的答案:</strong> ${res.studentAnswer || '未作答'}</p>
                <p><strong>AI反馈:</strong> ${res.feedback}</p>
                ${explanationHtml}
            `;
            questionContainer.appendChild(resultBlock);
            questionContainer.querySelectorAll('input, textarea').forEach(input => input.disabled = true);
        });

        // If there was a cloze test, append the main explanation at the very end.
        const outputContainer = getElem('questions-tab');
        if (clozePassageExplanation) {
            const explanationBlock = document.createElement('div');
            explanationBlock.className = 'mt-6 p-4 bg-gray-100 rounded-lg';
            explanationBlock.innerHTML = `
                <h4 class="font-bold text-lg">全文综合解析</h4>
                <p>${clozePassageExplanation}</p>
            `;
            outputContainer.appendChild(explanationBlock);
        }

        const totalQuestions = results.length - clozeQuestionsCount + (clozeQuestionsCount > 0 ? 1 : 0);
        const finalCorrectCount = results.filter(r => !r.questionIndex.toString().includes('_') && r.isCorrect).length + (clozeQuestionsCount > 0 && results.filter(r => r.questionIndex.toString().includes('_')).every(r => r.isCorrect) ? 1 : 0);

        const averageScore = Math.round(totalScore / results.length);
        const summaryHtml = `
            <div class="text-center my-6 p-4 bg-blue-100 rounded-lg">
                <h3 class="text-2xl font-bold">批改完成！</h3>
                <p class="text-xl">你答对了 ${finalCorrectCount} / ${totalQuestions} 题</p>
                <p class="text-xl font-semibold">综合得分: ${averageScore} / 100</p>
            </div>
        `;
        outputContainer.insertAdjacentHTML('afterbegin', summaryHtml);

        const submitBtn = getElem('submitAllAnswers');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

        // ==================== Export Functionality ====================
    
        function exportContent(type) {
            const title = getElem("title").value.trim() || "练习题";
            const filename = `${title}_${type}.docx`;
            let exportHtml = '';
    
            if (type === '题卷') {
                const questionsTab = document.querySelector('#questions-tab');
                if (!questionsTab || questionsTab.innerHTML.trim() === '') {
                    return showMessage("💡 请先生成题目才能导出题卷！", "warning");
                }
                exportHtml = questionsTab.innerHTML;
            } else { // "答案卷"
                if (AppState.currentFormat === 'structured') {
                    if (AppState.solutions.length === 0) {
                        return showMessage("💡 题目尚未生成或解析数据不存在。", "warning");
                    }
                    exportHtml = '<h2>参考答案与解析</h2>';
                    AppState.solutions.forEach(sol => {
                        exportHtml += `
                            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
                                <p><strong>第${sol.question_number}题</strong></p>
                                <p><strong>正确答案:</strong> ${sol.answer}</p>
                                <p><strong>解题思路:</strong> ${sol.explanation}</p>
                            </div>
                        `;
                    });
                } else { // markdown format
                    const answersTab = document.querySelector('#answers-tab');
                    if (!answersTab || answersTab.innerHTML.trim() === '') {
                        return showMessage("💡 题目尚未生成，无法导出解析。", "warning");
                    }
                    exportHtml = answersTab.innerHTML;
                }
            }
    
            // Use a temporary div to convert HTML to paragraphs for docx
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = exportHtml;
            // Remove feedback blocks from the exported question paper to get a clean version
            if (type === '题卷') {
                tempDiv.querySelectorAll('.result-feedback').forEach(el => el.remove());
            }
    
            const paragraphs = Array.from(tempDiv.childNodes).map(node => {
                return new docx.Paragraph({ text: node.textContent });
            });
    
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: [
                        new docx.Paragraph({ text: `${title} - ${type}`, heading: docx.HeadingLevel.TITLE }),
                        ...paragraphs
                    ]
                }]
            });
    
            docx.Packer.toBlob(doc).then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showMessage(`✅ ${type}已成功导出为Word文档！`, 'success');
            }).catch(err => {
                console.error("Export failed", err);
                showMessage("❌ 导出失败。", 'error');
            });
        }
    });
