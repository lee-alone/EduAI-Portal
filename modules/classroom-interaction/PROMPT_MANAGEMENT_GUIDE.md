# AI提示词统一管理指南

## 📋 概述

本指南介绍了AI智能课堂分析模块中提示词（prompts）的规范化管理方案，解决了原有系统中提示词分散、重复、难以维护的问题。

## 🔍 原有问题

### 1. 提示词管理分散
- `AIAnalyzer.js` 中的 `buildAIPrompt()` 方法
- `main.js` 中的 `buildAIPrompt()` 方法
- `prompts.js` 中的多个模板方法
- 新旧两套系统并存

### 2. 重复代码
- 多处重复的提示词构建逻辑
- 相似的数据格式化代码
- 缺乏统一的配置管理

### 3. 维护困难
- 修改提示词需要改动多个文件
- 缺乏统一的配置入口
- 难以进行批量更新

## 🎯 解决方案

### 核心组件

#### 1. PromptManager.js - 统一提示词管理器
```javascript
// 主要功能
- 统一的提示词生成接口
- 模板引擎支持
- 配置化管理
- 数据格式化

// 主要方法
- getOverallAnalysisPrompt(data)     // 班级整体分析
- getStudentAnalysisPrompt(students) // 学生个别分析
- getFullAnalysisPrompt(data)        // 完整分析
- getCustomAnalysisPrompt(...)       // 自定义分析
```

#### 2. PromptConfig.js - 配置管理器
```javascript
// 主要功能
- 输出格式配置
- 分析深度配置
- 模板配置
- 预设模板管理

// 配置项
- outputFormat: 输出格式设置
- analysisDepth: 分析深度控制
- templates: 模板配置
- presets: 预设模板
```

## 🚀 使用方法

### 1. 基本使用

```javascript
// 创建PromptManager实例
const promptManager = new PromptManager();

// 生成班级整体分析提示词
const overallPrompt = promptManager.getOverallAnalysisPrompt({
    totalRecords: 100,
    matchedRecords: 95,
    activeStudents: 30,
    totalClassSize: 35,
    inactiveStudents: 5,
    subjects: ['数学', '物理'],
    matchRate: 95,
    inactiveStudentNames: ['张三', '李四']
});

// 生成学生个别分析提示词
const studentPrompt = promptManager.getStudentAnalysisPrompt(students);

// 生成完整分析提示词
const fullPrompt = promptManager.getFullAnalysisPrompt(data);
```

### 2. 配置管理

```javascript
// 创建配置管理器
const config = new PromptConfig();

// 获取当前配置
const currentConfig = config.getConfig();

// 更新输出格式
config.setOutputFormat({
    useHTML: true,
    maxLength: 250,
    minLength: 180
});

// 更新分析深度
config.setAnalysisDepth({
    includeTrends: true,
    includeSubjects: true,
    includeDaily: false
});

// 添加自定义预设
config.addPreset('customStyle', {
    tone: '专业严谨',
    focus: '学科表现',
    style: '分析为主',
    template: '自定义模板内容'
});
```

### 3. 在现有代码中集成

#### AIAnalyzer.js 中的使用
```javascript
class AIAnalyzer {
    constructor(apiConfigManager) {
        this.apiConfigManager = apiConfigManager;
        this.promptManager = new PromptManager();  // 新增
        this.init();
    }
    
    async callAIAnalysis(integratedData, summary) {
        // 使用统一的提示词管理器
        const prompt = this.promptManager.getFullAnalysisPrompt(promptData);
        const aiResult = await this.callAIAnalysisWithPrompt(prompt);
        // ...
    }
}
```

#### main.js 中的使用
```javascript
buildAIPrompt(customPrompt, pointsData, pointsLog) {
    // 使用统一的PromptManager
    if (!this.promptManager) {
        this.promptManager = new PromptManager();
    }
    
    return this.promptManager.getCustomAnalysisPrompt(customPrompt, pointsData, pointsLog);
}
```

## 📁 文件结构

```
js/features/ai-analysis/
├── PromptManager.js      # 统一提示词管理器
├── PromptConfig.js       # 配置管理器
├── prompts.js           # 原有模板（保留兼容性）
├── AIAnalyzer.js        # AI分析器（已更新）
└── ...
```

## 🔄 迁移步骤

### 1. 引入新文件
在 `index.html` 中添加：
```html
<script src="js/features/ai-analysis/PromptManager.js"></script>
<script src="js/features/ai-analysis/PromptConfig.js"></script>
```

### 2. 更新现有代码
- 在 `AIAnalyzer.js` 中添加 `PromptManager` 实例
- 在 `main.js` 中使用统一的提示词生成方法
- 逐步替换原有的 `PromptTemplates` 调用

### 3. 配置优化
- 根据实际需求调整 `PromptConfig.js` 中的配置
- 设置合适的输出格式和分析深度
- 添加自定义预设模板

