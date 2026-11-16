(() => {
  const $ = (selector) => document.querySelector(selector);
  const grid = $("#animeGrid"), statusEl = $("#status");
  if (!grid || !statusEl) return;

  let page = 1, mode = "recent", query = "", activeController = null;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
  const clean = value => String(value ?? "").replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  const asArray = value => Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : [];

  function normalizeItems(value) {
    const seen = new Set();
    return asArray(value).filter(item => {
      if (!item || typeof item !== "object") return false;
      const key = item.link || item.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function showSkeletons() {
    grid.innerHTML = Array.from({length:8}, () =>
      '<article class="sk-card"><div class="sk-cover skeleton"></div><div class="sk-line skeleton"></div><div class="sk-line skeleton"></div></article>'
    ).join("");
  }
  function render(items) {
    if (mode === "movie") items = items.filter(item => /movie|film/i.test(`${item.type || ""} ${item.title || ""}`));
    if (!items.length) {
      grid.innerHTML = '<div class="empty"><i class="fa-solid fa-face-meh"></i><strong>Belum ada anime ditemukan</strong><span>Coba judul lain atau kategori berbeda.</span></div>';
      return 0;
    }
    grid.innerHTML = items.map((item, index) => {
      const rawTitle = clean(item.title || "Anime");
      const title = rawTitle.split(/\s{2,}/)[0] || rawTitle;
      const link = item.link || "";
      const image = item.image || "";
      const latest = clean(item.latestEpisode || item.totalEpisode || item.status || item.type || "Anime");
      return `<article class="anime-card" style="--delay:${Math.min(index * 28, 280)}ms">
        <a class="cover" href="/detail.html?url=${encodeURIComponent(link)}" aria-label="Detail ${esc(title)}">
          ${image ? `<img loading="lazy" decoding="async" src="${esc(image)}" alt="${esc(title)}" onerror="this.closest('.cover').classList.add('image-failed')">` : '<span class="cover-placeholder"><i class="fa-solid fa-film"></i></span>'}
          <span class="tag">${esc(item.type || "ANIME")}</span>
        </a>
        <div class="card-info"><h3 class="card-title">${esc(title)}</h3>
          <div class="card-meta"><i class="fa-regular fa-circle-play"></i> ${esc(latest)}</div>
          <a class="card-open" href="/detail.html?url=${encodeURIComponent(link)}"><i class="fa-solid fa-circle-info"></i> Detail anime</a>
        </div></article>`;
    }).join("");
    return items.length;
  }
  async function load() {
    activeController?.abort();
    activeController = new AbortController();
    showSkeletons();
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengambil katalog...';
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    else if (mode === "completed") params.set("completed", "1");
    else params.set("recent", "1");
    params.set("page", String(page));
    try {
      const response = await fetch(`/api/anime?${params.toString()}`, {
        signal: activeController.signal, headers: { Accept: "application/json" }
      });
      const raw = await response.text();
      let payload;
      try { payload = JSON.parse(raw); }
      catch { throw new Error(`API mengirim format bukan JSON (HTTP ${response.status}).`); }
      if (!response.ok || payload.success === false) throw new Error(payload.message || `API error ${response.status}`);
      const data = payload.data || {};
      if (!data.animeList) throw new Error("Respons valid, tetapi data.animeList tidak ditemukan.");
      const items = normalizeItems(data.animeList);
      const count = render(items);
      statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${count} anime ditampilkan <span>•</span> ${esc(payload.source || "Nexadev")}`;
      $("#pageLabel").textContent = `Halaman ${data.page || page}${data.total ? ` • ${data.total} judul` : ""}`;
    } catch (error) {
      if (error.name === "AbortError") return;
      grid.innerHTML = `<div class="empty error-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>Katalog gagal dimuat</strong><span>${esc(error.message)}</span><small>Periksa <a href="/api/anime?recent=1&page=1">endpoint katalog</a>.</small></div>`;
      statusEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Koneksi API bermasalah';
      $("#pageLabel").textContent = `Halaman ${page}`;
    }
    $("#prevBtn").disabled = page <= 1;
  }

  $("#searchForm")?.addEventListener("submit", event => {
    event.preventDefault(); query = $("#searchInput").value.trim(); page = 1;
    $("#sectionTitle").textContent = query ? `Hasil: ${query}` : "Anime Terbaru";
    document.querySelectorAll(".filter").forEach(button => button.classList.remove("active"));
    load();
  });
  document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active"); mode = button.dataset.type || "recent"; query = ""; page = 1;
    $("#searchInput").value = "";
    $("#sectionTitle").textContent = button.dataset.label || button.textContent.trim();
    load();
  }));
  $("#refreshBtn")?.addEventListener("click", load);
  $("#prevBtn")?.addEventListener("click", () => { if (page > 1) { page--; load(); } });
  $("#nextBtn")?.addEventListener("click", () => { page++; load(); });
  $("#navSearch")?.addEventListener("click", () => setTimeout(() => $("#searchInput")?.focus(), 80));
  $("#navTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  load();
})();
