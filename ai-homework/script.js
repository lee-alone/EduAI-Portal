// ==================== 全局变量和配置 ====================
const output = document.getElementById("output");
const progressIndicator = document.getElementById("progressIndicator");
const currentQuestionSpan = document.getElementById("currentQuestion");
const totalQuestionsSpan = document.getElementById("totalQuestions");

// 应用状态管理
const AppState = {
    currentQuestionCount: 0,
    totalQuestionCount: 0,
    currentQuestions: [],
    currentAnswers: [],
    studentAnswers: [],
    questionType: '',
    isGenerating: false,
    isEvaluating: false
};

// API配置
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

// ==================== 工具函数 ====================

// 显示学习进度
function showProgress(current, total) {
    AppState.currentQuestionCount = current;
    AppState.totalQuestionCount = total;
    currentQuestionSpan.textContent = current;
    totalQuestionsSpan.textContent = total;
    progressIndicator.style.display = 'block';
}

// 隐藏学习进度
function hideProgress() {
    progressIndicator.style.display = 'none';
    AppState.currentQuestionCount = 0;
    AppState.totalQuestionCount = 0;
}

// 显示消息提示
function showMessage(message, type = "info") {
    const messageDiv = document.createElement('div');
    messageDiv.className = `success-message ${type === 'warning' ? 'bg-yellow-400' : ''}`;
    messageDiv.innerHTML = message;
    
    // 插入到输出区域上方
    output.parentNode.insertBefore(messageDiv, output);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// 获取API配置
function getApiConfig(model) {
    for (const [provider, config] of Object.entries(API_CONFIG)) {
        if (config.models.includes(model)) {
            return { provider, ...config };
        }
    }
    return { provider: 'deepseek', ...API_CONFIG.deepseek };
}

// 安全的API调用
async function safeApiCall(apiUrl, apiKey, payload, retries = 3) {
    for (let i = 0; i < retries; i++) {
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
                throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // 验证响应数据
            if (!data) {
                throw new Error('API返回空数据');
            }

            return data;
        } catch (error) {
            console.warn(`API调用失败 (尝试 ${i + 1}/${retries}):`, error.message);
            
            if (i === retries - 1) {
                throw new Error(`API调用失败，已重试${retries}次: ${error.message}`);
            }
            
            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

    // 添加难度徽章
    function addDifficultyBadge(container, difficulty) {
      const badge = document.createElement('span');
      badge.className = `difficulty-badge difficulty-${difficulty.toLowerCase()}`;
      badge.textContent = difficulty;
      container.appendChild(badge);
    }

    // 添加学习动机提示
    function addMotivationTip() {
      const tips = [
        "💡 记住：每道题都是你成长路上的垫脚石！",
        "🌟 不要害怕犯错，错误是学习的最好老师！",
        "🚀 你已经很棒了，继续加油！",
        "🎯 专注于过程，结果自然会来！",
        "💪 每一次挑战都让你变得更强大！"
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      
      const tipElement = document.createElement('div');
      tipElement.className = 'learning-motivation';
      tipElement.textContent = randomTip;
      tipElement.style.marginTop = '1rem';
      tipElement.style.animation = 'fadeIn 0.5s ease-out';
      
      return tipElement;
    }

    // 添加学习友好的元素
    function addLearningElements(container, difficulty, num) {
      // 添加难度徽章到标签按钮
      const tabButtons = container.querySelector('.tab-buttons');
      if (tabButtons) {
        const difficultyBadge = document.createElement('span');
        addDifficultyBadge(difficultyBadge, difficulty);
        difficultyBadge.style.marginLeft = '1rem';
        tabButtons.appendChild(difficultyBadge);
      }

      // 为题目添加进度跟踪
      const questionsTab = container.querySelector('#questions-tab');
      if (questionsTab) {
        // 计算题目数量
        const questionElements = questionsTab.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        let questionCount = 0;
        questionElements.forEach(el => {
          if (el.textContent.includes('第') && el.textContent.includes('题')) {
            questionCount++;
          }
        });

        if (questionCount > 0) {
          // 更新进度显示
          showProgress(0, questionCount);
          
          // 添加答题界面
          addAnswerInterface(questionsTab, questionCount);
        }
      }
    }

// ==================== 答题界面优化 ====================

// 添加答题界面
function addAnswerInterface(container, totalQuestions) {
    const questionElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
    let questionIndex = 0;
    
    questionElements.forEach(el => {
        if (el.textContent.includes('第') && el.textContent.includes('题')) {
            questionIndex++;
            
            // 检测题目类型
            const questionType = detectQuestionType(el.textContent);
            
            // 创建答题区域
            const answerSection = createAnswerSection(questionIndex, questionType);
            
            // 添加提交按钮
            const submitBtn = createSubmitButton(questionIndex, questionType);
            answerSection.appendChild(submitBtn);
            
            // 插入答题区域
            el.parentNode.insertBefore(answerSection, el.nextSibling);
        }
    });
    
    // 添加整体提交按钮
    addFinalSubmitButton(container);
}

// 创建答题区域
function createAnswerSection(questionIndex, questionType) {
    const answerSection = document.createElement('div');
    answerSection.className = 'answer-section';
    answerSection.style.marginTop = '1rem';
    answerSection.style.padding = '1rem';
    answerSection.style.border = '2px dashed var(--accent-warm)';
    answerSection.style.borderRadius = '0.5rem';
    answerSection.style.background = 'linear-gradient(135deg, rgba(255, 230, 109, 0.1) 0%, rgba(255, 255, 255, 0.8) 100%)';
    
    // 根据题目类型创建不同的答题界面
    switch (questionType) {
        case 'multiple_choice':
            answerSection.innerHTML = createMultipleChoiceInterface(questionIndex);
            break;
        case 'fill_blank':
            answerSection.innerHTML = createFillBlankInterface(questionIndex);
            break;
        case 'true_false':
            answerSection.innerHTML = createTrueFalseInterface(questionIndex);
            break;
        case 'essay':
        default:
            answerSection.innerHTML = createEssayInterface(questionIndex);
            break;
    }
    
    return answerSection;
}

// 创建选择题界面
function createMultipleChoiceInterface(questionIndex) {
    return `
        <div class="answer-input">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
                🎯 请选择你的答案：
            </label>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <label class="choice-option" data-value="A">
                    <input type="radio" name="answer_${questionIndex}" value="A" style="margin-right: 0.5rem;">
                    A
                </label>
                <label class="choice-option" data-value="B">
                    <input type="radio" name="answer_${questionIndex}" value="B" style="margin-right: 0.5rem;">
                    B
                </label>
                <label class="choice-option" data-value="C">
                    <input type="radio" name="answer_${questionIndex}" value="C" style="margin-right: 0.5rem;">
                    C
                </label>
                <label class="choice-option" data-value="D">
                    <input type="radio" name="answer_${questionIndex}" value="D" style="margin-right: 0.5rem;">
                    D
                </label>
            </div>
        </div>
    `;
}

// 创建填空题界面
function createFillBlankInterface(questionIndex) {
    return `
        <div class="answer-input">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
                ✏️ 请填写你的答案：
            </label>
            <input type="text" name="answer_${questionIndex}" 
                style="width: 100%; padding: 0.75rem; border: 2px solid rgba(255, 107, 107, 0.2); border-radius: 0.5rem; font-size: 1rem; background: white;"
                placeholder="请在这里填写你的答案...">
        </div>
    `;
}

// 创建判断题界面
function createTrueFalseInterface(questionIndex) {
    return `
        <div class="answer-input">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
                ⚖️ 请判断对错：
            </label>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <label class="choice-option" data-value="正确">
                    <input type="radio" name="answer_${questionIndex}" value="正确" style="margin-right: 0.5rem;">
                    ✅ 正确
                </label>
                <label class="choice-option" data-value="错误">
                    <input type="radio" name="answer_${questionIndex}" value="错误" style="margin-right: 0.5rem;">
                    ❌ 错误
                </label>
            </div>
        </div>
    `;
}

// 创建简答题界面
function createEssayInterface(questionIndex) {
    return `
        <div class="answer-input">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
                ✍️ 请写下你的答案：
            </label>
            <textarea name="answer_${questionIndex}" rows="4" 
                style="width: 100%; padding: 0.75rem; border: 2px solid rgba(255, 107, 107, 0.2); border-radius: 0.5rem; font-size: 1rem; resize: vertical; background: white;"
                placeholder="请在这里写下你的详细答案..."></textarea>
        </div>
    `;
}

// 创建提交按钮
function createSubmitButton(questionIndex, questionType) {
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-success';
    submitBtn.style.marginTop = '0.5rem';
    submitBtn.innerHTML = '📝 提交答案';
    submitBtn.onclick = () => submitAnswer(questionIndex, questionType, submitBtn);
    
    return submitBtn;
}

// 添加整体提交按钮
function addFinalSubmitButton(container) {
    const finalSubmitBtn = document.createElement('div');
    finalSubmitBtn.style.textAlign = 'center';
    finalSubmitBtn.style.marginTop = '2rem';
    finalSubmitBtn.innerHTML = `
        <button id="submitAllAnswers" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem;">
            🚀 提交所有答案并查看结果
        </button>
    `;
    container.appendChild(finalSubmitBtn);
    
    // 绑定整体提交事件
    document.getElementById('submitAllAnswers').onclick = () => submitAllAnswers();
}

// ==================== 答案提交优化 ====================

// 提交单个答案
function submitAnswer(questionIndex, questionType, submitBtn) {
    const answerInput = getAnswerInput(questionIndex, questionType);
    
    if (!answerInput || !isValidAnswer(answerInput, questionType)) {
        showMessage("💡 请先选择或填写你的答案哦！", "warning");
        return;
    }
    
    const answer = extractAnswer(answerInput, questionType);
    AppState.studentAnswers[questionIndex - 1] = answer;
    
    // 更新按钮状态
    updateSubmitButton(submitBtn, true);
    
    // 更新进度
    updateProgress(questionIndex);
    
    showMessage(`🎉 第${questionIndex}题答案已提交！继续加油！`, "success");
}

// 获取答案输入元素
function getAnswerInput(questionIndex, questionType) {
    switch (questionType) {
        case 'multiple_choice':
        case 'true_false':
            return document.querySelector(`input[name="answer_${questionIndex}"]:checked`);
        case 'fill_blank':
            return document.querySelector(`input[name="answer_${questionIndex}"]`);
        case 'essay':
        default:
            return document.querySelector(`textarea[name="answer_${questionIndex}"]`);
    }
}

// 验证答案是否有效
function isValidAnswer(answerInput, questionType) {
    if (!answerInput) return false;
    
    switch (questionType) {
        case 'multiple_choice':
        case 'true_false':
            return answerInput.checked;
        case 'fill_blank':
        case 'essay':
        default:
            return answerInput.value.trim().length > 0;
    }
}

// 提取答案内容
function extractAnswer(answerInput, questionType) {
    switch (questionType) {
        case 'multiple_choice':
        case 'true_false':
            return answerInput.value;
        case 'fill_blank':
        case 'essay':
        default:
            return answerInput.value.trim();
    }
}

// 更新提交按钮状态
function updateSubmitButton(submitBtn, isSubmitted) {
    if (isSubmitted) {
        submitBtn.innerHTML = '✅ 已提交';
        submitBtn.style.background = 'linear-gradient(135deg, #51CF66, #40C057)';
        submitBtn.disabled = true;
    } else {
        submitBtn.innerHTML = '📝 提交答案';
        submitBtn.style.background = '';
        submitBtn.disabled = false;
    }
}

// 更新学习进度
function updateProgress(questionIndex) {
    AppState.currentQuestionCount = Math.min(questionIndex, AppState.totalQuestionCount);
    currentQuestionSpan.textContent = AppState.currentQuestionCount;
    
    // 如果所有题目都完成了，显示完成提示
    if (AppState.currentQuestionCount >= AppState.totalQuestionCount) {
        showMessage("🎉 太棒了！你已经完成了所有题目，可以提交查看结果了！", "success");
    }
}

// ==================== 整体提交和评判 ====================

// 提交所有答案并评判
async function submitAllAnswers() {
    // 防止重复提交
    if (AppState.isEvaluating) {
        showMessage("⏳ 正在评判中，请稍候...", "warning");
        return;
    }
    
    AppState.isEvaluating = true;
    
    const submitBtn = document.getElementById('submitAllAnswers');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<span class="loading"></span> 正在评判中...';
    submitBtn.disabled = true;
    
    try {
        // 收集所有答案
        const allAnswers = collectAllAnswers();
        
        // 验证答案完整性
        const validationResult = validateAnswers(allAnswers);
        if (!validationResult.isValid) {
            showMessage(validationResult.message, "warning");
            resetSubmitButton(submitBtn, originalText);
            AppState.isEvaluating = false;
            return;
        }
        
        // 开始评判
        showMessage("🤖 AI老师正在认真评判你的答案，请稍候...", "info");
        
        const results = await evaluateAnswers(allAnswers);
        displayResults(results);
        
        // 更新按钮状态
        submitBtn.innerHTML = '🎉 评判完成！';
        submitBtn.style.background = 'linear-gradient(135deg, #51CF66, #40C057)';
        
    } catch (error) {
        console.error('评判过程中出错:', error);
        showMessage("😅 评判过程中出现了问题，请稍后再试～", "warning");
        resetSubmitButton(submitBtn, originalText);
    } finally {
        AppState.isEvaluating = false;
    }
}

// 收集所有答案
function collectAllAnswers() {
    const allAnswers = [];
    const answerInputs = document.querySelectorAll('input[name^="answer_"]:checked, textarea[name^="answer_"], input[name^="answer_"]');
    
    answerInputs.forEach(input => {
        const questionNum = parseInt(input.name.split('_')[1]);
        let answer;
        
        if (input.type === 'radio') {
            answer = input.value;
        } else {
            answer = input.value.trim();
        }
        
        allAnswers[questionNum - 1] = answer;
    });
    
    return allAnswers;
}

// 验证答案完整性
function validateAnswers(allAnswers) {
    const unansweredQuestions = [];
    
    for (let i = 0; i < allAnswers.length; i++) {
        if (!allAnswers[i] || allAnswers[i].length === 0) {
            unansweredQuestions.push(i + 1);
        }
    }
    
    if (unansweredQuestions.length > 0) {
        return {
            isValid: false,
            message: `💡 还有第${unansweredQuestions.join('、')}题没有回答，请完成后再提交！`
        };
    }
    
    return { isValid: true };
}

// 重置提交按钮
function resetSubmitButton(submitBtn, originalText) {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    submitBtn.style.background = '';
}

// ==================== 答案评判系统 ====================

// 题目类型检测
function detectQuestionType(questionText) {
    const text = questionText.toLowerCase();
    
    // 选择题特征
    if (text.includes('a.') || text.includes('b.') || text.includes('c.') || text.includes('d.')) {
        return 'multiple_choice';
    }
    
    // 填空题特征
    if (text.includes('___') || text.includes('填空') || text.includes('填入')) {
        return 'fill_blank';
    }
    
    // 判断题特征
    if (text.includes('正确') || text.includes('错误') || text.includes('对错') || text.includes('判断')) {
        return 'true_false';
    }
    
    // 默认为简答题
    return 'essay';
}

// 评判答案主函数
async function evaluateAnswers(studentAnswers) {
    const results = [];
    const model = document.getElementById("model").value;
    const apiKey = document.getElementById("apiKey").value.trim() || "sk-0560c9a849694436a71c1ef4c053505a";
    
    // 获取题目内容
    const questionsTab = document.querySelector('#questions-tab');
    const answersTab = document.querySelector('#answers-tab');
    
    if (!questionsTab || !answersTab) {
        throw new Error('无法找到题目或答案内容');
    }
    
    // 解析题目和标准答案
    const questions = parseQuestions(questionsTab.innerHTML);
    const standardAnswers = parseAnswers(answersTab.innerHTML);
    
    for (let i = 0; i < studentAnswers.length; i++) {
        const studentAnswer = studentAnswers[i];
        const question = questions[i];
        const standardAnswer = standardAnswers[i];
        
        if (!question || !studentAnswer) continue;
        
        // 检测题目类型
        const questionType = detectQuestionType(question);
        
        let result;
        
        try {
            switch (questionType) {
                case 'multiple_choice':
                    result = evaluateMultipleChoice(question, studentAnswer, standardAnswer, i + 1);
                    break;
                case 'fill_blank':
                    result = await evaluateFillBlank(question, studentAnswer, standardAnswer, i + 1, model, apiKey);
                    break;
                case 'true_false':
                    result = evaluateTrueFalse(question, studentAnswer, standardAnswer, i + 1);
                    break;
                case 'essay':
                default:
                    result = await evaluateEssay(question, studentAnswer, standardAnswer, i + 1, model, apiKey);
                    break;
            }
        } catch (error) {
            console.error(`评判第${i + 1}题时出错:`, error);
            result = createErrorResult(i + 1, questionType, studentAnswer, standardAnswer, error.message);
        }
        
        results.push(result);
    }
    
    return results;
}

// 评判选择题
function evaluateMultipleChoice(question, studentAnswer, standardAnswer, questionIndex) {
    // 提取标准答案中的正确选项
    const correctAnswer = extractCorrectAnswer(standardAnswer);
    
    return {
        questionIndex,
        questionType: '选择题',
        isCorrect: studentAnswer === correctAnswer,
        studentAnswer,
        standardAnswer: correctAnswer,
        score: studentAnswer === correctAnswer ? 100 : 0,
        feedback: studentAnswer === correctAnswer ? 
            '✅ 回答正确！' : 
            `❌ 回答错误，正确答案是 ${correctAnswer}`,
        explanation: standardAnswer
    };
}

// 评判填空题
async function evaluateFillBlank(question, studentAnswer, standardAnswer, questionIndex, model, apiKey) {
    // 填空题需要更灵活的评判
    const evaluationPrompt = `请评判学生的填空题答案。

题目：${question}
标准答案：${standardAnswer}
学生答案：${studentAnswer}

请按照以下JSON格式给出评判结果：
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "具体反馈",
  "explanation": "详细解析"
}

评判标准：
1. 答案的准确性（60%）
2. 答案的完整性（40%）

请给出客观、公正的评判。`;

    try {
        const result = await callAiEvaluation(evaluationPrompt, model, apiKey);
        return {
            questionIndex,
            questionType: '填空题',
            ...result,
            studentAnswer,
            standardAnswer
        };
    } catch (error) {
        // 回退到简单评判
        return {
            questionIndex,
            questionType: '填空题',
            isCorrect: false,
            score: 50,
            studentAnswer,
            standardAnswer,
            feedback: 'AI评判暂时不可用，请参考标准答案',
            explanation: standardAnswer
        };
    }
}

// 评判判断题
function evaluateTrueFalse(question, studentAnswer, standardAnswer, questionIndex) {
    // 提取标准答案中的正确判断
    const correctAnswer = extractTrueFalseAnswer(standardAnswer);
    
    return {
        questionIndex,
        questionType: '判断题',
        isCorrect: studentAnswer === correctAnswer,
        studentAnswer,
        standardAnswer: correctAnswer,
        score: studentAnswer === correctAnswer ? 100 : 0,
        feedback: studentAnswer === correctAnswer ? 
            '✅ 判断正确！' : 
            `❌ 判断错误，正确答案是 ${correctAnswer}`,
        explanation: standardAnswer
    };
}

// 评判简答题
async function evaluateEssay(question, studentAnswer, standardAnswer, questionIndex, model, apiKey) {
    const evaluationPrompt = `请评判学生的简答题答案。

题目：${question}
标准答案：${standardAnswer}
学生答案：${studentAnswer}

请按照以下JSON格式给出评判结果：
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "具体反馈意见",
  "explanation": "详细解析说明"
}

评判标准：
1. 答案的准确性（40%）
2. 答案的完整性（30%）
3. 答案的逻辑性（20%）
4. 答案的表达清晰度（10%）

请给出客观、公正、建设性的评判。`;

    try {
        const result = await callAiEvaluation(evaluationPrompt, model, apiKey);
        return {
            questionIndex,
            questionType: '简答题',
            ...result,
            studentAnswer,
            standardAnswer
        };
    } catch (error) {
        // 回退到简单评判
        return {
            questionIndex,
            questionType: '简答题',
            isCorrect: false,
            score: 50,
            studentAnswer,
            standardAnswer,
            feedback: 'AI评判暂时不可用，请参考标准答案',
            explanation: standardAnswer
        };
    }
}

// 调用AI评判
async function callAiEvaluation(prompt, model, apiKey) {
    const apiConfig = getApiConfig(model);
    
    const payload = {
        model,
        messages: [
            { role: "system", content: "你是一位专业的教师，擅长评判学生答案。" },
            { role: "user", content: prompt }
        ],
        temperature: 0.3
    };

    const data = await safeApiCall(apiConfig.url, apiKey, payload);
    const text = data.choices?.[0]?.message?.content?.trim?.() || data.result || data.output?.[0]?.content || '';
    
    const json = extractJsonFromText(text);
    
    if (json) {
        return {
            isCorrect: json.isCorrect || false,
            score: json.score || 0,
            feedback: json.feedback || '暂无反馈',
            explanation: json.explanation || '暂无解析'
        };
    } else {
        throw new Error('AI返回格式不正确');
    }
}

// 提取选择题正确答案
function extractCorrectAnswer(standardAnswer) {
    // 尝试从标准答案中提取正确选项
    const match = standardAnswer.match(/[A-D]/);
    return match ? match[0] : 'A';
}

// 提取判断题正确答案
function extractTrueFalseAnswer(standardAnswer) {
    if (standardAnswer.includes('正确') || standardAnswer.includes('对') || standardAnswer.includes('是')) {
        return '正确';
    } else if (standardAnswer.includes('错误') || standardAnswer.includes('错') || standardAnswer.includes('否')) {
        return '错误';
    }
    return '正确'; // 默认
}

// 创建错误结果
function createErrorResult(questionIndex, questionType, studentAnswer, standardAnswer, errorMessage) {
    return {
        questionIndex,
        questionType,
        isCorrect: false,
        score: 0,
        studentAnswer,
        standardAnswer,
        feedback: `评判出错：${errorMessage}`,
        explanation: standardAnswer
    };
}

    // 解析题目内容
    function parseQuestions(questionsHtml) {
      const questions = [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(questionsHtml, 'text/html');
      const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
      
      elements.forEach(el => {
        if (el.textContent.includes('第') && el.textContent.includes('题')) {
          questions.push(el.textContent.trim());
        }
      });
      
      return questions;
    }

    // 解析标准答案
    function parseAnswers(answersHtml) {
      const answers = [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(answersHtml, 'text/html');
      const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
      
      let currentAnswer = '';
      let answerIndex = 0;
      
      elements.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('第') && text.includes('题')) {
          if (currentAnswer) {
            answers.push(currentAnswer.trim());
            currentAnswer = '';
          }
          answerIndex++;
        } else if (text && !text.includes('参考答案') && !text.includes('详细解析')) {
          currentAnswer += text + '\n';
        }
      });
      
      if (currentAnswer) {
        answers.push(currentAnswer.trim());
      }
      
      return answers;
    }

    // AI评判简答题
    async function evaluateEssayAnswer(question, studentAnswer, standardAnswer, model, apiKey) {
      const evaluationPrompt = `你是一位经验丰富的教师，请评判学生的答案。

题目：${question}

标准答案：${standardAnswer}

学生答案：${studentAnswer}

请按照以下格式给出评判结果（JSON格式）：
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "具体的反馈意见",
  "explanation": "详细的解析说明"
}

评判标准：
1. 答案的准确性（40%）
2. 答案的完整性（30%）
3. 答案的逻辑性（20%）
4. 答案的表达清晰度（10%）

请给出客观、公正、建设性的评判。`;

      try {
        let apiUrl = "https://api.deepseek.com/v1/chat/completions";
        if (model === "glm-4") apiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
        else if (model === "qwen-turbo") apiUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

        const payload = {
          model,
          messages: [
            { role: "system", content: "你是一位专业的教师，擅长评判学生答案。" },
            { role: "user", content: evaluationPrompt }
          ],
          temperature: 0.3
        };

        const data = await callModel(apiUrl, apiKey, payload);
        const text = data.choices?.[0]?.message?.content?.trim?.() || data.result || data.output?.[0]?.content || '';
        
        const json = extractJsonFromText(text);
        
        if (json) {
          return {
            isCorrect: json.isCorrect || false,
            score: json.score || 0,
            studentAnswer: studentAnswer,
            standardAnswer: standardAnswer,
            feedback: json.feedback || '暂无反馈',
            explanation: json.explanation || standardAnswer
          };
        } else {
          // 回退到简单评判
          return {
            isCorrect: false,
            score: 50,
            studentAnswer: studentAnswer,
            standardAnswer: standardAnswer,
            feedback: 'AI评判暂时不可用，请参考标准答案',
            explanation: standardAnswer
          };
        }
      } catch (error) {
        console.error('AI评判出错:', error);
        return {
          isCorrect: false,
          score: 0,
          studentAnswer: studentAnswer,
          standardAnswer: standardAnswer,
          feedback: '评判过程中出现错误，请稍后再试',
          explanation: standardAnswer
        };
      }
    }

    // 显示评判结果
    function displayResults(results) {
      const resultsContainer = document.createElement('div');
      resultsContainer.className = 'results-container';
      resultsContainer.style.marginTop = '2rem';
      resultsContainer.style.padding = '2rem';
      resultsContainer.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%)';
      resultsContainer.style.borderRadius = '1rem';
      resultsContainer.style.border = '2px solid var(--primary-warm)';
      
      let totalScore = 0;
      let correctCount = 0;
      
      results.forEach(result => {
        if (result.isCorrect) correctCount++;
        totalScore += result.score || (result.isCorrect ? 100 : 0);
      });
      
      const averageScore = Math.round(totalScore / results.length);
      
      resultsContainer.innerHTML = `
        <div class="results-header" style="text-align: center; margin-bottom: 2rem;">
          <h2 style="color: var(--text-primary); margin-bottom: 1rem;">🎉 答题结果</h2>
          <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
            <div style="background: linear-gradient(135deg, var(--success-warm), #40C057); color: white; padding: 1rem 2rem; border-radius: 1rem; font-weight: 600;">
              ✅ 正确：${correctCount}/${results.length}题
            </div>
            <div style="background: linear-gradient(135deg, var(--primary-warm), #FF5252); color: white; padding: 1rem 2rem; border-radius: 1rem; font-weight: 600;">
              📊 总分：${averageScore}分
            </div>
          </div>
        </div>
        <div class="results-details">
          ${results.map((result, index) => `
            <div class="result-item" style="margin-bottom: 1.5rem; padding: 1.5rem; border: 2px solid ${result.isCorrect ? 'var(--success-warm)' : 'var(--primary-warm)'}; border-radius: 1rem; background: ${result.isCorrect ? 'linear-gradient(135deg, rgba(81, 207, 102, 0.1), rgba(64, 192, 87, 0.1))' : 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 82, 82, 0.1))'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: var(--text-primary); margin: 0;">第${result.questionIndex}题 ${result.questionType}</h3>
                <span style="padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; color: white; background: ${result.isCorrect ? 'var(--success-warm)' : 'var(--primary-warm)'};">
                  ${result.isCorrect ? '✅ 正确' : '❌ 错误'}
                </span>
              </div>
              <div style="margin-bottom: 1rem;">
                <strong style="color: var(--text-primary);">你的答案：</strong>
                <p style="margin: 0.5rem 0; padding: 0.75rem; background: rgba(255, 255, 255, 0.8); border-radius: 0.5rem; border-left: 4px solid var(--accent-warm);">${result.studentAnswer}</p>
              </div>
              <div style="margin-bottom: 1rem;">
                <strong style="color: var(--text-primary);">标准答案：</strong>
                <p style="margin: 0.5rem 0; padding: 0.75rem; background: rgba(255, 255, 255, 0.8); border-radius: 0.5rem; border-left: 4px solid var(--secondary-warm);">${result.standardAnswer}</p>
              </div>
              ${result.feedback ? `
                <div style="margin-bottom: 1rem;">
                  <strong style="color: var(--text-primary);">AI反馈：</strong>
                  <p style="margin: 0.5rem 0; padding: 0.75rem; background: rgba(255, 255, 255, 0.8); border-radius: 0.5rem; border-left: 4px solid var(--info-warm);">${result.feedback}</p>
                </div>
              ` : ''}
              <div>
                <strong style="color: var(--text-primary);">详细解析：</strong>
                <p style="margin: 0.5rem 0; padding: 0.75rem; background: rgba(255, 255, 255, 0.8); border-radius: 0.5rem; border-left: 4px solid var(--primary-warm);">${result.explanation}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      // 将结果添加到输出区域
      const output = document.getElementById("output");
      output.appendChild(resultsContainer);
      
      // 滚动到结果区域
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
      
      // 显示成功提示
      showMessage("🎉 评判完成！快来看看你的学习成果吧！", "success");
    }

// ==================== 题目生成核心逻辑 ====================

// 检测学科类型
function detectSubjectType(title, topic) {
    const text = (title + ' ' + topic).toLowerCase();
    const scienceKeywords = ['数学', '物理', '化学', '生物', '几何', '代数', '函数', '方程', '计算', '公式', '定理', '证明', '实验', '元素', '分子', '细胞', '基因'];
    const liberalKeywords = ['语文', '英语', '历史', '地理', '政治', '道德', '阅读', '写作', '作文', '古诗', '文言文', '语法', '词汇', '朝代', '事件', '人物', '地理', '气候', '地形'];
    const scienceCount = scienceKeywords.filter(k => text.includes(k)).length;
    const liberalCount = liberalKeywords.filter(k => text.includes(k)).length;
    return scienceCount > liberalCount ? '理科' : '文科';
}

// 生成题目提示词
function generateQuestionPrompt(title, topic, subjectType, type, difficulty, num, customPrompt) {
    const basePrompt = `你是一位经验丰富的教师，请严格按照下述要求生成练习题。

【试卷科目】：${title}
【知识点】：${topic}
【学科类型】：${subjectType}
【题型】：${type}
【难度】：${difficulty}
【数量】：${num}题
【个性化要求】：${customPrompt || "无"}

请严格按照以下JSON格式输出（仅输出JSON，没有额外文本）：
{
  "questions": "题目部分（Markdown格式，题号用'第X题：'格式，选择题选项独立成行）",
  "answers": "答案与解析部分（Markdown格式，包含'## 参考答案'和'## 详细解析'）"
}

要求：
1. 题目部分使用"第X题："格式
2. 选择题选项格式为：
   A. 选项内容
   B. 选项内容
   C. 选项内容
   D. 选项内容
3. 解析部分要详细，包含解题步骤
4. 数学公式用$包围
5. 确保题目难度符合要求
6. 题目要有教育价值，避免过于简单或复杂`;

    return basePrompt;
}

// 解析AI返回的JSON
function parseAiResponse(text) {
    if (!text) {
        throw new Error('AI返回空内容');
    }

    // 尝试提取JSON
    const json = extractJsonFromText(text);
    
    if (!json) {
        throw new Error('AI返回格式不正确，无法解析JSON');
    }

    // 验证必要字段
    if (!json.questions && !json.answers) {
        throw new Error('AI返回的JSON缺少必要字段');
    }

    return {
        questions: json.questions || '',
        answers: json.answers || ''
    };
}

// 从文本中提取JSON
function extractJsonFromText(text) {
    if (!text) return null;
    text = text.trim();
    
    // 如果字符串本身就是JSON
    try { 
        return JSON.parse(text); 
    } catch (e) {}
    
    // 查找 ```json ... ```
    const m1 = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m1) {
        try { 
            return JSON.parse(m1[1].trim()); 
        } catch (e) {}
    }
    
    // 尝试截取第一个 { ... } 对象
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sub = text.slice(firstBrace, lastBrace + 1);
        try { 
            return JSON.parse(sub); 
        } catch (e) {}
    }
    
    return null;
}

    const SYSTEM_PROMPT = `你是一名经验丰富的初中教师，负责出卷与讲解。请严格按照下述要求输出。输出必须为一个 JSON 对象（仅输出 JSON，没有额外文本），格式：
{
  "questions": "（题目部分，Markdown，题号与题干与选项等，选项每项独立一行，公式用 $ 包围）",
  "answers": "（答案与解析部分，Markdown，包含 ## 参考答案 和 ## 详细解析）"
}
题目部分请用 "第X题：" 格式，并保证选择题选项为
A. 选项内容
B. 选项内容
C. 选项内容
D. 选项内容
解析中请保证详细步骤并使用 Markdown。
不要输出任何非 JSON 的文本或代码块。`;

    function renderMath(target) {
      if (!target) return;
      // 首先尝试 auto-render（简单、快速）
      try {
        renderMathInElement(target, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      } catch (e) {
        // ignore
      }

      // 回退：扫描文本节点，手动匹配 $...$ / $$...$$ / \( \) / \[ \] 并使用 katex.renderToString 替换
      try {
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const v = node.nodeValue;
            if (!v) return NodeFilter.FILTER_REJECT;
            if (v.indexOf('$') === -1 && v.indexOf('\\(') === -1 && v.indexOf('\\[') === -1) return NodeFilter.FILTER_REJECT;
            // 跳过 code/pre/script/style 与 katex 输出容器
            let el = node.parentElement;
            while (el) {
              const tag = el.tagName;
              if (tag === 'CODE' || tag === 'PRE' || tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
              if (el.classList && el.classList.contains('katex')) return NodeFilter.FILTER_REJECT;
              el = el.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }, false);

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        const mathRegex = /(\$\$([\s\S]+?)\$\$)|(\$([^\$\n][\s\S]*?)\$)|(\\\\\(([\s\S]+?)\\\\\))|(\\\\\[([\s\S]+?)\\\\\])/g;

        textNodes.forEach(textNode => {
          const str = textNode.nodeValue;
          let lastIndex = 0;
          let m;
          const frag = document.createDocumentFragment();
          while ((m = mathRegex.exec(str)) !== null) {
            const index = m.index;
            if (index > lastIndex) {
              frag.appendChild(document.createTextNode(str.slice(lastIndex, index)));
            }
            const mathContent = m[2] || m[4] || m[6] || m[8] || '';
            const display = !!m[2] || !!m[8];
            try {
              const span = document.createElement('span');
              span.innerHTML = katex.renderToString(mathContent, { displayMode: display, throwOnError: false });
              frag.appendChild(span);
            } catch (err) {
              // 如果 katex 渲染出错，则退回原文本
              frag.appendChild(document.createTextNode(m[0]));
            }
            lastIndex = mathRegex.lastIndex;
          }
          if (lastIndex < str.length) frag.appendChild(document.createTextNode(str.slice(lastIndex)));
          if (frag.childNodes.length) textNode.parentNode.replaceChild(frag, textNode);
        });
      } catch (e) {
        // 忽略回退过程中的错误
      }
    }

    // 把内联选项拆成独立段落，保留题干
    function splitInlineOptionsInElement(root) {
      if (!root) return;
      const nodes = root.querySelectorAll('p, li, div');
      nodes.forEach(node => {
        const txt = (node.textContent || '').replace(/\u00A0/g, ' ').trim();
        if (!txt) return;
        // 支持 A. 或 A) 等常见形式
        const regex = /([A-D])(?:[.\)])\s*/g;
        const matches = [];
        let m;
        while ((m = regex.exec(txt)) !== null) {
          matches.push({ index: m.index, key: m[1] });
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
        if (matches.length === 0) return;
        const parts = [];
        const firstIdx = matches[0].index;
        const head = txt.slice(0, firstIdx).trim();
        if (head) parts.push(head);
        for (let i = 0; i < matches.length; i++) {
          const start = matches[i].index;
          const end = (i + 1 < matches.length) ? matches[i + 1].index : txt.length;
          const opt = txt.slice(start, end).trim();
          if (opt) parts.push(opt);
        }
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          const el = document.createElement('p');
          el.textContent = p;
          frag.appendChild(el);
        });
        node.parentNode.replaceChild(frag, node);
      });
    }

    // 尝试从模型返回中提取 JSON（支持裸JSON或 ```json ``` 包裹）
    function extractJsonFromText(text) {
      if (!text) return null;
      text = text.trim();
      // 如果字符串本身就是 JSON
      try { return JSON.parse(text); } catch (e) {}
      // 查找 ```json ... ```
      const m1 = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (m1) {
        try { return JSON.parse(m1[1].trim()); } catch (e) {}
      }
      // 尝试截取第一个 { ... } 对象（简单策略）
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sub = text.slice(firstBrace, lastBrace + 1);
        try { return JSON.parse(sub); } catch (e) {}
      }
      return null;
    }

    async function callModel(apiUrl, apiKey, payload) {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      return res.json();
    }

