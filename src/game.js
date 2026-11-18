// Core Tycoon Engine & Screen State Machine for 《公募帝国：26层摩天楼》
(function () {
  const SAVE_KEY = "fund_empire_26f_save_v1";

  function formatAum(val) {
    if (val >= 100) return `¥${val.toFixed(0)}亿`;
    if (val >= 10) return `¥${val.toFixed(1)}亿`;
    return `¥${val.toFixed(2)}亿`;
  }

  class FundEmpireGame {
    constructor() {
      this.levels = [
        ...(window.LEVELS_ACT1 || []),
        ...(window.LEVELS_ACT2_A || []),
        ...(window.LEVELS_ACT2_B || [])
      ].sort((a, b) => a.floor - b.floor);

      this.save = this.loadSave();
      this.screen = "TITLE"; // TITLE | MAP | PLAY | CODEX
      this.mapAct = 1; // 1 | 2
      this.mapSubPage = 0; // 0 (9-17F) | 1 (18-26F) for compact screens
      this.codexTab = "CARDS"; // CARDS | MISTAKES
      this.codexFloor = 1;
      this.mistakeFeedback = null;

      // Active run state
      this.run = null;

      this.skyline = null;
      this.floorRenderer = null;
      this.lastTs = performance.now();
    }

    loadSave() {
      const fallback = {
        stars: {},
        bestAum: {},
        freeUnlock: false,
        sound: true,
        theme: "night",
        mistakes: []
      };
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return { ...fallback, ...parsed };
      } catch (_) {
        return fallback;
      }
    }

    persist() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
      } catch (_) {}
    }

    init() {
      window.GameAudio.enabled = this.save.sound;
      this.skyline = new window.SkylineBackdrop(document.getElementById("bg-canvas"));
      this.floorRenderer = new window.FloorCutawayRenderer(document.getElementById("floor-canvas"));

      window.addEventListener("resize", () => {
        if (this.screen === "MAP") this.renderMap();
      });

      window.addEventListener("keydown", (e) => this.handleKey(e));

      this.syncBackdrop();
      this.showScreen("TITLE");
      requestAnimationFrame((ts) => this.loop(ts));
    }

    loop(ts) {
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      if (this.skyline) this.skyline.draw(dt);
      if (this.screen === "PLAY" && this.floorRenderer) {
        this.floorRenderer.draw(dt);
      }
      requestAnimationFrame((next) => this.loop(next));
    }

    getClearedCount() {
      return Object.values(this.save.stars).filter((s) => s > 0).length;
    }

    getTotalStars() {
      return Object.values(this.save.stars).reduce((acc, s) => acc + (s || 0), 0);
    }

    getTotalEmpireAum() {
      let sum = 0.5;
      for (const lv of this.levels) {
        if (this.save.bestAum[lv.floor]) {
          sum = Math.max(sum, this.save.bestAum[lv.floor]);
        }
      }
      return sum;
    }

    getNextPlayableFloor() {
      for (let f = 1; f <= 26; f++) {
        if (!this.save.stars[f]) return f;
      }
      return 26;
    }

    isFloorUnlocked(floor) {
      if (this.save.freeUnlock) return true;
      if (floor === 1 || floor === 9) return true; // Both Subject 1 & Subject 2 entry floors open!
      return (this.save.stars[floor - 1] || 0) > 0 || (this.save.stars[floor] || 0) > 0;
    }

    syncBackdrop() {
      if (!this.skyline) return;
      this.skyline.setState({
        theme: this.save.theme,
        clearedCount: Math.max(1, this.getClearedCount()),
        showHeroTower: this.screen === "TITLE"
      });
    }

    showScreen(name) {
      this.screen = name;
      document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
      const target = document.getElementById(`screen-${name.toLowerCase()}`);
      if (target) target.classList.add("active");
      this.syncBackdrop();

      if (name === "TITLE") this.renderTitle();
      if (name === "MAP") this.renderMap();
      if (name === "PLAY") {
        setTimeout(() => this.floorRenderer && this.floorRenderer.resize(), 20);
      }
      if (name === "CODEX") this.renderCodex();
    }

    /* ==================== 1. TITLE SCREEN ==================== */
    renderTitle() {
      const nextFloor = this.getNextPlayableFloor();
      const lv = this.levels.find((x) => x.floor === nextFloor) || this.levels[0];
      const cleared = this.getClearedCount();
      const stars = this.getTotalStars();
      const maxAum = this.getTotalEmpireAum();
      const mistakeCount = this.save.mistakes.length;

      document.getElementById("title-career-pill").innerHTML =
        `<span>🏢 已竣工 <b>${cleared}/26层</b></span>` +
        `<span>💰 峰值规模 <b>${formatAum(maxAum)}</b></span>` +
        `<span>⭐ 金牛星章 <b>${stars}/78</b></span>`;

      const startBtn = document.getElementById("btn-start-career");
      if (lv) {
        startBtn.innerHTML = cleared === 0
          ? `▶ 开始执业生涯 (01F ${lv.deptName})`
          : `▶ 继续建造 (${String(lv.floor).padStart(2, "0")}F ${lv.deptName})`;
      }

      const codexBtn = document.getElementById("btn-open-codex");
      codexBtn.innerHTML = mistakeCount > 0
        ? `📖 考纲图鉴 & 错题本 (${mistakeCount})`
        : `📖 考纲图鉴 & 错题本`;

      document.getElementById("btn-title-sound").textContent = this.save.sound ? "🔊 音效: 开" : "🔇 音效: 关";
    }

    /* ==================== 2. 26-FLOOR LEVEL SELECT ==================== */
    openMap(preferredAct) {
      window.GameAudio.play("click");
      if (preferredAct) {
        this.mapAct = preferredAct;
      } else {
        const nextF = this.getNextPlayableFloor();
        this.mapAct = nextF <= 8 ? 1 : 2;
      }
      this.showScreen("MAP");
    }

    setMapAct(act) {
      window.GameAudio.play("tab");
      this.mapAct = act;
      this.mapSubPage = 0;
      this.renderMap();
    }

    setMapSubPage(p) {
      window.GameAudio.play("tab");
      this.mapSubPage = p;
      this.renderMap();
    }

    toggleFreeUnlock() {
      window.GameAudio.play("click");
      this.save.freeUnlock = !this.save.freeUnlock;
      this.persist();
      this.renderMap();
    }

    renderMap() {
      document.getElementById("tab-act1").classList.toggle("active", this.mapAct === 1);
      document.getElementById("tab-act2").classList.toggle("active", this.mapAct === 2);
      document.getElementById("map-star-badge").textContent = `⭐ ${this.getTotalStars()}/78`;

      const freeBtn = document.getElementById("btn-free-unlock");
      freeBtn.innerHTML = this.save.freeUnlock
        ? `🔓 自由<span class="hide-mobile">选层</span>`
        : `🔒 闯关<span class="hide-mobile">解锁</span>`;
      freeBtn.classList.toggle("g-btn-cyan", this.save.freeUnlock);

      const isCompactAct2 = this.mapAct === 2 && window.innerWidth < 960;
      const subBar = document.getElementById("map-subzone");
      subBar.classList.toggle("visible", isCompactAct2);
      if (isCompactAct2) {
        document.getElementById("sub-p0").classList.toggle("g-btn-gold", this.mapSubPage === 0);
        document.getElementById("sub-p1").classList.toggle("g-btn-gold", this.mapSubPage === 1);
      }

      const grid = document.getElementById("map-grid");
      grid.className = "map-grid-wrap " + (
        this.mapAct === 1
          ? "map-grid-act1"
          : (isCompactAct2 ? "map-grid-act2-paged" : "map-grid-act2-desktop")
      );

      let list = this.levels.filter((x) => x.act === this.mapAct);
      if (isCompactAct2) {
        list = this.mapSubPage === 0 ? list.slice(0, 9) : list.slice(9, 18);
      }

      const nextFloor = this.getNextPlayableFloor();
      grid.innerHTML = list.map((lv) => {
        const unlocked = this.isFloorUnlocked(lv.floor);
        const starCount = this.save.stars[lv.floor] || 0;
        const isCurrent = lv.floor === nextFloor;
        const starsHtml = [1, 2, 3]
          .map((i) => `<span class="${i <= starCount ? "lit" : ""}">★</span>`)
          .join("");
        const shortChapter = lv.chapterCode.replace("科目一 · ", "一·").replace("科目二 · ", "二·");

        return `
          <button class="floor-card ${starCount > 0 ? "cleared" : ""} ${isCurrent ? "current" : ""} ${!unlocked ? "locked" : ""}"
                  data-floor="${lv.floor}">
            <div class="fc-top">
              <span class="fc-num">${String(lv.floor).padStart(2, "0")}F</span>
              <span class="fc-stars">${unlocked ? starsHtml : "🔒"}</span>
            </div>
            <div class="fc-mid">
              <div class="fc-dept">${lv.themeIcon} ${lv.deptName}</div>
              <div class="fc-chap">${shortChapter}｜${lv.chapterTitle}</div>
            </div>
            <div class="fc-bot">
              <span>${formatAum(lv.targetAum)}</span>
              <span>${starCount > 0 ? "已竣工" : (unlocked ? "建造 ▶" : "待建")}</span>
            </div>
          </button>
        `;
      }).join("");

      grid.querySelectorAll(".floor-card").forEach((btn) => {
        btn.addEventListener("click", () => {
          const f = Number(btn.getAttribute("data-floor"));
          if (!this.isFloorUnlocked(f)) {
            window.GameAudio.play("wrong");
            return;
          }
          this.startFloor(f);
        });
      });
    }

    /* ==================== 3. FLOOR TYCOON SIMULATION ==================== */
    startFloor(floorNum) {
      const lv = this.levels.find((x) => x.floor === floorNum);
      if (!lv) return;
      window.GameAudio.play("bell");

      this.run = {
        level: lv,
        phase: "OPENING", // OPENING | ORDER | SETTLE | BOSS | BOSS_SETTLE | RESULT | SUSPENDED
        aum: lv.startAum,
        nav: 1.0,
        compliance: 85,
        stance: "balanced", // safe | growth | balanced
        hintUsed: false,
        eliminatedIdx: -1,
        orderIdx: 0,
        bossIdx: 0,
        correctCount: 0,
        totalAnswered: 0,
        lastFeedback: null
      };

      this.showScreen("PLAY");
      this.renderPlay();
    }

    setStance(mode) {
      if (!this.run) return;
      window.GameAudio.play("tab");
      this.run.stance = mode;
      this.renderPlayHud();
    }

    useResearchHint() {
      if (!this.run || this.run.hintUsed) return;
      if (this.run.phase !== "ORDER" && this.run.phase !== "BOSS") return;

      let wrongIndices = [];
      if (this.run.phase === "ORDER") {
        const ord = this.run.level.workOrders[this.run.orderIdx];
        ord.options.forEach((o, i) => {
          if (!o.ok) wrongIndices.push(i);
        });
      } else if (this.run.phase === "BOSS") {
        const bq = this.run.level.bossQuestions[this.run.bossIdx];
        bq.opts.forEach((_, i) => {
          if (i !== bq.ans) wrongIndices.push(i);
        });
      }
      if (!wrongIndices.length) return;
      this.run.hintUsed = true;
      this.run.eliminatedIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      window.GameAudio.play("hint");
      this.renderPlay();
    }

    renderPlayHud() {
      const r = this.run;
      if (!r) return;
      const lv = r.level;

      document.getElementById("play-floor-title").textContent =
        `${String(lv.floor).padStart(2, "0")}F · ${lv.deptName}`;
      document.getElementById("play-chap-sub").textContent =
        `${lv.chapterCode}《${lv.chapterTitle}》`;

      document.getElementById("hud-aum").textContent = formatAum(r.aum);
      const navEl = document.getElementById("hud-nav");
      navEl.textContent = r.nav.toFixed(4);
      navEl.style.color = r.nav >= 1.0 ? "#34d399" : "#f87171";

      const compEl = document.getElementById("hud-comp");
      compEl.textContent = `${r.compliance}`;
      compEl.style.color = r.compliance >= 50 ? "#fbbf24" : "#f87171";

      // Progress bar toward 2-star AUM target
      const pct = Math.min(100, Math.max(6, (r.aum / lv.targetAum) * 100));
      document.getElementById("aum-bar-fill").style.width = `${pct}%`;
      document.getElementById("aum-bar-label").textContent =
        `${formatAum(r.aum)} / 目标 ${formatAum(lv.targetAum)}`;

      // Stance buttons
      document.getElementById("stance-safe").classList.toggle("active", r.stance === "safe");
      document.getElementById("stance-growth").classList.toggle("active", r.stance === "growth");
      const hintBtn = document.getElementById("btn-use-hint");
      hintBtn.disabled = r.hintUsed || (r.phase !== "ORDER" && r.phase !== "BOSS");
      hintBtn.innerHTML = r.hintUsed
        ? `🔍 内参已用<small>本层限1次</small>`
        : `🔍 投研内参<small>排除1个错项</small>`;
    }

    renderPlay() {
      const r = this.run;
      if (!r) return;
      const lv = r.level;
      this.renderPlayHud();

      const activeOrder = r.phase === "ORDER" ? lv.workOrders[r.orderIdx] : null;
      this.floorRenderer.setFloorState({
        level: lv,
        activeDesk: activeOrder ? activeOrder.desk : null,
        phase: r.phase === "BOSS" || r.phase === "BOSS_SETTLE" ? "BOSS" : r.phase
      });

      const pane = document.getElementById("command-pane");

      // Phase A: Floor Opening & 4 Core Syllabus Rules
      if (r.phase === "OPENING") {
        pane.innerHTML = `
          <div class="phase-header">
            <span class="phase-pill">🏗️ 新部门挂牌 · 考纲执业蓝图</span>
            <span style="font-size:12px;color:var(--text-muted)">目标规模: <b style="color:var(--gold-bright)">${formatAum(lv.targetAum)}</b></span>
          </div>
          <div class="cheat-grid">
            ${lv.cheatSheet.map((c, idx) => `
              <div class="cheat-card">
                <div class="cheat-tag">📌 核心铁律 0${idx + 1} · ${c.tag}</div>
                <div class="cheat-rule">${c.rule}</div>
              </div>
            `).join("")}
          </div>
          <button class="g-btn g-btn-gold" id="btn-launch-ops" style="width:100%;padding:12px">
            🔔 敲钟开业 · 启动季度经营 (4单实务 + 协会飞检)
          </button>
        `;
        document.getElementById("btn-launch-ops").onclick = () => {
          window.GameAudio.play("bell");
          r.phase = "ORDER";
          r.eliminatedIdx = -1;
          this.renderPlay();
        };
        return;
      }

      // Phase B: Work Orders (Q1 - Q4)
      if (r.phase === "ORDER" || r.phase === "SETTLE") {
        const ord = lv.workOrders[r.orderIdx];
        const settled = r.phase === "SETTLE";
        const quarters = ["Q1 春季建仓季", "Q2 仲夏扩张季", "Q3 金秋调仓季", "Q4 年终决算季"];

        pane.innerHTML = `
          <div class="phase-header">
            <span class="phase-pill">📋 ${quarters[r.orderIdx] || "经营工单"} (${r.orderIdx + 1}/${lv.workOrders.length})</span>
            <span style="font-size:11.5px;color:#7dd3fc;font-weight:700">【${ord.type}工单】</span>
          </div>
          <div class="order-box">
            <div class="order-meta">
              <span>📨 来件人：${ord.sender}</span>
              <span>方针：${r.stance === "growth" ? "🚀 规模冲刺" : (r.stance === "safe" ? "🛡️ 稳健合规" : "⚖️ 均衡执业")}</span>
            </div>
            <div class="order-prompt">${ord.prompt}</div>
          </div>
          <div class="options-stack">
            ${ord.options.map((opt, idx) => {
              let cls = "";
              if (!settled && r.eliminatedIdx === idx) cls = "eliminated";
              if (settled) {
                if (opt.ok) cls = "correct";
                else if (r.lastFeedback && r.lastFeedback.chosen === idx) cls = "wrong";
              }
              return `
                <button class="opt-btn ${cls}" data-idx="${idx}" ${settled ? "disabled" : ""}>
                  <span class="opt-key">${idx + 1}</span>
                  <span>${opt.label}</span>
                </button>
              `;
            }).join("")}
          </div>
          ${settled ? `
            <div class="feedback-banner ${r.lastFeedback.ok ? "good" : "bad"}">
              <b>${r.lastFeedback.ok ? "✅ 执业精准：" : "⚠️ 违规/失误警示："}</b>${r.lastFeedback.note}
            </div>
            <button class="g-btn g-btn-gold" id="btn-next-step" style="width:100%">
              ${r.orderIdx + 1 < lv.workOrders.length ? "▶ 进入下一季度工单 (Space)" : "⚡ 迎战年度“协会飞检”考核 (Space)"}
            </button>
          ` : `
            <div style="font-size:11px;color:var(--text-muted);text-align:center">
              💡 提示：随时可点顶部【📘 秘籍】查阅本章考纲铁律，或用左侧【🔍 投研内参】排错
            </div>
          `}
        `;

        if (!settled) {
          pane.querySelectorAll(".opt-btn").forEach((b) => {
            b.onclick = () => this.chooseOrderOption(Number(b.getAttribute("data-idx")));
          });
        } else {
          document.getElementById("btn-next-step").onclick = () => this.advanceFromOrder();
        }
        return;
      }

      // Phase C: Boss Inspection (3 Real-Exam Questions)
      if (r.phase === "BOSS" || r.phase === "BOSS_SETTLE") {
        const bq = lv.bossQuestions[r.bossIdx];
        const settled = r.phase === "BOSS_SETTLE";
        const letters = ["A", "B", "C", "D"];

        pane.innerHTML = `
          <div class="phase-header">
            <span class="phase-pill boss">⚡ 中基协&证监局联合飞检 (${r.bossIdx + 1}/${lv.bossQuestions.length})</span>
            <span style="font-size:11.5px;color:#e9d5ff;font-weight:700">真题终审</span>
          </div>
          <div class="order-box" style="border-color:rgba(168,85,247,0.45)">
            <div class="order-meta" style="color:#d8b4fe">
              <span>🕵️ 飞检主考官提问</span>
              <span>当前正确率：${r.correctCount}/${r.totalAnswered}</span>
            </div>
            <div class="order-prompt">${bq.q}</div>
          </div>
          <div class="options-stack">
            ${bq.opts.map((txt, idx) => {
              let cls = "";
              if (!settled && r.eliminatedIdx === idx) cls = "eliminated";
              if (settled) {
                if (idx === bq.ans) cls = "correct";
                else if (r.lastFeedback && r.lastFeedback.chosen === idx) cls = "wrong";
              }
              return `
                <button class="opt-btn ${cls}" data-idx="${idx}" ${settled ? "disabled" : ""}>
                  <span class="opt-key">${letters[idx]}</span>
                  <span>${txt}</span>
                </button>
              `;
            }).join("")}
          </div>
          ${settled ? `
            <div class="feedback-banner ${r.lastFeedback.ok ? "good" : "bad"}">
              <b>${r.lastFeedback.ok ? "🎯 飞检过关：" : "❌ 考点盲区："}</b>${bq.exp}
            </div>
            <button class="g-btn g-btn-gold" id="btn-next-boss" style="width:100%">
              ${r.bossIdx + 1 < lv.bossQuestions.length ? "▶ 下一道飞检抽查 (Space)" : "🏆 查看楼层竣工验收报告 (Space)"}
            </button>
          ` : ""}
        `;

        if (!settled) {
          pane.querySelectorAll(".opt-btn").forEach((b) => {
            b.onclick = () => this.chooseBossOption(Number(b.getAttribute("data-idx")));
          });
        } else {
          document.getElementById("btn-next-boss").onclick = () => this.advanceFromBoss();
        }
        return;
      }

      // Phase D: Regulatory Suspension (Compliance <= 0)
      if (r.phase === "SUSPENDED") {
        pane.innerHTML = `
          <div class="result-card">
            <div style="font-size:42px">🚨</div>
            <h3 style="font-size:20px;color:#f87171">合规护盾归零 · 责令停业整顿</h3>
            <p style="font-size:13px;color:var(--text-sub);max-width:380px;line-height:1.5">
              由于连续触碰监管合规红线，本楼层试运营被紧急叫停。建议先开启【🛡️ 稳健合规】方针或查阅【📘 秘籍】后重新挂牌！
            </p>
            <div style="display:flex;gap:10px;width:100%;justify-content:center;margin-top:6px">
              <button class="g-btn g-btn-gold" id="btn-retry-floor">🔄 整顿完毕 · 重新建造本层</button>
              <button class="g-btn" id="btn-back-map">🗺 返回蓝图</button>
            </div>
          </div>
        `;
        document.getElementById("btn-retry-floor").onclick = () => this.startFloor(lv.floor);
        document.getElementById("btn-back-map").onclick = () => this.openMap(lv.act);
        return;
      }

      // Phase E: Floor Completion & Star Rating
      if (r.phase === "RESULT") {
        const accuracy = Math.round((r.correctCount / r.totalAnswered) * 100);
        const passed = accuracy >= 57 && r.compliance > 0;
        let stars = 0;
        if (passed) {
          stars = 1;
          if (r.aum >= lv.targetAum) stars = 2;
          if (r.aum >= lv.targetAum && r.correctCount >= 6) stars = 3;
        }

        const starsHtml = [1, 2, 3]
          .map((i) => `<span class="${i <= stars ? "lit" : ""}">★</span>`)
          .join("");

        const nextLv = this.levels.find((x) => x.floor === lv.floor + 1);

        pane.innerHTML = `
          <div class="result-card">
            <span class="phase-pill">${passed ? "🎉 楼层竣工验收通过" : "📝 考核未达60%从业及格线"}</span>
            <div class="big-stars">${starsHtml}</div>
            <h3 style="font-size:18px;color:#fef3c7">
              ${stars === 3 ? "🏆 斩获金牛卓越奖 · 完美执业！" : (stars === 2 ? "✨ 规模与合规双达标！" : (stars === 1 ? "✅ 顺利竣工（冲刺规模可夺3星）" : "⚠️ 差一点及格，复盘错题再战一局！"))}
            </h3>
            <div class="result-stats-grid">
              <div class="res-stat">期末规模<b>${formatAum(r.aum)}</b></div>
              <div class="res-stat">期末净值<b>${r.nav.toFixed(4)}</b></div>
              <div class="res-stat">综合正确率<b>${accuracy}% (${r.correctCount}/${r.totalAnswered})</b></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%">
              ${passed && nextLv ? `<button class="g-btn g-btn-gold" id="btn-next-floor">🏢 建造 ${String(nextLv.floor).padStart(2, "0")}F · ${nextLv.deptName} ▶</button>` : ""}
              <button class="g-btn ${!passed ? "g-btn-gold" : ""}" id="btn-replay-floor">🔄 ${stars < 3 ? "重玩冲刺三星" : "再刷一次巩固"}</button>
              <button class="g-btn" id="btn-res-map">🗺 摩天楼选关</button>
            </div>
          </div>
        `;

        const nextBtn = document.getElementById("btn-next-floor");
        if (nextBtn && nextLv) nextBtn.onclick = () => this.startFloor(nextLv.floor);
        document.getElementById("btn-replay-floor").onclick = () => this.startFloor(lv.floor);
        document.getElementById("btn-res-map").onclick = () => this.openMap(nextLv ? nextLv.act : lv.act);
      }
    }

    chooseOrderOption(idx) {
      const r = this.run;
      const lv = r.level;
      const ord = lv.workOrders[r.orderIdx];
      const opt = ord.options[idx];
      if (!opt) return;

      r.totalAnswered += 1;
      const gap = Math.max(0.2, lv.targetAum - lv.startAum);

      if (opt.ok) {
        r.correctCount += 1;
        const mult = r.stance === "growth" ? 1.32 : 1.0;
        const deltaAum = Math.max(lv.startAum * ((opt.aumPct || 20) / 100), gap * 0.29) * mult;
        r.aum = +(r.aum + deltaAum).toFixed(2);
        r.nav = +(r.nav * (1 + Math.abs(opt.navPct || 2.2) / 100)).toFixed(4);
        r.compliance = Math.min(100, r.compliance + Math.max(4, opt.comp || 6));

        window.GameAudio.play("coin");
        this.floorRenderer.triggerFlash("good");
        this.floorRenderer.spawnText(`+${formatAum(deltaAum)}`, "#34d399");
      } else {
        const mult = r.stance === "growth" ? 1.3 : 1.0;
        const lossAum = gap * 0.14 * mult;
        r.aum = +Math.max(lv.startAum * 0.45, r.aum - lossAum).toFixed(2);
        r.nav = +Math.max(0.65, r.nav * (1 - Math.abs(opt.navPct || 1.8) / 100 * mult)).toFixed(4);
        const rawComp = opt.comp < 0 ? opt.comp : -18;
        const compLoss = r.stance === "safe" ? Math.ceil(rawComp * 0.5) : rawComp;
        r.compliance = Math.max(0, r.compliance + compLoss);

        this.recordMistake({
          id: `ord_${lv.floor}_${r.orderIdx}`,
          floor: lv.floor,
          chapterCode: lv.chapterCode,
          prompt: ord.prompt,
          opts: ord.options.map((o) => o.label),
          ans: ord.options.findIndex((o) => o.ok),
          exp: ord.options.find((o) => o.ok).note
        });

        window.GameAudio.play("wrong");
        this.floorRenderer.triggerFlash("bad");
        this.floorRenderer.spawnText(`合规 ${compLoss}`, "#f87171");
      }

      r.lastFeedback = { chosen: idx, ok: !!opt.ok, note: opt.note };
      r.phase = "SETTLE";
      this.renderPlay();
    }

    advanceFromOrder() {
      const r = this.run;
      if (!r) return;
      if (r.compliance <= 0) {
        window.GameAudio.play("fail");
        r.phase = "SUSPENDED";
        this.renderPlay();
        return;
      }
      r.eliminatedIdx = -1;
      if (r.orderIdx + 1 < r.level.workOrders.length) {
        window.GameAudio.play("click");
        r.orderIdx += 1;
        r.phase = "ORDER";
      } else {
        window.GameAudio.play("boss");
        r.bossIdx = 0;
        r.phase = "BOSS";
      }
      this.renderPlay();
    }

    chooseBossOption(idx) {
      const r = this.run;
      const lv = r.level;
      const bq = lv.bossQuestions[r.bossIdx];
      const ok = idx === bq.ans;
      r.totalAnswered += 1;
      const gap = Math.max(0.2, lv.targetAum - lv.startAum);

      if (ok) {
        r.correctCount += 1;
        const bonus = gap * 0.14;
        r.aum = +(r.aum + bonus).toFixed(2);
        r.compliance = Math.min(100, r.compliance + 5);
        window.GameAudio.play("coin");
        this.floorRenderer.triggerFlash("good");
        this.floorRenderer.spawnText(`飞检加分 +${formatAum(bonus)}`, "#fbbf24");
      } else {
        const compLoss = r.stance === "safe" ? -8 : -15;
        r.compliance = Math.max(0, r.compliance + compLoss);
        this.recordMistake({
          id: `boss_${lv.floor}_${r.bossIdx}`,
          floor: lv.floor,
          chapterCode: lv.chapterCode,
          prompt: bq.q,
          opts: bq.opts,
          ans: bq.ans,
          exp: bq.exp
        });
        window.GameAudio.play("wrong");
        this.floorRenderer.triggerFlash("bad");
        this.floorRenderer.spawnText(`飞检扣分 ${compLoss}`, "#f87171");
      }

      r.lastFeedback = { chosen: idx, ok };
      r.phase = "BOSS_SETTLE";
      this.renderPlay();
    }

    advanceFromBoss() {
      const r = this.run;
      if (!r) return;
      if (r.compliance <= 0) {
        window.GameAudio.play("fail");
        r.phase = "SUSPENDED";
        this.renderPlay();
        return;
      }
      r.eliminatedIdx = -1;
      if (r.bossIdx + 1 < r.level.bossQuestions.length) {
        window.GameAudio.play("click");
        r.bossIdx += 1;
        r.phase = "BOSS";
        this.renderPlay();
      } else {
        this.finishFloor();
      }
    }

    finishFloor() {
      const r = this.run;
      const lv = r.level;
      const accuracy = Math.round((r.correctCount / r.totalAnswered) * 100);
      const passed = accuracy >= 57 && r.compliance > 0;
      let stars = 0;
      if (passed) {
        stars = 1;
        if (r.aum >= lv.targetAum) stars = 2;
        if (r.aum >= lv.targetAum && r.correctCount >= 6) stars = 3;

        const prevStars = this.save.stars[lv.floor] || 0;
        if (stars > prevStars) this.save.stars[lv.floor] = stars;
        const prevAum = this.save.bestAum[lv.floor] || 0;
        if (r.aum > prevAum) this.save.bestAum[lv.floor] = r.aum;
        this.persist();
        this.syncBackdrop();
        window.GameAudio.play("win");
      } else {
        window.GameAudio.play("fail");
      }
      r.phase = "RESULT";
      this.renderPlay();
    }

    recordMistake(item) {
      if (!this.save.mistakes.some((m) => m.id === item.id)) {
        this.save.mistakes.unshift(item);
        if (this.save.mistakes.length > 60) this.save.mistakes.pop();
        this.persist();
      }
    }

    /* ==================== 4. CODEX & MISTAKE BOOK ==================== */
    openCodex(tab = "CARDS") {
      window.GameAudio.play("click");
      this.codexTab = tab;
      this.mistakeFeedback = null;
      this.showScreen("CODEX");
    }

    renderCodex() {
      document.getElementById("tab-codex-cards").classList.toggle("active", this.codexTab === "CARDS");
      const mTab = document.getElementById("tab-codex-mistakes");
      mTab.classList.toggle("active", this.codexTab === "MISTAKES");
      mTab.textContent = `🩹 错题整改特训 (${this.save.mistakes.length})`;

      const body = document.getElementById("codex-body");

      if (this.codexTab === "CARDS") {
        const lv = this.levels.find((x) => x.floor === this.codexFloor) || this.levels[0];
        body.innerHTML = `
          <div class="floor-pills-row">
            ${this.levels.map((item) => `
              <button class="f-pill ${item.floor === lv.floor ? "active" : ""}" data-f="${item.floor}">
                ${String(item.floor).padStart(2, "0")}F
              </button>
            `).join("")}
          </div>
          <div class="codex-detail-head">
            <span style="font-size:13px;font-weight:800;color:var(--gold-bright)">
              ${lv.themeIcon} ${String(lv.floor).padStart(2, "0")}F ${lv.deptName} · ${lv.chapterCode}《${lv.chapterTitle}》
            </span>
            <button class="g-btn g-btn-sm g-btn-gold" id="btn-codex-play">▶ 直接实战本层</button>
          </div>
          <div class="cheat-grid">
            ${lv.cheatSheet.map((c, idx) => `
              <div class="cheat-card">
                <div class="cheat-tag">📘 考点 0${idx + 1} · ${c.tag}</div>
                <div class="cheat-rule">${c.rule}</div>
              </div>
            `).join("")}
          </div>
        `;

        body.querySelectorAll(".f-pill").forEach((b) => {
          b.onclick = () => {
            window.GameAudio.play("tab");
            this.codexFloor = Number(b.getAttribute("data-f"));
            this.renderCodex();
          };
        });
        document.getElementById("btn-codex-play").onclick = () => {
          this.save.freeUnlock = true;
          this.persist();
          this.startFloor(lv.floor);
        };
        return;
      }

      // Mistakes Drill Mode
      if (!this.save.mistakes.length) {
        body.innerHTML = `
          <div class="result-card">
            <div style="font-size:44px">🏅</div>
            <h3 style="font-size:18px;color:#34d399">零待整改错题 · 合规档案完美！</h3>
            <p style="font-size:13px;color:var(--text-muted)">你在经营闯关与协会飞检中答错的题目会自动收录至此，答对即可销号移除。</p>
          </div>
        `;
        return;
      }

      const cur = this.save.mistakes[0];
      const settled = !!this.mistakeFeedback;

      body.innerHTML = `
        <div class="codex-detail-head">
          <span style="font-size:12.5px;font-weight:800;color:#fca5a5">
            🩹 待销号错题 (剩余 ${this.save.mistakes.length} 题) ｜ 来源：${String(cur.floor).padStart(2, "0")}F · ${cur.chapterCode}
          </span>
          <span style="font-size:11.5px;color:var(--text-muted)">答对自动移出错题档案</span>
        </div>
        <div class="order-box">
          <div class="order-prompt">${cur.prompt}</div>
        </div>
        <div class="options-stack">
          ${cur.opts.map((txt, idx) => {
            let cls = "";
            if (settled) {
              if (idx === cur.ans) cls = "correct";
              else if (this.mistakeFeedback.chosen === idx) cls = "wrong";
            }
            return `
              <button class="opt-btn ${cls}" data-idx="${idx}" ${settled ? "disabled" : ""}>
                <span class="opt-key">${idx + 1}</span>
                <span>${txt}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${settled ? `
          <div class="feedback-banner ${this.mistakeFeedback.ok ? "good" : "bad"}">
            <b>${this.mistakeFeedback.ok ? "✅ 整改销号成功：" : "❌ 仍需巩固（已移至队尾）："}</b>${cur.exp}
          </div>
          <button class="g-btn g-btn-gold" id="btn-next-mistake" style="width:100%">▶ 下一道待整改题</button>
        ` : ""}
      `;

      if (!settled) {
        body.querySelectorAll(".opt-btn").forEach((b) => {
          b.onclick = () => {
            const chosen = Number(b.getAttribute("data-idx"));
            const ok = chosen === cur.ans;
            window.GameAudio.play(ok ? "coin" : "wrong");
            this.mistakeFeedback = { chosen, ok };
            this.renderCodex();
          };
        });
      } else {
        document.getElementById("btn-next-mistake").onclick = () => {
          const item = this.save.mistakes.shift();
          if (!this.mistakeFeedback.ok && item) {
            this.save.mistakes.push(item);
          }
          this.mistakeFeedback = null;
          this.persist();
          this.renderCodex();
        };
      }
    }

    /* ==================== MODALS & KEYBOARD ==================== */
    openCheatModal() {
      if (!this.run) return;
      window.GameAudio.play("click");
      const lv = this.run.level;
      const mask = document.getElementById("modal-cheat");
      document.getElementById("modal-cheat-title").textContent =
        `📘 ${String(lv.floor).padStart(2, "0")}F 执业秘籍 · ${lv.chapterTitle}`;
      document.getElementById("modal-cheat-list").innerHTML = lv.cheatSheet.map((c) => `
        <div class="cheat-card" style="padding:10px">
          <div class="cheat-tag">📌 ${c.tag}</div>
          <div class="cheat-rule">${c.rule}</div>
        </div>
      `).join("");
      mask.classList.add("open");
    }

    openSettingsModal() {
      window.GameAudio.play("click");
      this.syncSettingsUI();
      document.getElementById("modal-settings").classList.add("open");
    }

    syncSettingsUI() {
      document.getElementById("set-sound-btn").textContent = this.save.sound ? "🔊 已开启" : "🔇 已静音";
      document.getElementById("set-theme-btn").textContent = this.save.theme === "night" ? "🌃 夜幕陆家嘴" : "🌅 晨曦外滩";
      document.getElementById("set-unlock-btn").textContent = this.save.freeUnlock ? "🔓 全部26层可自由选关" : "🔒 按章节闯关解锁";
    }

    handleKey(e) {
      if (document.querySelector(".modal-mask.open")) {
        if (e.key === "Escape") {
          document.querySelectorAll(".modal-mask").forEach((m) => m.classList.remove("open"));
        }
        return;
      }
      if (this.screen !== "PLAY" || !this.run) return;
      const r = this.run;
      const keyMap = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      const k = e.key.toLowerCase();

      if (r.phase === "ORDER" && keyMap[k] !== undefined && keyMap[k] < 3 && r.eliminatedIdx !== keyMap[k]) {
        this.chooseOrderOption(keyMap[k]);
      } else if (r.phase === "BOSS" && keyMap[k] !== undefined && keyMap[k] < 4 && r.eliminatedIdx !== keyMap[k]) {
        this.chooseBossOption(keyMap[k]);
      } else if ((e.key === " " || e.key === "Enter") && r.phase === "SETTLE") {
        e.preventDefault();
        this.advanceFromOrder();
      } else if ((e.key === " " || e.key === "Enter") && r.phase === "BOSS_SETTLE") {
        e.preventDefault();
        this.advanceFromBoss();
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const game = new FundEmpireGame();
    window.appGame = game;
    game.init();

    // Title buttons
    document.getElementById("btn-start-career").onclick = () => {
      game.startFloor(game.getNextPlayableFloor());
    };
    document.getElementById("btn-open-map").onclick = () => game.openMap();
    document.getElementById("btn-open-codex").onclick = () => game.openCodex("CARDS");
    document.getElementById("btn-open-settings").onclick = () => game.openSettingsModal();
    document.getElementById("btn-title-sound").onclick = () => {
      game.save.sound = !game.save.sound;
      window.GameAudio.setEnabled(game.save.sound);
      game.persist();
      game.renderTitle();
    };

    // Map buttons
    document.getElementById("btn-map-home").onclick = () => {
      window.GameAudio.play("click");
      game.showScreen("TITLE");
    };
    document.getElementById("tab-act1").onclick = () => game.setMapAct(1);
    document.getElementById("tab-act2").onclick = () => game.setMapAct(2);
    document.getElementById("sub-p0").onclick = () => game.setMapSubPage(0);
    document.getElementById("sub-p1").onclick = () => game.setMapSubPage(1);
    document.getElementById("btn-free-unlock").onclick = () => game.toggleFreeUnlock();

    // Play HUD buttons
    document.getElementById("btn-play-back").onclick = () => {
      window.GameAudio.play("click");
      game.openMap(game.run ? game.run.level.act : 1);
    };
    document.getElementById("btn-play-cheat").onclick = () => game.openCheatModal();
    document.getElementById("stance-safe").onclick = () => game.setStance(game.run && game.run.stance === "safe" ? "balanced" : "safe");
    document.getElementById("stance-growth").onclick = () => game.setStance(game.run && game.run.stance === "growth" ? "balanced" : "growth");
    document.getElementById("btn-use-hint").onclick = () => game.useResearchHint();

    // Codex buttons
    document.getElementById("btn-codex-home").onclick = () => {
      window.GameAudio.play("click");
      game.showScreen("TITLE");
    };
    document.getElementById("tab-codex-cards").onclick = () => {
      window.GameAudio.play("tab");
      game.codexTab = "CARDS";
      game.renderCodex();
    };
    document.getElementById("tab-codex-mistakes").onclick = () => {
      window.GameAudio.play("tab");
      game.codexTab = "MISTAKES";
      game.mistakeFeedback = null;
      game.renderCodex();
    };

    // Modal close & Settings actions
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.onclick = () => {
        window.GameAudio.play("click");
        btn.closest(".modal-mask").classList.remove("open");
      };
    });
    document.querySelectorAll(".modal-mask").forEach((mask) => {
      mask.addEventListener("click", (e) => {
        if (e.target === mask) mask.classList.remove("open");
      });
    });

    document.getElementById("set-sound-btn").onclick = () => {
      game.save.sound = !game.save.sound;
      window.GameAudio.setEnabled(game.save.sound);
      game.persist();
      game.syncSettingsUI();
      game.renderTitle();
    };
    document.getElementById("set-theme-btn").onclick = () => {
      game.save.theme = game.save.theme === "night" ? "dawn" : "night";
      window.GameAudio.play("tab");
      game.persist();
      game.syncBackdrop();
      game.syncSettingsUI();
    };
    document.getElementById("set-unlock-btn").onclick = () => {
      game.save.freeUnlock = !game.save.freeUnlock;
      window.GameAudio.play("click");
      game.persist();
      game.syncSettingsUI();
    };
    document.getElementById("set-reset-btn").onclick = () => {
      if (confirm("确定要清空当前建造进度与错题记录，重新开始执业生涯吗？")) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
      }
    };

    // Optional deep-link hash support (#map1, #map2, #floor=13, #order=13, #boss=23, #codex)
    const applyHashRoute = () => {
      const h = (location.hash || "").replace(/^#/, "");
      if (!h) return;
      if (h === "map1") game.openMap(1);
      else if (h === "map2") game.openMap(2);
      else if (h === "codex") game.openCodex("CARDS");
      else if (h.startsWith("floor=")) {
        const f = Number(h.split("=")[1]) || 1;
        game.startFloor(f);
      } else if (h.startsWith("order=")) {
        const f = Number(h.split("=")[1]) || 1;
        game.startFloor(f);
        if (game.run) {
          game.run.phase = "ORDER";
          game.renderPlay();
        }
      } else if (h.startsWith("boss=")) {
        const f = Number(h.split("=")[1]) || 1;
        game.startFloor(f);
        if (game.run) {
          game.run.phase = "BOSS";
          game.renderPlay();
        }
      }
    };
    applyHashRoute();
    window.addEventListener("hashchange", applyHashRoute);
  });
})();
