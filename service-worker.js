/* 가족 캘린더 서비스워커
   - 설치 가능(installability) 조건을 충족시키기 위한 fetch 핸들러 포함
   - 앱 껍데기(같은 폴더 파일)만 가볍게 캐시. 데이터는 Firebase(온라인)라 캐시하지 않음. */
const CACHE = 'famcal-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Firebase / 외부 API / CDN 은 항상 네트워크로 (실시간 데이터 보장)
  if (url.origin !== self.location.origin) {
    return; // 브라우저 기본 처리
  }

  // 같은 출처(앱 파일)는 네트워크 우선, 실패하면 캐시로 폴백
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
