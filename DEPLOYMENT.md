# 部署指南

本项目支持多种部署方式，包括GitHub Pages和Cloudflare Pages。

## GitHub Pages 部署

### 1. 创建GitHub仓库
1. 在GitHub上创建一个新仓库
2. 将代码推送到仓库

### 2. 启用GitHub Pages
1. 进入仓库的 Settings 页面
2. 滚动到 "Pages" 部分
3. 在 "Source" 下选择 "Deploy from a branch"
4. 选择 "main" 分支和 "/ (root)" 文件夹
5. 点击 "Save"

### 3. 访问网站
部署完成后，网站将在以下地址可用：
`https://your-username.github.io/EduAI-Portal/`

## Cloudflare Pages 部署

### 1. 连接GitHub仓库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Pages" 部分
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 授权并选择你的GitHub仓库

### 2. 配置构建设置
- **Framework preset**: None (静态站点)
- **Build command**: (留空)
- **Build output directory**: / (根目录)
- **Root directory**: / (根目录)

### 3. 部署
1. 点击 "Save and Deploy"
2. Cloudflare将自动构建和部署你的网站

### 4. 自定义域名（可选）
1. 在项目设置中添加自定义域名
2. 配置DNS记录

## 本地开发

### 使用Python服务器
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### 使用Node.js服务器
```bash
# 安装serve
npm install -g serve

# 启动服务器
serve -s . -l 8000
```

### 使用Live Server (VS Code)
1. 安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## 注意事项

1. **相对路径**：项目使用相对路径，确保在子目录中正常工作
2. **API密钥**：默认使用内置API密钥，生产环境建议配置自己的密钥
3. **HTTPS**：部署后自动支持HTTPS
4. **缓存**：静态资源已配置长期缓存，更新后可能需要清除浏览器缓存

## 故障排除

### 常见问题
1. **页面空白**：检查浏览器控制台是否有JavaScript错误
2. **样式丢失**：确保CSS文件路径正确
3. **API调用失败**：检查网络连接和API密钥配置

### 调试技巧
1. 使用浏览器开发者工具检查网络请求
2. 查看控制台错误信息
3. 检查文件路径是否正确
