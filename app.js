const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtTime = t => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
};

/* ---------- Events store ---------- */
const today = new Date();
const seedEvents = () => ([
  { date: iso(addDays(today, 1)), time: "09:30", title: "Weekly standup", who: "Whole team" },
  { date: iso(addDays(today, 1)), time: "14:00", title: "Design critique", who: "Priya, Ana" },
  { date: iso(addDays(today, 3)), time: "11:00", title: "Sprint planning", who: "Whole team" },
  { date: iso(addDays(today, 6)), time: "16:00", title: "Client walkthrough", who: "Daniel, Ana" },
  { date: iso(addDays(today, 8)), time: "10:00", title: "1:1 Priya / Daniel", who: "Priya, Daniel" },
  { date: iso(addDays(today, -2)), time: "15:00", title: "Retro", who: "Whole team" },
]);

let events;
try {
  events = JSON.parse(localStorage.getItem("katon360-events")) || seedEvents();
} catch (e) { events = seedEvents(); }

const saveEvents = () => { try { localStorage.setItem("katon360-events", JSON.stringify(events)); } catch (e) {} };
const eventsOn = dateIso => events.filter(ev => ev.date === dateIso).sort((a, b) => a.time.localeCompare(b.time));

/* ---------- Toasts ---------- */
function toast(msg) {
  const zone = $("#toastZone");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<i class="ph ph-check-circle"></i><span></span>`;
  el.lastElementChild.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => { el.classList.add("leaving"); setTimeout(() => el.remove(), 320); }, 3200);
}

/* ---------- Calendar ---------- */
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = iso(today);

function buildWeekdays(el) {
  el.innerHTML = WDAYS.map(d => `<span>${d}</span>`).join("");
}

function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push(d);
  }
  return cells;
}

function renderCalendar(gridEl, titleEl, { interactive }) {
  titleEl.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  const todayIso = iso(today);
  gridEl.innerHTML = "";
  monthCells(viewYear, viewMonth).forEach(d => {
    const dIso = iso(d);
    const dayEvents = eventsOn(dIso);
    const cell = document.createElement(interactive ? "button" : "div");
    cell.className = "cal-day";
    if (d.getMonth() !== viewMonth) cell.classList.add("out");
    if (dIso === todayIso) cell.classList.add("today");
    if (interactive && dIso === selectedDate) cell.classList.add("selected");
    if (dayEvents.length) cell.classList.add("has-evt");
    let html = `<span class="cal-day-num">${d.getDate()}</span>`;
    dayEvents.slice(0, 2).forEach(ev => { html += `<span class="cal-evt">${fmtTime(ev.time)} ${ev.title}</span>`; });
    if (dayEvents.length > 2) html += `<span class="cal-evt more">+${dayEvents.length - 2} more</span>`;
    cell.innerHTML = html;
    if (interactive) {
      cell.addEventListener("click", () => { selectedDate = dIso; refreshCalendars(); });
    }
    gridEl.appendChild(cell);
  });
}

function renderPanel() {
  const d = new Date(selectedDate + "T00:00:00");
  $("#panelDate").textContent = `${WDAYS[(d.getDay() + 6) % 7]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  const list = eventsOn(selectedDate);
  const panel = $("#panelEvents");
  panel.innerHTML = list.length
    ? list.map(ev => `<div class="panel-evt"><strong></strong><span></span></div>`).join("")
    : `<p class="panel-empty">Nothing booked. Enjoy the focus time.</p>`;
  if (list.length) {
    $$(".panel-evt", panel).forEach((el, i) => {
      $("strong", el).textContent = list[i].title;
      $("span", el).textContent = `${fmtTime(list[i].time)} · ${list[i].who || "Team"}`;
    });
  }
}

function renderMiniCal() {
  $("#miniCalMonth").textContent = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const grid = $("#miniGrid");
  const todayIso = iso(today);
  grid.innerHTML = "";
  monthCells(today.getFullYear(), today.getMonth()).slice(0, 35).forEach(d => {
    const dIso = iso(d);
    const dayEvents = eventsOn(dIso);
    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (d.getMonth() !== today.getMonth()) cell.classList.add("out");
    if (dIso === todayIso) cell.classList.add("today");
    let html = `<span class="cal-day-num">${d.getDate()}</span>`;
    dayEvents.slice(0, 1).forEach(ev => { html += `<span class="cal-evt">${ev.title}</span>`; });
    cell.innerHTML = html;
    grid.appendChild(cell);
  });
}

function refreshCalendars() {
  if ($("#calGrid")) renderCalendar($("#calGrid"), $("#calMonth"), { interactive: true });
  if ($("#panelDate")) renderPanel();
  if ($("#miniGrid")) renderMiniCal();
  if ($("#meetList")) renderMeetings();
  if (typeof updateHeroWidget === "function" && $("#hwList")) updateHeroWidget();
}

on("#calPrev", "click", () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } refreshCalendars(); });
on("#calNext", "click", () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } refreshCalendars(); });
on("#calToday", "click", () => { viewYear = today.getFullYear(); viewMonth = today.getMonth(); selectedDate = iso(today); refreshCalendars(); });
on("#calNew", "click", () => switchView("meetings"));

