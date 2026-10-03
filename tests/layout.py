import asyncio, sys
sys.path.insert(0, '/home/box/system-app/tests')
from playwright.async_api import async_playwright
from test_app import CHECK_JS, SAFE
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        for (w, h), (sat, sab) in SAFE.items():
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=3, is_mobile=True, has_touch=True)
            await ctx.add_init_script(f"document.addEventListener('DOMContentLoaded',()=>{{const s=document.createElement('style');s.textContent=':root{{--sat:{sat}px!important;--sab:{sab}px!important}}';document.head.appendChild(s);}});")
            page = await ctx.new_page(); await page.goto('http://localhost:8765/'); await page.wait_for_timeout(1200)
            for t in sys.argv[1:] or ['quest', 'status']:
                if t != 'quest': await page.click(f'[data-tab="{t}"]')
                await page.wait_for_timeout(900)
                r = await page.evaluate(CHECK_JS)
                gp = await page.evaluate("(()=>{const p=document.querySelector('#screen .panel.grow');const m=document.querySelector('#main');return p?Math.round(p.getBoundingClientRect().bottom-m.getBoundingClientRect().bottom):null})()")
                print(f'{w}x{h} {t}: mainH={r["mainH"]} scrollH={r["scrollH"]} growPanelBottom-vs-viewport={gp} small={r["small"]} clipped={r["clipped"]} overflow={r["overflow"][:3]}')
                await page.screenshot(path=f'/home/box/system-app/screenshots/{w}x{h}-{t}.png')
            await ctx.close()
        await b.close()
asyncio.run(main())
