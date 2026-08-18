// 月の出費 — オフラインでも開けるようにするための最小の番人。
// 中身を書き換えたら CACHE の版を上げること。上げないと古い画面が居座る。
const CACHE = "shuppi-v6";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // スプレッドシートへの通信は絶対に横取りしない。常に生で通す。
  if (url.origin !== location.origin) return;
  if (e.request.method !== "GET") return;

  // 画面の本体は「まず網、駄目なら控え」。更新が届きやすい。
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
