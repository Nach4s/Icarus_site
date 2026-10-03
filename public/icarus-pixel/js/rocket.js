// ─── Rocket ───────────────────────────────────────────────────
function createRocket(w, h) {
  return {
    x: w / 2,
    y: h / 2,
    w: 28,
    h: 44,
    vx: 0,          // current velocity px/s
    vy: 0,
    thrusterPhase: 0,
    alive: true,
    invincible: 0,
    trailPoints: [],
    controlsInverted: false,
    eventInvertAxis: null,
  };
}

/* ─── Movement direction tracking ────────────────────────────
   Stores smoothed pixel velocity for rocket rendering            */
let rocketMvx = 0, rocketMvy = 0;
let rocketAngle = 0;  // smoothly interpolated display angle

// ─── Multi-layer animated flame ───────────────────────────────
// angleRad: direction the flame EXITS (π/2 = downward by default)
function drawRocketFlame(ctx, x, y, thrusterPhase, scale, angleRad) {
  const S = scale;
  const t = thrusterPhase;
  const ang = (angleRad !== undefined) ? angleRad : Math.PI / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang - Math.PI / 2);

  const baseY = 18 * S;
  const flameL = (30 + Math.sin(t * 14) * 9 + Math.cos(t * 9.3) * 5) * S;
  const flameW = (11 + Math.sin(t * 11) * 2.5) * S;

  // Outer diffuse glow
  const glow1 = ctx.createRadialGradient(0, baseY + flameL * 0.3, 0, 0, baseY + flameL * 0.3, flameL * 0.9);
  glow1.addColorStop(0, 'rgba(60, 130, 255, 0.22)');
  glow1.addColorStop(0.5, 'rgba(30,  80, 220, 0.08)');
  glow1.addColorStop(1, 'rgba(0,   40, 180, 0)');
  ctx.fillStyle = glow1;
  ctx.beginPath();
  ctx.ellipse(0, baseY + flameL * 0.38, flameL * 0.65, flameL * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mid cyan/blue flame body
  const midGrd = ctx.createLinearGradient(0, baseY, 0, baseY + flameL);
  midGrd.addColorStop(0, 'rgba(130, 225, 255, 0.92)');
  midGrd.addColorStop(0.35, 'rgba(60,  160, 255, 0.82)');
  midGrd.addColorStop(0.7, 'rgba(20,   80, 240, 0.50)');
  midGrd.addColorStop(1, 'rgba(0,    40, 200, 0)');
  ctx.fillStyle = midGrd;
  const waver = Math.sin(t * 13) * 2.2 * S;
  ctx.beginPath();
  ctx.moveTo(-flameW / 2, baseY);
  ctx.quadraticCurveTo(-flameW * 0.28 + waver, baseY + flameL * 0.6, 0, baseY + flameL);
  ctx.quadraticCurveTo(flameW * 0.28 - waver, baseY + flameL * 0.6, flameW / 2, baseY);
  ctx.closePath();
  ctx.fill();

  // Inner hot white-cyan core
  const coreW = flameW * 0.36;
  const coreL = flameL * 0.52;
  const coreGrd = ctx.createLinearGradient(0, baseY, 0, baseY + coreL);
  coreGrd.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  coreGrd.addColorStop(0.25, 'rgba(200, 245, 255, 0.95)');
  coreGrd.addColorStop(0.6, 'rgba(100, 200, 255, 0.70)');
  coreGrd.addColorStop(1, 'rgba(50,  140, 255, 0)');
  ctx.fillStyle = coreGrd;
  ctx.beginPath();
  ctx.moveTo(-coreW / 2, baseY);
  ctx.quadraticCurveTo(0, baseY + coreL * 1.1, coreW / 2, baseY);
  ctx.closePath();
  ctx.fill();

  // Nozzle ring glow
  const nozzleGrd = ctx.createRadialGradient(0, baseY, 0, 0, baseY, flameW * 0.75);
  nozzleGrd.addColorStop(0, 'rgba(210, 245, 255, 0.85)');
  nozzleGrd.addColorStop(0.5, 'rgba(80,  190, 255, 0.35)');
  nozzleGrd.addColorStop(1, 'rgba(40,  110, 255, 0)');
  ctx.fillStyle = nozzleGrd;
  ctx.beginPath();
  ctx.arc(0, baseY, flameW * 0.75, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Rocket Multi-Skin Rendering System ────────────────────────
function drawRocketPixelArt(ctx, x, y, thrusterPhase, scale = 1, mvx = 0, mvy = 0, precomputedAngle) {
  drawRocketSkin(ctx, selectedSkin, x, y, thrusterPhase, scale, mvx, mvy, precomputedAngle);
}

function drawRocketSkin(ctx, skinId, x, y, thrusterPhase, scale = 1, mvx = 0, mvy = 0, precomputedAngle) {
  const S = scale;
  const t = thrusterPhase;

  let angle = 0;
  if (precomputedAngle !== undefined) {
    angle = precomputedAngle;
  } else {
    const speed = Math.sqrt(mvx * mvx + mvy * mvy);
    if (speed > 5) {
      angle = Math.atan2(mvy, mvx) + Math.PI / 2;
    }
  }

  // Draw custom propulsion / exhaust for the active skin
  drawSkinExhaust(ctx, skinId, x, y, t, S, angle);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Render skin body
  switch (skinId) {
    case 'icarus_wings':
      drawSkinIcarusWings(ctx, t, S);
      break;
    case 'space_shuttle':
    case 'solar_phoenix':
      drawSkinSpaceShuttle(ctx, t, S);
      break;
    case 'void_phantom':
      drawSkinVoidPhantom(ctx, t, S);
      break;
    case 'venator':
    case 'golden_aegis':
      drawSkinVenator(ctx, t, S);
      break;
    case 'cyber_dreadnought':
      drawSkinCyberDreadnought(ctx, t, S);
      break;
    case 'classic':
    default:
      drawSkinClassic(ctx, t, S);
      break;
  }

  // Polarity distortion if controls are inverted near black hole or during axis inversion event
  if (rocket && rocket.alive) {
    if (rocket.controlsInverted) {
      drawInversionAuraOnRocket(ctx, S, 'BOTH');
    } else if (rocket.eventInvertAxis) {
      drawInversionAuraOnRocket(ctx, S, rocket.eventInvertAxis);
    }
  }

  ctx.restore();
}

function drawInversionAuraOnRocket(ctx, S, mode = 'BOTH') {
  const t = performance.now() / 1000;
  ctx.save();

  if (mode === 'X') {
    // Horizontal magnetic polarity indicators (Left/Right inverted)
    const col = `rgba(56, 189, 248, ${0.75 + 0.25 * Math.sin(t * 12)})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6 * S;
    ctx.setLineDash([4 * S, 3 * S]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 * S, 11 * S, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `${Math.round(8 * S)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◀', -19 * S, 0);
    ctx.fillText('▶', 19 * S, 0);

  } else if (mode === 'Y') {
    // Vertical magnetic polarity indicators (Up/Down inverted)
    const col = `rgba(244, 63, 94, ${0.75 + 0.25 * Math.sin(t * 12)})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6 * S;
    ctx.setLineDash([4 * S, 3 * S]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * S, 20 * S, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = `${Math.round(8 * S)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▲', 0, -21 * S);
    ctx.fillText('▼', 0, 21 * S);

  } else {
    // Full inversion (Black hole)
    ctx.strokeStyle = `rgba(217, 70, 239, ${0.7 + 0.3 * Math.sin(t * 12)})`;
    ctx.lineWidth = 1.6 * S;
    ctx.setLineDash([4 * S, 4 * S]);
    ctx.lineDashOffset = -t * 40;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * S, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f472b6';
    ctx.font = `${Math.round(7 * S)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawBoltIcon(ctx, 0, -16 * S, 7 * S, '#f472b6');
    drawBoltIcon(ctx, 0, 16 * S, 7 * S, '#f472b6');
  }

  ctx.restore();
}

// ── Custom Propulsion for Skins ──────────────────────────────
function drawSkinExhaust(ctx, skinId, x, y, t, S, angle) {
  if (skinId === 'classic') {
    drawRocketFlame(ctx, x, y, t, S * 0.78, Math.PI / 2 + angle);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const flameFlicker = 0.8 + 0.2 * Math.sin(t * 22);

  if (skinId === 'icarus_wings') {
    // No engine: just a soft white wake behind the flyer (feathers do the rest)
    const pulse = 0.85 + 0.15 * Math.sin(t * 6);
    const wake = ctx.createRadialGradient(0, 16 * S, 0, 0, 16 * S, 16 * S);
    wake.addColorStop(0, `rgba(255, 255, 255, ${0.16 * pulse})`);
    wake.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = wake;
    ctx.beginPath();
    ctx.ellipse(0, 16 * S, 9 * S, 16 * S, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (skinId === 'space_shuttle' || skinId === 'solar_phoenix') {
    // Space Shuttle Launch Exhaust: Massive twin SRB plumes + SSME rocket flame
    const S_sh = S * 0.78;
    const srbFlameLen = (36 + flameFlicker * 14) * S_sh;

    // Dual SRB solid-fuel plumes (violent white-hot fiery plume columns)
    [-13 * S_sh, 13 * S_sh].forEach(srbX => {
      // Outer fiery flare
      const srbGrd = ctx.createLinearGradient(srbX, 22 * S_sh, srbX, 22 * S_sh + srbFlameLen);
      srbGrd.addColorStop(0, '#ffffff');
      srbGrd.addColorStop(0.15, '#fef08a');
      srbGrd.addColorStop(0.4, '#f97316');
      srbGrd.addColorStop(0.75, '#ea580c');
      srbGrd.addColorStop(1, 'rgba(154, 52, 18, 0)');

      ctx.fillStyle = srbGrd;
      ctx.beginPath();
      ctx.moveTo(srbX - 3.5 * S_sh, 22 * S_sh);
      ctx.quadraticCurveTo(srbX - 6 * S_sh, 22 * S_sh + srbFlameLen * 0.45, srbX, 22 * S_sh + srbFlameLen);
      ctx.quadraticCurveTo(srbX + 6 * S_sh, 22 * S_sh + srbFlameLen * 0.45, srbX + 3.5 * S_sh, 22 * S_sh);
      ctx.closePath();
      ctx.fill();

      // Inner white-hot core
      const coreGrd = ctx.createLinearGradient(srbX, 22 * S_sh, srbX, 22 * S_sh + srbFlameLen * 0.55);
      coreGrd.addColorStop(0, '#ffffff');
      coreGrd.addColorStop(0.5, '#fed7aa');
      coreGrd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrd;
      ctx.beginPath();
      ctx.ellipse(srbX, 22 * S_sh + srbFlameLen * 0.28, 2 * S_sh, srbFlameLen * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Central Orbiter SSME plume (clean blue-white rocket flame)
    const ssmeLen = (20 + flameFlicker * 10) * S_sh;
    const ssmeGrd = ctx.createLinearGradient(0, 16 * S_sh, 0, 16 * S_sh + ssmeLen);
    ssmeGrd.addColorStop(0, '#ffffff');
    ssmeGrd.addColorStop(0.3, '#38bdf8');
    ssmeGrd.addColorStop(0.7, '#0284c7');
    ssmeGrd.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = ssmeGrd;
    ctx.beginPath();
    ctx.moveTo(-3 * S_sh, 16 * S_sh);
    ctx.lineTo(0, 16 * S_sh + ssmeLen);
    ctx.lineTo(3 * S_sh, 16 * S_sh);
    ctx.closePath();
    ctx.fill();

  } else if (skinId === 'void_phantom') {
    const S_vp = S * 0.85; // Slightly reduced scale as requested ("поменьше текстуру чуть чуть")
    // Dual neon void plasma beams
    [-5 * S_vp, 5 * S_vp].forEach((exOff, idx) => {
      const col = idx === 0 ? '#38bdf8' : '#d946ef';
      const beamLen = (24 + flameFlicker * 10) * S_vp;
      const grd = ctx.createLinearGradient(exOff, 12 * S_vp, exOff, 12 * S_vp + beamLen);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.4, col);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(exOff, 12 * S_vp + beamLen * 0.45, 2.5 * S_vp, beamLen * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (skinId === 'venator' || skinId === 'golden_aegis') {
    // Star Wars Venator Ion Propulsion: Triple cyan/blue sublight ion beams (compacted)
    [-4.2 * S, 0, 4.2 * S].forEach((exOff, idx) => {
      const beamLen = ((idx === 1 ? 21 : 18) + flameFlicker * 7) * S;
      const beamW = (idx === 1 ? 2.3 : 1.9) * S;

      // Outer ion dissipation glow
      const grd = ctx.createLinearGradient(exOff, 18 * S, exOff, 18 * S + beamLen);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.2, '#67e8f9');
      grd.addColorStop(0.5, '#00e5ff');
      grd.addColorStop(0.8, '#0284c7');
      grd.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(exOff, 18 * S + beamLen * 0.45, beamW, beamLen * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp high-energy ion core
      const core = ctx.createLinearGradient(exOff, 18 * S, exOff, 18 * S + beamLen * 0.6);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.5, '#a5f3fc');
      core.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(exOff, 18 * S + beamLen * 0.28, beamW * 0.5, beamLen * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Secondary auxiliary engine small jets
    [-6.5 * S, 6.5 * S].forEach(exOff => {
      const secLen = (8 + flameFlicker * 5) * S;
      const grd = ctx.createLinearGradient(exOff, 17 * S, exOff, 17 * S + secLen);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.4, '#00e5ff');
      grd.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(exOff, 17 * S + secLen * 0.4, 1.0 * S, secLen * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (skinId === 'cyber_dreadnought') {
    // Cyber Dreadnought: Twin high-energy cyan quantum ion drives + wingtip stabilization plasma jets
    [-4.2 * S, 4.2 * S].forEach(exOff => {
      const beamLen = (28 + flameFlicker * 10) * S;
      const beamW = 2.6 * S;

      // Outer cyan ion halo
      const grd = ctx.createLinearGradient(exOff, 11 * S, exOff, 11 * S + beamLen);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.2, '#67e8f9');
      grd.addColorStop(0.5, '#00f5ff');
      grd.addColorStop(0.85, '#0891b2');
      grd.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(exOff, 11 * S + beamLen * 0.45, beamW, beamLen * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white-cyan collimated core
      const core = ctx.createLinearGradient(exOff, 11 * S, exOff, 11 * S + beamLen * 0.65);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.4, '#a5f3fc');
      core.addColorStop(1, 'rgba(0, 245, 255, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(exOff, 11 * S + beamLen * 0.3, beamW * 0.45, beamLen * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Wingtip stabilization plasma jets at outer pylons
    [-18 * S, 18 * S].forEach(exOff => {
      const secLen = (12 + flameFlicker * 6) * S;
      const grd = ctx.createLinearGradient(exOff, 16.5 * S, exOff, 16.5 * S + secLen);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.35, '#00f5ff');
      grd.addColorStop(1, 'rgba(0, 245, 255, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(exOff, 16.5 * S + secLen * 0.4, 1.2 * S, secLen * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

// ── SKIN 1: Classic Rocket ────────────────────────────────────
function drawSkinClassic(ctx, t, S) {
  const bH = 24 * S;
  const bW = 10 * S;
  const nH = 14 * S;

  // Engine nozzle
  const nozzleW = 7 * S, nozzleH = 5 * S;
  const nozzleGrd = ctx.createLinearGradient(-nozzleW / 2, bH / 2, nozzleW / 2, bH / 2);
  nozzleGrd.addColorStop(0, '#0d1520');
  nozzleGrd.addColorStop(0.4, '#1a2a40');
  nozzleGrd.addColorStop(1, '#0d1520');
  ctx.fillStyle = nozzleGrd;
  ctx.beginPath();
  ctx.moveTo(-nozzleW / 2, bH / 2);
  ctx.lineTo(-nozzleW / 2 + 1 * S, bH / 2 + nozzleH);
  ctx.lineTo(nozzleW / 2 - 1 * S, bH / 2 + nozzleH);
  ctx.lineTo(nozzleW / 2, bH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 180, 255, 0.6)';
  ctx.lineWidth = 1.2 * S;
  ctx.beginPath();
  ctx.moveTo(-nozzleW / 2, bH / 2);
  ctx.lineTo(nozzleW / 2, bH / 2);
  ctx.stroke();

  // Side fins
  const finTop = bH * 0.1;
  const finBase = bH * 0.5;
  const finOut = (bW / 2 + 8 * S);
  // Left fin
  const leftFinGrd = ctx.createLinearGradient(-bW / 2, 0, -finOut, 0);
  leftFinGrd.addColorStop(0, '#1e3a6a');
  leftFinGrd.addColorStop(1, '#0e1f3a');
  ctx.fillStyle = leftFinGrd;
  ctx.beginPath();
  ctx.moveTo(-bW / 2, finTop);
  ctx.lineTo(-finOut, finBase);
  ctx.lineTo(-bW / 2, finBase);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a5090';
  ctx.lineWidth = 0.8 * S;
  ctx.stroke();
  // Right fin
  const rightFinGrd = ctx.createLinearGradient(bW / 2, 0, finOut, 0);
  rightFinGrd.addColorStop(0, '#1e3a6a');
  rightFinGrd.addColorStop(1, '#0e1f3a');
  ctx.fillStyle = rightFinGrd;
  ctx.beginPath();
  ctx.moveTo(bW / 2, finTop);
  ctx.lineTo(finOut, finBase);
  ctx.lineTo(bW / 2, finBase);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a5090';
  ctx.lineWidth = 0.8 * S;
  ctx.stroke();

  // Main body
  const bodyGrd = ctx.createLinearGradient(-bW / 2, 0, bW / 2, 0);
  bodyGrd.addColorStop(0, '#131f36');
  bodyGrd.addColorStop(0.25, '#22385e');
  bodyGrd.addColorStop(0.5, '#2e4f82');
  bodyGrd.addColorStop(0.75, '#22385e');
  bodyGrd.addColorStop(1, '#131f36');
  ctx.fillStyle = bodyGrd;
  const r = 3 * S;
  ctx.beginPath();
  ctx.moveTo(-bW / 2 + r, -bH / 2);
  ctx.lineTo(bW / 2 - r, -bH / 2);
  ctx.quadraticCurveTo(bW / 2, -bH / 2, bW / 2, -bH / 2 + r);
  ctx.lineTo(bW / 2, bH / 2);
  ctx.lineTo(-bW / 2, bH / 2);
  ctx.lineTo(-bW / 2, -bH / 2 + r);
  ctx.quadraticCurveTo(-bW / 2, -bH / 2, -bW / 2 + r, -bH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 140, 220, 0.4)';
  ctx.lineWidth = 1 * S;
  ctx.stroke();

  // Gold stripes
  ctx.fillStyle = 'rgba(200, 155, 40, 0.75)';
  ctx.fillRect(-bW / 2, -bH / 2 + 8 * S, bW, 1.5 * S);
  ctx.fillRect(-bW / 2, bH / 2 - 8 * S, bW, 1.5 * S);

  // Cockpit window
  const winY = -bH / 2 + 6 * S;
  const winR = 3.5 * S;
  ctx.fillStyle = '#1a3a6a';
  ctx.beginPath();
  ctx.arc(0, winY, winR + 1.5 * S, 0, Math.PI * 2);
  ctx.fill();
  const winGrd = ctx.createRadialGradient(-winR * 0.3, winY - winR * 0.3, 0, 0, winY, winR);
  winGrd.addColorStop(0, 'rgba(160, 230, 255, 0.95)');
  winGrd.addColorStop(0.5, 'rgba(60,  140, 220, 0.80)');
  winGrd.addColorStop(1, 'rgba(20,   60, 160, 0.70)');
  ctx.fillStyle = winGrd;
  ctx.beginPath();
  ctx.arc(0, winY, winR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.arc(-winR * 0.3, winY - winR * 0.3, winR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Nose cone
  const noseGrd = ctx.createLinearGradient(-bW / 2, -bH / 2, bW / 2, -bH / 2);
  noseGrd.addColorStop(0, '#1a3560');
  noseGrd.addColorStop(0.4, '#3070c0');
  noseGrd.addColorStop(0.6, '#4090e0');
  noseGrd.addColorStop(1, '#1a3560');
  ctx.fillStyle = noseGrd;
  ctx.beginPath();
  ctx.moveTo(0, -bH / 2 - nH);
  ctx.lineTo(-bW / 2, -bH / 2);
  ctx.lineTo(bW / 2, -bH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
  ctx.lineWidth = 0.8 * S;
  ctx.stroke();
  const tipGrd = ctx.createRadialGradient(0, -bH / 2 - nH, 0, 0, -bH / 2 - nH, 5 * S);
  tipGrd.addColorStop(0, 'rgba(160, 220, 255, 0.7)');
  tipGrd.addColorStop(1, 'rgba(60,  140, 255, 0)');
  ctx.fillStyle = tipGrd;
  ctx.beginPath();
  ctx.arc(0, -bH / 2 - nH, 5 * S, 0, Math.PI * 2);
  ctx.fill();
}

// Leaf-shaped feather, pointed at both ends (the Icarus logo's feather motif).
// Drawn from its base at (x, y) along angle `ang`; uses the current fill/stroke.
function drawLeafFeather(ctx, x, y, len, wid, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.55, wid, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ── SKIN 2: Wings of Icarus (styled after the Icarus Team logo) ─────
// Top-down view in the logo's style — white silhouette, thin grey outline,
// leaf-shaped feathers: Icarus flies head-first with both wings spread, legs
// trailing, and loose feathers breaking off the wings behind him.
function drawSkinIcarusWings(ctx, t, S) {
  const beat = Math.sin(t * 7);

  // Soft white glow so the silhouette reads on every background
  const aura = ctx.createRadialGradient(0, 0, 4 * S, 0, 0, 32 * S);
  aura.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
  aura.addColorStop(0.6, 'rgba(226, 232, 240, 0.09)');
  aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 32 * S, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.95)';
  ctx.lineWidth = 0.75 * S;
  ctx.lineJoin = 'round';

  // Loose feathers drifting off behind each wing
  const loose = [[8, 5, 5.5], [15, 8, 6], [22, 4, 5], [11, 13, 5], [19, 14, 4.5], [6, 16, 4], [14, 20, 4]];
  [-1, 1].forEach(side => {
    loose.forEach(([lx, ly, len], i) => {
      const drift = Math.sin(t * 2.4 + i * 1.4 + side);
      drawLeafFeather(ctx, (side * lx + drift * 0.7) * S, (ly + drift * 0.8) * S,
        len * S, 1.4 * S, Math.PI / 2 - side * 0.3 + drift * 0.15);
    });
  });

  // ── Wings: right one drawn, left one mirrored; they sweep slightly as they beat ──
  [-1, 1].forEach(side => {
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate(3.5 * S, -9 * S);              // shoulder joint
    ctx.rotate(beat * 0.09);
    ctx.scale(0.9 + 0.1 * Math.cos(t * 7), 1);   // span "breathes" with each beat
    ctx.translate(-3.5 * S, 9 * S);

    // Trailing feathers fanning backwards, longer towards the wing tip
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      drawLeafFeather(ctx, (6 + 19 * k) * S, (-3.5 - 3 * k) * S, (7 + 6 * k) * S, 2 * S, Math.PI / 2 - 0.15 - 0.35 * k);
    }

    // Wing body with the logo's sharp spikes on the leading edge
    ctx.beginPath();
    ctx.moveTo(3.5 * S, -10 * S);                               // shoulder
    ctx.quadraticCurveTo(11 * S, -15 * S, 18 * S, -13.5 * S);
    ctx.lineTo(21 * S, -18 * S);                                // forward spike
    ctx.lineTo(22.5 * S, -12.5 * S);
    ctx.lineTo(29 * S, -10 * S);                                // wing tip
    ctx.lineTo(25 * S, -7 * S);                                 // ragged trailing edge
    ctx.lineTo(21 * S, -6.5 * S);
    ctx.lineTo(18 * S, -4.5 * S);
    ctx.lineTo(14 * S, -5 * S);
    ctx.lineTo(10 * S, -3 * S);
    ctx.lineTo(6.5 * S, -3.5 * S);
    ctx.lineTo(3.5 * S, -5 * S);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // ── Body from above: shoulders, torso, two legs trailing behind ──
  ctx.beginPath();
  ctx.moveTo(0, -12 * S);
  ctx.lineTo(2 * S, -12 * S);
  ctx.quadraticCurveTo(5.5 * S, -11 * S, 5 * S, -8 * S);   // right shoulder
  ctx.lineTo(3.6 * S, -2 * S);
  ctx.lineTo(3.2 * S, 3 * S);                               // right hip
  ctx.lineTo(3.4 * S, 10 * S);
  ctx.lineTo(2.8 * S, 17 * S);
  ctx.lineTo(1.6 * S, 18.6 * S);                            // right foot
  ctx.lineTo(1.2 * S, 10.5 * S);
  ctx.lineTo(0, 5 * S);
  ctx.lineTo(-1.2 * S, 10.5 * S);
  ctx.lineTo(-1.6 * S, 18.6 * S);                           // left foot
  ctx.lineTo(-2.8 * S, 17 * S);
  ctx.lineTo(-3.4 * S, 10 * S);
  ctx.lineTo(-3.2 * S, 3 * S);                              // left hip
  ctx.lineTo(-3.6 * S, -2 * S);
  ctx.lineTo(-5 * S, -8 * S);
  ctx.quadraticCurveTo(-5.5 * S, -11 * S, -2 * S, -12 * S); // left shoulder
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head seen from above: hair covers the back half, swept back by the wind
  ctx.beginPath();
  ctx.arc(0, -15.5 * S, 3.3 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(0, -15.5 * S, 3.3 * S, 0.15, Math.PI - 0.15);
  ctx.quadraticCurveTo(0, -11 * S, 3.3 * S * Math.cos(0.15), -15.5 * S + 3.3 * S * Math.sin(0.15));
  ctx.fill();
  ctx.stroke();
}

// ── SKIN 3: Space Shuttle (Directly based on the user's NASA photo) ──
function drawSkinSpaceShuttle(ctx, t, S) {
  // Rescale Space Shuttle by ~22% so it fits comfortably within player hitbox and obstacle gaps
  S *= 0.78;

  // 1. Central External Tank (ET) - iconic rust-orange foam tank
  const etW = 12.5 * S;
  const etTop = -25 * S;
  const etBottom = 18 * S;
  const etH = etBottom - etTop;

  // External tank gradient: burnt rust-orange with 3D highlight cylinder
  const etGrd = ctx.createLinearGradient(-etW / 2, 0, etW / 2, 0);
  etGrd.addColorStop(0, '#9a3412');
  etGrd.addColorStop(0.18, '#c2410c');
  etGrd.addColorStop(0.48, '#ea580c');
  etGrd.addColorStop(0.78, '#c2410c');
  etGrd.addColorStop(1, '#7c2d12');

  ctx.fillStyle = etGrd;
  ctx.beginPath();
  // Ogive nose cone
  ctx.moveTo(0, etTop);
  ctx.quadraticCurveTo(etW * 0.45, etTop + 4 * S, etW / 2, etTop + 10 * S);
  ctx.lineTo(etW / 2, etBottom - 4 * S);
  // Rounded bottom dome
  ctx.quadraticCurveTo(etW / 2, etBottom, 0, etBottom);
  ctx.quadraticCurveTo(-etW / 2, etBottom, -etW / 2, etBottom - 4 * S);
  ctx.lineTo(-etW / 2, etTop + 10 * S);
  ctx.quadraticCurveTo(-etW * 0.45, etTop + 4 * S, 0, etTop);
  ctx.closePath();
  ctx.fill();

  // ET surface ribs (horizontal insulation texture rings from the photo)
  ctx.strokeStyle = 'rgba(124, 45, 18, 0.45)';
  ctx.lineWidth = 0.8 * S;
  for (let ry = etTop + 12 * S; ry < etBottom - 4 * S; ry += 3.5 * S) {
    ctx.beginPath();
    ctx.moveTo(-etW / 2 + 0.6 * S, ry);
    ctx.lineTo(etW / 2 - 0.6 * S, ry);
    ctx.stroke();
  }

  // Cable tray feedline along tank side
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(-etW / 2 + 1.2 * S, etTop + 10 * S, 1.2 * S, etH - 14 * S);

  // 2. Solid Rocket Boosters (SRBs on Left & Right)
  [-13 * S, 13 * S].forEach(srbX => {
    const srbW = 5.2 * S;
    const srbTop = -22 * S;
    const srbBottom = 20 * S;

    // Booster cylindrical shadow & highlight gradient
    const srbGrd = ctx.createLinearGradient(srbX - srbW / 2, 0, srbX + srbW / 2, 0);
    srbGrd.addColorStop(0, '#cbd5e1');
    srbGrd.addColorStop(0.3, '#f8fafc');
    srbGrd.addColorStop(0.7, '#ffffff');
    srbGrd.addColorStop(1, '#94a3b8');
    ctx.fillStyle = srbGrd;

    // Conical nose cone
    ctx.beginPath();
    ctx.moveTo(srbX, srbTop);
    ctx.lineTo(srbX + srbW / 2, srbTop + 7 * S);
    ctx.lineTo(srbX + srbW / 2, srbBottom);
    // Flared aft skirt
    ctx.lineTo(srbX + srbW * 0.65, srbBottom + 3 * S);
    ctx.lineTo(srbX - srbW * 0.65, srbBottom + 3 * S);
    ctx.lineTo(srbX - srbW / 2, srbBottom);
    ctx.lineTo(srbX - srbW / 2, srbTop + 7 * S);
    ctx.closePath();
    ctx.fill();

    // Black nose tip and aerodynamic stripe
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(srbX, srbTop);
    ctx.lineTo(srbX + srbW * 0.35, srbTop + 3.5 * S);
    ctx.lineTo(srbX - srbW * 0.35, srbTop + 3.5 * S);
    ctx.closePath();
    ctx.fill();

    // Segment field joint rings (as seen in photo)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1 * S;
    [srbTop + 10 * S, srbTop + 17 * S, srbTop + 24 * S, srbTop + 31 * S, srbTop + 38 * S].forEach(yRing => {
      ctx.beginPath();
      ctx.moveTo(srbX - srbW / 2, yRing);
      ctx.lineTo(srbX + srbW / 2, yRing);
      ctx.stroke();
    });

    // SRB Exhaust Nozzle bell
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(srbX - srbW * 0.5, srbBottom + 3 * S);
    ctx.lineTo(srbX - srbW * 0.6, srbBottom + 5.5 * S);
    ctx.lineTo(srbX + srbW * 0.6, srbBottom + 5.5 * S);
    ctx.lineTo(srbX + srbW * 0.5, srbBottom + 3 * S);
    ctx.closePath();
    ctx.fill();
  });

  // Structural attach struts between ET and SRBs
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.4 * S;
  [-1, 1].forEach(side => {
    ctx.beginPath();
    ctx.moveTo(side * etW * 0.45, -12 * S);
    ctx.lineTo(side * 11 * S, -12 * S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(side * etW * 0.45, 14 * S);
    ctx.lineTo(side * 11 * S, 14 * S);
    ctx.stroke();
  });

  // 3. The Orbiter Shuttle (Mounted on front of ET)
  // Delta Wings
  const oWingGrd = ctx.createLinearGradient(-16 * S, 0, 16 * S, 0);
  oWingGrd.addColorStop(0, '#e2e8f0');
  oWingGrd.addColorStop(0.5, '#ffffff');
  oWingGrd.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = oWingGrd;

  ctx.beginPath();
  ctx.moveTo(0, -11 * S);
  // Port wing leading edge
  ctx.lineTo(-7 * S, 0);
  ctx.lineTo(-15 * S, 12 * S);
  ctx.lineTo(-15 * S, 15 * S);
  ctx.lineTo(-4 * S, 15 * S);
  // Starboard wing
  ctx.lineTo(4 * S, 15 * S);
  ctx.lineTo(15 * S, 15 * S);
  ctx.lineTo(15 * S, 12 * S);
  ctx.lineTo(7 * S, 0);
  ctx.closePath();
  ctx.fill();

  // Black thermal tiles on wing leading edges
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8 * S;
  ctx.beginPath();
  ctx.moveTo(-15 * S, 12 * S);
  ctx.lineTo(-7 * S, 0);
  ctx.lineTo(0, -11 * S);
  ctx.lineTo(7 * S, 0);
  ctx.lineTo(15 * S, 12 * S);
  ctx.stroke();

  // Orbiter Fuselage Body
  const fusGrd = ctx.createLinearGradient(-4.5 * S, 0, 4.5 * S, 0);
  fusGrd.addColorStop(0, '#cbd5e1');
  fusGrd.addColorStop(0.3, '#ffffff');
  fusGrd.addColorStop(0.7, '#f8fafc');
  fusGrd.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = fusGrd;

  ctx.beginPath();
  ctx.moveTo(0, -14 * S);
  ctx.quadraticCurveTo(4.5 * S, -10 * S, 4.5 * S, 2 * S);
  ctx.lineTo(4.5 * S, 14 * S);
  ctx.lineTo(-4.5 * S, 14 * S);
  ctx.lineTo(-4.5 * S, 2 * S);
  ctx.quadraticCurveTo(-4.5 * S, -10 * S, 0, -14 * S);
  ctx.closePath();
  ctx.fill();

  // Black Nose Cap (Thermal TPS Tiles)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, -14 * S);
  ctx.quadraticCurveTo(3 * S, -11 * S, 3 * S, -9.5 * S);
  ctx.lineTo(-3 * S, -9.5 * S);
  ctx.quadraticCurveTo(-3 * S, -11 * S, 0, -14 * S);
  ctx.closePath();
  ctx.fill();

  // Cockpit Windows (Dark tinted glass panes with blue glint)
  ctx.fillStyle = '#0284c7';
  // Left windshield
  ctx.beginPath();
  ctx.moveTo(-0.6 * S, -8.5 * S);
  ctx.lineTo(-2.2 * S, -7.5 * S);
  ctx.lineTo(-2.0 * S, -6.6 * S);
  ctx.lineTo(-0.6 * S, -7.2 * S);
  ctx.closePath();
  ctx.fill();
  // Right windshield
  ctx.beginPath();
  ctx.moveTo(0.6 * S, -8.5 * S);
  ctx.lineTo(2.2 * S, -7.5 * S);
  ctx.lineTo(2.0 * S, -6.6 * S);
  ctx.lineTo(0.6 * S, -7.2 * S);
  ctx.closePath();
  ctx.fill();

  // Vertical Tailfin (with black thermal leading edge)
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(-1.2 * S, 14 * S);
  ctx.lineTo(-0.6 * S, 0);
  ctx.lineTo(0.6 * S, 0);
  ctx.lineTo(1.2 * S, 14 * S);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.0 * S;
  ctx.stroke();

  // Three SSME Rocket Nozzles (Space Shuttle Main Engines)
  ctx.fillStyle = '#334155';
  [-2.2 * S, 2.2 * S].forEach(nx => {
    ctx.beginPath();
    ctx.arc(nx, 15.5 * S, 1.8 * S, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(0, 13 * S, 1.8 * S, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkinSolarPhoenix(ctx, t, S) {
  drawSkinSpaceShuttle(ctx, t, S);
}

// ── SKIN 4: Void Phantom ──────────────────────────────────────
function drawSkinVoidPhantom(ctx, t, S) {
  // Slightly reduced scale as requested ("поменьше текстуру чуть чуть")
  S *= 0.85;

  // Crystal neon blades
  [-1, 1].forEach(side => {
    ctx.save();
    ctx.scale(side, 1);

    const cGrd = ctx.createLinearGradient(0, 0, 24 * S, 0);
    cGrd.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
    cGrd.addColorStop(0.7, '#00e5ff');
    cGrd.addColorStop(1, '#d946ef');
    ctx.fillStyle = cGrd;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.3 * S;

    ctx.beginPath();
    ctx.moveTo(4 * S, -14 * S);
    ctx.lineTo(26 * S, 8 * S);   // razor crystal wing
    ctx.lineTo(18 * S, 11 * S);
    ctx.lineTo(23 * S, 17 * S);  // secondary winglet
    ctx.lineTo(4 * S, 8 * S);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });

  // Stealth obsidian chassis
  const hullGrd = ctx.createLinearGradient(-6 * S, 0, 6 * S, 0);
  hullGrd.addColorStop(0, '#0a0515');
  hullGrd.addColorStop(0.5, '#1e1138');
  hullGrd.addColorStop(1, '#0a0515');
  ctx.fillStyle = hullGrd;
  ctx.strokeStyle = 'rgba(217, 70, 239, 0.7)';
  ctx.lineWidth = 1.2 * S;

  ctx.beginPath();
  ctx.moveTo(0, -22 * S);         // needle stealth nose
  ctx.lineTo(6 * S, -6 * S);
  ctx.lineTo(5 * S, 12 * S);
  ctx.lineTo(0, 16 * S);
  ctx.lineTo(-5 * S, 12 * S);
  ctx.lineTo(-6 * S, -6 * S);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Quantum hyperdrive core
  const qPulse = 0.7 + 0.3 * Math.sin(t * 14);
  ctx.fillStyle = `rgba(0, 229, 255, ${qPulse})`;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, -2 * S, 3.5 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── SKIN 5: Star Wars Venator-class Star Destroyer ───────────
function drawSkinVenator(ctx, t, S) {
  // 1. Lower armor base plate
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, -26 * S);
  ctx.lineTo(18 * S, 14 * S);
  ctx.lineTo(8 * S, 17 * S);
  ctx.lineTo(-8 * S, 17 * S);
  ctx.lineTo(-18 * S, 14 * S);
  ctx.closePath();
  ctx.fill();

  // 2. Main Dorsal Dagger/Wedge Hull Plate
  const hullGrd = ctx.createLinearGradient(-17 * S, 0, 17 * S, 0);
  hullGrd.addColorStop(0, '#475569');
  hullGrd.addColorStop(0.2, '#64748b');
  hullGrd.addColorStop(0.5, '#94a3b8');
  hullGrd.addColorStop(0.8, '#64748b');
  hullGrd.addColorStop(1, '#475569');
  ctx.fillStyle = hullGrd;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.0 * S;

  ctx.beginPath();
  ctx.moveTo(0, -26 * S);               // Bow tip
  ctx.lineTo(6 * S, -12 * S);
  ctx.lineTo(7.5 * S, -11 * S);          // Lateral trench step
  ctx.lineTo(11 * S, -3 * S);
  ctx.lineTo(13 * S, 4 * S);
  ctx.lineTo(17.5 * S, 13 * S);          // Aft wing corner
  ctx.lineTo(8 * S, 16 * S);             // Engine bracket cut
  ctx.lineTo(6 * S, 18 * S);
  ctx.lineTo(-6 * S, 18 * S);
  ctx.lineTo(-8 * S, 16 * S);
  ctx.lineTo(-17.5 * S, 13 * S);
  ctx.lineTo(-13 * S, 4 * S);
  ctx.lineTo(-11 * S, -3 * S);
  ctx.lineTo(-7.5 * S, -11 * S);
  ctx.lineTo(-6 * S, -12 * S);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Iconic Grand Army of the Republic Crimson Dorsal Stripe & Markings
  const redGrd = ctx.createLinearGradient(0, -22 * S, 0, 12 * S);
  redGrd.addColorStop(0, '#b91c1c');
  redGrd.addColorStop(0.5, '#dc2626');
  redGrd.addColorStop(1, '#991b1b');
  ctx.fillStyle = redGrd;

  // Central runway flight deck red stripe
  ctx.beginPath();
  ctx.moveTo(0, -24 * S);
  ctx.lineTo(3.2 * S, -12 * S);
  ctx.lineTo(3.2 * S, 4 * S);
  ctx.lineTo(1.8 * S, 12 * S);
  ctx.lineTo(-1.8 * S, 12 * S);
  ctx.lineTo(-3.2 * S, 4 * S);
  ctx.lineTo(-3.2 * S, -12 * S);
  ctx.closePath();
  ctx.fill();

  // Republic Crimson Wing Accents
  [-1, 1].forEach(side => {
    ctx.beginPath();
    ctx.moveTo(side * 8 * S, 0);
    ctx.lineTo(side * 14 * S, 10 * S);
    ctx.lineTo(side * 11 * S, 12 * S);
    ctx.lineTo(side * 6 * S, 3 * S);
    ctx.closePath();
    ctx.fill();

    // Republic emblem roundel
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(side * 9.5 * S, 6 * S, 1.6 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = redGrd;
  });

  // Center flight deck dorsal seam lines (hangar doors)
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 0.8 * S;
  ctx.beginPath();
  ctx.moveTo(0, -24 * S);
  ctx.lineTo(0, 11 * S);
  ctx.stroke();

  // 4. Dorsal Superstructure
  const supGrd = ctx.createLinearGradient(-5 * S, 0, 5 * S, 0);
  supGrd.addColorStop(0, '#475569');
  supGrd.addColorStop(0.5, '#cbd5e1');
  supGrd.addColorStop(1, '#475569');
  ctx.fillStyle = supGrd;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 0.9 * S;

  ctx.beginPath();
  ctx.moveTo(0, -8 * S);
  ctx.lineTo(4.5 * S, 3 * S);
  ctx.lineTo(4.5 * S, 12 * S);
  ctx.lineTo(-4.5 * S, 12 * S);
  ctx.lineTo(-4.5 * S, 3 * S);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Iconic Twin Command Towers (Двойной мостик - signature Venator feature!)
  // Left: Flight operations tower; Right: Ship command bridge
  [-4.2 * S, 4.2 * S].forEach(twX => {
    // Tower pylon
    ctx.fillStyle = '#334155';
    ctx.fillRect(twX - 1.6 * S, 5 * S, 3.2 * S, 6 * S);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(twX - 1.6 * S, 5 * S, 3.2 * S, 6 * S);

    // Tower bridge head capsule
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(twX - 2.8 * S, 4 * S);
    ctx.lineTo(twX + 2.8 * S, 4 * S);
    ctx.lineTo(twX + 2.2 * S, 7 * S);
    ctx.lineTo(twX - 2.2 * S, 7 * S);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing bridge viewport strip (soft cyan-blue sensor glass)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(twX - 2.2 * S, 4.6 * S, 4.4 * S, 0.9 * S);
  });

  // Heavy Turbolaser Turrets
  ctx.fillStyle = '#0f172a';
  [-7 * S, 7 * S].forEach(tx => {
    [0, 6 * S].forEach(ty => {
      ctx.beginPath();
      ctx.arc(tx, ty, 1.2 * S, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // 6. Engine Exhaust Bells (Three primary + 4 secondary ion engines)
  ctx.fillStyle = '#0f172a';
  [-4.2 * S, 0, 4.2 * S].forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex, 17.5 * S, 2.2 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 0.8 * S;
    ctx.stroke();
  });
  [-6.5 * S, 6.5 * S].forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex, 16.5 * S, 1.3 * S, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSkinGoldenAegis(ctx, t, S) {
  drawSkinVenator(ctx, t, S);
}

// ── SKIN 6: Cyber Dreadnought (Кибер-Дредноут) ──────────────────
// Heavy sci-fi battlecruiser: gunmetal chevron hull, 8 glowing cyan energy nodes,
// curved platinum intake conduits, horizontal plasma blades, and segmented prow armor.
function drawSkinCyberDreadnought(ctx, t, S) {
  // 1. Outer Heavy Weapon Pylons / Vertical Thruster Nacelles
  [-18 * S, 18 * S].forEach(pylonX => {
    // Pylon dark backing
    ctx.fillStyle = '#090d16';
    ctx.fillRect(pylonX - 1.8 * S, 7 * S, 3.6 * S, 10 * S);

    // Armor segment plates
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(pylonX - 1.4 * S, 8 * S, 2.8 * S, 3.2 * S);
    ctx.fillStyle = '#334155';
    ctx.fillRect(pylonX - 1.4 * S, 11.5 * S, 2.8 * S, 3.2 * S);
    ctx.fillStyle = '#475569';
    ctx.fillRect(pylonX - 1.1 * S, 15 * S, 2.2 * S, 2.0 * S);

    // Outer armor rim line
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8 * S;
    ctx.strokeRect(pylonX - 1.8 * S, 7 * S, 3.6 * S, 10 * S);

    // Pylon tip beacon / sensor
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(pylonX - 0.9 * S, 16.5 * S, 1.8 * S, 1.0 * S);
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(pylonX - 0.5 * S, 17.5 * S, 1.0 * S, 0.8 * S);
  });

  // 2. Aft Center Armor Keel / Tail (stepped downwards)
  const keelSegments = [
    { y1: 5 * S,    y2: 8.5 * S,  hw: 2.7 * S, col: '#1e293b' },
    { y1: 8.5 * S,  y2: 11.5 * S, hw: 2.1 * S, col: '#334155' },
    { y1: 11.5 * S, y2: 14.5 * S, hw: 1.5 * S, col: '#1e293b' },
    { y1: 14.5 * S, y2: 17.0 * S, hw: 1.0 * S, col: '#0f172a' },
  ];
  keelSegments.forEach(seg => {
    ctx.fillStyle = seg.col;
    ctx.fillRect(-seg.hw, seg.y1, seg.hw * 2, seg.y2 - seg.y1);
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 0.7 * S;
    ctx.strokeRect(-seg.hw, seg.y1, seg.hw * 2, seg.y2 - seg.y1);
  });
  // Keel center seam & highlight
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-0.4 * S, 6 * S, 0.8 * S, 8.5 * S);
  // Cyan keel sensor beacon
  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(-0.6 * S, 15 * S, 1.2 * S, 1.2 * S);

  // 3. Engine Thruster Bells (Dual primary ion drives)
  [-4.2 * S, 4.2 * S].forEach(exX => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(exX - 2.5 * S, 8 * S, 5.0 * S, 3.5 * S);
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 0.8 * S;
    ctx.strokeRect(exX - 2.5 * S, 8 * S, 5.0 * S, 3.5 * S);

    // Glowing cyan nozzle lip
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(exX - 2.2 * S, 11 * S, 4.4 * S, 0.8 * S);
  });

  // 4. Main Swept-Chevron Hull / Wings Base
  const hullGrd = ctx.createLinearGradient(-20 * S, 0, 20 * S, 0);
  hullGrd.addColorStop(0, '#1e293b');
  hullGrd.addColorStop(0.2, '#334155');
  hullGrd.addColorStop(0.5, '#475569');
  hullGrd.addColorStop(0.8, '#334155');
  hullGrd.addColorStop(1, '#1e293b');
  ctx.fillStyle = hullGrd;
  ctx.strokeStyle = '#080c14';
  ctx.lineWidth = 1.0 * S;

  ctx.beginPath();
  ctx.moveTo(0, -22 * S);
  // Right wing leading edge
  ctx.lineTo(3.5 * S, -13 * S);
  ctx.lineTo(6.0 * S, -8.5 * S);
  ctx.lineTo(9.5 * S, -4.0 * S);
  ctx.lineTo(13.5 * S, 1.0 * S);
  ctx.lineTo(17.5 * S, 5.5 * S);
  ctx.lineTo(20.0 * S, 7.5 * S);
  // Right wing tip & trailing edge
  ctx.lineTo(20.0 * S, 9.8 * S);
  ctx.lineTo(11.5 * S, 9.8 * S);
  ctx.lineTo(11.5 * S, 7.5 * S);
  ctx.lineTo(5.5 * S, 7.5 * S);
  ctx.lineTo(3.5 * S, 4.0 * S);
  // Left wing trailing edge
  ctx.lineTo(-3.5 * S, 4.0 * S);
  ctx.lineTo(-5.5 * S, 7.5 * S);
  ctx.lineTo(-11.5 * S, 7.5 * S);
  ctx.lineTo(-11.5 * S, 9.8 * S);
  ctx.lineTo(-20.0 * S, 9.8 * S);
  // Left wing tip & leading edge
  ctx.lineTo(-20.0 * S, 7.5 * S);
  ctx.lineTo(-17.5 * S, 5.5 * S);
  ctx.lineTo(-13.5 * S, 1.0 * S);
  ctx.lineTo(-9.5 * S, -4.0 * S);
  ctx.lineTo(-6.0 * S, -8.5 * S);
  ctx.lineTo(-3.5 * S, -13 * S);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Wing Armor Tier Plates (Stepped pixel plates)
  [-1, 1].forEach(side => {
    // Mid-tier slate armor panel
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(side * 4.5 * S, -7 * S);
    ctx.lineTo(side * 8.5 * S, -2 * S);
    ctx.lineTo(side * 12.5 * S, 3 * S);
    ctx.lineTo(side * 16.5 * S, 7 * S);
    ctx.lineTo(side * 11.5 * S, 7 * S);
    ctx.lineTo(side * 5.0 * S, 3.5 * S);
    ctx.closePath();
    ctx.fill();

    // Top diagonal silver ridge bevel (beneath power nodes)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(side * 5.5 * S, -9.5 * S);
    ctx.lineTo(side * 18.5 * S, 6.2 * S);
    ctx.lineTo(side * 17.5 * S, 7.2 * S);
    ctx.lineTo(side * 4.5 * S, -8.5 * S);
    ctx.closePath();
    ctx.fill();

    // Subtle dark panel seam lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.7 * S;
    ctx.beginPath();
    ctx.moveTo(side * 7.5 * S, -4 * S);
    ctx.lineTo(side * 6.0 * S, 1 * S);
    ctx.moveTo(side * 11.0 * S, 0.5 * S);
    ctx.lineTo(side * 9.5 * S, 5.5 * S);
    ctx.stroke();
  });

  // 6. Horizontal Cyan Plasma Energy Blades (Outer lower wings)
  [-1, 1].forEach(side => {
    const x1 = side * 11.8 * S, x2 = side * 19.5 * S;
    const startX = Math.min(x1, x2), wStrip = Math.abs(x2 - x1);

    // Neon cyan bloom
    ctx.fillStyle = 'rgba(0, 245, 255, 0.45)';
    ctx.fillRect(startX - 0.5 * S, 7.2 * S, wStrip + 1.0 * S, 2.4 * S);

    // Cyan plasma blade
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(startX, 7.6 * S, wStrip, 1.6 * S);

    // Hot white inner plasma line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX + 0.8 * S, 8.0 * S, wStrip - 1.6 * S, 0.7 * S);

    // Emitter grate separators (pixel notches)
    ctx.fillStyle = '#0f172a';
    for (let gx = 13.5 * S; gx < 18.5 * S; gx += 2.2 * S) {
      ctx.fillRect(side * gx - 0.4 * S, 7.3 * S, 0.8 * S, 2.2 * S);
    }
  });

  // 7. Symmetrical Glowing Cyan Power Nodes (4 per wing = 8 total)
  const nodeCoords = [
    { x: 6.8 * S,  y: -7.2 * S },
    { x: 10.2 * S, y: -3.0 * S },
    { x: 13.6 * S, y: 1.2 * S },
    { x: 17.0 * S, y: 5.4 * S },
  ];
  nodeCoords.forEach((nc, idx) => {
    [-1, 1].forEach(side => {
      const nx = side * nc.x, ny = nc.y;
      const pulse = 0.85 + 0.15 * Math.sin(t * 7 + idx * 0.9);

      // Dark socket base
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(nx, ny, 2.3 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.7 * S;
      ctx.stroke();

      // Cyan outer corona
      const glowGrd = ctx.createRadialGradient(nx, ny, 0, nx, ny, 4.2 * S * pulse);
      glowGrd.addColorStop(0, 'rgba(0, 245, 255, 0.65)');
      glowGrd.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
      glowGrd.addColorStop(1, 'rgba(0, 245, 255, 0)');
      ctx.fillStyle = glowGrd;
      ctx.beginPath();
      ctx.arc(nx, ny, 4.2 * S * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Vibrant power sphere
      const orbGrd = ctx.createRadialGradient(nx - 0.4 * S, ny - 0.4 * S, 0.2 * S, nx, ny, 1.7 * S);
      orbGrd.addColorStop(0, '#ffffff');
      orbGrd.addColorStop(0.35, '#67e8f9');
      orbGrd.addColorStop(0.75, '#00f5ff');
      orbGrd.addColorStop(1, '#0891b2');
      ctx.fillStyle = orbGrd;
      ctx.beginPath();
      ctx.arc(nx, ny, 1.7 * S, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // 8. Armored Bow Prow (Tiered crest, silver plates & cyan visor)
  // Base bow structure
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, -22 * S);
  ctx.lineTo(4.5 * S, -16 * S);
  ctx.lineTo(4.5 * S, -13 * S);
  ctx.lineTo(-4.5 * S, -13 * S);
  ctx.lineTo(-4.5 * S, -16 * S);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 0.9 * S;
  ctx.stroke();

  // White / platinum bow crest plate
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(0, -21.5 * S);
  ctx.lineTo(2.8 * S, -17.5 * S);
  ctx.lineTo(0, -16.5 * S);
  ctx.lineTo(-2.8 * S, -17.5 * S);
  ctx.closePath();
  ctx.fill();

  // Bevel step plates
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-3.6 * S, -16.5 * S, 7.2 * S, 1.4 * S);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-4.2 * S, -15.0 * S, 8.4 * S, 1.4 * S);

  // Cyan sensor visor strip
  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(-2.2 * S, -15.5 * S, 4.4 * S, 1.4 * S);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.2 * S, -15.1 * S, 2.4 * S, 0.6 * S);

  // Flanking sensor nodes on bow shoulders
  [-3.8 * S, 3.8 * S].forEach(sx => {
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(sx - 0.7 * S, -14.2 * S, 1.4 * S, 1.4 * S);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 0.3 * S, -13.8 * S, 0.6 * S, 0.6 * S);
  });

  // 9. Central Reactor Core and Curved Platinum Conduits
  // Central reactor bay background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-2.8 * S, -12 * S, 5.6 * S, 16.5 * S);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 0.8 * S;
  ctx.strokeRect(-2.8 * S, -12 * S, 5.6 * S, 16.5 * S);

  // Vertical glowing cyan reactor plasma slits
  [-2.0 * S, 2.0 * S].forEach(rx => {
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(rx - 0.45 * S, -7 * S, 0.9 * S, 9 * S);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - 0.2 * S, -5 * S, 0.4 * S, 5 * S);
  });

  // Center reactor core plating
  ctx.fillStyle = '#475569';
  ctx.fillRect(-1.4 * S, -8 * S, 2.8 * S, 11 * S);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-1.0 * S, -4 * S, 2.0 * S, 5 * S);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-0.4 * S, -8 * S, 0.8 * S, 11 * S);

  // Curved platinum / white conduits looping down from shoulders around reactor
  [-1, 1].forEach(side => {
    // Drop shadow / dark outline
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4 * S;
    ctx.beginPath();
    ctx.moveTo(side * 3.2 * S, -13 * S);
    ctx.quadraticCurveTo(side * 6.6 * S, -5 * S, side * 6.2 * S, 0);
    ctx.quadraticCurveTo(side * 5.8 * S, 4.5 * S, side * 3.8 * S, 5.5 * S);
    ctx.stroke();

    // Platinum conduit surface
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.6 * S;
    ctx.beginPath();
    ctx.moveTo(side * 3.2 * S, -13 * S);
    ctx.quadraticCurveTo(side * 6.6 * S, -5 * S, side * 6.2 * S, 0);
    ctx.quadraticCurveTo(side * 5.8 * S, 4.5 * S, side * 3.8 * S, 5.5 * S);
    ctx.stroke();

    // Pulsing cyan energy packet traveling down conduit
    const pulseY = -12 * S + ((t * 8) % 18) * S;
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.arc(side * 5.4 * S, Math.min(Math.max(pulseY, -11 * S), 4 * S), 0.9 * S, 0, Math.PI * 2);
    ctx.fill();
  });
}


