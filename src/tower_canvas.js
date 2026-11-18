// Canvas Renderers: Black-Gold Neon Arcade Skyline + Interactive 26F Floor Cutaway
(function () {
  class SkylineBackdrop {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.theme = "night";
      this.clearedCount = 1;
      this.showHeroTower = true;
      this.particles = [];
      this.buildings = [];
      this.time = 0;
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.initScene();
    }

    resize() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = w;
      this.h = h;
      this.initScene();
    }

    initScene() {
      const count = Math.max(12, Math.floor(this.w / 72));
      this.buildings = [];
      for (let i = 0; i < count; i++) {
        const bw = 44 + ((i * 37) % 48);
        const bh = this.h * (0.17 + ((i * 53) % 36) / 100);
        this.buildings.push({
          x: (i / count) * this.w,
          w: bw,
          h: bh,
          seed: i * 17 + 3,
          neonRim: i % 3 === 0 ? "rgba(255, 190, 11, 0.35)" : "rgba(0, 240, 255, 0.22)"
        });
      }
      this.particles = Array.from({ length: 30 }, (_, i) => ({
        x: (((i * 97) % 100) / 100) * this.w,
        y: (((i * 61) % 100) / 100) * this.h,
        vy: 0.24 + (i % 5) * 0.11,
        size: 2.2 + (i % 3),
        isGold: i % 3 !== 0
      }));
    }

    setState({ theme, clearedCount, showHeroTower }) {
      if (theme) this.theme = theme;
      if (typeof clearedCount === "number") this.clearedCount = clearedCount;
      if (typeof showHeroTower === "boolean") this.showHeroTower = showHeroTower;
    }

    draw(dt) {
      this.time += dt;
      const ctx = this.ctx;
      const { w, h } = this;
      if (!w || !h) return;

      // Obsidian Black-Gold Neon Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (this.theme === "dawn") {
        grad.addColorStop(0, "#07070c");
        grad.addColorStop(0.62, "#14101c");
        grad.addColorStop(1, "#2b1c0c");
      } else {
        grad.addColorStop(0, "#030306");
        grad.addColorStop(0.6, "#080811");
        grad.addColorStop(1, "#171107");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle neon gold/cyan arcade grid
      ctx.strokeStyle = "rgba(255, 190, 11, 0.045)";
      ctx.lineWidth = 1;
      const step = 58;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Ambient gold-cyan neon horizon bloom
      const bloom = ctx.createRadialGradient(w * 0.5, h * 0.95, 20, w * 0.5, h * 0.95, w * 0.65);
      bloom.addColorStop(0, "rgba(255, 183, 3, 0.14)");
      bloom.addColorStop(0.55, "rgba(0, 240, 255, 0.05)");
      bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);

      // Rising Neon K-Line Candlesticks (body + wick!)
      for (const p of this.particles) {
        p.y -= p.vy;
        if (p.y < -24) {
          p.y = h + 16;
          p.x = Math.random() * w;
        }
        const color = p.isGold ? "rgba(255, 190, 11, 0.42)" : "rgba(0, 240, 255, 0.36)";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1;
        const bodyW = p.size * 1.5;
        const bodyH = p.size * 4.2;
        ctx.beginPath();
        ctx.moveTo(p.x + bodyW / 2, p.y - 4);
        ctx.lineTo(p.x + bodyW / 2, p.y + bodyH + 4);
        ctx.stroke();
        ctx.fillRect(p.x, p.y, bodyW, bodyH);
      }

      // Background obsidian skyline silhouettes with neon roof rims
      for (const b of this.buildings) {
        ctx.fillStyle = "rgba(6, 6, 11, 0.92)";
        ctx.fillRect(b.x, h - b.h, b.w, b.h);
        ctx.strokeStyle = b.neonRim;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, h - b.h);
        ctx.lineTo(b.x + b.w, h - b.h);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 190, 11, 0.16)";
        for (let wy = h - b.h + 10; wy < h - 14; wy += 14) {
          for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 10) {
            if ((wx + wy + b.seed) % 7 < 2) {
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
      }

      // Hero 26-Story Black-Gold Neon Skyscraper on Title screen
      if (this.showHeroTower) {
        const isWide = w >= 860;
        const tw = isWide ? Math.min(162, w * 0.14) : Math.min(118, w * 0.28);
        const tx = isWide ? w * 0.78 - tw / 2 : w * 0.5 - tw / 2;
        const topY = h * 0.13;
        const bottomY = h;
        const totalH = bottomY - topY;
        const floorH = totalH / 26;

        // Neon gold aura
        const glow = ctx.createRadialGradient(
          tx + tw / 2,
          topY + totalH * 0.42,
          10,
          tx + tw / 2,
          topY + totalH * 0.42,
          tw * 2.0
        );
        glow.addColorStop(0, "rgba(255, 183, 3, 0.24)");
        glow.addColorStop(0.6, "rgba(0, 240, 255, 0.06)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(tx - tw * 1.2, 0, tw * 3.4, h);

        // Laser Spire
        ctx.strokeStyle = "rgba(255, 209, 102, 0.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx + tw / 2, topY - 40);
        ctx.lineTo(tx + tw / 2, topY - 14);
        ctx.stroke();

        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.5);
        ctx.fillStyle = `rgba(255, 209, 102, ${0.55 + pulse * 0.45})`;
        ctx.beginPath();
        ctx.arc(tx + tw / 2, topY - 42, 5, 0, Math.PI * 2);
        ctx.fill();

        // Architectural crown setbacks + Obsidian Tower Body
        ctx.fillStyle = isWide ? "rgba(8, 8, 13, 0.96)" : "rgba(8, 8, 13, 0.42)";
        ctx.strokeStyle = isWide ? "rgba(255, 190, 11, 0.72)" : "rgba(255, 190, 11, 0.28)";
        ctx.lineWidth = 1.8;
        ctx.fillRect(tx + tw * 0.16, topY - 14, tw * 0.68, 14);
        ctx.strokeRect(tx + tw * 0.16, topY - 14, tw * 0.68, 14);
        ctx.fillRect(tx, topY, tw, totalH);
        ctx.strokeRect(tx, topY, tw, totalH);

        // 26 floors from bottom (1F) to top (26F)
        const alphaScale = isWide ? 1 : 0.4;
        for (let f = 1; f <= 26; f++) {
          const fy = bottomY - f * floorH;
          const lit = f <= this.clearedCount;
          ctx.fillStyle = lit
            ? f <= 8
              ? `rgba(0, 240, 255, ${0.58 * alphaScale})`
              : `rgba(255, 190, 11, ${0.68 * alphaScale})`
            : `rgba(39, 39, 46, ${0.38 * alphaScale})`;
          ctx.fillRect(tx + 6, fy + 2, tw - 12, Math.max(3, floorH - 3.5));
        }

        if (isWide) {
          ctx.font = "800 10.5px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.fillStyle = "#ffd166";
          ctx.fillText("26F 旗舰顶层", tx + tw + 9, bottomY - 25.3 * floorH);
          ctx.fillStyle = "#67e8f9";
          ctx.fillText("09F 科二中枢", tx + tw + 9, bottomY - 8.3 * floorH);
          ctx.fillText("01F 科一基座", tx + tw + 9, bottomY - 0.35 * floorH);
        }
      }
    }
  }

  class FloorCutawayRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.time = 0;
      this.level = null;
      this.activeDesk = null;
      this.phase = "OPENING";
      this.floaters = [];
      this.flash = null;
      this.tickerOffset = 0;
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = rect.width;
      this.h = rect.height;
    }

    setFloorState({ level, activeDesk, phase }) {
      if (level !== undefined) this.level = level;
      if (activeDesk !== undefined) this.activeDesk = activeDesk;
      if (phase !== undefined) this.phase = phase;
    }

    spawnText(text, color = "#ffd166") {
      if (!this.w || !this.h) return;
      const deskXMap = { product: 0.2, compliance: 0.5, trading: 0.8 };
      const ratio = deskXMap[this.activeDesk] || 0.5;
      this.floaters.push({
        x: this.w * ratio,
        y: this.h * 0.52,
        text,
        color,
        life: 1.0
      });
    }

    triggerFlash(type) {
      this.flash = {
        color: type === "good" ? "rgba(0, 245, 155, 0.25)" : "rgba(255, 46, 99, 0.3)",
        life: 1.0
      };
    }

    draw(dt) {
      this.resizeIfNeeded();
      const ctx = this.ctx;
      const { w, h } = this;
      if (!w || !h) return;
      this.time += dt;
      this.tickerOffset = (this.tickerOffset + dt * 42) % 900;

      const accent = (this.level && this.level.floorColor) || "#ffb703";
      const floorNum = (this.level && this.level.floor) || 1;

      // 1. Exterior obsidian neon night sky through panoramic window
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, this.phase === "BOSS" ? "#1a0626" : "#05050a");
      sky.addColorStop(1, this.phase === "BOSS" ? "#2e0938" : "#120e07");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Exterior distant neon-rimmed towers
      const towerCount = 9;
      for (let i = 0; i < towerCount; i++) {
        const bx = (i / towerCount) * w;
        const bw = w / towerCount - 4;
        const bh = h * (0.25 + ((i * 29 + floorNum * 7) % 35) / 100);
        ctx.fillStyle = "rgba(10, 10, 16, 0.85)";
        ctx.fillRect(bx, h * 0.82 - bh, bw, bh);
        ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 190, 11, 0.22)" : "rgba(0, 240, 255, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, h * 0.82 - bh);
        ctx.lineTo(bx + bw, h * 0.82 - bh);
        ctx.stroke();
      }

      // 2. Top Black-Gold LED Market Ticker Beam
      const tickerH = Math.max(22, Math.min(28, h * 0.11));
      ctx.fillStyle = "#040407";
      ctx.fillRect(0, 0, w, tickerH);
      ctx.strokeStyle = "rgba(255, 190, 11, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, tickerH);
      ctx.lineTo(w, tickerH);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, tickerH);
      ctx.clip();
      ctx.fillStyle = "#ffd166";
      ctx.font = `700 ${Math.max(10, Math.floor(tickerH * 0.48))}px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`;
      const tickerStr =
        `⚡ 帝国实时终端 ｜ 沪深300 ▲1.38% ｜ 中证全债 ▲0.19% ｜ DR007 1.76% ｜ ${String(floorNum).padStart(2, "0")}F ${(this.level && this.level.deptName) || "筹备厅"} ｜ 中基协风控在线   `;
      ctx.fillText(tickerStr + tickerStr, -this.tickerOffset, tickerH * 0.69);
      ctx.restore();

      // 3. Curtain Wall & Neon Gold Floor Slab
      const floorY = h * 0.82;
      ctx.strokeStyle = "rgba(255, 190, 11, 0.1)";
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 6; i++) {
        const mx = (w / 6) * i;
        ctx.beginPath();
        ctx.moveTo(mx, tickerH);
        ctx.lineTo(mx, floorY);
        ctx.stroke();
      }

      const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
      floorGrad.addColorStop(0, "#181622");
      floorGrad.addColorStop(0.3, "#09090f");
      floorGrad.addColorStop(1, "#040407");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, w, h - floorY);

      ctx.strokeStyle = this.phase === "BOSS" ? "#d946ef" : "#ffb703";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(w, floorY);
      ctx.stroke();

      // Floor neon plaque
      ctx.fillStyle = "rgba(8, 8, 12, 0.92)";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, 10, tickerH + 8, 86, 24, 6, true, true);
      ctx.fillStyle = "#ffd166";
      ctx.font = "800 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(`${String(floorNum).padStart(2, "0")}F ${(this.level && this.level.themeIcon) || "🏢"}`, 18, tickerH + 24);

      // 4. Three Neon Specialist Workstations
      const desks = [
        { key: "product", label: "产品渠道台", x: w * 0.2, color: "#00f0ff", shirt: "#06b6d4" },
        { key: "compliance", label: "风控法务台", x: w * 0.5, color: "#ffb703", shirt: "#f59e0b" },
        { key: "trading", label: "投研运营台", x: w * 0.8, color: "#00f59b", shirt: "#10b981" }
      ];

      const deskW = Math.min(96, w * 0.25);
      const deskH = Math.max(18, Math.min(28, h * 0.12));

      for (let i = 0; i < desks.length; i++) {
        const d = desks[i];
        const isActive = this.phase === "ORDER" && this.activeDesk === d.key;
        const bob = Math.sin(this.time * (isActive ? 6 : 2.6) + i * 1.7) * (isActive ? 3.5 : 1.5);

        if (isActive) {
          const spot = ctx.createRadialGradient(d.x, floorY - deskH, 6, d.x, floorY - deskH, deskW * 1.05);
          spot.addColorStop(0, "rgba(255, 190, 11, 0.42)");
          spot.addColorStop(1, "rgba(255, 190, 11, 0)");
          ctx.fillStyle = spot;
          ctx.beginPath();
          ctx.arc(d.x, floorY - deskH, deskW * 1.05, 0, Math.PI * 2);
          ctx.fill();
        }

        const charY = floorY - deskH - 16 + bob;
        ctx.fillStyle = d.shirt;
        this.roundRect(ctx, d.x - 11, charY, 22, 18, 5, true, false);
        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.arc(d.x, charY - 8, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Holographic Neon Monitor
        ctx.fillStyle = isActive ? "#fff3b0" : "#12121c";
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.6;
        this.roundRect(ctx, d.x - 16, floorY - deskH - 11, 32, 12, 3, true, true);

        // Obsidian Desk
        ctx.fillStyle = isActive ? "#272318" : "#12121a";
        ctx.strokeStyle = isActive ? "#ffd166" : "rgba(255, 190, 11, 0.28)";
        ctx.lineWidth = isActive ? 2 : 1;
        this.roundRect(ctx, d.x - deskW / 2, floorY - deskH, deskW, deskH, 5, true, true);

        ctx.fillStyle = isActive ? "#ffd166" : "#a1a1aa";
        ctx.font = `700 ${Math.max(10, Math.min(12, Math.floor(w * 0.026)))}px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(d.label, d.x, floorY + Math.min(16, (h - floorY) * 0.62));

        if (isActive) {
          const by = charY - 32 + bob * 0.6;
          ctx.fillStyle = "#ffb703";
          this.roundRect(ctx, d.x - 32, by - 11, 64, 20, 10, true, false);
          ctx.fillStyle = "#050508";
          ctx.font = "900 11px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.fillText("⚡ 待办急件", d.x, by + 3);
        }
      }

      if (this.phase === "BOSS") {
        const bx = w * 0.5;
        ctx.fillStyle = "rgba(217, 70, 239, 0.92)";
        this.roundRect(ctx, bx - 68, tickerH + 8, 136, 24, 12, true, false);
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 12px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ 协会飞检考官驻场中", bx, tickerH + 24);
      }

      ctx.textAlign = "left";

      if (this.flash) {
        ctx.fillStyle = this.flash.color;
        ctx.fillRect(0, 0, w, h);
        this.flash.life -= dt * 3.2;
        if (this.flash.life <= 0) this.flash = null;
      }

      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i];
        f.y -= dt * 36;
        f.life -= dt * 0.95;
        if (f.life <= 0) {
          this.floaters.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.font = "900 14px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }

    resizeIfNeeded() {
      const rect = this.canvas.getBoundingClientRect();
      if (
        rect.width &&
        rect.height &&
        (Math.abs(rect.width - (this.w || 0)) > 2 || Math.abs(rect.height - (this.h || 0)) > 2)
      ) {
        this.resize();
      }
    }

    roundRect(ctx, x, y, w, h, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }
  }

  window.SkylineBackdrop = SkylineBackdrop;
  window.FloorCutawayRenderer = FloorCutawayRenderer;
})();
