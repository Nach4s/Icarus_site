// ─── Main Game Loop ───────────────────────────────────────────
function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  const w = canvas.width, h = canvas.height;

  ctx.fillStyle = currentBgColor;
  ctx.fillRect(0, 0, w, h);

  if (gameState === 'PLAYING') {
    // ── Update ──────────────────────────────
    updateStars(dt, w, h);

    // ── Inertia-based rocket movement ──
    const ACCEL = 1400;   // px/s² — how fast rocket speeds up
    const FRICTION = 7.5;   // damping factor when no key pressed
    const MAX_SPD = getRocketSpeed();

    let inputX = 0, inputY = 0;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) inputY -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) inputY += 1;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) inputX -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) inputX += 1;
    // Normalize diagonal input
    if (inputX !== 0 && inputY !== 0) { inputX *= 0.707; inputY *= 0.707; }
    // Touch joystick: analog direction, top speed scales with stick deflection
    let maxSpd = MAX_SPD;
    if (touchStick.active && (touchStick.x !== 0 || touchStick.y !== 0)) {
      inputX = touchStick.x;
      inputY = touchStick.y;
      maxSpd = MAX_SPD * Math.max(0.35, Math.sqrt(inputX * inputX + inputY * inputY));
    }

    // ── Control Inversion Near Black Holes ───────────────────
    // "если игрок близко подойдет к черной дыре его управление будет полностью наоборот"
    let controlsInverted = false;
    if (rocket && rocket.alive && blackHoles.length > 0) {
      for (let b = 0; b < blackHoles.length; b++) {
        const bh = blackHoles[b];
        const dx = bh.x - rocket.x;
        const dy = bh.y - rocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const invertThreshold = Math.max(bh.r * 3.5, bh.pullR * 0.52);
        if (dist < invertThreshold) {
          controlsInverted = true;
          break;
        }
      }
    }
    if (rocket) rocket.controlsInverted = controlsInverted;

    // Single-axis inversion from AXIS_INVERSION event
    let eventAxis = null;
    if (activeEvent && activeEvent.type === 'AXIS_INVERSION') {
      eventAxis = activeEvent.invertAxis || 'X';
    }
    if (rocket) rocket.eventInvertAxis = eventAxis;

    if (controlsInverted) {
      // Black hole inverts both axes
      inputX = -inputX;
      inputY = -inputY;
    } else if (eventAxis === 'X') {
      // Variant A: Horizontal inversion only (Left/Right swapped, Up/Down normal)
      inputX = -inputX;
    } else if (eventAxis === 'Y') {
      // Variant B: Vertical inversion only (Up/Down swapped, Left/Right normal)
      inputY = -inputY;
    }

    if (rocket) {
      if (inputX !== 0 || inputY !== 0) {
        // Accelerate toward input direction
        rocket.vx += inputX * ACCEL * dt;
        rocket.vy += inputY * ACCEL * dt;
        // Clamp to max speed
        const spd = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
        if (spd > maxSpd) {
          rocket.vx = (rocket.vx / spd) * maxSpd;
          rocket.vy = (rocket.vy / spd) * maxSpd;
        }
      } else {
        // Friction deceleration when no key pressed
        rocket.vx *= Math.max(0, 1 - FRICTION * dt);
        rocket.vy *= Math.max(0, 1 - FRICTION * dt);
        // Stop fully below threshold to avoid jitter
        if (Math.abs(rocket.vx) < 2) rocket.vx = 0;
        if (Math.abs(rocket.vy) < 2) rocket.vy = 0;
      }

      // Gravity Shift force & drift on rocket
      if (activeEvent && activeEvent.type === 'GRAVITY_SHIFT' && activeEvent.gravity) {
        const gDir = activeEvent.gravity;
        const gPow = activeEvent.gravityPower || 280;
        const dSpd = activeEvent.driftSpeed || 35;
        rocket.vx += gDir.x * gPow * dt;
        rocket.vy += gDir.y * gPow * dt;
        rocket.x += gDir.x * dSpd * dt;
        rocket.y += gDir.y * dSpd * dt;
      }

      rocket.x += rocket.vx * dt;
      rocket.y += rocket.vy * dt;
      // Смерть при выходе за границу экрана
      if (rocket.alive && (
        rocket.x < 0 || rocket.x > w ||
        rocket.y < 0 || rocket.y > h
      )) {
        rocket.alive = false;
        playSfxExplosion();
        spawnExplosion(rocket.x, rocket.y, 48);
        setTimeout(showGameOver, 900);
      }
      rocket.thrusterPhase += dt;
    }

    // ── Smooth rotation toward velocity direction ──
    if (rocket) {
      const velSpd = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
      if (velSpd > 20) {
        const targetAngle = Math.atan2(rocket.vy, rocket.vx) + Math.PI / 2;
        // Shortest-path angle lerp
        let diff = targetAngle - rocketAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rocketAngle += diff * Math.min(1, 10 * dt);
      }

      // Store smoothed velocity for rendering
      rocketMvx = rocket.vx;
      rocketMvy = rocket.vy;

      // Exhaust trail
      const exhaustDist = 28;
      const spd2 = velSpd || 1;
      const exX = rocket.x - (rocket.vx / spd2) * exhaustDist;
      const exY = rocket.y - (rocket.vy / spd2) * exhaustDist;
      spawnRocketTrail(exX, exY, rocket.vx, rocket.vy);
    }

    // Score (1 point per second)
    scoreTimer += dt;
    if (scoreTimer >= 1) {
      scoreTimer -= 1;
      score++;
      EL.scoreVal.textContent = score;
    }

    // Difficulty
    diffTimer += dt;
    if (diffTimer >= 15) {
      diffTimer -= 15;
      diffLevel++;
      sessionLevel = diffLevel;
      EL.levelVal.textContent = diffLevel;
      syncDebugLevel();
      playSfxLevelUp();
      // Level-up ring effect
      if (rocket && rocket.alive) spawnLevelUpRing(rocket.x, rocket.y);
      EL.hudLevel.classList.add('level-flash');
      setTimeout(() => EL.hudLevel.classList.remove('level-flash'), 600);

      // If an event was active on the previous level, end it when advancing to the new level
      if (activeEvent) {
        endEvent();
      }

      // Smooth theme transition at levels 5, 10, 15, 20
      if (diffLevel === 5 || diffLevel === 10 || diffLevel === 15 || diffLevel === 20 || (diffLevel > 20 && diffLevel % 5 === 0)) {
        triggerThemeTransition();
      }

      // Special events trigger every 3-4 levels as requested
      if (diffLevel >= nextEventLevel) {
        if (!activeEvent) startEvent(diffLevel, w, h);
        nextEventLevel = diffLevel + getNextEventLevelInterval();
      }

      // Periodic pirate encounters every 1-3 levels (1-2 pirates depending on level)
      // Pirates are disabled in Synthwave Magenta biome only
      const isSynthwaveNow = typeof isSynthwaveTheme === 'function' && isSynthwaveTheme();
      if (!isSynthwaveNow && diffLevel >= nextPirateLevel) {
        triggerLevelPirates(w, h);
        nextPirateLevel = diffLevel + getNextPirateLevelInterval();
      }
    }

    // Spawn obstacles: fewer obstacles in Purple Space theme and Green Zone (~40-50% reduction)
    // Crimson Pulsar: reduced obstacle count
    const isPurple = isPurpleSpaceTheme();
    const isGreen = isGreenZoneTheme();
    const isCrimson = typeof isCrimsonTheme === 'function' && isCrimsonTheme();
    const isSynthwave = typeof isSynthwaveTheme === 'function' && isSynthwaveTheme();
    spawnTimer += dt;
    if (spawnTimer >= getSpawnInterval()) {
      spawnTimer = 0;
      spawnObstacle(w, h);
      // Extra spawns — slightly increased obstacles during PIRATES event as requested
      if (activeEvent && activeEvent.type === 'PIRATES') {
        if (diffLevel >= 6 && Math.random() < 0.20) spawnObstacle(w, h);
      } else if (isPurple || isGreen || isCrimson || isBiomeHazardTheme()) {
        // Biomes with their own hazard: 15% chance of a second obstacle from level 6
        // Crimson Pulsar: no extra spawns — solar waves carry the difficulty
        if (!isCrimson && diffLevel >= 6 && Math.random() < 0.15) spawnObstacle(w, h);
      } else {
        // From level 10: 10% chance of three obstacles in one tick (was 20%)
        // From level 5: 25% chance of two obstacles at once
        if (diffLevel >= 10 && Math.random() < 0.10) {
          spawnObstacle(w, h);
          spawnObstacle(w, h);
        } else if (diffLevel >= 5 && Math.random() < 0.25) {
          spawnObstacle(w, h);
        }
      }
    }

    // Spawn black holes: frequent in Purple Space theme, occasional in other themes, disabled in Green Zone and Crimson Pulsar
    const enableBlackHoles = !isGreen && !isCrimson;
    const maxBH = isPurple ? 2 : 1;
    blackHoleTimer += dt;
    if (enableBlackHoles && blackHoles.length < maxBH && blackHoleTimer >= getBlackHoleInterval(isPurple)) {
      blackHoleTimer = 0;
      spawnBlackHole(w, h);
    }

    // ── Toxic Barrel Spawning ──
    // Green Zone: random timer every 15–25s. Other biomes: rare random timer every 40–80s.
    // Synthwave Magenta: toxic barrels are DISABLED (no poison in this biome)
    // Crimson Pulsar: toxic barrels are DISABLED
    toxicBarrelTimer += dt;
    if (!isSynthwave && !isCrimson && toxicBarrelTimer >= nextToxicBarrelInterval) {
      toxicBarrelTimer = 0;
      nextToxicBarrelInterval = getToxicBarrelInterval(isGreen);
      if (toxicBarrels.length < 2) {
        spawnToxicBarrel(w, h);
      }
    }

    // Update toxic barrels & clouds
    if (toxicBarrels.length > 0) updateToxicBarrels(dt, w, h);
    if (toxicClouds.length > 0 || rocketFogTransition > 0) {
      updateToxicClouds(dt);
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];

      // Comets turned into energy orbs by a solar storm (Crimson Pulsar) only live
      // while the wave is sweeping — afterwards they burst instead of hanging in place
      if (ob.wasComet && !(pushWave && pushWave.state === 'SWEEPING')) {
        spawnExplosion(ob.x, ob.y, 12);
        obstacles.splice(i, 1);
        continue;
      }

      // If captured by a black hole: position is set by orbit, skip normal movement
      if (ob.capturedByBH) {
        if (rocket && rocket.alive && rocket.invincible <= 0 && checkCollision(rocket, ob)) {
          rocket.alive = false;
          playSfxExplosion();
          spawnExplosion(rocket.x, rocket.y, 48);
          setTimeout(showGameOver, 900);
        }
        continue;
      }

      // Gravity Shift: curves obstacle trajectories smoothly toward gravity horizon
      if (activeEvent && activeEvent.type === 'GRAVITY_SHIFT' && activeEvent.gravity) {
        ob.vx += activeEvent.gravity.x * 65 * dt;
        ob.vy += activeEvent.gravity.y * 65 * dt;
      }

      ob.x += ob.vx * dt;
      ob.y += ob.vy * dt;
      if (ob.type === 'asteroid') ob.rotation += ob.rotSpeed * dt;

      const margin = ob.r + 120;
      if (ob.x < -margin || ob.x > w + margin || ob.y < -margin || ob.y > h + margin) {
        obstacles.splice(i, 1);
        continue;
      }

      // ── Asteroid split at midpoint ──────────────────────────
      if (ob.type === 'asteroid' && !ob.hasSplit && ob.splitX !== undefined) {
        const distToSplit = Math.sqrt(
          (ob.x - ob.splitX) * (ob.x - ob.splitX) +
          (ob.y - ob.splitY) * (ob.y - ob.splitY)
        );
        if (distToSplit < ob.r * 1.2) {
          ob.hasSplit = true;
          splitAsteroid(ob, i);
          continue;
        }
      }

      // ── Comet mid-path explosion ────────────────────────────
      if (ob.type === 'comet' && ob.willExplode && ob.explodeTimer !== undefined) {
        ob.explodeTimer -= dt;
        if (ob.explodeTimer <= 0) {
          spawnCometBlast(ob);
          obstacles.splice(i, 1);
          continue;
        }
      }

      if (rocket && rocket.alive && rocket.invincible <= 0 && checkCollision(rocket, ob)) {
        rocket.alive = false;
        playSfxExplosion();
        spawnExplosion(rocket.x, rocket.y, 48);
        setTimeout(showGameOver, 900);
      }
    }

    if (rocket && rocket.invincible > 0) rocket.invincible -= dt;

    // ── Update danger zones (comet blasts) ────────────────────
    for (let i = dangerZones.length - 1; i >= 0; i--) {
      dangerZones[i].life -= dt;
      if (dangerZones[i].life <= 0) { dangerZones.splice(i, 1); continue; }
      // Kill rocket if inside the danger zone (and not already invincible)
      const dz = dangerZones[i];
      if (rocket && rocket.alive && rocket.invincible <= 0) {
        const ddx = rocket.x - dz.x, ddy = rocket.y - dz.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy) < dz.r) {
          rocket.alive = false;
          playSfxExplosion();
          spawnExplosion(rocket.x, rocket.y, 48);
          setTimeout(showGameOver, 900);
        }
      }

      // Kill pirates if inside the danger zone!
      // "пираты должны умерать в зоне после взрывия комет который еще пунктиром отмечается тип туда нельзя"
      if (pirates.length > 0) {
        for (let pIdx = 0; pIdx < pirates.length; pIdx++) {
          const p = pirates[pIdx];
          if (!p.alive || !p.active) continue;
          const pdx = p.x - dz.x, pdy = p.y - dz.y;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pDist < dz.r + p.r * 0.75) {
            if (p.hasArmor) spawnShieldBreakEffect(p.x, p.y, p.r);
            p.alive = false;
            playSfxExplosion();
            spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
            score += 4;
            EL.scoreVal.textContent = score;
            spawnFloatingText(p.x, p.y - 20, '+4 BLAST ZONE!', '#ff5500');
          }
        }
      }
    }

    updateParticles(dt);
    updateFloatingTexts(dt);

    // ── Active event update ─────────────────────────────────
    if (activeEvent) {
      activeEvent.timer += dt;
      if (activeEvent.bannerTimer > 0) activeEvent.bannerTimer -= dt;

      if (activeEvent.type === 'CONSTRICTION') {
        applyConstriction(dt, w, h);
      } else if (activeEvent.type === 'PIRATES') {
        // Spawn reinforcement waves of pirates from screen edges (5 to 10 pirates total)
        activeEvent.pirateSpawnTimer += dt;
        if (activeEvent.pirateSpawnTimer >= (activeEvent.pirateSpawnInterval || 2.2) &&
            activeEvent.piratesSpawned < activeEvent.maxPirates) {
          activeEvent.pirateSpawnTimer = 0;
          const toSpawn = Math.min(Math.random() < 0.5 ? 2 : 1, activeEvent.maxPirates - activeEvent.piratesSpawned);
          for (let k = 0; k < toSpawn; k++) {
            activeEvent.piratesSpawned++;
            spawnPirate(w, h);
          }
          playSfxPirateAlert();
        }
      } else if (activeEvent.type === 'SOLAR_FLARE') {
        // Periodically spawn new flare waves
        activeEvent.flareTimer += dt;
        if (activeEvent.flareTimer >= activeEvent.flareCooldown &&
            activeEvent.flaresDone < activeEvent.maxFlareWaves) {
          activeEvent.flareTimer = 0;
          activeEvent.flaresDone++;
          spawnFlareWave(w, h, activeEvent.intensity);
        }
        updateSolarFlares(dt, w, h);
      }
    } else {
      // No active event — clean up non-pirate lingering entities
      if (solarFlares.length > 0) solarFlares = [];
      if (eventBounds.active) eventBounds = { active: false };
    }

    // ── Pirates update (always, so they persist after event ends) ──
    if (pirates.length > 0) {
      updatePirates(dt, w, h);
    }

    // ── Pirate Mothership update ──
    if (pirateMothership) {
      updatePirateMothership(dt, w, h);
    }

    // ── Black holes: gravity + lifecycle ─────────────────
    if (blackHoles.length > 0) updateBlackHoles(dt);

    // ── Crimson Pulsar: Solar Push Waves ─────────────────
    if (isCrimson) {
      pushWaveTimer += dt;
      if (pushWaveTimer >= pushWaveInterval) {
        pushWaveTimer = 0;
        pushWaveInterval = 15 + Math.random() * 10; // 15-25 seconds
        if (typeof spawnPushWave === 'function') {
          spawnPushWave(w, h);
        }
      }
      if (typeof updatePushWave === 'function') {
        updatePushWave(dt, w, h);
      }
    }

    // ── Biome hazards: ion gates, supernova, minefield, lava (biomes.js) ──
    updateBiomeHazards(dt, w, h);

    // ── Gravity Shift particle & field update ────────────
    if (activeEvent && activeEvent.type === 'GRAVITY_SHIFT' && typeof updateGravityShift === 'function') {
      updateGravityShift(dt, w, h);
    }

    // ── Draw ───────────────────────────────
    drawStars(ctx, w, h);
    drawBiomeHazardsBelow(ctx);
    drawDangerZones(ctx);

    // Draw constriction zone overlay (behind obstacles, above stars)
    if (activeEvent && activeEvent.type === 'CONSTRICTION') {
      drawConstrictionZone(ctx, w, h);
    }

    // Draw Gravity Shift field aura & vector flux streaks (behind obstacles, above stars)
    if (activeEvent && activeEvent.type === 'GRAVITY_SHIFT' && typeof drawGravityShiftField === 'function') {
      drawGravityShiftField(ctx, w, h);
    }

    drawParticles(ctx);

    // Draw black holes behind obstacles (they sit in space, beneath everything)
    if (blackHoles.length > 0) {
      blackHoles.forEach(bh => drawBlackHole(ctx, bh));
    }

    // Draw solar flare warning stripes BEHIND obstacles/rocket
    if (activeEvent && activeEvent.type === 'SOLAR_FLARE') {
      drawSolarFlares(ctx, w, h);
    }

    // Draw Crimson Pulsar solar push wave
    if (isCrimson && typeof drawPushWave === 'function') {
      drawPushWave(ctx, w, h);
    }

    // ── Draw Obstacles (with Fog of War smooth alpha visibility) ──
    obstacles.forEach(ob => {
      const alpha = getObstacleFogAlpha(ob);
      if (alpha <= 0.02) return; // Hidden in poison gas cloud!
      if (alpha < 0.98) {
        ctx.save();
        ctx.globalAlpha = alpha;
        if (ob.type === 'comet') drawComet(ctx, ob);
        else drawAsteroid(ctx, ob);
        ctx.restore();
      } else {
        if (ob.type === 'comet') drawComet(ctx, ob);
        else drawAsteroid(ctx, ob);
      }
    });

    // ── Draw Toxic Barrels (with Fog of War smooth alpha visibility) ──
    if (toxicBarrels.length > 0) {
      toxicBarrels.forEach(b => {
        const alpha = getObstacleFogAlpha(b);
        if (alpha <= 0.02) return;
        if (alpha < 0.98) {
          ctx.save();
          ctx.globalAlpha = alpha;
          drawToxicBarrel(ctx, b);
          ctx.restore();
        } else {
          drawToxicBarrel(ctx, b);
        }
      });
    }

    // Draw pirates (only during PIRATES event, or while array still has entries)
    if (pirates.length > 0) {
      pirates.forEach(p => drawPirate(ctx, p));
    }

    // Draw Pirate Mothership & Heavy Cannon Beam (beam overlays muzzle properly)
    if (pirateMothership) {
      drawPirateMothership(ctx, pirateMothership);
      drawMothershipCannonBeam(ctx, pirateMothership);
    }

    // Draw firing beam OVER entities
    if (activeEvent && activeEvent.type === 'SOLAR_FLARE') {
      const hasFiring = solarFlares.some(f => f.state === 'FIRING');
      if (hasFiring) drawSolarFlares(ctx, w, h);
    }

    // ── Draw Toxic Clouds (Poison Gas Fog of War with cleared vision hole around rocket) ──
    if (toxicClouds.length > 0) {
      drawToxicClouds(ctx, w, h);
    }

    drawBiomeHazardsAbove(ctx);

    // ── Draw Rocket & Fog Vision Ring ──
    if (rocket && rocket.alive) {
      if (isRocketInFog()) {
        drawRocketFogVision(ctx);
      }
      if (rocket.invincible <= 0 || Math.floor(rocket.invincible * 10) % 2 === 0) {
        drawRocketPixelArt(ctx, rocket.x, rocket.y, rocket.thrusterPhase, 1.6, rocketMvx, rocketMvy, rocketAngle);
      }
    }

    // Draw floating score texts and event banner on top
    drawFloatingTexts(ctx);
    drawEventBanner(ctx, w, h);
    if (activeEvent && activeEvent.type === 'AXIS_INVERSION' && rocket && rocket.alive && !rocket.controlsInverted) {
      drawAxisInversionHud(ctx, w, h);
    }
    if (activeEvent && activeEvent.type === 'GRAVITY_SHIFT' && rocket && rocket.alive) {
      drawGravityShiftHud(ctx, w, h);
    }
    if (rocket && rocket.alive && rocket.controlsInverted) {
      drawControlInversionHUD(ctx, w, h);
    }
    if (isCrimson && typeof drawPushWaveHUD === 'function') {
      drawPushWaveHUD(ctx, w, h);
    }

  } else if (gameState === 'PAUSED') {
    drawStars(ctx, w, h);
    drawBiomeHazardsBelow(ctx);
    obstacles.forEach(ob => {
      const alpha = getObstacleFogAlpha(ob);
      if (alpha <= 0.02) return;
      if (alpha < 0.98) {
        ctx.save();
        ctx.globalAlpha = alpha;
        if (ob.type === 'comet') drawComet(ctx, ob);
        else drawAsteroid(ctx, ob);
        ctx.restore();
      } else {
        if (ob.type === 'comet') drawComet(ctx, ob);
        else drawAsteroid(ctx, ob);
      }
    });
    if (toxicBarrels.length > 0) {
      toxicBarrels.forEach(b => {
        const alpha = getObstacleFogAlpha(b);
        if (alpha <= 0.02) return;
        if (alpha < 0.98) {
          ctx.save();
          ctx.globalAlpha = alpha;
          drawToxicBarrel(ctx, b);
          ctx.restore();
        } else {
          drawToxicBarrel(ctx, b);
        }
      });
    }
    if (toxicClouds.length > 0) drawToxicClouds(ctx, w, h);
    drawParticles(ctx);
    if (pirateMothership) {
      drawPirateMothership(ctx, pirateMothership);
      drawMothershipCannonBeam(ctx, pirateMothership);
    }
    if (pirates.length > 0) {
      pirates.forEach(p => drawPirate(ctx, p));
    }
    drawBiomeHazardsAbove(ctx);
    if (rocket && rocket.alive) {
      if (isRocketInFog()) drawRocketFogVision(ctx);
      drawRocketPixelArt(ctx, rocket.x, rocket.y, rocket.thrusterPhase, 1.6, rocketMvx, rocketMvy, rocketAngle);
    }
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

