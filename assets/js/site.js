(function () {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.innerHTML = '<button class="x" type="button">Close</button><img alt="">';
  document.body.appendChild(box);
  const big = box.querySelector("img");
  let lastFocus = null;
  function open(src, alt) {
    lastFocus = document.activeElement;
    big.src = src;
    big.alt = alt || "";
    box.classList.add("open");
    box.querySelector(".x").focus();
  }
  function close() {
    box.classList.remove("open");
    if (lastFocus) lastFocus.focus();
  }
  box.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box.classList.contains("open")) close(); });
  document.querySelectorAll("figure.fig button").forEach((b) => {
    const img = b.querySelector("img");
    b.setAttribute("aria-label", "Enlarge figure");
    b.addEventListener("click", () => open(img.currentSrc || img.src, img.alt));
  });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduce && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1100;
        const step = (now) => {
          const u = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - u, 3);
          el.textContent = Math.round(end * e).toLocaleString();
          if (u < 1) requestAnimationFrame(step);
        };
        el.textContent = "0";
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }
  const links = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const targets = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (targets.length && "IntersectionObserver" in window) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    targets.forEach((t) => nio.observe(t));
  }
})();

