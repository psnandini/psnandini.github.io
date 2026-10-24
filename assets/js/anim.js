(function () {
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FONT = '"Manrope", Arial, sans-serif';
  const C = {
    ink: "#1f1f1f", muted: "#8a8a8a", rule: "#e3e3df", blue: "#2b5d8a", warm: "#b8562f",
    green: "#5f8f6a", cortex: "#9c1c1c", thal: "#1f3556",
  };
  function run(canvas, draw, stillT) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, visible = true, raf = 0, t0 = performance.now();
    function size() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (REDUCE || !visible) frame(stillT != null ? stillT * 1000 + t0 : performance.now());
    }
    function frame(now) {
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, (now - t0) / 1000);
    }
    function loop(now) {
      frame(now);
      if (visible && !REDUCE) raf = requestAnimationFrame(loop);
    }
    new ResizeObserver(size).observe(canvas);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible && !REDUCE) raf = requestAnimationFrame(loop);
      }).observe(canvas);
    }
    size();
    if (!REDUCE) raf = requestAnimationFrame(loop);
    else frame(t0 + (stillT || 0) * 1000);
  }

  function label(ctx, text, x, y, color, opts = {}) {
    ctx.font = `${opts.weight || 600} ${opts.size || 12.5}px ${FONT}`;
    ctx.fillStyle = color || C.muted;
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.base || "alphabetic";
    ctx.fillText(text, x, y);
  }
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const mdr = document.getElementById("anim-mdr");
  if (mdr) {
    const LAG = 3.5;
    const neural = (d) => 0.62 * Math.sin(2 * Math.PI * d / 14) + 0.3 * Math.sin(2 * Math.PI * d / 31 + 1.1);
    const mood = (d) => neural(d - LAG);
    run(mdr, (ctx, w, h, t) => {
      const padL = 26, padR = 26, top = 46, bot = h - 46;
      const span = 70, today = 0.68;
      const d0 = t * 2.2;
      const X = (d) => padL + ((d - d0) / span) * (w - padL - padR);
      const dToday = d0 + today * span;
      const yN = (v) => top + (bot - top) * 0.3 - v * (bot - top) * 0.2;
      const yM = (v) => top + (bot - top) * 0.74 - v * (bot - top) * 0.2;
      ctx.fillStyle = "rgba(184,86,47,0.08)";
      let bandStart = null;
      for (let d = Math.floor(d0 * 8) / 8; d <= d0 + span + 0.25; d += 0.125) {
        const on = mood(d) > 0.5 && d <= d0 + span;
        if (on && bandStart === null) bandStart = d;
        if (!on && bandStart !== null) {
          const a = Math.max(X(bandStart), X(d0)), b = Math.min(X(d), X(d0 + span));
          if (b > a) ctx.fillRect(a, top - 6, b - a, bot - top + 12);
          bandStart = null;
        }
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(0, top - 8, w, bot - top + 16); ctx.clip();
      ctx.fillStyle = "rgba(43,93,138,0.045)";
      ctx.fillRect(X(dToday), top - 6, w - padR - X(dToday), bot - top + 12);
      const path = (f, y, a, b) => {
        ctx.beginPath();
        ctx.moveTo(X(a), y(f(a)));
        for (let d = Math.ceil(a * 5) / 5; d < b; d += 0.2) ctx.lineTo(X(d), y(f(d)));
        ctx.lineTo(X(b), y(f(b)));
        ctx.stroke();
      };
      ctx.lineWidth = 2.2; ctx.strokeStyle = C.warm; ctx.setLineDash([]);
      path(neural, yN, d0, dToday);
      ctx.strokeStyle = "rgba(95,143,106,0.55)"; ctx.lineWidth = 1.6;
      path(mood, yM, d0, dToday);
      for (let d = Math.ceil(d0); d <= dToday; d++) {
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.arc(X(d), yM(mood(d) + (hash(d) - 0.5) * 0.9), 2.4, 0, Math.PI * 2); ctx.fill();
      }
      const end = d0 + span;
      ctx.beginPath();
      const spread = (d) => 0.12 + 0.025 * (d - dToday);
      for (let d = dToday; d <= end; d += 0.25) {
        const py = yM(mood(d) + spread(d)); d === dToday ? ctx.moveTo(X(d), py) : ctx.lineTo(X(d), py);
      }
      for (let d = end; d >= dToday; d -= 0.25) ctx.lineTo(X(d), yM(mood(d) - spread(d)));
      ctx.closePath(); ctx.fillStyle = "rgba(95,143,106,0.14)"; ctx.fill();
      ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (let k = Math.floor(dToday / 0.6) * 0.6; k < end; k += 0.6) {
        const a = Math.max(k, dToday), b = Math.min(k + 0.32, end);
        if (b <= a) continue;
        ctx.beginPath(); ctx.moveTo(X(a), yM(mood(a)));
        for (let d = a + 0.08; d < b; d += 0.08) ctx.lineTo(X(d), yM(mood(d)));
        ctx.lineTo(X(b), yM(mood(b))); ctx.stroke();
      }
      ctx.lineCap = "butt";
      ctx.restore();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(dToday), top - 10); ctx.lineTo(X(dToday), bot + 8); ctx.stroke();
      label(ctx, "today", X(dToday), bot + 24, C.ink, { align: "center", weight: 700 });
      label(ctx, "forecast", X(dToday) + 10, top + 6, C.blue, { weight: 700 });
      const pk = (() => { for (let d = Math.floor((dToday - 2) * 20) / 20; d > d0 + 4; d -= 0.05) { if (neural(d) > neural(d - 0.05) && neural(d) > neural(d + 0.05) && d + LAG < dToday) return d; } return null; })();
      if (pk) {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(X(pk), yN(neural(pk)) + 8); ctx.lineTo(X(pk + LAG), yM(mood(pk + LAG)) - 8); ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, "neural leads mood", X(pk + LAG) + 10, yM(mood(pk + LAG)) - 22, C.ink, { size: 12 });
      }
      label(ctx, "Limbic neural rhythm (iEEG)", padL, top - 22, C.warm, { weight: 700 });
      label(ctx, "Daily depression ratings", padL + 220, top - 22, C.green, { weight: 700 });
      label(ctx, "shaded: peak-depression phase", w - padR, top - 22, C.muted, { align: "right", size: 12 });
      label(ctx, "days →", w - padR, bot + 24, C.muted, { align: "right", size: 12 });
    }, 6);
  }
  const interpCanvas = document.getElementById("anim-interp");
  if (interpCanvas) {
    const L = 28;
    const cols = ["ctx", "ctx", "affect", "affect", "affect", "ctx", "question", "answer", "pushback"];
    const iAffect = 3, iPush = cols.length - 1;
    run(interpCanvas, (ctx, w, h, t) => {
      const neg = REDUCE ? true : Math.floor(t / 6) % 2 === 1;
      const u = REDUCE ? 1 : (t % 6) / 6;
      const left = 64, top = 40, gw = Math.min(w - left - 220, 560), gh = h - top - 70;
      const cw = gw / cols.length, rh = gh / L;
      const reached = Math.floor(ease(u / 0.7) * L);
      const readout = Math.round(L * 0.55);
      for (let l = 0; l < L; l++) {
        for (let c = 0; c < cols.length; c++) {
          const x = left + c * cw, y = top + (L - 1 - l) * rh;
          let fill = "#f1f1ee";
          if (l < reached) {
            fill = "#e6e6e2";
            if (cols[c] === "affect") fill = neg ? (l < readout ? "#e3a586" : "#efe2d9") : (l < readout ? "#b9cde0" : "#e3eaf1");
            if (c === iPush && l >= readout) fill = neg ? "#d07a52" : "#7ea3c4";
          }
          ctx.fillStyle = fill;
          ctx.fillRect(x + 1.5, y + 1, cw - 3, rh - 2);
        }
      }
      const yr = top + (L - readout) * rh;
      ctx.strokeStyle = C.ink; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left - 6, yr); ctx.lineTo(left + gw + 6, yr); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, "readout at ~55% depth", left + gw + 14, yr + 4, C.ink, { size: 12, weight: 700 });
      if (reached > readout) {
        const ax = left + (iAffect + 0.5) * cw, bx2 = left + (iPush + 0.5) * cw, ay = yr - rh * 1.5;
        ctx.strokeStyle = neg ? C.warm : C.blue; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx2) / 2, ay - 46, bx2 - 4, ay - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx2, ay); ctx.lineTo(bx2 - 12, ay - 6); ctx.lineTo(bx2 - 7, ay - 14); ctx.closePath(); ctx.fill();
      }
      label(ctx, "layer 28", left - 8, top + rh, C.muted, { size: 11.5, align: "right" });
      label(ctx, "layer 1", left - 8, top + gh, C.muted, { size: 11.5, align: "right" });
      label(ctx, neg ? "frustrated context" : "neutral context", left + (iAffect + 0.5) * cw, top + gh + 22, neg ? C.warm : C.blue, { align: "center", weight: 700 });
      label(ctx, "pushback", left + (iPush + 0.5) * cw, top + gh + 22, C.ink, { align: "center", weight: 700, size: 12 });
      label(ctx, "tokens →", left + gw, top + gh + 44, C.muted, { align: "right", size: 12 });
      const gx = left + gw + 14, gy = top + gh * 0.82, gwid = Math.min(170, w - gx - 16);
      const target = neg ? 0.82 : 0.55, val = REDUCE ? target : target * ease((u - 0.62) / 0.25);
      label(ctx, "defends its answer", gx, gy - 12, C.ink, { size: 12, weight: 700 });
      ctx.fillStyle = "#ecebe7"; ctx.fillRect(gx, gy, gwid, 12);
      ctx.fillStyle = neg ? C.warm : C.blue; ctx.fillRect(gx, gy, gwid * val, 12);
    }, 4);
  }
})();
