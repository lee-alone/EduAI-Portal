# 厦门市第九中学温馨班会记录助手

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Educational-green.svg)
![Platform](https://img.shields.io/badge/platform-Web-orange.svg)

**用心记录每一次成长时光** 🧡

[快速开始](#快速开始) • [功能特性](#功能特性) • [使用指南](#使用指南) • [技术文档](#技术文档)

</div>

## 📋 项目概述

厦门市第九中学温馨班会记录助手是一个专为中学教师设计的Web应用系统，旨在简化主题班会课记录表的创建流程，提高教学工作效率。系统采用现代化Web技术栈，结合AI智能生成和本地模板双重保障，为教师提供便捷、专业的班会记录生成服务。

### 🎯 设计理念

- **教育温度**：采用温暖的橙色系设计，体现教育的温度与人文关怀
- **专业规范**：严格按照厦门市第九中学标准格式生成记录表
- **智能高效**：集成AI技术，快速生成高质量的班会记录内容
- **用户友好**：简洁直观的界面设计，降低使用门槛

## ✨ 功能特性

### 🚀 核心功能

- **智能内容生成**
  - 集成DeepSeek AI API，基于先进大语言模型
  - 本地模板备用机制，确保服务稳定性
  - 年级自适应内容生成，符合不同学段特点

- **完整记录结构**
  - 基本信息录入（时间、班级、班主任、主持人、主题）
  - 三维教育目标（认知、能力、情感目标）
  - 详细过程内容（6个完整环节设计）
  - 收获反思（学生收获与教师反思）

- **多格式导出**
  - HTML格式导出，保持完整样式
  - Word文档导出，便于打印存档
  - 剪贴板复制，快速分享使用

- **个性化定制**
  - 特殊要求输入，满足个性化需求
  - 实时预览功能，所见即所得
  - 灵活的内容调整机制

### 🎨 界面特色

- **橙色系主题**：温暖的渐变色彩设计
- **响应式布局**：适配桌面和移动设备
- **毛玻璃效果**：现代化的视觉体验
- **交互动画**：流畅的用户交互反馈

## 🛠️ 技术架构

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | HTML5 | - | 语义化标记结构 |
| 样式层 | CSS3 | - | 响应式布局与动画 |
| 交互层 | JavaScript ES6+ | - | 现代JavaScript特性 |
| AI服务 | DeepSeek API | v1 | 智能内容生成 |
| 图标库 | Font Awesome | 6.0.0 | 矢量图标资源 |

### 项目结构

```
class-meetings/
├── index.html              # 主页面文件
├── styles.css              # 样式表文件
├── script.js               # 核心功能脚本
├── ds密钥.txt              # API密钥配置
└── README.md               # 项目文档
```

### 核心模块

#### ClassMeetingGenerator 类

```javascript
class ClassMeetingGenerator {
    // 核心功能模块
    - initializeElements()     // 元素初始化
    - bindEvents()            // 事件绑定
    - validateInputs()        // 输入验证
    - generateClassMeeting()  // 生成班会记录
    - generateLocalTemplate() // 本地模板生成
    - callDeepSeekAPI()       // API调用
    - updatePreview()         // 预览更新
    - copyContent()           // 内容复制
    - downloadWordDocument()  // Word导出
}
```

## 🚀 快速开始

### 环境要求

- **浏览器**：Chrome 80+、Firefox 75+、Safari 13+、Edge 80+
- **网络**：需要互联网连接（用于AI API调用）
- **分辨率**：支持1024x768及以上分辨率

### 安装步骤

1. **获取项目文件**
   ```bash
   # 下载或克隆项目到本地
   git clone [repository-url]
   cd class-meetings
   ```

2. **启动应用**
   ```bash
   # 直接在浏览器中打开
   open index.html
   # 或使用本地服务器（推荐）
   python -m http.server 8000
   # 然后访问 http://localhost:8000
   ```

3. **配置API密钥**（可选）
   - 访问 [DeepSeek官网](https://deepseek.com) 注册账号
   - 申请API访问权限并获取密钥
   - 在应用界面输入API密钥

### 快速体验

1. 填写基本信息（时间、班级、班主任等）
2. 输入班会主题
3. 点击"生成班会记录"按钮
4. 查看预览结果
5. 导出或复制使用

## 📖 使用指南

### 详细操作流程

#### 1. 基本信息填写

| 字段 | 说明 | 示例 | 必填 |
|------|------|------|------|
| 时间 | 班会举行的具体时间 | 2024-01-15 14:30 | ✅ |
| 班级 | 班级名称 | 高一(3)班 | ✅ |
| 班主任 | 班主任姓名 | 张老师 | ✅ |
| 主持人 | 班会主持人 | 李同学 | ✅ |
| 主题 | 班会主题内容 | 心理健康教育 | ✅ |

#### 2. 个性化定制

在"特殊要求"文本框中可以输入：
- 重点关注的学生表现
- 特定的教育重点
- 互动环节的特殊要求
- 其他个性化需求

#### 3. API密钥配置

- **有密钥**：享受AI智能生成的高质量内容
- **无密钥**：自动使用本地模板，确保功能可用

#### 4. 生成与导出

- **生成**：点击按钮后等待10-30秒
- **预览**：在预览区域查看生成结果
- **复制**：一键复制到剪贴板
- **导出**：下载HTML或Word格式文件

### 使用技巧

1. **主题描述技巧**
   - 使用具体明确的主题描述
   - 包含关键的教育要素
   - 避免过于宽泛的表述

2. **个性化定制建议**
   - 描述具体的教育目标
   - 说明特殊的学生群体需求
   - 提出具体的互动形式要求

3. **导出文件使用**
   - HTML文件适合在线查看和分享
   - Word文件适合打印和正式存档
   - 可根据需要选择合适的格式

## 🔧 配置说明

### API配置

#### DeepSeek API设置

```javascript
// API配置示例
const apiConfig = {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 3000
};
```

#### 密钥管理

- **本地配置**：编辑 `ds密钥.txt` 文件
- **界面输入**：在应用界面临时输入
- **安全建议**：不要将密钥提交到版本控制系统

### 本地模板配置

系统内置了针对不同年级的模板：

- **初中阶段**：初一、初二、初三
- **高中阶段**：高一、高二、高三
- **自动识别**：根据班级名称自动匹配年级

## 🐛 故障排除

### 常见问题

#### API相关问题

| 错误代码 | 错误信息 | 解决方案 |
|----------|----------|----------|
| 401 | Unauthorized | 检查API密钥是否正确 |
| 429 | Too Many Requests | 等待后重试或联系API服务商 |
| 500 | Internal Server Error | 稍后重试或使用本地模板 |

#### 功能问题

**Q: 生成的内容质量不满意**
A: 
- 优化主题描述，使其更加具体
- 添加个性化要求指导
- 重新生成获取不同结果
- 手动编辑导出的文件

**Q: 导出的Word文件格式异常**
A:
- 确保使用最新版本的Microsoft Word
- 尝试用WPS Office等替代软件打开
- 检查浏览器是否支持文件下载功能

**Q: 页面显示异常**
A:
- 清除浏览器缓存和Cookie
- 检查JavaScript是否被禁用
- 尝试使用其他浏览器
- 确保网络连接正常

### 调试模式

开启浏览器开发者工具查看详细错误信息：

```javascript
// 控制台调试命令
console.log('当前生成内容:', generator.generatedContent);
console.log('API响应状态:', response.status);
```

## 📚 API文档

### DeepSeek API集成

#### 请求格式

```javascript
const requestData = {
    model: 'deepseek-chat',
    messages: [
        {
            role: 'system',
            content: '你是一个专业的班会记录生成助手...'
        },
        {
            role: 'user',
            content: '根据以下输入变量生成班会记录...'
        }
    ],
    temperature: 0.7,
    max_tokens: 3000
};
```

#### 响应处理

```javascript
const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestData)
});

const data = await response.json();
const generatedContent = data.choices[0].message.content;
```

### 本地模板API

```javascript
// 模板生成函数
generateLocalTemplate(formData) {
    const goals = this.generateEducationGoals(formData.className, formData.topic_2025);
    const process = this.generateProcessContent(formData.hostName, formData.teacher_info, formData.topic_2025);
    const reflection = this.generateReflection(formData.teacher_info, formData.topic_2025);
    // 返回完整的HTML模板
}
```

## 🧪 测试指南

### 功能测试

#### 基础功能测试

1. **输入验证测试**
   - 测试必填字段验证
   - 测试输入格式验证
   - 测试边界值处理

2. **生成功能测试**
   - 测试API生成模式
   - 测试本地模板模式
   - 测试错误处理机制

3. **导出功能测试**
   - 测试HTML导出
   - 测试Word导出
   - 测试复制功能

#### 兼容性测试

| 浏览器 | 版本 | 状态 | 备注 |
|--------|------|------|------|
| Chrome | 80+ | ✅ 完全支持 | 推荐使用 |
| Firefox | 75+ | ✅ 完全支持 | 良好支持 |
| Safari | 13+ | ✅ 完全支持 | 良好支持 |
| Edge | 80+ | ✅ 完全支持 | 良好支持 |

### 性能测试

- **加载时间**：首次加载 < 3秒
- **生成时间**：API生成 < 30秒
- **文件大小**：导出文件 < 2MB

## 🤝 贡献指南

### 开发规范

#### 代码风格

```javascript
// 使用现代JavaScript特性
class ClassMeetingGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }
    
    // 使用箭头函数
    generateClassMeeting = async () => {
        // 实现逻辑
    };
}
```

#### 提交规范

```bash
# 提交信息格式
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug"
git commit -m "docs: 更新文档"
git commit -m "style: 代码格式调整"
```

### 功能扩展

#### 添加新模板

1. 在 `generateEducationGoals()` 中添加年级模板
2. 更新 `extractGradeLevel()` 的识别逻辑
3. 测试新模板的生成效果

#### 集成新API

1. 实现新的API调用方法
2. 添加错误处理机制
3. 更新用户界面提示

## 📄 许可证

本项目采用教育用途许可证，仅供厦门市第九中学内部使用。

### 使用条款

- ✅ **允许**：校内教学使用
- ✅ **允许**：教育研究使用
- ✅ **允许**：功能改进建议
- ❌ **禁止**：商业用途
- ❌ **禁止**：二次分发
- ❌ **禁止**：逆向工程

## 📞 支持与联系

### 技术支持

- **学校官网**：[厦门市第九中学](http://www.xm9z.com)
- **技术支持**：信息技术部门
- **问题反馈**：通过学校内部渠道

### 更新日志

#### v2.0.0 (2024-01-15)
- 🎨 全新橙色系UI设计
- 🚀 新增Word文档导出功能
- 🎯 个性化定制功能
- 📱 响应式布局优化
- 🐛 修复多个已知问题

#### v1.0.0 (2023-12-01)
- ✨ 初始版本发布
- 🤖 AI智能生成功能
- 📋 完整记录表结构
- 💾 HTML导出功能

---

<div align="center">

**厦门市第九中学制** • **用心记录每一次成长时光** 🧡

*让教育充满温度，让技术服务教学*

</div>