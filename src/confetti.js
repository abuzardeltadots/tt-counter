export function fireConfetti(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#ff6b35','#00d4ff','#ffd700','#ff5050','#50ff50','#ff50ff'];
  const particles = Array.from({length:120}, () => ({
    x: canvas.width/2+(Math.random()-.5)*100, y: canvas.height/2,
    vx: (Math.random()-.5)*16, vy: -Math.random()*18-4,
    size: Math.random()*8+3, color: colors[Math.floor(Math.random()*colors.length)],
    rotation: Math.random()*360, rotSpeed: (Math.random()-.5)*12, life: 1
  }));
  (function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = false;
    particles.forEach(p => {
      if (p.life<=0) return; alive=true;
      p.x+=p.vx; p.vy+=.4; p.y+=p.vy; p.rotation+=p.rotSpeed; p.life-=.012;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rotation*Math.PI/180);
      ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color;
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6); ctx.restore();
    });
    if (alive) requestAnimationFrame(animate);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  })();
}
