    const output = document.getElementById("output");

    function detectSubjectType(title, topic) {
      const text = (title + ' ' + topic).toLowerCase();
      const scienceKeywords = ['数学', '物理', '化学', '生物', '几何', '代数', '函数', '方程', '计算', '公式', '定理', '证明', '实验', '元素', '分子', '细胞', '基因'];
      const liberalKeywords = ['语文', '英语', '历史', '地理', '政治', '道德', '阅读', '写作', '作文', '古诗', '文言文', '语法', '词汇', '朝代', '事件', '人物', '地理', '气候', '地形'];
      const scienceCount = scienceKeywords.filter(k => text.includes(k)).length;
      const liberalCount = liberalKeywords.filter(k => text.includes(k)).length;
      return scienceCount > liberalCount ? '理科' : '文科';
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

    document.getElementById("generateBtn").addEventListener("click", async () => {
      const title = document.getElementById("title").value.trim() || "初中测验题";
      const topic = document.getElementById("topic").value.trim();
      const type = document.getElementById("type").value;
      const difficulty = document.getElementById("difficulty").value;
      const num = document.getElementById("num").value;
      const model = document.getElementById("model").value;
      const apiKey = document.getElementById("apiKey").value.trim() || "sk-0560c9a849694436a71c1ef4c053505a";
      const customPrompt = document.getElementById("customPrompt").value.trim();

      if (!topic) {
        showMessage("💡 请先告诉我你想学习什么知识点哦！这样AI才能为你量身定制练习题～", "warning");
        return;
      }

      // 显示温暖的加载提示
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

      // 添加按钮状态
      const btn = document.getElementById("generateBtn");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="loading"></span> 正在生成中...';
      btn.disabled = true;

      const subjectType = detectSubjectType(title, topic);

      const userPrompt = `【试卷科目】：${title}
【知识点】：${topic}
【学科类型】：${subjectType}
【题型】：${type}
【难度】：${difficulty}
【数量】：${num}题
【个性化补充】：${customPrompt || "无"}
请按系统指令输出一个 JSON。`;

      let apiUrl = "https://api.deepseek.com/v1/chat/completions";
      if (model === "glm-4") apiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
      else if (model === "qwen-turbo") apiUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

      try {
        const payload = {
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        };

        const data = await callModel(apiUrl, apiKey, payload);
        const text = data.choices?.[0]?.message?.content?.trim?.() || data.result || data.output?.[0]?.content || '';

        const json = extractJsonFromText(text);

        let questionsMd = '', answersMd = '';
        if (json && (json.questions || json.answers || json.questions_markdown || json.answers_markdown)) {
          questionsMd = json.questions || json.questions_markdown || '';
          answersMd = json.answers || json.answers_markdown || '';
        } else {
          // 回退：如果未返回 JSON，则当作 Markdown 全文，尝试用分割关键词分离
          const fullHtml = marked.parse(text || '');
          let splitIndex = -1;
          const lower = (text || '').toLowerCase();
          const markers = ['## 参考答案', '## 答案', '参考答案', '答案：', '答案部分'];
          for (const m of markers) {
            const idx = fullHtml.indexOf(m);
            if (idx !== -1) { splitIndex = idx; break; }
          }
          if (splitIndex !== -1) {
            questionsMd = marked.parse(text).slice(0, splitIndex);
            answersMd = fullHtml.slice(splitIndex);
            // fallback to raw markdown split if needed:
            const raw = text || '';
            const rx = /(?:##\s*参考答案|##\s*答案|参考答案|答案：)/i;
            const match = raw.match(rx);
            if (match) {
              questionsMd = marked.parse(raw.slice(0, raw.indexOf(match[0])));
              answersMd = marked.parse(raw.slice(raw.indexOf(match[0])));
            } else {
              questionsMd = fullHtml;
              answersMd = '';
            }
          } else {
            // 最后回退：全部放题目
            questionsMd = marked.parse(text || '');
            answersMd = '';
          }
        }

        // 如果从 JSON 得到的是 Markdown 字符串，先转 HTML
        const qHtml = marked.parse(questionsMd || '');
        const aHtml = marked.parse(answersMd || '');

        // 构建简洁标签页
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
        // 标准化选项（DOM 处理）
        splitInlineOptionsInElement(container.querySelector('#questions-tab'));
        splitInlineOptionsInElement(container.querySelector('#answers-tab'));

        output.innerHTML = '';
        output.appendChild(container);

        // 绑定标签切换
        container.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tab = container.querySelector('#' + btn.dataset.tab + '-tab');
            if (tab) tab.classList.add('active');
            renderMath(tab || container);
          });
        });

        // 渲染公式
        renderMath(container);
        
        // 恢复按钮状态
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // 显示成功提示
        showMessage("🎉 太棒了！你的专属练习题已经生成完成，开始你的学习之旅吧！", "success");
        
      } catch (err) {
        // 恢复按钮状态
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // 显示温暖的错误提示
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
            <p class="text-gray-500 mb-4">错误信息：${err.message || err}</p>
            <button onclick="location.reload()" class="btn">
              🔄 重新开始
            </button>
          </div>
        `;
      }
    });

    // 添加消息提示函数
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