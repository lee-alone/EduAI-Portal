// 导航栏滚动变色
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// 粒子网络系统
class ParticleNetwork {
  constructor() {
    this.canvas = document.getElementById('particleNetworkCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.animationId = null;
    this.particleCount = 80;
    this.maxDistance = 120;
    
    this.init();
  }
  
  init() {
    this.resizeCanvas();
    this.bindEvents();
    this.createParticles();
    this.animate();
  }
  
  resizeCanvas() {
    const heroSection = document.getElementById('heroSection');
    this.canvas.width = heroSection.offsetWidth;
    this.canvas.height = heroSection.offsetHeight;
  }
  
  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // 鼠标移动事件
    document.addEventListener('mousemove', (e) => {
      const heroSection = document.getElementById('heroSection');
      const rect = heroSection.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    
    // 鼠标离开时重置位置
    document.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }
  
  createParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 2,
        opacity: Math.random() * 0.3 + 0.7,
        originalX: 0,
        originalY: 0,
        isMoving: false,
        moveTimer: 0
      });
      
      // 记录原始位置
      const particle = this.particles[i];
      particle.originalX = particle.x;
      particle.originalY = particle.y;
    }
  }
  
  updateParticles() {
    this.particles.forEach(particle => {
      // 计算到鼠标的距离
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 鼠标躲避逻辑
      if (distance < 80) {
        // 鼠标靠近时，粒子快速躲避
        const force = (80 - distance) / 80;
        const angle = Math.atan2(dy, dx);
        
        particle.vx = -Math.cos(angle) * force * 3;
        particle.vy = -Math.sin(angle) * force * 3;
        particle.isMoving = true;
        particle.moveTimer = 0;
      } else {
        // 远离鼠标时，逐渐回到原始位置
        particle.moveTimer++;
        
        if (particle.isMoving && particle.moveTimer > 60) {
          const backDx = particle.originalX - particle.x;
          const backDy = particle.originalY - particle.y;
          const backDistance = Math.sqrt(backDx * backDx + backDy * backDy);
          
          if (backDistance > 5) {
            particle.vx = backDx * 0.02;
            particle.vy = backDy * 0.02;
          } else {
            particle.isMoving = false;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
          }
        } else if (!particle.isMoving) {
          // 正常缓慢移动
          particle.vx += (Math.random() - 0.5) * 0.02;
          particle.vy += (Math.random() - 0.5) * 0.02;
          
          // 限制速度
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          if (speed > 0.8) {
            particle.vx = (particle.vx / speed) * 0.8;
            particle.vy = (particle.vy / speed) * 0.8;
          }
        }
      }
      
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 边界检测
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
      
      // 限制在画布内
      particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
    });
  }
  
  drawConnections() {
    this.particles.forEach((particle, i) => {
      this.particles.slice(i + 1).forEach(otherParticle => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.maxDistance) {
          const opacity = (1 - distance / this.maxDistance) * 0.8;
          
          this.ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(otherParticle.x, otherParticle.y);
          this.ctx.stroke();
        }
      });
    });
  }
  
  drawParticles() {
    this.particles.forEach((particle, index) => {
      // 根据粒子索引分配不同的科技感颜色
      const colors = [
        { main: 'rgba(0, 255, 255, 1)', glow: 'rgba(0, 255, 255, 0.8)', outer: 'rgba(0, 255, 255, 0.4)' }, // 青色 - 数据流
        { main: 'rgba(0, 255, 127, 1)', glow: 'rgba(0, 255, 127, 0.8)', outer: 'rgba(0, 255, 127, 0.4)' }, // 春绿色 - 能量
        { main: 'rgba(255, 0, 255, 1)', glow: 'rgba(255, 0, 255, 0.8)', outer: 'rgba(255, 0, 255, 0.4)' }, // 洋红色 - 信号
        { main: 'rgba(255, 255, 0, 1)', glow: 'rgba(255, 255, 0, 0.8)', outer: 'rgba(255, 255, 0, 0.4)' }  // 黄色 - 智能
      ];
      const colorSet = colors[index % 4];
      
      // 绘制粒子发光效果 - 使用科技感颜色
      this.ctx.shadowColor = colorSet.glow;
      this.ctx.shadowBlur = 15;
      
      // 粒子主体 - 使用高显色
      this.ctx.fillStyle = colorSet.main.replace('1)', `${particle.opacity})`);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 粒子中心亮点 - 更亮的中心
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 添加外层光晕 - 使用对应颜色的光晕
      this.ctx.shadowColor = colorSet.outer;
      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = colorSet.outer.replace('0.4)', `${particle.opacity * 0.3})`);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.updateParticles();
    this.drawConnections();
    this.drawParticles();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// 模块卡片滚动加载动画
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.card').forEach(card => observer.observe(card));

// 滚动管理器已移除 - 使用静态布局

// DOM缓存管理器 - 避免重复查询
const DOMCache = {
  elements: new Map(),
  get(id) {
    if (!this.elements.has(id)) {
      this.elements.set(id, document.getElementById(id));
    }
    return this.elements.get(id);
  },
  query(selector) {
    if (!this.elements.has(selector)) {
      this.elements.set(selector, document.querySelector(selector));
    }
    return this.elements.get(selector);
  }
};

// 调试信息 - 帮助诊断布局问题
function debugLayout() {
  const singleRow = document.querySelector('.single-row');
  const container = document.querySelector('.single-row-container');
  
  if (singleRow) {
    const computedStyle = window.getComputedStyle(singleRow);
    console.log('🔍 布局调试信息:');
    console.log('屏幕宽度:', window.innerWidth);
    console.log('视口宽度:', document.documentElement.clientWidth);
    console.log('Flex Direction:', computedStyle.flexDirection);
    console.log('Display:', computedStyle.display);
    console.log('Container宽度:', container ? container.offsetWidth : 'N/A');
    console.log('Row宽度:', singleRow.offsetWidth);
    console.log('模块数量:', document.querySelectorAll('.module-item').length);
    
    // 检查是否在移动端模式
    if (computedStyle.flexDirection === 'column') {
      console.warn('⚠️ 检测到垂直布局 - 可能是移动端模式被意外触发');
    } else {
      console.log('✅ 水平布局正常');
    }
  }
}

// 缓存检测和CSS版本检查
function checkCacheAndVersion() {
  console.log('🔍 缓存和版本检测:');
  console.log('当前时间:', new Date().toLocaleString());
  console.log('页面URL:', window.location.href);
  
  // 检查CSS文件加载时间
  const cssLink = document.querySelector('link[href*="style.css"]');
  if (cssLink) {
    console.log('CSS文件URL:', cssLink.href);
    
    // 尝试获取CSS文件的最后修改时间
    fetch(cssLink.href, { method: 'HEAD' })
      .then(response => {
        const lastModified = response.headers.get('last-modified');
        const cacheControl = response.headers.get('cache-control');
        const etag = response.headers.get('etag');
        
        console.log('CSS最后修改时间:', lastModified);
        console.log('缓存控制:', cacheControl);
        console.log('ETag:', etag);
        
        if (lastModified) {
          const cssDate = new Date(lastModified);
          const now = new Date();
          const diffHours = (now - cssDate) / (1000 * 60 * 60);
          console.log('CSS文件年龄:', Math.round(diffHours * 100) / 100, '小时');
          
          if (diffHours > 1) {
            console.warn('⚠️ CSS文件可能被缓存，建议清除Cloudflare缓存');
          }
        }
      })
      .catch(err => console.log('无法获取CSS文件信息:', err));
  }
  
  // 检查是否有我们的新样式规则
  const testElement = document.createElement('div');
  testElement.className = 'single-row';
  testElement.style.cssText = 'display: flex; flex-direction: row;';
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  const hasNewRules = computedStyle.flexDirection === 'row';
  
  console.log('新CSS规则是否生效:', hasNewRules ? '✅ 是' : '❌ 否');
  
  document.body.removeChild(testElement);
  
  if (!hasNewRules) {
    console.warn('⚠️ 检测到CSS可能未更新，建议：');
    console.warn('1. 清除Cloudflare缓存');
    console.warn('2. 等待几分钟后重试');
    console.warn('3. 检查CSS文件是否包含新的媒体查询规则');
  }
}

// 初始化粒子网络系统
let particleNetwork;

// 处理"开始探索"按钮点击
function handleExploreButtonClick() {
  // 滚动到模块区域
  const modulesSection = document.getElementById('modules');
  if (modulesSection) {
    modulesSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 初始化粒子网络系统
  if (DOMCache.get('particleNetworkCanvas')) {
    particleNetwork = new ParticleNetwork();
  }
  
  // 绑定"开始探索"按钮事件
  const exploreButton = document.querySelector('.hero .btn');
  if (exploreButton) {
    exploreButton.addEventListener('click', (e) => {
      e.preventDefault();
      handleExploreButtonClick();
    });
  }
  
  // 延迟执行调试，确保CSS完全加载
  setTimeout(() => {
    debugLayout();
    checkCacheAndVersion();
  }, 1000);
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    setTimeout(debugLayout, 100);
  });
});
