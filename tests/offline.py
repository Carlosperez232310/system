import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); ctx = await b.new_context(viewport={'width':390,'height':844})
        p = await ctx.new_page(); await p.goto('http://localhost:8765/'); 
        await p.evaluate("navigator.serviceWorker.ready.then(()=>1)"); await p.wait_for_timeout(1500)
        await p.reload(); await p.wait_for_timeout(800)
        man = await p.evaluate("fetch('manifest.json').then(r=>r.json())")
        await ctx.set_offline(True); await p.reload(); await p.wait_for_timeout(1000)
        t = await p.evaluate("document.querySelector('.q-title')?.textContent")
        f = await p.evaluate("document.fonts.check('20px Orbitron') && document.fonts.check('600 20px Rajdhani')")
        print('offline render:', t, '| fonts:', f, '| manifest display:', man['display'], [i['sizes'] for i in man['icons']])
        await b.close()
asyncio.run(main())
