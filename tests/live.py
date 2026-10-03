import asyncio, json
from playwright.async_api import async_playwright
URL = 'https://carlosperez232310.github.io/system/'
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        await ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=':root{--sat:47px!important;--sab:34px!important}';document.head.appendChild(s);});")
        p = await ctx.new_page()
        errs, bad = [], []
        p.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        p.on('console', lambda m: m.type in ('error', 'warning') and errs.append(f'{m.type}: {m.text}'))
        p.on('response', lambda r: r.status >= 400 and bad.append(f'{r.status} {r.url}'))
        p.on('requestfailed', lambda r: bad.append(f'FAILED {r.url} {r.failure}'))
        await p.goto(URL, wait_until='networkidle'); await p.wait_for_timeout(1500)
        res = await p.evaluate("""async () => {
          const reg = await navigator.serviceWorker.ready;
          const man = await (await fetch(document.querySelector('link[rel=manifest]').href)).json();
          const manUrl = new URL(document.querySelector('link[rel=manifest]').href);
          const icons = await Promise.all(man.icons.map(async i => { const u = new URL(i.src, manUrl); const r = await fetch(u); return `${i.sizes} ${r.status} ${r.headers.get('content-type')}`; }));
          const ati = await fetch(document.querySelector('link[rel=apple-touch-icon]').href);
          await document.fonts.ready;
          const fontsLoaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
          return {title: document.querySelector('.q-title')?.textContent, objectives: document.querySelectorAll('.obj').length,
            swScope: reg.scope, swActive: !!reg.active, swScript: reg.active && reg.active.scriptURL,
            manifest: {start_url: new URL(man.start_url, manUrl).href, scope: new URL(man.scope, manUrl).href, display: man.display},
            icons, appleTouchIcon: ati.status, fontsLoaded,
            orbitronCheck: document.fonts.check('700 20px Orbitron'), rajdhaniCheck: document.fonts.check('600 20px Rajdhani'),
            titleFont: getComputedStyle(document.querySelector('.q-title')).fontFamily,
            hScroll: document.documentElement.scrollWidth > innerWidth,
            controlled: !!navigator.serviceWorker.controller,
            meta: {viewport: document.querySelector('meta[name=viewport]').content, capable: document.querySelector('meta[name=apple-mobile-web-app-capable]').content, bar: document.querySelector('meta[name=apple-mobile-web-app-status-bar-style]').content}};
        }""")
        await p.reload(wait_until='networkidle'); await p.wait_for_timeout(1500)
        res['controlledAfterReload'] = await p.evaluate('!!navigator.serviceWorker.controller')
        await p.screenshot(path='/home/box/system-app/screenshots/live-quest.png')
        await ctx.set_offline(True); await p.reload(); await p.wait_for_timeout(1200)
        res['offlineTitle'] = await p.evaluate("document.querySelector('.q-title')?.textContent")
        await ctx.set_offline(False)
        res['consoleErrors'] = errs; res['badResponses'] = bad
        print(json.dumps(res, indent=1))
        await b.close()
asyncio.run(main())