// ==================== 主要功能函数 ====================

// 生成题目主函数
async function generateQuestions() {
    // 获取用户输入
    const title = document.getElementById("title").value.trim() || "初中测验题";
    const topic = document.getElementById("topic").value.trim();
    const type = document.getElementById("type").value;
    const difficulty = document.getElementById("difficulty").value;
    const num = document.getElementById("num").value;
    const model = document.getElementById("model").value;
    const apiKey = document.getElementById("apiKey").value.trim() || "sk-0560c9a849694436a71c1ef4c053505a";
    const customPrompt = document.getElementById("customPrompt").value.trim();

    // 验证输入
    if (!topic) {
        showMessage("💡 请先告诉我你想学习什么知识点哦！这样AI才能为你量身定制练习题～", "warning");
        return;
    }

    // 防止重复生成
    if (AppState.isGenerating) {
        showMessage("⏳ 正在生成中，请稍候...", "warning");
        return;
    }

    AppState.isGenerating = true;

    // 显示学习进度
    showProgress(0, parseInt(num));

    // 显示加载界面
    showLoadingInterface();

    // 更新按钮状态
    const btn = document.getElementById("generateBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading"></span> 正在生成中...';
    btn.disabled = true;

    try {
        // 验证用户输入
        const validation = validateUserInput({ topic, num, apiKey });
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }
        
        // 检测学科类型
        const subjectType = detectSubjectType(title, topic);
        
        // 生成提示词
        const userPrompt = generateQuestionPrompt(title, topic, subjectType, type, difficulty, num, customPrompt);
        
        // 获取API配置
        const apiConfig = getApiConfig(model);
        
        // 构建请求载荷
        const payload = {
            model,
            messages: [
                { role: "system", content: "你是一位经验丰富的教师，擅长生成高质量的练习题。" },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        };

        // 调用AI API
        const data = await safeApiCall(apiConfig.url, apiKey, payload);
        
        // 提取响应文本
        const text = data.choices?.[0]?.message?.content?.trim?.() || 
                   data.result || 
                   data.output?.[0]?.content || '';

        if (!text) {
            throw new Error('AI返回空内容');
        }

        // 解析AI响应
        const parsedData = parseAiResponse(text);
        
        // 渲染题目界面
        renderQuestionInterface(parsedData.questions, parsedData.answers, difficulty, num);
        
        // 显示成功提示
        showMessage("🎉 太棒了！你的专属练习题已经生成完成，开始你的学习之旅吧！", "success");
        
    } catch (error) {
        console.error('生成题目失败:', error);
        
        // 根据错误类型显示不同的错误信息
        if (error.message.includes('网络') || error.message.includes('fetch')) {
            handleNetworkError(error);
        } else if (error.message.includes('API') || error.message.includes('401') || error.message.includes('429')) {
            handleApiError(error, model);
        } else if (error.message.includes('JSON') || error.message.includes('解析')) {
            handleParseError(error, 'json');
        } else {
            showErrorDetails(error, '题目生成');
        }
        
        showErrorInterface(error.message);
    } finally {
        // 恢复按钮状态
        btn.innerHTML = originalText;
        btn.disabled = false;
        AppState.isGenerating = false;
    }
}

// 显示加载界面
function showLoadingInterface() {
    const loadingMessages = [
        "🌟 正在为你精心准备学习内容...",
        "💫 AI老师正在思考如何帮助你...",
        "✨ 即将为你生成专属练习题...",
        "🚀 知识的大门正在为你打开..."
    ];
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    
    output.innerHTML = `
        <div class="text-center py-8">
            <div class="loading mx-auto mb-4"></div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">${randomMessage}</h3>
            <p class="text-gray-500">请稍等片刻，好的内容值得等待～</p>
        </div>
    `;
}

// 显示错误界面
function showErrorInterface(errorMessage) {
    const errorMessages = [
        "😅 哎呀，AI老师暂时有点累了，请稍后再试～",
        "🤔 网络好像有点小问题，让我们重新尝试一下吧！",
        "💪 别担心，这只是个小插曲，再试一次就能成功！",
        "🌟 偶尔的挫折是成长的一部分，让我们继续努力！"
    ];
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    
    output.innerHTML = `
        <div class="text-center py-8">
            <div class="text-6xl mb-4">🤗</div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">${randomError}</h3>
            <p class="text-gray-500 mb-4">错误信息：${errorMessage}</p>
            <button onclick="location.reload()" class="btn">
                🔄 重新开始
            </button>
        </div>
    `;
}

// 渲染题目界面
function renderQuestionInterface(questionsMd, answersMd, difficulty, num) {
    // 转换Markdown为HTML
    const qHtml = marked.parse(questionsMd || '');
    const aHtml = marked.parse(answersMd || '');

    // 构建标签页容器
    const container = document.createElement('div');
    container.className = 'content-tabs';
    container.innerHTML = `
        <div class="tab-buttons">
            <button class="tab-btn active" data-tab="questions">题目部分</button>
            <button class="tab-btn" data-tab="answers">答案解析</button>
        </div>
        <div id="questions-tab" class="tab-content active">${qHtml}</div>
        <div id="answers-tab" class="tab-content">${aHtml}</div>
    `;

    // 标准化选项格式
    splitInlineOptionsInElement(container.querySelector('#questions-tab'));
    splitInlineOptionsInElement(container.querySelector('#answers-tab'));

    // 清空输出区域并添加容器
    output.innerHTML = '';
    output.appendChild(container);

    // 绑定标签切换事件
    bindTabEvents(container);

    // 渲染数学公式
    renderMath(container);
    
    // 添加学习友好元素
    addLearningElements(container, difficulty, num);
    
    // 添加学习动机提示
    setTimeout(() => {
        const motivationTip = addMotivationTip();
        output.appendChild(motivationTip);
    }, 1000);
}

// 绑定标签页事件
function bindTabEvents(container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 移除所有活动状态
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // 激活当前标签
            btn.classList.add('active');
            const tab = container.querySelector('#' + btn.dataset.tab + '-tab');
            if (tab) {
                tab.classList.add('active');
                renderMath(tab);
            }
        });
    });
}

