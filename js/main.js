// 初始化粒子效果
particlesJS('particles-js', {
  particles: {
    number: { value: window.innerWidth < 768 ? 40 : 80, density: { enable: true, value_area: 800 } },
    color: { value: '#ffffff' },
    shape: { type: 'circle' },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
    move: { enable: true, speed: 2, random: true }
  },
  interactivity: {
    detect_on: 'canvas',
    events: { onhover: { enable: true, mode: 'repulse' } },
    modes: { repulse: { distance: 100, duration: 0.4 } }
  }
});

// 导航栏滚动变色
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// 模块卡片滚动加载动画
const cards = document.querySelectorAll('.card');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

cards.forEach(card => observer.observe(card));