## ⚙️ 配置选项详解

### 输出格式配置 (outputFormat)
```javascript
{
    useHTML: false,           // 是否使用HTML格式
    useAnnotations: true,     // 是否使用学生标注格式
    maxLength: 200,          // 每个学生评价最大长度
    minLength: 150,          // 每个学生评价最小长度
    includeExamples: true    // 是否包含示例格式
}
```

### 分析深度配置 (analysisDepth)
```javascript
{
    includeTrends: true,     // 包含学习趋势
    includeSubjects: true,    // 包含学科分析
    includeDaily: true,       // 包含每日表现
    includePatterns: true,   // 包含表现模式
    includeInactiveStudents: true  // 包含未活跃学生分析
}
```

### 模板配置 (templates)
```javascript
{
    overallAnalysis: {
        minWordCount: 800,    // 最小字数要求
        requiredSections: [  // 必需的分析部分
            '课堂参与度分析',
            '学科表现分布',
            '学习氛围评价',
            '整体学习状态',
            '教学建议',
            '个性化关注'
        ]
    },
    studentAnalysis: {
        wordCountRange: [150, 200],  // 字数范围
        requiredElements: [          // 必需的评价要素
            '学习积极性',
            '表现特点',
            '建议鼓励',
            '关注问题'
        ]
    }
}
```

## 🎨 预设模板

### 班主任风格
```javascript
{
    tone: '亲切关怀',
    focus: '学生成长',
    style: '鼓励为主',
    template: '以班主任的口吻，对学生的课堂表现进行总结和鼓励。分析学生的学习状态，提供个性化的建议和鼓励。'
}
```

### 学科老师风格
```javascript
{
    tone: '专业严谨',
    focus: '学科表现',
    style: '分析为主',
    template: '以学科老师的角度，重点分析学生在各学科的表现情况，提供针对性的学习建议。'
}
```

### 数据分析风格
```javascript
{
    tone: '客观理性',
    focus: '数据统计',
    style: '分析为主',
    template: '基于数据统计，客观分析学生的课堂表现和学习状态，提供数据驱动的教学建议。'
}
```

## 🔧 高级功能

### 1. 自定义模板引擎
PromptManager 内置了简单的模板引擎，支持：
- 变量替换：`{{variable}}`
- 条件判断：`{{#if condition}}...{{/if}}`
- 循环遍历：`{{#each array}}...{{/each}}`

### 2. 动态配置更新
```javascript
// 运行时更新配置
promptManager.updateConfig({
    outputFormat: {
        useHTML: true,
        maxLength: 300
    }
});
```

### 3. 批量模板管理
```javascript
// 获取所有预设
const presets = config.getPresetNames();

// 批量更新模板配置
config.setTemplateConfig('overallAnalysis', {
    minWordCount: 1000,
    requiredSections: ['新增分析部分']
});
```

## 📊 性能优化

### 1. 模板缓存
- 模板在初始化时预编译
- 避免重复的字符串拼接
- 减少运行时计算开销

### 2. 配置复用
- 配置对象复用，避免重复创建
- 深拷贝确保配置隔离
- 支持配置继承和覆盖

### 3. 内存优化
- 及时清理临时数据
- 避免循环引用
- 合理使用对象池

## 🧪 测试建议

### 1. 单元测试
```javascript
// 测试提示词生成
const prompt = promptManager.getOverallAnalysisPrompt(testData);
assert(prompt.includes('班级整体学情分析'));

// 测试配置更新
config.setOutputFormat({ maxLength: 300 });
assert(config.getOutputFormat().maxLength === 300);
```

### 2. 集成测试
- 测试与现有AI分析流程的兼容性
- 验证不同配置下的输出格式
- 检查性能影响

### 3. 用户测试
- 收集用户对新的提示词格式的反馈
- 测试不同预设模板的效果
- 验证配置的易用性

## 🚨 注意事项

### 1. 向后兼容
- 保留原有的 `prompts.js` 文件
- 逐步迁移，避免破坏现有功能
- 提供迁移工具和文档

### 2. 错误处理
- 配置验证和错误提示
- 模板渲染失败的处理
- 数据格式不匹配的容错

### 3. 性能考虑
- 大型数据集的处理优化
- 内存使用监控
- 渲染性能测试

## 📈 未来扩展

### 1. 可视化配置界面
- 图形化配置编辑器
- 实时预览功能
- 配置模板导入导出

### 2. 智能提示词优化
- 基于历史数据的模板优化
- 自动调整提示词长度
- 个性化模板推荐

### 3. 多语言支持
- 国际化模板
- 本地化配置
- 多语言提示词生成

## 📞 技术支持

如有问题或建议，请参考：
- 代码注释和文档
- 测试用例示例
- 配置示例文件
- 社区讨论和反馈

---

*本指南将随着系统更新持续维护，请关注最新版本。*