// 绑定生成按钮事件
document.getElementById("generateBtn").addEventListener("click", generateQuestions);

// ==================== 错误处理和用户反馈 ====================

// 增强的消息提示系统
function showMessage(message, type = "info", duration = 3000) {
    // 移除之前的消息
    const existingMessages = document.querySelectorAll('.success-message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `success-message message-${type}`;
    messageDiv.innerHTML = message;
    
    // 根据类型设置不同的样式
    switch (type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(135deg, var(--success-warm) 0%, #40C057 100%)';
            break;
        case 'warning':
            messageDiv.style.background = 'linear-gradient(135deg, var(--warning-warm) 0%, #FFD43B 100%)';
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(135deg, var(--primary-warm) 0%, #FF5252 100%)';
            break;
        case 'info':
        default:
            messageDiv.style.background = 'linear-gradient(135deg, var(--info-warm) 0%, #74C0FC 100%)';
            break;
    }
    
    // 插入到输出区域上方
    output.parentNode.insertBefore(messageDiv, output);
    
    // 添加动画效果
    messageDiv.style.animation = 'slideInDown 0.5s ease-out';
    
    // 自动消失
    if (duration > 0) {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutUp 0.3s ease-in';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }
        }, duration);
    }
}

// 显示错误详情
function showErrorDetails(error, context = '') {
    console.error(`错误详情 [${context}]:`, error);
    
    const errorMessage = `
        <div style="text-align: left;">
            <strong>错误信息：</strong><br>
            ${error.message || error}<br><br>
            <strong>建议解决方案：</strong><br>
            • 检查网络连接是否正常<br>
            • 确认API密钥是否正确<br>
            • 稍后重试或联系技术支持
        </div>
    `;
    
    showMessage(errorMessage, 'error', 8000);
}

// 网络错误处理
function handleNetworkError(error) {
    const networkMessages = [
        "🌐 网络连接似乎有问题，请检查你的网络设置",
        "📡 无法连接到AI服务，请稍后重试",
        "🔌 网络超时，请检查网络连接后重试"
    ];
    
    const randomMessage = networkMessages[Math.floor(Math.random() * networkMessages.length)];
    showMessage(randomMessage, 'error', 5000);
}

// API错误处理
function handleApiError(error, apiProvider) {
    let errorMessage = "API调用失败";
    
    if (error.message.includes('401')) {
        errorMessage = "🔑 API密钥无效，请检查你的API密钥设置";
    } else if (error.message.includes('429')) {
        errorMessage = "⏰ API调用频率过高，请稍后重试";
    } else if (error.message.includes('500')) {
        errorMessage = "🔧 服务器内部错误，请稍后重试";
    } else if (error.message.includes('timeout')) {
        errorMessage = "⏱️ 请求超时，请检查网络连接";
    } else {
        errorMessage = `API调用失败：${error.message}`;
    }
    
    showMessage(errorMessage, 'error', 6000);
}

// 数据解析错误处理
function handleParseError(error, dataType) {
    const parseMessages = {
        'json': "📄 JSON格式解析失败，AI返回的数据格式不正确",
        'question': "❓ 题目解析失败，请重新生成题目",
        'answer': "📝 答案解析失败，请检查答案格式"
    };
    
    const message = parseMessages[dataType] || "数据解析失败";
    showMessage(message, 'warning', 4000);
}

// 用户输入验证
function validateUserInput(inputs) {
    const errors = [];
    
    if (!inputs.topic || inputs.topic.trim().length === 0) {
        errors.push("请填写学习主题");
    }
    
    if (inputs.num && (isNaN(inputs.num) || inputs.num < 1 || inputs.num > 10)) {
        errors.push("题目数量必须在1-10之间");
    }
    
    if (inputs.apiKey && inputs.apiKey.length < 10) {
        errors.push("API密钥格式不正确");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// 显示验证错误
function showValidationErrors(errors) {
    const errorMessage = `
        <div style="text-align: left;">
            <strong>请修正以下问题：</strong><br>
            ${errors.map(error => `• ${error}`).join('<br>')}
        </div>
    `;
    
    showMessage(errorMessage, 'warning', 5000);
}

    function buildExportContainer(type) {
      const container = document.createElement('div');
      const questionsTab = document.querySelector('#questions-tab');
      const answersTab = document.querySelector('#answers-tab');

      if (type === "题卷") {
        if (!questionsTab || questionsTab.innerHTML.trim() === '') { alert('请先生成题目！'); return null; }
        container.innerHTML = questionsTab.innerHTML;
      } else if (type === "答案卷") {
        if (!answersTab || answersTab.innerHTML.trim() === '') { alert('请先生成题目！'); return null; }
        container.innerHTML = answersTab.innerHTML;
      } else {
        if (!questionsTab && !answersTab) { alert('请先生成题目！'); return null; }
        container.innerHTML = (questionsTab ? questionsTab.innerHTML : '') + (answersTab ? answersTab.innerHTML : '');
      }

      // 删除 katex 的 MathML 节点以防重复
      Array.from(container.querySelectorAll('.katex .katex-mathml')).forEach(el => el.remove());
      splitInlineOptionsInElement(container);
      renderMath(container);
      return container;
    }

    // PDF 导出功能已移除，导出仅支持 Word

    function exportWord(content, type) {
      const temp = buildExportContainer(type);
      if (!temp) return;

      function createParagraph(text, opts = {}) {
        return new docx.Paragraph({
          children: [new docx.TextRun({ text, size: opts.size || 24, bold: !!opts.bold })],
          spacing: { line: 360, after: 200 },
          alignment: opts.align || undefined
        });
      }

      const children = [];
      const title = document.getElementById("title").value.trim() || "初中测验题";
      children.push(createParagraph(`${title} - ${type}`, { bold: true, size: 32, align: docx.AlignmentType.CENTER }));

  const blocks = temp.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,div.solution-space,strong');
  let lastAddedLine = null;
  const titleParseRegex = /^第\s*(\d+)\s*题解析[:：]?\s*$/;
  blocks.forEach(node => {
        if (node.classList && node.classList.contains('solution-space')) {
          children.push(createParagraph('解题空间：'));
          children.push(createParagraph(''));
          children.push(createParagraph(''));
          return;
        }
        const clone = node.cloneNode(true);
        Array.from(clone.querySelectorAll('.katex .katex-mathml')).forEach(el => el.remove());
        let text = (clone.textContent || '').replace(/\u00A0/g, ' ').trim();
        // 如果是解析标题单独一行，且与上一个相同，则跳过
        const maybeTitle = text.match(titleParseRegex);
        if (maybeTitle) {
          if (lastAddedLine === text) return; // 重复标题，跳过
          lastAddedLine = text;
          // 添加解析标题作为段落（保留）
          children.push(createParagraph(text, { bold: true }));
          return;
        }
        if (!text) return;
        text = text.replace(/([A-D])(?:[.\)])\s*/g, '\n$1. ');
        // 移除块内可能重复的“第X题解析”前缀
        text = text.replace(/^第\s*\d+\s*题解析[:：]?\s*/g, '').trim();
        const lines = text.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
        lines.forEach(line => {
          if (line.match(/^[A-D]\./)) children.push(createParagraph('    ' + line));
          else children.push(createParagraph(line));
        });
      });

      const doc = new docx.Document({ sections: [{ properties: {}, children }] });
      docx.Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI初中测验题_${type}_${new Date().toLocaleDateString()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }).catch(() => alert('Word 导出失败，请检查控制台错误信息'));
    }

    function exportContent(content, type) {
      // 仅支持 Word 导出（PDF 功能已移除）
      exportWord(content, type);
    }

    document.getElementById("exportPaperBtn").addEventListener("click", () => {
      const questionsTab = document.querySelector('#questions-tab');
      if (!questionsTab || questionsTab.innerHTML.trim() === "") { 
        showMessage("💡 请先生成练习题哦！这样你就能保存自己的学习成果了～", "warning");
        return; 
      }
      
      // 显示导出提示
      showMessage("📝 正在为你准备Word文档，请稍候...", "info");
      exportContent("", "题卷");
      
      // 延迟显示成功提示
      setTimeout(() => {
        showMessage("🎉 太棒了！你的练习题已经保存完成，可以分享给朋友们一起学习啦！", "success");
      }, 1000);
    });

    document.getElementById("exportAnswerBtn").addEventListener("click", () => {
      const answersTab = document.querySelector('#answers-tab');
      if (!answersTab || answersTab.innerHTML.trim() === "") { 
        showMessage("💡 请先生成练习题哦！这样你就能查看解题思路了～", "warning");
        return; 
      }
      
      // 显示导出提示
      showMessage("🔍 正在为你准备答案解析，请稍候...", "info");
      exportContent("", "答案卷");
      
      // 延迟显示成功提示
      setTimeout(() => {
        showMessage("✨ 解题秘籍已为你准备好！好好学习，天天向上！", "success");
      }, 1000);
    });