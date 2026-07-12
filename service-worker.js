// 🌟 重要：今後HTMLやJSを書き換えてGitに上げる際は、この数字を「v4」「v5」と増やしてください。
// これによってスマホ側が「あ、新しいバージョンが来たな」と確実に気付けます。
const CACHE_NAME = 'bus-app-v4'; 

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // 🌟 新しいプログラムを待たずにすぐ有効化する設定
  );
});

// 🌟【追加】古いバージョンのキャッシュを自動でゴミ箱に捨てる処理
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // 🌟 今開いている画面を即座に新しいシステムに切り替える
  );
});

// キャッシュから高速表示する処理
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});