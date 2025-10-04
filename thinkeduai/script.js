    console.log("JavaScript开始执行");
    
    // 检查marked库是否加载
    if (typeof marked === 'undefined') {
      console.error("Marked库未加载，使用备用方案");
    } else {
      console.log("Marked库已加载");
    }
    
    const SYSTEM_PROMPT = `
你是一位具有深厚教育专业背景教学专家。
你的是厦门九中的AI老师。
你熟悉中国教育体系与课程标准，能够针对教师的具体问题，
结合学科特征与教学目标，提供科学、务实且富有启发性的指导。
你的回答应兼具逻辑性、情感温度与教育哲思。

回答格式要求：
1. 当需要展示对比、分析、步骤等结构化信息时，请使用表格格式
2. 使用markdown语法，包括**粗体**、*斜体*、表格等
3. 重要概念用粗体标注
4. 具体步骤或方法可以用编号列表
5. 相关数据、对比信息请用表格呈现

示例表格格式：
| 教学方法 | 适用场景 | 优势 | 注意事项 |
|---------\|---------\|------\|----------| 
| 讨论法 | 概念理解 | 互动性强 | 需要引导 |
| 实验法 | 技能训练 | 实践性强 | 安全第一 |
    `;

    const defaultApiKey = "sk-0560c9a849694436a71c1ef4c053505a";
    
    // 对话历史管理
    let conversationHistory = [];
    
    console.log("变量初始化完成");

    function displayUserMessage(message) {
      const conversationContainer = document.getElementById("conversationContainer");
      if (!conversationContainer) {
        createConversationContainer();
      }
      
      const messageDiv = document.createElement("div");
      messageDiv.className = "message user-message";
      messageDiv.innerHTML = `
        <div class="message-content">
          <div class="message-text">${message}</div>
        </div>
      `;
      
      document.getElementById("conversationContainer").appendChild(messageDiv);
      scrollToBottom();
    }

    function createAIMessageContainer() {
      const conversationContainer = document.getElementById("conversationContainer");
      const messageDiv = document.createElement("div");
      messageDiv.className = "message ai-message";
      messageDiv.innerHTML = `
        <div class="message-content">
          <div class="message-text" id="aiMessage-${Date.now()}"></div>
          <button class="copy-message-btn" onclick="copyMessage(this)" title="复制此条消息">📋</button>
        </div>
      `;
      
      conversationContainer.appendChild(messageDiv);
      scrollToBottom();
      return messageDiv;
    }

    function displayAIMessage(message) {
      const messageDiv = createAIMessageContainer();
      const messageText = messageDiv.querySelector(".message-text");
      
      // 使用打字机效果显示AI回复，完成后隐藏加载状态
      typeWriterEffect(messageText, message, 30, hideLoading);
    }

    function displayErrorMessage(message) {
      const conversationContainer = document.getElementById("conversationContainer");
      const messageDiv = document.createElement("div");
      messageDiv.className = "message error-message";
      messageDiv.innerHTML = `
        <div class="message-content">
          <div class="message-text">${message}</div>
        </div>
      `;
      
      conversationContainer.appendChild(messageDiv);
      scrollToBottom();
      hideLoading();
    }

    function createConversationContainer() {
      const responseBox = document.getElementById("response");
      responseBox.innerHTML = `
        <div id="conversationContainer" class="conversation-container"></div>
        <div class="conversation-actions">
          <button class="clear-conversation-btn" onclick="clearConversation()" title="清空对话历史">🗑️ 清空对话</button>
        </div>
      `;
      responseBox.classList.remove("hidden");
    }

    function scrollToBottom() {
      const container = document.getElementById("conversationContainer");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }

    function clearConversation() {
      conversationHistory = [];
      const conversationContainer = document.getElementById("conversationContainer");
      if (conversationContainer) {
        conversationContainer.innerHTML = "";
      }
    }

    function copyMessage(button) {
      const messageText = button.parentElement.querySelector(".message-text");
      const textContent = messageText.textContent || messageText.innerText;
      
      navigator.clipboard.writeText(textContent).then(() => {
        button.textContent = "✅";
        setTimeout(() => {
          button.textContent = "📋";
        }, 2000);
      }).catch(err => {
        console.error("复制失败:", err);
        button.textContent = "❌";
        setTimeout(() => {
          button.textContent = "📋";
        }, 2000);
      });
    }

    function toggleAdvanced() {
      const content = document.getElementById("advancedContent");
      const toggleBtn = document.querySelector(".advanced-toggle");
      const settingsContainer = document.querySelector(".advanced-settings");
      
      if (content.style.display === "none" || content.style.display === "") {
        // 展开时设置容器宽度为100%
        settingsContainer.style.width = "100%";
        content.style.display = "block";
        content.classList.add("show");
        toggleBtn.textContent = "收起高级设置 ▴";
      } else {
        // 收起时恢复自动宽度
        content.classList.remove("show");
        setTimeout(() => {
          content.style.display = "none";
          settingsContainer.style.width = "auto";
        }, 300);
        toggleBtn.textContent = "展开高级设置 ▾";
      }
    }

    function showStreamingLoading(messageElement) {
      const buttonText = document.getElementById("buttonText");
      const button = document.querySelector(".primary-button");
      
      if (buttonText) {
        buttonText.innerHTML = '<span class="loading"></span>🤔 AI正在思考...';
      }
      if (button) {
        button.disabled = true;
      }
      
      // 在消息元素中显示思考动画
      messageElement.innerHTML = `
        <div class="thinking-animation">
          <span class="thinking-dot"></span>
          <span class="thinking-dot"></span>
          <span class="thinking-dot"></span>
          <span class="thinking-text">🤔 正在为您整理思路...</span>
        </div>
      `;
    }

    function showLoading() {
      console.log("showLoading函数被调用");
      
      const buttonText = document.getElementById("buttonText");
      const responseBox = document.getElementById("response");
      const responseContent = document.getElementById("responseContent");
      const button = document.querySelector(".primary-button");
      
      console.log("找到的元素:", { buttonText, responseBox, responseContent, button });
      
      if (buttonText) {
        buttonText.innerHTML = '<span class="loading"></span>🤔 正在思考...';
      }
      if (button) {
        button.disabled = true;
      }
      if (responseBox) {
        responseBox.classList.remove("hidden");
      }
      if (responseContent) {
        responseContent.innerHTML = "<div class='warm-loading'>🌱 请稍候，AI 正在为您整理思路...</div>";
        responseBox.classList.add("show");
      }
      
      console.log("showLoading完成");
    }

    function hideLoading() {
      const buttonText = document.getElementById("buttonText");
      const button = document.querySelector(".primary-button");
      
      buttonText.innerHTML = '🚀 发送';
      button.disabled = false;
    }

    // 处理流式响应
    async function handleStreamResponse(response, messageElement) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // 流结束，添加到对话历史
                conversationHistory.push({ role: "assistant", content: fullContent });
                hideLoading();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  // 实时更新显示
                  updateStreamingMessage(messageElement, fullContent);
                  scrollToBottom();
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } catch (error) {
        console.error('流式响应错误:', error);
        // 降级到非流式模式
        await fallbackToNonStreaming(messageElement);
      }
    }
    
    // 更新流式消息显示
    function updateStreamingMessage(element, content) {
      if (typeof marked !== 'undefined') {
        element.innerHTML = marked.parse(content) + '<span class="cursor-blink">|</span>';
      } else {
        element.innerHTML = formatMessage(content) + '<span class="cursor-blink">|</span>';
      }
    }
    
    // 降级到非流式模式
    async function fallbackToNonStreaming(messageElement) {
      try {
        // 重新发送非流式请求
        const model = document.getElementById("model").value;
        const apiKey = document.getElementById("apiKey").value || defaultApiKey;
        const customPrompt = document.getElementById("customPrompt").value.trim();
        const finalPrompt = SYSTEM_PROMPT + (customPrompt ? "\n请特别注意以下要求：" + customPrompt : "");
        
        const messages = [
          { role: "system", content: finalPrompt },
          ...conversationHistory
        ];
        
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.8,
            max_tokens: 2000
          })
        });
        
        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content || "抱歉，AI暂时无法生成回复，请稍后重试。";
        
        conversationHistory.push({ role: "assistant", content: answer });
        typeWriterEffect(messageElement, answer, 30, hideLoading);
        
      } catch (error) {
        messageElement.innerHTML = '抱歉，发生了错误，请稍后重试。';
        hideLoading();
      }
    }
    
    function typeWriterEffect(element, text, speed = 30, onComplete = null) {
      element.innerHTML = "";
      let i = 0;
      const timer = setInterval(() => {
        const partialText = text.substring(0, i + 1);
        // 使用marked库解析，如果未加载则使用纯文本
        if (typeof marked !== 'undefined') {
          element.innerHTML = marked.parse(partialText);
        } else {
          element.innerHTML = formatMessage(partialText);
        }
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          if (onComplete) {
            onComplete();
          }
        }
      }, speed);
    }
    
    // 格式化消息函数
    function formatMessage(text) {
      return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\|(.*?)\|/g, function(match, content) {
          // 简单表格处理
          const rows = content.split('\n').filter(row => row.trim());
          if (rows.length > 1) {
            let table = '<table class="ai-table">';
            rows.forEach((row, index) => {
              const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
              if (cells.length > 0) {
                table += '<tr>';
                cells.forEach(cell => {
                  table += index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
                });
                table += '</tr>';
              }
            });
            table += '</table>';
            return table;
          }
          return match;
        });
    }

    function copyResponse() {
      const responseContent = document.getElementById("responseContent");
      const copyButton = document.querySelector(".copy-button");
      
      // 获取纯文本内容
      const textContent = responseContent.textContent || responseContent.innerText;
      
      // 复制到剪贴板
      navigator.clipboard.writeText(textContent).then(() => {
        copyButton.textContent = "✅ 已复制";
        copyButton.classList.add("copied");
        
        setTimeout(() => {
          copyButton.textContent = "📋 复制";
          copyButton.classList.remove("copied");
        }, 2000);
      }).catch(err => {
        console.error("复制失败:", err);
        // 降级方案：使用传统方法
        const textArea = document.createElement("textarea");
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        
        copyButton.textContent = "✅ 已复制";
        copyButton.classList.add("copied");
        
        setTimeout(() => {
          copyButton.textContent = "📋 复制";
          copyButton.classList.remove("copied");
        }, 2000);
      });
    }

    async function sendMessage() {
      console.log("sendMessage函数被调用");
      
      const userInput = document.getElementById("userInput").value.trim();
      console.log("用户输入:", userInput);
      
      const responseBox = document.getElementById("response");
      const responseContent = document.getElementById("responseContent");
      const model = document.getElementById("model").value;
      const apiKey = document.getElementById("apiKey").value || defaultApiKey;
      const customPrompt = document.getElementById("customPrompt").value.trim();

      console.log("获取到的值:", { model, apiKey: apiKey.substring(0, 10) + "...", customPrompt });

      if (!userInput) {
        console.log("用户输入为空");
        responseBox.classList.remove("hidden");
        responseContent.innerHTML = "<div class='gentle-reminder'>😊 请先输入您想要探讨的教育问题</div>";
        return;
      }

      // 添加用户消息到对话历史
      conversationHistory.push({ role: "user", content: userInput });
      
      // 显示用户消息
      displayUserMessage(userInput);
      
      // 清空输入框
      document.getElementById("userInput").value = "";

      // 创建AI消息容器并开始流式显示
      const aiMessageDiv = createAIMessageContainer();
      const messageTextElement = aiMessageDiv.querySelector('.message-text');
      
      showStreamingLoading(messageTextElement);

      const finalPrompt = SYSTEM_PROMPT + (customPrompt ? "\n请特别注意以下要求：" + customPrompt : "");

      try {
        // 构建消息数组，包含系统提示和对话历史
        const messages = [
          { role: "system", content: finalPrompt },
          ...conversationHistory
        ];

        console.log("发送API请求:", {
          model: model,
          apiKey: apiKey.substring(0, 10) + "...",
          messageCount: messages.length
        });

        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.8,
            max_tokens: 2000,
            stream: true  // 启用流式输出
          })
        });

        console.log("API响应状态:", res.status);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`API错误 (${res.status}): ${errorData.error?.message || res.statusText}`);
        }
        
        // 处理流式响应
        await handleStreamResponse(res, messageTextElement);
        
      } catch (err) {
        console.error("API调用错误:", err);
        displayErrorMessage(`请求失败: ${err.message}。请检查网络连接或API配置。`);
      }
    }

    // AI粒子效果系统
    class ParticleSystem {
      constructor() {
        this.leftContainer = document.getElementById('particlesLeft');
        this.rightContainer = document.getElementById('particlesRight');
        this.particles = [];
        this.init();
      }
      
      init() {
        // 初始化粒子
        this.createParticles();
        // 定期创建新粒子（更频繁）
        setInterval(() => this.createParticles(), 1500);
        // 清理过期粒子
        setInterval(() => this.cleanupParticles(), 3000);
        // 添加随机粒子爆发效果
        setInterval(() => this.createBurstParticles(), 4000);
      }
      
      createParticles() {
        // 左侧粒子（更多数量）
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            this.createParticle(this.leftContainer, 'left');
          }, i * 400);
        }
        
        // 右侧粒子（更多数量）
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            this.createParticle(this.rightContainer, 'right');
          }, i * 600);
        }
      }
      
      createParticle(container, side) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机选择粒子类型（更多颜色）
        const types = [
          'particle-data',
          'particle-neural',
          'particle-thought',
          'particle-energy',
          'particle-signal',
          'particle-smart'
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        particle.classList.add(type);
        
        // 随机位置
        const startX = Math.random() * (container.offsetWidth - 10);
        particle.style.left = startX + 'px';
        
        // 随机延迟
        const delay = Math.random() * 3;
        particle.style.animationDelay = delay + 's';
        
        // 随机持续时间（上升效果）
        const duration = 8 + Math.random() * 6;
        particle.style.animationDuration = duration + 's';
        
        // 随机水平偏移和旋转速度
        const randomOffset = (Math.random() - 0.5) * 80;
        const randomRotation = Math.random() * 360;
        particle.style.setProperty('--random-x', randomOffset + 'px');
        particle.style.transform = `rotate(${randomRotation}deg)`;
        
        container.appendChild(particle);
        this.particles.push({
          element: particle,
          createdAt: Date.now()
        });
      }
      
      cleanupParticles() {
        const now = Date.now();
        this.particles = this.particles.filter(particle => {
          if (now - particle.createdAt > 12000) { // 12秒后清理
            if (particle.element.parentNode) {
              particle.element.parentNode.removeChild(particle.element);
            }
            return false;
          }
          return true;
        });
      }
      
      // 粒子爆发效果
      createBurstParticles() {
        // 随机选择一侧创建爆发效果
        const container = Math.random() > 0.5 ? this.leftContainer : this.rightContainer;
        const side = container === this.leftContainer ? 'left' : 'right';
        
        // 快速创建多个粒子
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            this.createParticle(container, side);
          }, i * 100);
        }
      }
    }
    
    // 初始化粒子系统
    let particleSystem;
    
    // 页面加载完成后添加事件监听器
    document.addEventListener("DOMContentLoaded", function() {
      console.log("DOM加载完成，添加事件监听器");
      
      // 初始化粒子效果
      particleSystem = new ParticleSystem();
      
      // 添加回车键发送功能
      const userInput = document.getElementById("userInput");
      if (userInput) {
        userInput.addEventListener("keydown", function(event) {
          if (event.key === "Enter" && event.ctrlKey) {
            console.log("Ctrl+Enter被按下");
            sendMessage();
          }
        });

        // 添加输入框焦点效果
        userInput.addEventListener("focus", function() {
          this.parentElement.classList.add("focused");
        });

        userInput.addEventListener("blur", function() {
          this.parentElement.classList.remove("focused");
        });

        // 自动调整textarea高度
        userInput.addEventListener("input", function() {
          this.style.height = "auto";
          this.style.height = Math.min(this.scrollHeight, 120) + "px";
        });
        
        console.log("事件监听器添加完成");
      } else {
        console.error("找不到userInput元素");
      }
    });
    
    // 测试函数
    window.testFunction = function() {
      console.log("测试函数被调用");
      alert("JavaScript正常工作！");
    };
