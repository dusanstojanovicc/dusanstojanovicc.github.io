(() => {
const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const page = document.body.dataset.page;
if (page !== "home") { try { sessionStorage.removeItem("nl"); } catch (e) {} }
const hasG = typeof gsap !== "undefined";
const anim = hasG && !RM;
if (hasG) gsap.registerPlugin(ScrollTrigger);

const img = (src, alt, eager) => src ? `<img src="${src}" alt="${alt}" ${eager ? "" : 'loading="lazy"'} decoding="async" onerror="this.parentElement.classList.add('ph');this.remove()">` : "";
const splitLines = el => {
  el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(t => `<span class="line"><span>${t}</span></span>`).join("");
  return $$(".line>span", el);
};

/* smooth scroll */
let lenis;
if (typeof Lenis !== "undefined" && !RM && page !== "work") {
  lenis = new Lenis({ lerp: 0.075, wheelMultiplier: .9 });
  if (hasG) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
}
const scrollTo = t => lenis ? lenis.scrollTo(t, { duration: 1.6 }) : (typeof t === "number" ? scrollTo(0, t) : $(t)?.scrollIntoView({ behavior: RM ? "auto" : "smooth" }));

/* page transitions */
const curtain = $(".curtain");
if (anim) { gsap.set(curtain, { y: "100%" }); if (sessionStorage.getItem("tr") && sessionStorage.getItem("trc")) { curtain.style.background = `#0a0a09 url(${sessionStorage.getItem("trc")}) center/cover`; gsap.set(curtain, { y: 0 }); } }
const VT = "onpageswap" in window;   /* cross-document view transitions (stacked cards, see CSS) */
function go(url, label, cover) {
  if (VT) { try { sessionStorage.setItem("nl", "1"); } catch (e) {} location.href = url; return; }
  if (!anim) { location.href = url; return; }
  $("span", curtain).textContent = label || "";
  if (cover) { curtain.style.background = `#0a0a09 url(${cover}) center/cover`; sessionStorage.setItem("trc", cover); }
  gsap.to(curtain, { y: 0, duration: 1.1, ease: "power3.inOut", onComplete: () => { sessionStorage.setItem("tr", "1"); location.href = url; } });
}
addEventListener("pageshow", e => { if (e.persisted && anim) gsap.set(curtain, { y: "100%" }); });
document.addEventListener("click", e => {
  const a = e.target.closest("a"); if (!a) return;
  const h = a.getAttribute("href") || "";
  if (h === "#top") { e.preventDefault(); lenis ? lenis.scrollTo(0) : scrollTo(0); return; }
  if (h.startsWith("#") && h.length > 1) { e.preventDefault(); lenis ? lenis.scrollTo(h) : scrollTo(h); closeMenu(); return; }
  if (/^(project|index)\.html/.test(h) && a.target !== "_blank") {
    e.preventDefault();
    const [path, hash] = h.split("#");
    if (path === "index.html" && page === "home" && hash) { lenis ? lenis.scrollTo("#" + hash) : scrollTo("#" + hash); closeMenu(); return; }
    go(h, a.dataset.name);
  }
});

/* menu */
const burger = $(".burger"), menu = $("#menu");
function closeMenu() { if (!burger) return; menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.textContent = "MENU"; }
burger && burger.addEventListener("click", () => { const o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "CLOSE" : "MENU"; });

/* cursor + magnetic */
const cur = $(".cur");
if (anim && matchMedia("(hover:hover)").matches) {
  const qx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3" }), qy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3" });
  addEventListener("mousemove", e => { qx(e.clientX); qy(e.clientY); });
  document.addEventListener("mouseover", e => cur.classList.toggle("big", !!e.target.closest(".sc-center a, .card, .next")));
  $$(".mag").forEach(b => {
    b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4 }); });
    b.addEventListener("mouseleave", () => gsap.to(b, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.4)" }));
  });
}

