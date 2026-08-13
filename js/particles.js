'use strict';

(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.querySelector('#particle-background')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'particle-background';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    canvas.remove();
    return;
  }

  const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
  const pointer = { active: false, x: 0, y: 0 };
  let particles = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frameId = 0;
  let lastTime = performance.now();
  let particleColor = '#555';
  let dotOpacity = 0.42;
  let lineOpacity = 0.16;
  const linkDistance = 132;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function particleCount() {
    const areaCount = Math.floor((width * height) / 18000);
    if (width < 640) return Math.max(28, Math.min(48, areaCount));
    return Math.max(42, Math.min(96, areaCount));
  }

  function createParticle() {
    return {
      x: random(0, width),
      y: random(0, height),
      radius: random(0.9, 1.9),
      vx: random(-9, 9),
      vy: random(-9, 9)
    };
  }

  function refreshPalette() {
    const styles = getComputedStyle(document.documentElement);
    particleColor = styles.getPropertyValue('--text-color').trim() || (darkMode.matches ? '#ddd' : '#555');
    dotOpacity = darkMode.matches ? 0.5 : 0.42;
    lineOpacity = darkMode.matches ? 0.2 : 0.16;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const targetCount = particleCount();
    if (particles.length > targetCount) particles.length = targetCount;
    while (particles.length < targetCount) particles.push(createParticle());
    refreshPalette();
  }

  function updateParticle(particle, seconds) {
    particle.x += particle.vx * seconds;
    particle.y += particle.vy * seconds;

    if (pointer.active) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared > 0 && distanceSquared < 10000) {
        const distance = Math.sqrt(distanceSquared);
        const force = (1 - distance / 100) * 24 * seconds;
        particle.x += (dx / distance) * force;
        particle.y += (dy / distance) * force;
      }
    }

    if (particle.x < -4) particle.x = width + 4;
    if (particle.x > width + 4) particle.x = -4;
    if (particle.y < -4) particle.y = height + 4;
    if (particle.y > height + 4) particle.y = -4;
  }

  function drawParticle(particle) {
    context.globalAlpha = dotOpacity;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawLinks() {
    const maxDistanceSquared = linkDistance * linkDistance;
    context.lineWidth = 0.8;
    for (let index = 0; index < particles.length; index += 1) {
      const first = particles[index];
      for (let next = index + 1; next < particles.length; next += 1) {
        const second = particles[next];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared >= maxDistanceSquared) continue;
        const distance = Math.sqrt(distanceSquared);
        context.globalAlpha = lineOpacity * (1 - distance / linkDistance);
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.stroke();
      }
    }
  }

  function render(time) {
    const seconds = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    context.clearRect(0, 0, width, height);
    context.fillStyle = particleColor;
    context.strokeStyle = particleColor;
    particles.forEach(particle => updateParticle(particle, seconds));
    drawLinks();
    particles.forEach(drawParticle);
    context.globalAlpha = 1;
    frameId = window.requestAnimationFrame(render);
  }

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(resize);
  }, { passive: true });

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer.active = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (!frameId) {
      lastTime = performance.now();
      frameId = window.requestAnimationFrame(render);
    }
  });

  darkMode.addEventListener('change', refreshPalette);
  resize();
  frameId = window.requestAnimationFrame(render);
})();
