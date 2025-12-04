/* ---------------------------
  URL Shortener — Frontend Only
  Features:
  - LocalStorage mapping
  - Copy icon
  - Clear all
  - QR generation (public API)
  - Dark/Light theme (persisted)
  - Animated buttons
  - Toast notifications
  - Save last input
--------------------------- */

(function () {
  // --- Helpers ---
  const $ = (id) => document.getElementById(id);
  const urlsKey = "urls";
  const themeKey = "shortly_theme";
  const lastInputKey = "shortly_last_input";

  // DOM
  const longUrlInput = $("longUrl");
  const shortenBtn = $("shortenBtn");
  const resultDiv = $("result");
  const linksList = $("linksList");
  const clearAllBtn = $("clearAllBtn");
  const toastContainer = $("toastContainer");
  const themeToggle = $("themeToggle");

  // init
  loadTheme();
  loadLastInput();
  loadLinks();
  handleRedirectOnLoad();

  /* ---------------------
     ID generator (6 chars)
     ensure no collision
  ----------------------*/
  function generateShortId() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id;
    const data = getUrls();
    do {
      id = Array.from(
        { length: 6 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("");
    } while (data[id]);
    return id;
  }

  // URL storage helpers
  function getUrls() {
    try {
      return JSON.parse(localStorage.getItem(urlsKey) || "{}");
    } catch (e) {
      return {};
    }
  }
  function setUrls(obj) {
    localStorage.setItem(urlsKey, JSON.stringify(obj));
  }

  // Save last typed input
  function saveLastInput(val) {
    localStorage.setItem(lastInputKey, val || "");
  }
  function loadLastInput() {
    const val = localStorage.getItem(lastInputKey) || "";
    if (val) longUrlInput.value = val;
  }

  // Theme
  function saveTheme(t) {
    localStorage.setItem(themeKey, t);
  }
  function loadTheme() {
    const t = localStorage.getItem(themeKey) || "light";
    const isDark = t === "dark";
    document.documentElement.style.setProperty(
      "--bg1",
      isDark
        ? "linear-gradient(135deg,#141e30,#243b55)"
        : "linear-gradient(135deg,#89f7fe,#66a6ff)"
    );
    document.documentElement.style.setProperty(
      "--card-bg",
      isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.18)"
    );
    document.documentElement.style.setProperty(
      "--glass",
      isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)"
    );
    themeToggle.checked = isDark;
    saveTheme(t);
  }
  themeToggle.addEventListener("change", () => {
    const t = themeToggle.checked ? "dark" : "light";
    loadTheme(); // toggle visual using loadTheme
    saveTheme(t);
  });

  // Toast
  function toast(msg, timeout = 2200) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  // QR generator (free API)
  function qrFor(url) {
    // Using goqr.me / qrserver - returns an image
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      url
    )}`;
  }

  // Build short url string (works on file:// or http)
  function shortUrlFor(id) {
    // keep same path and add hash
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/${id}`;
  }

  // Save mapping
  function saveUrl(id, longUrl) {
    const data = getUrls();
    data[id] = longUrl;
    setUrls(data);
  }

  // Delete one
  function deleteLink(id) {
    const d = getUrls();
    if (!d[id]) return;
    delete d[id];
    setUrls(d);
    loadLinks();
    toast("Deleted link");
  }

  // Clear all
  clearAllBtn.addEventListener("click", () => {
    if (!confirm("Clear ALL saved links?")) return;
    localStorage.removeItem(urlsKey);
    loadLinks();
    toast("All links cleared");
  });

  // Copy helper
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch (e) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copied to clipboard");
    }
  }

  // Render links list
  function loadLinks() {
    const data = getUrls();
    linksList.innerHTML = "";
    const keys = Object.keys(data).reverse();
    if (!keys.length) {
      linksList.innerHTML = `<div class="result" style="background:transparent;color:var(--muted)">No saved links yet — create one above.</div>`;
      return;
    }
    for (const id of keys) {
      const long = data[id];
      const short = shortUrlFor(id);

      const item = document.createElement("div");
      item.className = "link-item";

      const left = document.createElement("div");
      left.className = "link-left";

      const shortBox = document.createElement("div");
      shortBox.className = "short-id";
      shortBox.textContent = id;

      const longBox = document.createElement("div");
      longBox.className = "long-url";
      // clickable
      const a = document.createElement("a");
      a.href = long;
      a.target = "_blank";
      a.textContent = long;
      a.title = long;
      a.style.color = "inherit";
      longBox.appendChild(a);

      left.appendChild(shortBox);
      left.appendChild(longBox);

      const actions = document.createElement("div");
      actions.className = "link-actions";

      // Copy icon/button
      const copyBtn = document.createElement("button");
      copyBtn.className = "icon-btn";
      copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><rect x="2" y="2" width="13" height="13" rx="2" ry="2"/></svg>`;
      copyBtn.title = "Copy short URL";
      copyBtn.addEventListener("click", () => copyText(short));

      // Open short link (redirect)
      const openBtn = document.createElement("button");
      openBtn.className = "icon-btn";
      openBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M5 5v14h14"/></svg>`;
      openBtn.title = "Open original URL";
      openBtn.addEventListener("click", () => window.open(long, "_blank"));

      // QR image (click to open large)
      const qrImg = document.createElement("img");
      qrImg.className = "qr";
      qrImg.src = qrFor(short);
      qrImg.title = "QR of short URL (click to open)";
      qrImg.addEventListener("click", () =>
        window.open(qrFor(short), "_blank")
      );

      // Delete
      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn delete";
      delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>`;
      delBtn.title = "Delete";
      delBtn.addEventListener("click", () => {
        if (confirm("Delete this link?")) deleteLink(id);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(openBtn);
      actions.appendChild(qrImg);
      actions.appendChild(delBtn);

      item.appendChild(left);
      item.appendChild(actions);
      linksList.appendChild(item);
    }
  }

  // Shorten button
  shortenBtn.addEventListener("click", async () => {
    const long = longUrlInput.value.trim();
    if (!long) {
      toast("Enter a valid URL");
      return;
    }
    // basic validation — allow http/https or mailto etc, but prefer http for web
    if (
      !/^([a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//.test(long) &&
      !long.startsWith("mailto:") &&
      !long.startsWith("tel:")
    ) {
      // if user omitted protocol, add https://
      // but keep simple: if no protocol, prepend https://
      // e.g., example.com -> https://example.com
      // Avoid double adding if they wrote "www."
      const candidate = "https://" + long;
      // no heavy validation
      toast("No protocol found — prepending https://");
      await new Promise((r) => setTimeout(r, 350));
      return shortenWithUrl(candidate);
    }
    shortenWithUrl(long);
  });

  // helper that actually shortens
  function shortenWithUrl(long) {
    const id = generateShortId();
    saveUrl(id, long);
    loadLinks();

    const short = shortUrlFor(id);
    resultDiv.innerHTML = `Short URL: <a href="${short}" target="_blank">${short}</a>`;
    // copy to clipboard automatically
    copyText(short);
    // clear input and save last input as empty
    longUrlInput.value = "";
    saveLastInput("");
    toast("Short URL created");
  }

  // Save input on typing
  longUrlInput.addEventListener("input", (e) => {
    saveLastInput(e.target.value);
  });

  // On load redirect handler (reads hash)
  function handleRedirectOnLoad() {
    const h = window.location.hash || "";
    const match = h.replace("#/", "");
    if (match && match.length === 6) {
      const data = getUrls();
      if (data[match]) {
        // redirect to long URL
        window.location.href = data[match];
      } else {
        // unknown id — show message and stay
        toast("Short link not found");
      }
    }
  }

  // ensure page reloads links after manual modifications sometimes
  window.addEventListener("storage", loadLinks);
})();
