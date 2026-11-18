// Canvas Renderers: Title Skyline + Interactive 26F Floor Cutaway
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
      const count = Math.max(12, Math.floor(this.w / 75));
      this.buildings = [];
      for (let i = 0; i < count; i++) {
        const bw = 42 + ((i * 37) % 48);
        const bh = this.h * (0.18 + ((i * 53) % 38) / 100);
        this.buildings.push({
          x: (i / count) * this.w,
          w: bw,
          h: bh,
          seed: i * 17 + 3
        });
      }
      this.particles = Array.from({ length: 28 }, (_, i) => ({
        x: ((i * 97) % 100) / 100 * this.w,
        y: ((i * 61) % 100) / 100 * this.h,
        vy: 0.22 + (i % 5) * 0.1,
        size: 1.5 + (i % 3),
        isUp: i % 3 !== 0
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

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (this.theme === "dawn") {
        grad.addColorStop(0, "#0f172a");
        grad.addColorStop(0.55, "#1e293b");
        grad.addColorStop(1, "#334155");
      } else {
        grad.addColorStop(0, "#050814");
        grad.addColorStop(0.55, "#0b132b");
        grad.addColorStop(1, "#162447");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle financial grid lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.045)";
      ctx.lineWidth = 1;
      const step = 56;
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

      // Rising K-line / gold particles
      for (const p of this.particles) {
        p.y -= p.vy;
        if (p.y < -15) {
          p.y = h + 12;
          p.x = Math.random() * w;
        }
        ctx.fillStyle = p.isUp ? "rgba(245, 158, 11, 0.28)" : "rgba(56, 189, 248, 0.22)";
        ctx.fillRect(p.x, p.y, p.size * 1.4, p.size * 3.8);
      }

      // Background skyline silhouette
      for (const b of this.buildings) {
        ctx.fillStyle = this.theme === "dawn" ? "rgba(15, 23, 42, 0.62)" : "rgba(7, 12, 28, 0.82)";
        ctx.fillRect(b.x, h - b.h, b.w, b.h);
        // Tiny lit windows
        ctx.fillStyle = "rgba(251, 191, 36, 0.14)";
        for (let wy = h - b.h + 10; wy < h - 14; wy += 14) {
          for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 10) {
            if (((wx + wy + b.seed) % 7) < 2) {
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
      }

      // Hero 26-Story Skyscraper silhouette on Title screen
      if (this.showHeroTower) {
        const isWide = w >= 860;
        const tw = isWide ? Math.min(160, w * 0.14) : Math.min(116, w * 0.28);
        const tx = isWide ? w * 0.78 - tw / 2 : w * 0.5 - tw / 2;
        const topY = h * 0.13;
        const bottomY = h;
        const totalH = bottomY - topY;
        const floorH = totalH / 26;

        // Outer glow
        const glow = ctx.createRadialGradient(tx + tw / 2, topY + totalH * 0.4, 10, tx + tw / 2, topY + totalH * 0.4, tw * 1.8);
        glow.addColorStop(0, "rgba(245, 158, 11, 0.18)");
        glow.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(tx - tw, 0, tw * 3, h);

        // Spire
        ctx.strokeStyle = "rgba(251, 191, 36, 0.65)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx + tw / 2, topY - 38);
        ctx.lineTo(tx + tw / 2, topY);
        ctx.stroke();

        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.2);
        ctx.fillStyle = `rgba(251, 191, 36, ${0.45 + pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(tx + tw / 2, topY - 40, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Architectural crown setbacks + Tower body
        ctx.fillStyle = isWide ? "rgba(13, 23, 45, 0.95)" : "rgba(13, 23, 45, 0.38)";
        ctx.strokeStyle = isWide ? "rgba(245, 158, 11, 0.55)" : "rgba(245, 158, 11, 0.22)";
        ctx.lineWidth = 1.6;
        // Crown tier
        ctx.fillRect(tx + tw * 0.16, topY - 14, tw * 0.68, 14);
        ctx.strokeRect(tx + tw * 0.16, topY - 14, tw * 0.68, 14);
        // Main shaft
        ctx.fillRect(tx, topY, tw, totalH);
        ctx.strokeRect(tx, topY, tw, totalH);

        // 26 floors from bottom (1F) to top (26F)
        const alphaScale = isWide ? 1 : 0.38;
        for (let f = 1; f <= 26; f++) {
          const fy = bottomY - f * floorH;
          const lit = f <= this.clearedCount;
          ctx.fillStyle = lit
            ? (f <= 8 ? `rgba(56, 189, 248, ${0.52 * alphaScale})` : `rgba(251, 191, 36, ${0.58 * alphaScale})`)
            : `rgba(51, 65, 85, ${0.28 * alphaScale})`;
          ctx.fillRect(tx + 6, fy + 2, tw - 12, Math.max(3, floorH - 3.5));
        }

        // Floor milestone markers on wide desktop
        if (isWide) {
          ctx.font = "700 10px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.fillStyle = "rgba(251, 191, 36, 0.78)";
          ctx.fillText("26F 旗舰顶层", tx + tw + 8, bottomY - 25.3 * floorH);
          ctx.fillStyle = "rgba(56, 189, 248, 0.78)";
          ctx.fillText("09F 科二投研", tx + tw + 8, bottomY - 8.3 * floorH);
          ctx.fillText("01F 科一基座", tx + tw + 8, bottomY - 0.35 * floorH);
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
      this.activeDesk = null; // 'product' | 'compliance' | 'trading' | null
      this.phase = "OPENING"; // 'OPENING' | 'ORDER' | 'SETTLE' | 'BOSS' | 'RESULT'
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

    spawnText(text, color = "#fbbf24") {
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
        color: type === "good" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.3)",
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

      const accent = (this.level && this.level.floorColor) || "#f59e0b";
      const floorNum = (this.level && this.level.floor) || 1;

      // 1. Exterior sky visible through panoramic window
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, this.phase === "BOSS" ? "#1e1b4b" : "#081229");
      sky.addColorStop(1, "#0f1e3a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Exterior distant towers
      const towerCount = 9;
      for (let i = 0; i < towerCount; i++) {
        const bx = (i / towerCount) * w;
        const bw = w / towerCount - 4;
        const bh = h * (0.25 + ((i * 29 + floorNum * 7) % 35) / 100);
        ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
        ctx.fillRect(bx, h * 0.82 - bh, bw, bh);
      }

      // 2. Top LED Market Ticker Beam
      const tickerH = Math.max(22, Math.min(28, h * 0.11));
      ctx.fillStyle = "#060b18";
      ctx.fillRect(0, 0, w, tickerH);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, tickerH);
      ctx.lineTo(w, tickerH);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, tickerH);
      ctx.clip();
      ctx.fillStyle = "#fbbf24";
      ctx.font = `600 ${Math.max(10, Math.floor(tickerH * 0.48))}px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`;
      const tickerStr =
        `📊 帝国大厦实时行情 ｜ 沪深300 ▲1.38% ｜ 中证全债 ▲0.19% ｜ DR007 1.76% ｜ 当前楼层: ${String(floorNum).padStart(2, "0")}F ${(this.level && this.level.deptName) || "筹备厅"} ｜ 中基协合规监测在线   `;
      ctx.fillText(tickerStr + tickerStr, -this.tickerOffset, tickerH * 0.69);
      ctx.restore();

      // 3. Skyscraper Structural Steel Columns & Floor Slab
      const floorY = h * 0.82;
      // Curtain wall mullions
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 2;
      for (let i = 1; i < 6; i++) {
        const mx = (w / 6) * i;
        ctx.beginPath();
        ctx.moveTo(mx, tickerH);
        ctx.lineTo(mx, floorY);
        ctx.stroke();
      }

      // Floor slab & lower floor ceiling hint
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
      floorGrad.addColorStop(0, "#1e293b");
      floorGrad.addColorStop(0.25, "#0f172a");
      floorGrad.addColorStop(1, "#090d1a");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, w, h - floorY);

      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(w, floorY);
      ctx.stroke();

      // Floor number architectural plaque on left pillar
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, 10, tickerH + 8, 86, 24, 6, true, true);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(`${String(floorNum).padStart(2, "0")}F ${(this.level && this.level.themeIcon) || "🏢"}`, 18, tickerH + 24);

      // 4. Three Specialist Workstations inside the Floor
      const desks = [
        { key: "product", label: "产品渠道台", x: w * 0.2, color: "#38bdf8", shirt: "#0ea5e9" },
        { key: "compliance", label: "风控法务台", x: w * 0.5, color: "#f59e0b", shirt: "#eab308" },
        { key: "trading", label: "投研运营台", x: w * 0.8, color: "#10b981", shirt: "#10b981" }
      ];

      const deskW = Math.min(96, w * 0.25);
      const deskH = Math.max(18, Math.min(28, h * 0.12));

      for (let i = 0; i < desks.length; i++) {
        const d = desks[i];
        const isActive = this.phase === "ORDER" && this.activeDesk === d.key;
        const bob = Math.sin(this.time * (isActive ? 6 : 2.6) + i * 1.7) * (isActive ? 3.5 : 1.5);

        // Active spotlight cone
        if (isActive) {
          const spot = ctx.createRadialGradient(d.x, floorY - deskH, 6, d.x, floorY - deskH, deskW * 0.95);
          spot.addColorStop(0, "rgba(251, 191, 36, 0.34)");
          spot.addColorStop(1, "rgba(251, 191, 36, 0)");
          ctx.fillStyle = spot;
          ctx.beginPath();
          ctx.arc(d.x, floorY - deskH, deskW * 0.95, 0, Math.PI * 2);
          ctx.fill();
        }

        // Character avatar behind desk
        const charY = floorY - deskH - 16 + bob;
        // Torso
        ctx.fillStyle = d.shirt;
        this.roundRect(ctx, d.x - 11, charY, 22, 18, 5, true, false);
        // Head
        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.arc(d.x, charY - 8, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Monitor screen glow
        ctx.fillStyle = isActive ? "#fef08a" : "#1e293b";
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, d.x - 16, floorY - deskH - 11, 32, 12, 3, true, true);

        // Desk body
        ctx.fillStyle = isActive ? "#334155" : "#1e293b";
        ctx.strokeStyle = isActive ? "#fbbf24" : "rgba(148, 163, 184, 0.35)";
        ctx.lineWidth = isActive ? 2 : 1;
        this.roundRect(ctx, d.x - deskW / 2, floorY - deskH, deskW, deskH, 5, true, true);

        // Desk nameplate on floor slab
        ctx.fillStyle = isActive ? "#fbbf24" : "#94a3b8";
        ctx.font = `600 ${Math.max(10, Math.min(12, Math.floor(w * 0.026)))}px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(d.label, d.x, floorY + Math.min(16, (h - floorY) * 0.62));

        // Urgent Work Order Alert Bubble above active desk!
        if (isActive) {
          const by = charY - 32 + bob * 0.6;
          ctx.fillStyle = "#f59e0b";
          this.roundRect(ctx, d.x - 32, by - 11, 64, 20, 10, true, false);
          ctx.fillStyle = "#0f172a";
          ctx.font = "800 11px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.fillText("⚡ 待办急件", d.x, by + 3);
        }
      }

      // 5. Boss Phase Inspector Spotlight Overlay
      if (this.phase === "BOSS") {
        const bx = w * 0.5;
        const by = floorY - deskH - 36;
        ctx.fillStyle = "rgba(168, 85, 247, 0.92)";
        this.roundRect(ctx, bx - 66, tickerH + 8, 132, 24, 12, true, false);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 12px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ 协会飞检考官驻场中", bx, tickerH + 24);
      }

      ctx.textAlign = "left";

      // 6. Flash effect
      if (this.flash) {
        ctx.fillStyle = this.flash.color;
        ctx.fillRect(0, 0, w, h);
        this.flash.life -= dt * 3.2;
        if (this.flash.life <= 0) this.flash = null;
      }

      // 7. Floating numbers (+AUM / +NAV / Compliance)
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
        ctx.font = "800 14px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(5, 8, 20, 0.8)";
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }

    resizeIfNeeded() {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width && rect.height && (Math.abs(rect.width - (this.w || 0)) > 2 || Math.abs(rect.height - (this.h || 0)) > 2)) {
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