/* ---------- Meetings ---------- */
function renderMeetings() {
  const list = $("#meetList");
  const upcoming = events
    .filter(ev => ev.date >= iso(today))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 6);
  list.innerHTML = upcoming.length ? "" : `<p class="panel-empty">No meetings scheduled. That is a good week.</p>`;
  upcoming.forEach(ev => {
    const d = new Date(ev.date + "T00:00:00");
    const card = document.createElement("div");
    card.className = "meet-card";
    card.innerHTML = `
      <div class="meet-date"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()].slice(0, 3)}</span></div>
      <div class="meet-info"><strong></strong><span></span></div>
      <button class="btn btn-secondary btn-sm">Join</button>`;
    $("strong", card).textContent = ev.title;
    $(".meet-info span", card).textContent = `${fmtTime(ev.time)} · ${ev.who || "Team"}`;
    $(".btn", card).addEventListener("click", () => toast(`Joining "${ev.title}"...`));
    list.appendChild(card);
  });
}

on("#meetForm", "submit", e => {
  e.preventDefault();
  const f = e.target;
  if (!f.title.value.trim() || !f.date.value) return;
  events.push({ date: f.date.value, time: f.time.value || "10:00", title: f.title.value.trim(), who: f.attendees.value.trim() || "Team" });
  saveEvents();
  selectedDate = f.date.value;
  const d = new Date(f.date.value + "T00:00:00");
  viewYear = d.getFullYear(); viewMonth = d.getMonth();
  refreshCalendars();
  toast(`"${f.title.value.trim()}" added to the calendar`);
  f.reset();
  f.time.value = "10:00";
});

const meetDateInput = $("#meetForm [name=date]");
if (meetDateInput) {
  meetDateInput.min = iso(today);
  meetDateInput.value = iso(addDays(today, 1));
}

/* ---------- App tabs ---------- */
function switchView(name) {
  $$(".app-tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
  $$(".app-view").forEach(v => v.classList.toggle("active", v.dataset.view === name));
}
$$(".app-tab").forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.view)));
if ($(".dept-visual .app")) switchView("meetings");

/* ---------- Chat ---------- */
const team = [
  { name: "Priya Raghavan", initials: "PR", cls: "av-1" },
  { name: "Daniel Okafor", initials: "DO", cls: "av-2" },
  { name: "Ana Beatriz Costa", initials: "AC", cls: "av-3" },
];

const chatData = {
  general: [
    { who: 0, text: "Morning all. Standup moved to 9:30, it is on the calendar." },
    { who: 1, text: "Saw it. The reminder pinged me here, nice." },
    { who: 2, text: "Launch checklist is pinned in #launch when you have a minute." },
  ],
  design: [
    { who: 2, text: "New hero mockups are up. Blue palette locked." },
    { who: 0, text: "The navy band section is my favorite. Ship it." },
  ],
  launch: [
    { who: 1, text: "Staging build is green. Final run-through tomorrow 4 PM." },
    { who: 2, text: "Added it to the calendar from this thread. One click, done." },
  ],
};

const replies = [
  "On it. Give me ten minutes.",
  "Agreed, let's lock that in.",
  "Nice. Adding it to tomorrow's agenda.",
  "Can we take this to a quick call? Scheduling now.",
  "Done. Recap will post here after the meeting.",
];

let activeChannel = "general";
let replyIdx = 0;

function renderChat() {
  const feed = $("#chatFeed");
  if (!feed) return;
  feed.innerHTML = "";
  chatData[activeChannel].forEach(m => {
    const isMe = m.who === -1;
    const person = isMe ? { name: "You", initials: "YO", cls: "av-1" } : team[m.who];
    const el = document.createElement("div");
    el.className = "chat-msg" + (isMe ? " me" : "");
    el.innerHTML = `
      <span class="avatar ${isMe ? "av-1" : person.cls}">${isMe ? "YO" : person.initials}</span>
      <div>
        <div class="chat-msg-meta"><strong></strong><span>${m.time || "today"}</span></div>
        <p></p>
      </div>`;
    $("strong", el).textContent = person.name;
    $("p", el).textContent = m.text;
    feed.appendChild(el);
  });
  feed.scrollTop = feed.scrollHeight;
}

