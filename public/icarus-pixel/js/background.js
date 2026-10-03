// ─── Stars & Nebulae ──────────────────────────────────────────
function initStars(w, h) {
  stars = [];
  STAR_LAYERS.forEach((layer, li) => {
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: layer.size + Math.random() * 0.5,
        speed: layer.speed,
        alpha: layer.alpha * (0.6 + Math.random() * 0.4),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.8 + Math.random() * 1.5,
        layer: li,
      });
    }
  });

  nebulae = [];
  // Main prominent cosmic circle in the background
  const mainR = Math.min(w, h) * (0.30 + Math.random() * 0.10);
  nebulae.push({
    x: w * 0.5 + (Math.random() - 0.5) * w * 0.25,
    y: h * 0.5 + (Math.random() - 0.5) * h * 0.25,
    baseRx: mainR,
    baseRy: mainR,
    rx: mainR,
    ry: mainR,
    curColor: [...currentBgTheme.circle],
    fromColor: [...currentBgTheme.circle],
    targetColor: [...currentBgTheme.circle],
    alpha: 0.12 + Math.random() * 0.04,
    speed: 3 + Math.random() * 3,
    isMainCircle: true,
  });

  // Secondary drifting clouds of the theme
  for (let i = 1; i < 5; i++) {
    const r = 110 + Math.random() * 160;
    const col = currentBgTheme.nebulae[i % currentBgTheme.nebulae.length];
    nebulae.push({
      x: Math.random() * w,
      y: Math.random() * h,
      baseRx: r,
      baseRy: r * (0.7 + Math.random() * 0.4),
      rx: r,
      ry: r * (0.7 + Math.random() * 0.4),
      curColor: [...col],
      fromColor: [...col],
      targetColor: [...col],
      alpha: 0.04 + Math.random() * 0.04,
      speed: 5 + Math.random() * 6,
      isMainCircle: false,
    });
  }
}

function updateStars(dt, w, h) {
  const t = performance.now() / 1000;
  // Speed multiplier for "warp" effect at high levels
  const speedMult = diffLevel >= 5 ? 1 + (diffLevel - 5) * 0.12 : 1;
  stars.forEach(s => {
    s.y += s.speed * dt * speedMult;
    if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
    s.currentAlpha = s.alpha * (0.7 + 0.3 * Math.sin(t * s.twinkleSpeed + s.twinklePhase));
  });
  nebulae.forEach(n => {
    n.y += n.speed * dt;
    if (n.y - n.ry > h) { n.y = -n.ry; n.x = Math.random() * w; }
  });

  // Smooth theme transition animation
  if (themeTransition.active) {
    themeTransition.timer += dt;
    const p = Math.min(1, themeTransition.timer / themeTransition.duration);
    // Smooth easeInOut cosine curve
    const ease = 0.5 - 0.5 * Math.cos(p * Math.PI);

    // Interpolate background color
    curBg[0] = Math.round(fromBg[0] + (targetBg[0] - fromBg[0]) * ease);
    curBg[1] = Math.round(fromBg[1] + (targetBg[1] - fromBg[1]) * ease);
    curBg[2] = Math.round(fromBg[2] + (targetBg[2] - fromBg[2]) * ease);
    currentBgColor = `rgb(${curBg[0]},${curBg[1]},${curBg[2]})`;

    // Interpolate nebulae colors and breathe the main circle
    nebulae.forEach(n => {
      n.curColor[0] = Math.round(n.fromColor[0] + (n.targetColor[0] - n.fromColor[0]) * ease);
      n.curColor[1] = Math.round(n.fromColor[1] + (n.targetColor[1] - n.fromColor[1]) * ease);
      n.curColor[2] = Math.round(n.fromColor[2] + (n.targetColor[2] - n.fromColor[2]) * ease);

      if (n.isMainCircle) {
        const pulse = 1 + Math.sin(p * Math.PI) * 0.18;
        n.rx = n.baseRx * pulse;
        n.ry = n.baseRy * pulse;
      }
    });

    if (p >= 1) {
      themeTransition.active = false;
      nebulae.forEach(n => {
        n.rx = n.baseRx;
        n.ry = n.baseRy;
      });
    }
  }
}

function drawStars(ctx, w, h) {
  // Nebulae
  nebulae.forEach(n => {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.scale(1, n.ry / n.rx);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
    const colStr = `rgba(${n.curColor[0]},${n.curColor[1]},${n.curColor[2]},`;
    grd.addColorStop(0, colStr + n.alpha + ')');
    grd.addColorStop(0.5, colStr + (n.alpha * 0.4) + ')');
    grd.addColorStop(1, colStr + '0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Speed streaks at high levels
  if (diffLevel >= 5) {
    const streakAlpha = Math.min((diffLevel - 4) * 0.03, 0.18);
    ctx.strokeStyle = `rgba(100, 200, 255, ${streakAlpha})`;
    ctx.lineWidth = 1;
    stars.filter(s => s.layer === 2).forEach(s => {
      const streakLen = (diffLevel - 4) * 8 + 10;
      ctx.globalAlpha = s.currentAlpha * 0.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y - streakLen);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // Stars
  stars.forEach(s => {
    ctx.globalAlpha = s.currentAlpha;
    ctx.fillStyle = '#fff';
    if (s.size > 2) {
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      ctx.globalAlpha = s.currentAlpha * 0.3;
      ctx.fillRect(s.x - s.size, s.y - 0.5, s.size * 2, 1);
      ctx.fillRect(s.x - 0.5, s.y - s.size, 1, s.size * 2);
    } else {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  });
  ctx.globalAlpha = 1;

  // Smooth theme transition visual effects & sector announcement
  if (themeTransition.active) {
    const p = Math.min(1, themeTransition.timer / themeTransition.duration);
    ctx.save();

    // Cosmic shockwave ring expanding from screen center
    const maxR = Math.hypot(w, h) * 0.75;
    const ringR = p * maxR;
    const ringAlpha = Math.sin(p * Math.PI) * 0.35;
    ctx.strokeStyle = `rgba(${targetBg[0] + 120}, ${targetBg[1] + 120}, ${targetBg[2] + 120}, ${ringAlpha})`;
    ctx.lineWidth = 4 * (1 - p * 0.5);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle atmospheric light flash
    const flashAlpha = Math.sin(p * Math.PI) * 0.12;
    ctx.fillStyle = `rgba(${targetBg[0] * 4 + 30}, ${targetBg[1] * 4 + 30}, ${targetBg[2] * 4 + 30}, ${flashAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // On-screen sector banner
    const textAlpha = Math.sin(p * Math.PI);
    if (textAlpha > 0.05) {
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Sector level subtitle
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
      ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(`★ СЕКТОР ${diffLevel} ★`, w / 2, h * 0.28);

      // Theme name title
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = `rgb(${targetBg[0] + 160}, ${targetBg[1] + 160}, ${targetBg[2] + 160})`;
      ctx.shadowBlur = 18;
      ctx.fillText(themeTransition.sectorName.toUpperCase(), w / 2, h * 0.28 + 22);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

