// ==== Utilities & State ====
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const state = {
  projects: [],
  filtered: [],
  token: localStorage.getItem("adminToken") || "",
};

// Year
$("#year").textContent = new Date().getFullYear();

// Particles Background
(function particles() {
  const c = document.getElementById("particles");
  const ctx = c.getContext("2d");
  let w,
    h,
    dpr = Math.max(1, window.devicePixelRatio || 1);
  const P = [];
  const N = 80;
  function resize() {
    w = c.width = innerWidth * dpr;
    h = c.height = innerHeight * dpr;
  }
  function spawn() {
    P.length = 0;
    for (let i = 0; i < N; i++)
      P.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.8 + 0.6) * dpr,
      });
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const p of P) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(124,245,255,.55)";
      ctx.fill();
    }
    // links
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const a = P[i],
          b = P[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 120 * dpr) {
          ctx.globalAlpha = 1 - d / (120 * dpr);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(155,92,255,.25)";
          ctx.lineWidth = 0.6 * dpr;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    requestAnimationFrame(step);
  }
  addEventListener("resize", () => {
    resize();
    spawn();
  });
  resize();
  spawn();
  step();
})();

// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("revealed");
    });
  },
  { threshold: 0.2 }
);
$$(".reveal").forEach((el) => io.observe(el));

// Tilt effect for cards
function tilt(el) {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(800px) rotateY(${
      (x - 0.5) * 8
    }deg) rotateX(${(0.5 - y) * 8}deg)`;
    el.style.setProperty("--mx", `${x * 100}%`);
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "none";
  });
}
$$(".card,.project").forEach(tilt);

// ==== Projects Rendering ====
const grid = $("#projectsGrid");

function projectCard(p) {
  const el = document.createElement("article");
  el.className = "card project";
  el.innerHTML = `
      <div class="thumb">${
        p.thumbnail
          ? `<img alt="${p.title} thumbnail" src="${p.thumbnail}">`
          : '<svg width="60" height="60" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v14H3z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M3 17l4-4 3 3 6-6 5 5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>'
      }</div>
      <div class="content">
        <h3>${p.title}</h3>
        <p style="color:var(--muted); margin:.2rem 0 .6rem">${
          p.description || ""
        }</p>
        <div class="tags">${(p.tags || [])
          .map((t) => `<span class='tag'>${t}</span>`)
          .join("")}</div>
        <div class="actions">
          ${
            p.url
              ? `<a class="btn" href="${p.url}" target="_blank" rel="noopener">Live</a>`
              : ""
          }
          ${
            p.repo
              ? `<a class="btn" href="${p.repo}" target="_blank" rel="noopener">Code</a>`
              : ""
          }
        </div>
      </div>`;
  tilt(el);
  return el;
}

function renderProjects(list) {
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = `<div class="hint">No projects found.</div>`;
    return;
  }
  list.forEach((p) => grid.appendChild(projectCard(p)));
}

async function loadProjects() {
  try {
    const res = await fetch("json/Projects.json");
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    state.projects = Array.isArray(data) ? data : data.items || [];
  } catch (err) {
    // Fallback demo data
    state.projects = [
      {
        title: "Neon CLI",
        description: "A swift toolchain visualizer with terminal UI.",
        tags: ["Node", "CLI"],
        url: "#",
        repo: "#",
      },
      {
        title: "Holo UI",
        description: "Glassmorphic components and shaders.",
        tags: ["WebGL", "three.js"],
        url: "#",
        repo: "#",
      },
      {
        title: "Pulse Charts",
        description: "High‑FPS time‑series visualizations.",
        tags: ["D3", "Canvas"],
        url: "#",
        repo: "#",
      },
    ];
  }
  state.filtered = state.projects;
  renderProjects(state.filtered);
}

// Search
$("#search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  state.filtered = state.projects.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => (t + "").toLowerCase().includes(q))
  );
  renderProjects(state.filtered);
});

// Load initial projects
loadProjects();

// ==== Contact (demo) ====
$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: $("#name").value,
    email: $("#email").value,
    message: $("#message").value,
  };
  console.log("Contact submit → /api/contact", payload);
  try {
    const r = await fetch("https://formspree.io/f/xjkodyry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    alert(r.ok ? "Thanks! I will get back to you." : "Failed to send.");
  } catch (err) {
    alert("Failed to send.");
  }
});

// Keyboard accessibility for drawer
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
});

// fetch add data from tech.json file
const handleFetch = async () => {
  const allSkills = document.querySelector(".skills");

  try {
    const response = await fetch("./json/Tech.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    allSkills.innerHTML = "";
    data.forEach((item) => {
      const span = document.createElement("span");
      span.classList.add("chip");
      span.textContent = item;
      allSkills.appendChild(span);
    });
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};

handleFetch();