$$(".channel").forEach(btn => btn.addEventListener("click", () => {
  activeChannel = btn.dataset.channel;
  $$(".channel").forEach(b => b.classList.toggle("active", b === btn));
  $("#chatInput").placeholder = `Message # ${activeChannel}`;
  renderChat();
}));

on("#chatForm", "submit", e => {
  e.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
  chatData[activeChannel].push({ who: -1, text, time });
  input.value = "";
  renderChat();

  const responder = team[Math.floor(Math.random() * team.length)];
  const typing = $("#chatTyping");
  $("#typingAvatar").textContent = responder.initials;
  $("#typingAvatar").className = `avatar ${responder.cls} sm`;
  typing.hidden = false;
  setTimeout(() => {
    typing.hidden = true;
    chatData[activeChannel].push({ who: team.indexOf(responder), text: replies[replyIdx++ % replies.length], time });
    renderChat();
  }, 1400);
});

/* ---------- Thread to meeting ---------- */
on("#threadSchedule", "click", function () {
  const thursday = addDays(today, ((4 - ((today.getDay() + 6) % 7) + 7) % 7) || 7);
  events.push({ date: iso(thursday), time: "16:00", title: "Launch copy review", who: "Priya, Daniel, Ana" });
  saveEvents();
  refreshCalendars();
  this.innerHTML = `<i class="ph ph-check"></i> On the calendar`;
  this.disabled = true;
  this.style.opacity = "0.75";
  toast(`"Launch copy review" scheduled for Thursday 4:00 PM`);
});

/* ---------- Nav ---------- */
const nav = $("#nav");
if (nav && $("#navSentinel")) {
  new IntersectionObserver(([entry]) => {
    nav.classList.toggle("scrolled", !entry.isIntersecting);
  }).observe($("#navSentinel"));
}

on("#navBurger", "click", () => $("#navLinks").classList.toggle("open"));
$$("#navLinks a").forEach(a => a.addEventListener("click", () => {
  $("#navLinks").classList.remove("open");
  $$(".nav-item").forEach(i => i.classList.remove("open"));
}));
$$(".nav-drop-btn").forEach(btn => btn.addEventListener("click", () => {
  const item = btn.parentElement;
  const wasOpen = item.classList.contains("open");
  $$(".nav-item").forEach(i => i.classList.remove("open"));
  if (!wasOpen) item.classList.add("open");
}));
document.addEventListener("click", e => {
  if (!e.target.closest(".nav-item")) $$(".nav-item").forEach(i => i.classList.remove("open"));
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") $$(".nav-item").forEach(i => i.classList.remove("open"));
});
$$(".nav-item").forEach(item => item.addEventListener("mouseenter", () => {
  $$(".nav-item").forEach(i => { if (i !== item) i.classList.remove("open"); });
}));

/* ---------- Smooth anchor scrolling ---------- */
const reduceMotionEarly = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function scrollToTarget(el) {
  const targetY = el.getBoundingClientRect().top + window.scrollY - 80;
  if (reduceMotionEarly) { window.scrollTo(0, targetY); return; }
  const startY = window.scrollY;
  const dist = targetY - startY;
  const dur = 800;
  const t0 = performance.now();
  const step = now => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    window.scrollTo(0, startY + dist * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
$$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const target = document.getElementById(a.getAttribute("href").slice(1));
  if (!target) return;
  e.preventDefault();
  history.replaceState(null, "", a.getAttribute("href"));
  scrollToTarget(target);
}));

/* ---------- Scroll animations: GSAP with IO fallback ---------- */
const reduceMotionNow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const groupSels = [".trio-grid", ".bento", ".price-row", ".stats-row", ".faq-list", ".flow-grid", ".chal-grid"];