/* common reveals */
function reveals(root = document) {
  if (!anim) return;
  $$(".split", root).forEach(el => {
    const s = splitLines(el);
    gsap.from(s, { yPercent: 110, duration: 1.2, stagger: .1, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$(".rv", root).forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
  $$(".mask", root).forEach(m => {
    gsap.fromTo(m, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "power4.inOut", scrollTrigger: { trigger: m, start: "top 85%" } });
  });
  $$(".about .pt img, .cs-cover img", root).forEach(im => {
    gsap.fromTo(im, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: im.parentElement, scrub: true, start: "top bottom", end: "bottom top" } });
  });
}

/* nav clock — ticks every second */
(() => { const c = $("#clock"); if (!c) return; const f = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Belgrade" }); const tick = () => c.textContent = f.format(new Date()); tick(); setInterval(tick, 1000); })();

/* scramble text + full-bleed slider (shared by Home showcase and Work page) */
const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function scramble(el, to, dur) {
  const from = el.textContent, L = Math.max(from.length, to.length), o = { p: 0 };
  if (!anim) { el.textContent = to; return; }
  el._t && el._t.kill();
  el._t = gsap.to(o, { p: 1, duration: dur * .75, ease: "power2.inOut", onUpdate() {
    let s = ""; for (let k = 0; k < L; k++) { const t = o.p * (L + 4) - k; s += t >= 4 ? (to[k] || "") : t > 0 ? (to[k] === " " ? " " : CH[(Math.random() * 26) | 0]) : (from[k] || ""); }
    el.textContent = s; }, onComplete: () => el.textContent = to });
}
function slider(list, root, opts = {}) {
  /* Transform-based reveal (GPU): the slide window moves while its image counter-moves, so the picture stays still.
     Image and text start in the same frame and finish together. */
  const H = opts.dir === "h", swapMode = opts.text === "swap", prop = H ? "xPercent" : "yPercent";
  const bgs = $$(".si", root), kbs = $$(".kbw", root), tEl = $(".sc-title", root), dEl = $(".sc-desc", root), lk = $(".explore", root), nEl = $(".cnt-n", root);
  if (swapMode) [tEl, dEl].forEach(e => e.innerHTML = `<span class="sw">${e.textContent}</span>`);
  const DUR = 1.2;
  const swap = (el, to, d) => {
    const s = $(".sw", el);
    if (!anim) { s.textContent = to; return; }
    gsap.killTweensOf(s);
    gsap.to(s, { xPercent: -110 * d, duration: DUR * .38, ease: "power3.in", onComplete: () => { s.textContent = to; gsap.fromTo(s, { xPercent: 110 * d }, { xPercent: 0, duration: DUR * .62, ease: "power3.out" }); } });
  };
  let cur = 0, z = 2;
  const REST = 100;
  if (anim) { bgs.forEach((b, k) => { gsap.set(b, { [prop]: k ? REST : 0, zIndex: k ? 0 : 1 }); gsap.set(kbs[k], { [prop]: k ? -REST : 0 }); }); kb(0); }
  function kb(k) { const im = $("img", kbs[k]); if (im && anim) gsap.fromTo(im, { scale: 1.1 }, { scale: 1, duration: 6, ease: "power2.out", overwrite: true }); }
  return {
    get cur() { return cur; },
    show(i) {
      if (i === cur || i < 0 || i >= list.length) return false;
      const dir = i > cur ? 1 : -1, p = list[i]; cur = i;
      const el = bgs[i], kw = kbs[i];
      lk.href = "project.html?p=" + p.slug; lk.dataset.name = p.name;
      if (nEl) nEl.textContent = String(i + 1).padStart(2, "0");
      if (!anim) { bgs.forEach((b, k) => b.style.zIndex = k === i ? 2 : 0); tEl.textContent = p.name; dEl.textContent = p.tag; return true; }
      const im0 = $("img", kw);
      const start = () => {
        if (cur !== i) return;
        gsap.killTweensOf([el, kw]);
        gsap.set(el, { zIndex: z++, [prop]: REST * dir }); gsap.set(kw, { [prop]: -REST * dir });
        gsap.to(el, { [prop]: 0, duration: DUR, ease: "power3.inOut", onComplete: () => {
          if (cur !== i) return;
          bgs.forEach((b, k) => { if (k !== i) { gsap.set(b, { [prop]: REST, zIndex: 0 }); gsap.set(kbs[k], { [prop]: -REST }); } });
          gsap.set(el, { zIndex: 1 }); z = 2; } });
        gsap.to(kw, { [prop]: 0, duration: DUR, ease: "power3.inOut" });
        kb(i);
        if (swapMode) { swap(tEl, p.name, dir); swap(dEl, p.tag, dir); } else { scramble(tEl, p.name, DUR); scramble(dEl, p.tag, DUR); }
        gsap.fromTo(lk, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .7, ease: "power3.out", delay: DUR * .55 });
      };
      if (im0 && !(im0.complete && im0.naturalWidth)) Promise.race([new Promise(r => { im0.addEventListener("load", r, { once: true }); }), new Promise(r => setTimeout(r, 450))]).then(start); else start();
      return true;
    }
  };
}

/* ================= HOME ================= */
if (page === "home") {
  const feat = PROJECTS.filter(p => p.feature);
  const more = PROJECTS.filter(p => !p.feature || true).filter(p => p.slug !== "takween-aldar" || true);

  /* pinned showcase — same full-bleed slider as the Work page */
  const scList = PROJECTS.filter(p => p.work), scEl = $(".sc");
  scEl.insertAdjacentHTML("beforeend", `
    <div class="sc-bg">${scList.map((p, n) => `<div class="si"><div class="kbw">${img(p.cover, p.name, true)}</div></div>`).join("")}</div>
    <div class="sc-shade"></div>
    <div class="sc-center">
      <h3 class="sc-title disp">${scList[0].name}</h3>
      <p class="sc-desc">${scList[0].tag}</p>
      <a class="explore" href="project.html?p=${scList[0].slug}" data-name="${scList[0].name}">Explore</a>
    </div>
    <a class="sc-all label" href="work.html">View all work ↗</a>`);
  $("#sc-t").textContent = String(scList.length).padStart(2, "0");

  /* more work horizontal */
  $("#hz-track").innerHTML = PROJECTS.filter(p => p.shotD || p.imgs.length).map((p, n) => `
    <a class="card ${p.sq ? "big" : ""}" href="project.html?p=${p.slug}" data-name="${p.name}">
      <div class="shot">${img(p.shotD || p.cover || p.imgs[0], p.name, n < 2)}${p.shotM ? `<div class="mob">${img(p.shotM, p.name + " mobile")}</div>` : ""}</div>
      <div class="cap"><h3 class="disp">${p.name}</h3><span class="label">${p.cat} · ${p.year}</span></div>
    </a>`).join("");

  /* statement words */
  const st = $("#statement");
  st.innerHTML = st.textContent.split(" ").map(w => `<span class="w">${w}</span>`).join(" ");

  /* intro */
  const hLines = splitLines($(".hero h1"));
  const loader = $(".loader"), count = $("#count");
  if (sessionStorage.getItem("nl")) loader.style.display = "none";
  const intro = () => {
    loader.remove();
    if (!anim) return;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .fromTo(".hero .pt", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "power4.inOut" })
      .from(".hero .pt img", { scale: 1.4, duration: 2 }, 0)
      .from(hLines, { yPercent: 115, duration: 1.4, stagger: .12 }, .5)
      .from(".hero .r", { y: 24, opacity: 0, duration: 1, stagger: .1 }, "-=.9")
      .from("nav", { y: -40, opacity: 0, duration: 1 }, "-=1");
  };
  const skipLoader = sessionStorage.getItem("nl"); sessionStorage.removeItem("nl");
  if (anim && skipLoader) {
    gsap.set(".hero h1 .line>span", { yPercent: 115 }); gsap.set(".hero .pt", { clipPath: "inset(100% 0 0 0)" });
    gsap.delayedCall(.55, () => { gsap.set(".hero h1 .line>span", { clearProps: "all" }); intro(); });
  } else if (anim) {
    gsap.set(".hero h1 .line>span", { yPercent: 115 }); gsap.set(".hero .pt", { clipPath: "inset(100% 0 0 0)" });
    const o = { v: 0 };
    gsap.to(o, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => count.textContent = Math.round(o.v),
      onComplete: () => gsap.to(loader, { yPercent: -100, duration: 1, ease: "power4.inOut", onComplete: () => { gsap.set(".hero h1 .line>span", { clearProps: "all" }); intro(); } }) });
  } else loader.remove();
  setTimeout(() => { if (loader.isConnected) { gsap.killTweensOf(loader); intro(); } }, 6000);

  if (anim) {
    /* hero scroll-out */
    gsap.to(".hero .pt", { yPercent: -14, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero h1", { yPercent: 30, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* PINNED SHOWCASE — scroll stops on every project */
    const N = scList.length, bar = $(".sc-prog i"), sl = slider(scList, scEl, { dir: "v", text: "scramble" }), nEl = $("#sc-n");
    const scT = ScrollTrigger.create({ trigger: ".sc", start: "top top", end: () => "+=" + (N - 1) * 90 + "%", pin: true, anticipatePin: 1, scrub: true,
      onUpdate: self => { bar.style.width = (self.progress * 100) + "%"; if (sl.show(Math.round(self.progress * (N - 1)))) nEl.textContent = String(sl.cur + 1).padStart(2, "0"); } });

    /* snap to the nearest project when scrolling settles (Lenis-safe, works both directions) */
    let snapT;
    const snapNow = () => {
      if (!lenis || scT.progress <= .001 || scT.progress >= .999) return;
      const k = Math.round(scT.progress * (N - 1)), y = scT.start + (scT.end - scT.start) * (k / (N - 1));
      if (Math.abs(y - scrollY) > 2) lenis.scrollTo(y, { duration: .9, easing: t => 1 - Math.pow(1 - t, 3) });
    };
    if (lenis) lenis.on("scroll", () => { clearTimeout(snapT); snapT = setTimeout(snapNow, 160); });

    /* statement scrub */
    gsap.to("#statement .w", { opacity: 1, stagger: .12, ease: "none", scrollTrigger: { trigger: "#statement", start: "top 75%", end: "bottom 45%", scrub: true } });

    /* HORIZONTAL gallery + PROCESS */
    const mm = gsap.matchMedia();
    mm.add("(min-width:901px)", () => {
      const tr = $("#hz-track");
      gsap.to(tr, { x: () => -(tr.scrollWidth - innerWidth), ease: "none", scrollTrigger: { trigger: "#more", start: "top top", end: () => "+=" + (tr.scrollWidth - innerWidth), pin: true, scrub: .8, invalidateOnRefresh: true } });
      const pt = $(".pr-track");
      gsap.to(pt, { x: () => -(pt.scrollWidth - innerWidth), ease: "none", scrollTrigger: { trigger: "#process", start: "top top", end: () => "+=" + (pt.scrollWidth - innerWidth), pin: true, scrub: .8, invalidateOnRefresh: true } });
    });
    mm.add("(max-width:900px)", () => {
      const tr = $("#hz-track");
      gsap.to(tr, { x: () => -(tr.scrollWidth - innerWidth), ease: "none", scrollTrigger: { trigger: "#more", start: "top top", end: () => "+=" + (tr.scrollWidth - innerWidth), pin: true, scrub: .8, invalidateOnRefresh: true } });
      const pt = $(".pr-track");
      gsap.to(pt, { x: () => -(pt.scrollWidth - innerWidth), ease: "none", scrollTrigger: { trigger: "#process", start: "top top", end: () => "+=" + (pt.scrollWidth - innerWidth), pin: true, scrub: .8, invalidateOnRefresh: true } });
    });
    $$(".exp-row").forEach(r => gsap.from($("h3", r), { x: -80, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 85%" } }));
  }
  reveals();   /* created after every pin, so their start positions include the pin spacing */
  ScrollTrigger.sort();
  addEventListener("load", () => ScrollTrigger.refresh());

}

/* ================= WORK ================= */
if (page === "work") {
  const list = PROJECTS.filter(p => p.work), N = list.length;
  $("#wk").innerHTML = `
    <div class="sc-bg">${list.map((p, n) => `<div class="si"><div class="kbw">${img(p.cover, p.name, true)}</div></div>`).join("")}</div>
    <div class="sc-shade"></div>
    <div class="sc-center">
      <h1 class="sc-title disp">${list[0].name}</h1>
      <p class="sc-desc">${list[0].tag}</p>
      <a class="explore" href="project.html?p=${list[0].slug}" data-name="${list[0].name}">Explore</a>
    </div>
    <div class="wk-count"><span class="cnt-n">01</span><i><b></b></i><span>${String(N).padStart(2, "0")}</span></div>
    <div class="wk-arrows"><button id="wk-prev" aria-label="Previous project">←</button><button id="wk-next" aria-label="Next project">→</button></div>`;
  const sl = slider(list, $("#wk"), { dir: "h", text: "swap" }), bar = $(".wk-count b");
  const fill = () => bar.style.width = ((sl.cur + 1) / N * 100) + "%"; fill();
  let lock = false;
  const step = d => { if (lock) return; const i = Math.min(N - 1, Math.max(0, sl.cur + d)); if (i === sl.cur) return; sl.show(i); fill(); lock = true; setTimeout(() => lock = false, 1100); };
  $("#wk-prev").onclick = () => step(-1); $("#wk-next").onclick = () => step(1);
  addEventListener("wheel", e => { if (Math.abs(e.deltaY) > 12) step(e.deltaY > 0 ? 1 : -1); }, { passive: true });
  addEventListener("keydown", e => { if (["ArrowDown", "ArrowRight", "PageDown"].includes(e.key)) step(1); if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) step(-1); if (e.key === "Enter") go($(".explore").getAttribute("href"), $(".explore").dataset.name); });
  let ty = 0; addEventListener("touchstart", e => ty = e.touches[0].clientY, { passive: true });
  addEventListener("touchend", e => { const d = ty - e.changedTouches[0].clientY; if (Math.abs(d) > 40) step(d > 0 ? 1 : -1); }, { passive: true });
  if (anim) {
    gsap.from(".sc-bg", { scale: 1.15, duration: 2, ease: "expo.out" });
    gsap.from(".sc-center > *", { y: 40, opacity: 0, duration: 1.2, stagger: .12, ease: "power3.out", delay: .2 });
    gsap.from("nav", { y: -30, opacity: 0, duration: 1, delay: .3 });
    gsap.from(".wk-count, .wk-arrows", { opacity: 0, y: 20, duration: 1, delay: .6 });
    if (sessionStorage.getItem("tr")) { sessionStorage.removeItem("tr"); gsap.fromTo(curtain, { y: 0 }, { y: "-100%", duration: 1.2, ease: "power3.inOut", delay: .2, onComplete: () => { gsap.set(curtain, { y: "100%" }); curtain.style.background = ""; sessionStorage.removeItem("trc"); } }); }
  }
}

/* ================= CASE STUDY ================= */
if (page === "project") {
  const slug = new URLSearchParams(location.search).get("p");
  const idx = Math.max(0, PROJECTS.findIndex(p => p.slug === slug));
  const p = PROJECTS[idx], nx = PROJECTS[(idx + 1) % PROJECTS.length];
  document.title = `${p.name}, Case Study, Dušan`;
  const g = n => p.imgs[n % Math.max(1, p.imgs.length)];
  const tx = t => `<p class="txt">${t}</p>`;
  const cover = p.imgs[0] || p.shotD;
  $("#cs").innerHTML = `
  <header class="cs-hero">
    <span class="label">01 Project introduction</span>
    <h1 class="disp split">${p.name.replace(/ (.+)/, "<br>$1")}</h1>
    <p class="lead rv">${p.short}</p>
    <div class="facts-row rv"><div><span class="label">Category</span><b>${p.cat}</b></div><div><span class="label">My role</span><b>${p.role}</b></div><div><span class="label">Type</span><b>${p.org}</b></div><div><span class="label">Year</span><b>${p.year}</b></div></div>
  </header>
  <div class="cs-cover mask">${img(cover, p.name, true)}</div>
  <section class="cs-sec"><h2>02 Overview</h2>${tx(p.overview)}</section>
  <section class="cs-sec"><h2>03 The challenge</h2>${tx(p.challenge)}</section>
  <section class="cs-sec"><h2>04 Design approach</h2>${tx(p.approach)}</section>
  ${p.imgs.length > 2 ? `<div class="cs-gal">
    <div class="g1 mask">${img(g(1), p.name)}</div><div class="g2 mask">${img(g(2), p.name)}</div>
    <div class="g3 mask">${img(g(3), p.name)}</div><div class="g4 mask">${img(g(4), p.name)}</div>
    <div class="g5 mask">${img(g(5), p.name)}</div></div>` : ""}
  ${p.shotD ? `<section class="cs-sec"><h2>05 Visual showcase, 07 Responsive</h2><p class="txt rv" style="font-size:clamp(22px,2.4vw,34px)">Desktop and mobile captures of the live website.</p></section>
  <div class="cs-dev"><div class="d mask">${img(p.shotD, p.name + " desktop")}</div>${p.shotM ? `<div class="m">${img(p.shotM, p.name + " mobile")}</div>` : ""}</div>` : ""}
  <section class="cs-sec"><h2>06 Interface details, 08 Final result</h2><div class="rv">${p.live ? `<a class="vl" href="${p.live}" target="_blank" rel="noopener">${p.live.includes("framer") ? "Read the full case study ↗" : "Visit live site ↗"}</a>` : `<p class="txt">${p.short}</p>`}</div></section>
  <a class="next" href="project.html?p=${nx.slug}" data-name="${nx.name}">
    <div class="nx-bg">${img(nx.cover || nx.imgs[0], nx.name)}</div>
    <div class="nx-in"><span class="label" style="color:#d8d3c9">Next project</span><h2 class="disp">${nx.name}</h2>
    <div class="clock"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="46"/><circle class="fg" cx="50" cy="50" r="46"/></svg><span>${String(idx + 2 > PROJECTS.length ? 1 : idx + 2).padStart(2, "0")}</span></div>
    <span class="label" style="color:#d8d3c9">Keep scrolling</span></div>
  </a>`;
  reveals();
  if (anim) {
    /* next project: the clock fills as you scroll, then it opens the next case */
    const fg = $(".clock .fg"); let going = false;
    ScrollTrigger.create({ trigger: ".next", start: "top top", end: "+=90%", pin: true, scrub: true,
      onUpdate: s => { fg.style.strokeDashoffset = 289 * (1 - s.progress); if (s.progress > .995 && !going) { going = true; go("project.html?p=" + nx.slug, "", nx.cover || nx.imgs[0]); } } });
    gsap.fromTo(".nx-bg img", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".next", start: "top bottom", end: "+=190%", scrub: true } });
    gsap.from("nav", { y: -40, opacity: 0, duration: 1, delay: .3 });
    if (sessionStorage.getItem("tr")) {
      sessionStorage.removeItem("tr");
      gsap.fromTo(curtain, { y: 0 }, { y: "-100%", duration: 1.2, ease: "power3.inOut", delay: .25, onComplete: () => { gsap.set(curtain, { y: "100%" }); curtain.style.background = ""; sessionStorage.removeItem("trc"); } });
    }
  }
}
})();
