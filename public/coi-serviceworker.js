/*
 * coi-serviceworker.js
 * Injects Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
 * into every response so that SharedArrayBuffer (required by FFmpeg WASM) works
 * on GitHub Pages, which cannot serve custom HTTP headers.
 *
 * Architecture:
 *  - On first load, this script registers itself as a SW.
 *  - After registration it reloads the page so all subsequent requests are
 *    intercepted by the SW, which adds the COOP/COEP headers.
 *
 * Based on the popular coi-serviceworker pattern:
 * https://github.com/gzuidhof/coi-serviceworker
 */

/* ─── Service Worker Side ─── */
if (typeof window === 'undefined') {
    // Running inside the SW
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

    self.addEventListener('fetch', (event) => {
        const url = new URL(event.request.url);

        // Only intercept same-origin requests
        if (url.origin !== self.location.origin) return;

        event.respondWith(
            fetch(event.request).then((response) => {
                // Don't modify redirects or opaque responses
                if (response.status === 0 || response.redirected) return response;

                const newHeaders = new Headers(response.headers);
                newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
                newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            })
        );
    });
}

/* ─── Main Thread Side ─── */
else {
    (() => {
        // Already has the headers — nothing to do
        if (self.crossOriginIsolated) return;

        // Safari workaround: skip SW approach, it often blocks WASM there
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
            console.warn('[coi-sw] Safari detected — SharedArrayBuffer may not be available.');
            return;
        }

        if (!navigator.serviceWorker) {
            console.warn('[coi-sw] Service workers not supported — SharedArrayBuffer unavailable.');
            return;
        }

        navigator.serviceWorker
            .register('/vidacut/coi-serviceworker.js')
            .then((reg) => {
                // If SW was just installed, reload so it can intercept this page's requests
                if (reg.installing || reg.waiting) {
                    reg.installing?.addEventListener('statechange', ({ target }) => {
                        if (target.state === 'activated') window.location.reload();
                    });
                    reg.waiting?.addEventListener('statechange', ({ target }) => {
                        if (target.state === 'activated') window.location.reload();
                    });
                }
            })
            .catch((err) => console.error('[coi-sw] SW registration failed:', err));
    })();
}