function initScrollAnimations() {
if (window.gsap && window.ScrollTrigger && !reduceMotionNow) {
  gsap.registerPlugin(ScrollTrigger);

  if ($(".hero-copy")) {
    gsap.from(".hero-copy", { opacity: 0, y: 18, duration: 0.7, ease: "power2.out" });
  }
  if ($(".hero-art")) {
    gsap.from(".hero-art", { opacity: 0, duration: 0.9, delay: 0.15, ease: "power2.out" });
  }
  if ($(".page-hero")) {
    gsap.from(".page-hero .container", { opacity: 0, y: 16, duration: 0.7, ease: "power2.out" });
  }

  $$(".reveal").forEach(el => {
    el.style.transition = "none";
    el.classList.add("in");
    gsap.from(el, {
      y: 18, opacity: 0, duration: 0.55, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  if ($(".stage-wrap")) {
    gsap.fromTo(".stage-wrap", { y: 48 }, {
      y: -20, ease: "none",
      scrollTrigger: { trigger: ".stage-band", start: "top 90%", end: "bottom 50%", scrub: 1 }
    });
  }
} else {
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el => revealObs.observe(el));
}
}

if (document.readyState === "complete") {
  initScrollAnimations();
} else {
  window.addEventListener("load", () => {
    initScrollAnimations();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
}

/* ---------- Stats count-up ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const statObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    statObs.unobserve(en.target);
    const el = en.target;
    if (!el.dataset.count) return;
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
    const t0 = performance.now();
    const dur = 1400;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.5 });
$$(".stat-num").forEach(el => statObs.observe(el));

/* ---------- Logo marquee: real UAE brands ---------- */
const brands = [
  ["noon", "Noon"], ["emirates", "Emirates"], ["emaar", "Emaar"], ["etisalat", "e& Etisalat"],
  ["emiratesnbd", "Emirates NBD"], ["talabat", "Talabat"], ["du", "du"], ["adnoc", "ADNOC"],
];
const track = $("#marqueeTrack");
if (track) track.innerHTML = [...brands, ...brands].map(([f, name]) =>
  `<span class="logo-item"><img src="assets/logos/${f}.png" alt="${name}" loading="lazy">${name}</span>`).join("");

/* ---------- Pricing toggle ---------- */
$$(".toggle-opt").forEach(btn => btn.addEventListener("click", () => {
  $$(".toggle-opt").forEach(b => b.classList.toggle("active", b === btn));
  const mode = btn.dataset.billing;
  $$(".price-num").forEach(el => {
    el.classList.add("swap");
    setTimeout(() => {
      const val = el.dataset[mode];
      el.textContent = `$${val}`;
      el.classList.remove("swap");
    }, 180);
  });
}));

/* ---------- Modal ---------- */
const modal = $("#signupModal");
if (modal) {
  $$("[data-open-modal]").forEach(btn => btn.addEventListener("click", () => {
    $("#modalBody").hidden = false;
    $("#modalSuccess").hidden = true;
    modal.showModal();
  }));
  on("#modalClose", "click", () => modal.close());
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });
}

on("#signupForm", "submit", e => {
  const email = $("#suEmail");
  const teamName = $("#suTeam");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
  const teamOk = teamName.value.trim().length > 1;
  $("#suEmailErr").hidden = emailOk;
  $("#suTeamErr").hidden = teamOk;
  email.classList.toggle("invalid", !emailOk);
  teamName.classList.toggle("invalid", !teamOk);
  if (!emailOk || !teamOk) { e.preventDefault(); return; }
  e.preventDefault();
  $("#modalBody").hidden = true;
  $("#modalSuccess").hidden = false;
});

on("#modalDone", "click", () => {
  modal.close();
  if ($("#product")) $("#product").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
});

/* ---------- Hero Today panel ---------- */
function updateHeroWidget() {
  const list = $("#hwList");
  if (!list) return;
  const now = new Date();
  const upcoming = events
    .map(ev => ({ ...ev, at: new Date(`${ev.date}T${ev.time}:00`) }))
    .filter(ev => ev.at > now)
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);
  list.innerHTML = upcoming.length
    ? ""
    : `<div class="hp-row"><span class="hp-time">--:--</span><span class="hp-title">Nothing booked. Deep work day.</span></div>`;
  const avs = ["av-1", "av-2", "av-3"];
  upcoming.forEach((ev, i) => {
    const row = document.createElement("div");
    row.className = "hp-row" + (i === 0 ? " next" : "");
    const dayDiff = Math.floor((ev.at - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    const dayWord = dayDiff === 0 ? "" : dayDiff === 1 ? "Tomorrow" : `${MONTHS[ev.at.getMonth()].slice(0, 3)} ${ev.at.getDate()}`;
    row.innerHTML = `
      <span class="hp-time">${fmtTime(ev.time)}</span>
      <span class="hp-title">${dayWord ? dayWord + " · " : ""}<span class="t"></span>${i === 0 ? '<span class="hp-count" id="hwCount"></span>' : ""}</span>
      <span class="avatar ${avs[i % 3]} sm">${(ev.who || "T").slice(0, 2).toUpperCase()}</span>`;
    $(".t", row).textContent = ev.title;
    list.appendChild(row);
  });
  const next = upcoming[0];
  if (next) {
    const tick = () => {
      const el = $("#hwCount");
      if (!el) return;
      const ms = next.at - new Date();
      if (ms <= 0) { el.textContent = "happening now"; return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      el.textContent = h >= 48 ? `in ${Math.floor(h / 24)} days` : `in ${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };
    tick();
    clearInterval(updateHeroWidget._t);
    updateHeroWidget._t = setInterval(tick, 1000);
  }
}

/* ---------- FAQ accordion animation ---------- */
if (window.gsap) {
  $$(".faq-item").forEach(item => {
    const summary = $("summary", item);
    const body = $("p", item);
    if (!summary || !body) return;
    summary.addEventListener("click", e => {
      e.preventDefault();
      if (item.open) {
        gsap.to(body, {
          height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0,
          duration: 0.32, ease: "power2.inOut",
          onComplete: () => { item.open = false; gsap.set(body, { clearProps: "all" }); }
        });
      } else {
        item.open = true;
        gsap.fromTo(body,
          { height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0 },
          { height: "auto", paddingTop: 6, paddingBottom: 24, opacity: 1, duration: 0.4, ease: "power2.out", clearProps: "height" }
        );
      }
    });
  });
}

/* ---------- FAQ expand/collapse all ---------- */
on("#faqExpand", "click", () => $$(".faq-item:not([open]) summary").forEach(s => s.click()));
on("#faqCollapse", "click", () => $$(".faq-item[open] summary").forEach(s => s.click()));

/* ---------- Quotes slider ---------- */
const qTrack = $("#quotesTrack");
if (qTrack) {
  const perView = () => (window.innerWidth > 860 ? 3 : 1);
  const pages = () => Math.ceil(qTrack.children.length / perView());
  let qPage = 0;
  let qTimer;
  const goQ = i => {
    qPage = (i + pages()) % pages();
    qTrack.style.transform = `translateX(calc(${-qPage} * (100% + 20px)))`;
    $$("#qDots span").forEach((d, j) => d.classList.toggle("active", j === qPage));
  };
  const renderDots = () => {
    $("#qDots").innerHTML = Array.from({ length: pages() }, (_, i) => `<span class="${i === qPage ? "active" : ""}"></span>`).join("");
    $$("#qDots span").forEach((d, i) => d.addEventListener("click", () => { goQ(i); restartAuto(); }));
  };
  const restartAuto = () => { clearInterval(qTimer); qTimer = setInterval(() => goQ(qPage + 1), 6500); };
  on("#qPrev", "click", () => { goQ(qPage - 1); restartAuto(); });
  on("#qNext", "click", () => { goQ(qPage + 1); restartAuto(); });
  $(".quotes-slider").addEventListener("mouseenter", () => clearInterval(qTimer));
  $(".quotes-slider").addEventListener("mouseleave", restartAuto);
  window.addEventListener("resize", () => { qPage = 0; renderDots(); goQ(0); });
  renderDots();
  new IntersectionObserver(([en]) => {
    en.isIntersecting ? restartAuto() : clearInterval(qTimer);
  }, { threshold: 0.3 }).observe(qTrack);
}

const hwClock = $("#hwClock");
if (hwClock) {
  const clockTick = () => {
    const n = new Date();
    hwClock.textContent = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`;
  };
  clockTick();
  setInterval(clockTick, 1000);
}

const hwFeed = [
  { who: 1, text: "Recap posted. Three action items assigned." },
  { who: 0, text: "Thursday review is on the calendar." },
  { who: 2, text: "Moving this thread to a quick call." },
];
let hwIdx = 0;
if ($("#hwMsg")) {
  setInterval(() => {
    const box = $("#hwMsg");
    box.classList.add("fading");
    setTimeout(() => {
      hwIdx = (hwIdx + 1) % hwFeed.length;
      const person = team[hwFeed[hwIdx].who];
      $("#hwMsgAv").textContent = person.initials;
      $("#hwMsgAv").className = `avatar ${person.cls} sm`;
      $("#hwMsgText").textContent = hwFeed[hwIdx].text;
      box.classList.remove("fading");
    }, 420);
  }, 3600);
}

/* ---------- Film sound toggle ---------- */
const heroFilmEl = $("#heroFilm");
if (heroFilmEl) {
  on("#soundBtn", "click", () => {
    heroFilmEl.muted = !heroFilmEl.muted;
    if (!heroFilmEl.muted) heroFilmEl.play().catch(() => {});
    $("#soundBtn").innerHTML = heroFilmEl.muted
      ? '<i class="ph ph-speaker-slash"></i> Tap for sound'
      : '<i class="ph ph-speaker-high"></i> Sound on';
  });
}

/* ---------- Product film: keep it playing while visible ---------- */
$$(".show-video").forEach(vid => {
  if (reduceMotion) { vid.removeAttribute("autoplay"); return; }
  const tryPlay = () => { if (vid.paused) vid.play().catch(() => {}); };
  document.addEventListener("visibilitychange", tryPlay);
  window.addEventListener("focus", tryPlay);
  new IntersectionObserver(entries => {
    entries[0].isIntersecting ? tryPlay() : vid.pause();
  }, { threshold: 0.05 }).observe(vid);
});

/* ---------- Suite product tabs ---------- */
$$(".suite").forEach(suite => {
  const tabs = $$(".suite-tab", suite);
  const panels = $$(".prod-panel", suite);
  if (!tabs.length) return;
  tabs.forEach((t, i) => t.addEventListener("click", () => {
    tabs.forEach((x, j) => x.classList.toggle("active", j === i));
    panels.forEach((p, j) => p.classList.toggle("active", j === i));
    if (window.gsap) gsap.fromTo(panels[i], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
  }));
});

/* ---------- Numbered feature switcher ---------- */
if ($(".fs-list")) {
  const fsItems = $$(".fs-item");
  const fsPanels = $$(".fs-panel");
  fsItems.forEach((t, i) => t.addEventListener("click", () => {
    fsItems.forEach((x, j) => x.classList.toggle("active", j === i));
    fsPanels.forEach((p, j) => p.classList.toggle("active", j === i));
    if (window.gsap) gsap.fromTo(fsPanels[i], { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" });
  }));
}

/* ---------- Ask Katon AI live demo ---------- */
const aiDemo = $("#aiDemo");
if (aiDemo) {
  const askEl = $("#aiAskText"), ansBox = $("#aiAns"), ansText = $("#aiAnsText"), srcEl = $("#aiSrc");
  const capEls = $$(".ai-item");
  const DEMOS = [
    { q: "Where did we land on pricing?", a: "Keep Professional at $12 per user. Decided in Tuesday's launch review and noted in the brief.",
      srcs: [["ph-file-doc", "Launch brief v4"], ["ph-video-camera", "Launch review recording"]], cap: 4 },
    { q: "Summarise yesterday's stand-up.", a: "Three decisions and two action items, assigned to Priya and Daniel. Full summary saved to Notes.",
      srcs: [["ph-video-camera", "Stand-up recording"], ["ph-note-pencil", "Meeting notes"]], cap: 2 },
    { q: "What is blocking the launch?", a: "One open item: the final QA pass. Ana owns it, due Thursday.",
      srcs: [["ph-list-checks", "Launch board"]], cap: 3 },
  ];
  const renderAns = d => {
    ansText.textContent = d.a;
    srcEl.innerHTML = d.srcs.map(s => '<span><i class="ph ' + s[0] + '"></i> ' + s[1] + "</span>").join("");
  };
  const setCap = i => capEls.forEach((el, j) => el.classList.toggle("active", j === i));
  const show = d => { askEl.textContent = d.q; renderAns(d); ansBox.classList.add("in"); setCap(d.cap); };
  show(DEMOS[0]);
  if (!reduceMotion) {
    let idx = 1, running = false, timer = null;
    const step = () => {
      const d = DEMOS[idx % DEMOS.length];
      idx++;
      askEl.textContent = "";
      setCap(d.cap);
      let c = 0;
      const type = () => {
        if (!running) return;
        askEl.textContent = d.q.slice(0, ++c);
        if (c < d.q.length) timer = setTimeout(type, 38);
        else timer = setTimeout(() => {
          ansBox.classList.remove("in");
          timer = setTimeout(() => { renderAns(d); ansBox.classList.add("in"); timer = setTimeout(step, 3800); }, 280);
        }, 250);
      };
      type();
    };
    new IntersectionObserver(es => {
      if (es[0].isIntersecting && !running) { running = true; timer = setTimeout(step, 2600); }
      else if (!es[0].isIntersecting && running) { running = false; clearTimeout(timer); show(DEMOS[0]); }
    }, { threshold: 0.35 }).observe(aiDemo);
  }
}

/* ---------- Translation demo loop ---------- */
const mlDemo = $(".ml-demo");
if (mlDemo && !reduceMotion) {
  mlDemo.classList.add("ml-anim");
  const mlMsgs = $$(".ml-msg", mlDemo);
  let mlTimers = [];
  let mlRun = false;
  const mlSched = (fn, ms) => mlTimers.push(setTimeout(fn, ms));
  const mlShowAll = () => mlMsgs.forEach(m => { m.classList.add("on"); $(".ml-trans", m).classList.add("on"); });
  const mlPlay = () => {
    if (!mlRun) return;
    mlTimers.forEach(clearTimeout); mlTimers = [];
    mlMsgs.forEach(m => { m.classList.remove("on"); $(".ml-trans", m).classList.remove("on"); });
    let t = 500;
    mlMsgs.forEach(m => {
      mlSched(() => m.classList.add("on"), t);
      mlSched(() => $(".ml-trans", m).classList.add("on"), t + 750);
      t += 1700;
    });
    mlSched(mlPlay, t + 3800);
  };
  new IntersectionObserver(es => {
    if (es[0].isIntersecting && !mlRun) { mlRun = true; mlPlay(); }
    else if (!es[0].isIntersecting && mlRun) {
      mlRun = false;
      mlTimers.forEach(clearTimeout); mlTimers = [];
      mlShowAll();
    }
  }, { threshold: 0.3 }).observe(mlDemo);
}

/* ---------- Security card torch ---------- */
const secTorch = $("#secTorch");
if (secTorch) {
  secTorch.addEventListener("mousemove", e => {
    const r = secTorch.getBoundingClientRect();
    secTorch.style.setProperty("--mx", (e.clientX - r.left) + "px");
    secTorch.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
}

/* ---------- Day story carousel ---------- */
const dayTrack = $("#dayTrack");
if (dayTrack) {
  const dCards = $$(".day-card", dayTrack);
  const dPrev = $("#dayPrev"), dNext = $("#dayNext");
  const dGap = 20;
  let dI = 0;
  const dVisible = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
  const dMax = () => Math.max(0, dCards.length - dVisible());
  const dLayout = () => {
    const cont = $(".challenges .container");
    const vis = dVisible();
    const w = (cont.clientWidth - dGap * (vis - 1)) / vis;
    dCards.forEach(c => c.style.width = w + "px");
    dI = Math.min(dI, dMax());
    dayTrack.style.transform = "translateX(" + (-dI * (w + dGap)) + "px)";
    dPrev.disabled = dI === 0;
    dNext.disabled = dI >= dMax();
  };
  dPrev.addEventListener("click", () => { dI = Math.max(0, dI - 1); dLayout(); });
  dNext.addEventListener("click", () => { dI = Math.min(dMax(), dI + 1); dLayout(); });
  window.addEventListener("resize", dLayout);
  dLayout();
}

/* ---------- Day replay steps ---------- */
const rpSteps = $$(".rp-step");
if (rpSteps.length) {
  const rpCards = $$(".rp-card");
  rpSteps.forEach((s, i) => s.addEventListener("click", () => {
    rpSteps.forEach((x, j) => x.classList.toggle("active", j === i));
    rpCards.forEach((c, j) => c.classList.toggle("active", j === i));
  }));
}

/* ---------- Lead form ---------- */
on("#leadForm", "submit", e => {
  e.preventDefault();
  const f = e.target;
  const ok = f.name.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value) && f.company.value.trim();
  const err = $("#leadErr");
  if (err) err.hidden = !!ok;
  if (!ok) return;
  f.classList.add("sent");
  const done = $("#leadSuccess");
  if (done) done.hidden = false;
  toast("Thanks! The Katon 360 team will reach out shortly.");
});

/* ---------- Scroll popup at 90% ---------- */
const pop90 = $("#pop90");
if (pop90) {
  let p90done = false;
  try { p90done = sessionStorage.getItem("k360-pop") === "1"; } catch (e) {}
  const p90hide = () => { pop90.classList.remove("in"); setTimeout(() => { pop90.hidden = true; }, 350); };
  const p90show = () => {
    pop90.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => pop90.classList.add("in")));
    try { sessionStorage.setItem("k360-pop", "1"); } catch (e) {}
  };
  const p90scroll = () => {
    if (p90done) return;
    const d = document.documentElement;
    if ((window.scrollY + window.innerHeight) / d.scrollHeight >= 0.9) {
      p90done = true;
      window.removeEventListener("scroll", p90scroll);
      p90show();
    }
  };
  window.addEventListener("scroll", p90scroll, { passive: true });
  on("#pop90Close", "click", p90hide);
  on("#pop90Cta", "click", p90hide);
  pop90.addEventListener("click", e => { if (e.target === pop90) p90hide(); });
}

/* ---------- Katon Assist chatbot ---------- */
const cb = $("#chatbot");
if (cb) {
  const feed = $("#cbFeed");
  const quick = $("#cbQuick");
  let greeted = false;

  const cbScroll = () => { feed.scrollTop = feed.scrollHeight; };
  const cbAdd = (content, who, asHtml) => {
    const el = document.createElement("div");
    el.className = `cb-msg ${who}`;
    if (asHtml) el.innerHTML = content; else el.textContent = content;
    feed.appendChild(el);
    cbScroll();
  };
  const cbBot = content => {
    const t = document.createElement("div");
    t.className = "cb-typing";
    t.innerHTML = `<span class="typing-dots"><i></i><i></i><i></i></span>`;
    feed.appendChild(t);
    cbScroll();
    setTimeout(() => { t.remove(); cbAdd(content, "bot", true); }, 700 + Math.random() * 500);
  };

  const ANSWERS = [
    { re: /price|pricing|cost|plan|how much/i, a: 'Plans start at $6 per user per month on Core and scale up to Enterprise volume pricing. <a href="#pricing">See all five plans</a>.' },
    { re: /demo|tour|try|trial|evaluat|walkthrough|see it/i, a: 'You can use the live product right on this page. <a href="#product">Open the product tour</a>, or <a href="#contact">book a walkthrough</a> with our team.' },
    { re: /secur|privacy|complian|gdpr|trust|govern/i, a: 'Katon 360 is built around secure collaboration, privacy by design, controlled access and enterprise governance. <a href="#security">Read the security overview</a>.' },
    { re: /meet|video|call|conference/i, a: 'Katon Meet gives you HD meetings with AI summaries, live captions, recordings and breakout rooms. <a href="meetings.html">Explore Katon Meet</a>.' },
    { re: /calendar|schedul|book/i, a: 'Katon Calendar brings smart scheduling, suggested times and conflict resolution to your whole team. <a href="calendar.html">Explore Katon Calendar</a>.' },
    { re: /chat|message|channel|thread/i, a: 'Katon Chat keeps channels, threads and AI-assisted messaging in one place, and any thread can become a meeting. <a href="chat.html">Explore Katon Chat</a>.' },
    { re: /file|drive|storage|document/i, a: 'Katon Drive organises your files with permissions, version history and AI-powered search. <a href="drive.html">Explore Katon Drive</a>.' },
    { re: /task|project|kanban|to-?do/i, a: 'Katon Tasks turns decisions into action with boards, owners, deadlines and AI action-item extraction. <a href="tasks.html">Explore Katon Tasks</a>.' },
    { re: /note|wiki|knowledge/i, a: 'Katon Notes captures meeting notes, decisions and ideas, with AI summaries and note-to-task conversion. <a href="notes.html">Explore Katon Notes</a>.' },
    { re: /language|translat|multiling/i, a: 'Katon 360 is designed for multilingual teams, with translation in context and personal language preferences. <a href="#multilingual">See how it works</a>.' },
    { re: /\bai\b|intelligen|assistant|smart/i, a: 'AI runs across the whole workplace: meeting summaries, content intelligence, discovery and workflow productivity. <a href="#ai">See the AI capabilities</a>.' },
    { re: /contact|sales|team|talk|human|support|help/i, a: 'The Katon 360 team is happy to help. <a href="#contact">Leave your details here</a> and they will reach out shortly.' },
    { re: /\b(hi|hello|hey)\b/i, a: 'Hello! Ask me about pricing, products, security or getting started.' },
  ];
  const FALLBACK = 'I can help with pricing, products, security and getting started. You can also <a href="#contact">talk to the Katon 360 team</a> directly.';
  const respond = text => {
    const hit = ANSWERS.find(x => x.re.test(text));
    cbBot(hit ? hit.a : FALLBACK);
  };

  [["See pricing", "pricing"], ["Try the product", "demo"], ["Security", "security"], ["Talk to sales", "contact sales"]].forEach(([label, q]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => { cbAdd(label, "user"); respond(q); });
    quick.appendChild(b);
  });

  const openBot = () => {
    cb.hidden = false;
    if (!greeted) {
      greeted = true;
      cbBot("Hi, I am Katon Assist. Ask me anything about Katon 360, or pick a topic below.");
    }
    $("#cbInput").focus();
  };
  on("#cbLauncher", "click", () => { cb.hidden ? openBot() : (cb.hidden = true); });
  on("#cbClose", "click", () => { cb.hidden = true; });
  on("#cbForm", "submit", e => {
    e.preventDefault();
    const input = $("#cbInput");
    const text = input.value.trim();
    if (!text) return;
    cbAdd(text, "user");
    input.value = "";
    respond(text);
  });
  feed.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (href && href.startsWith("#")) {
      const target = document.getElementById(href.slice(1));
      if (target) { e.preventDefault(); cb.hidden = true; scrollToTarget(target); }
    }
  });
}

/* ---------- Init ---------- */
if ($("#calWeekdays")) buildWeekdays($("#calWeekdays"));
if ($("#miniWeekdays")) buildWeekdays($("#miniWeekdays"));
refreshCalendars();
renderChat();
if (document.body.dataset.view) switchView(document.body.dataset.view);
