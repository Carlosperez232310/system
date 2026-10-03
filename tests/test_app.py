import json, sys, os, asyncio
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/'
OUT = '/home/box/system-app/screenshots'
os.makedirs(OUT, exist_ok=True)
SAFE = {(390, 844): (47, 34), (430, 932): (59, 34)}
issues = []

CHECK_JS = r'''() => {
  const vw = innerWidth, vh = innerHeight, res = {vw, vh};
  const main = document.querySelector('#main'), scr = document.querySelector('#screen'), tb = document.querySelector('#tabbar'), top = document.querySelector('#topbar');
  res.docScrollW = document.documentElement.scrollWidth; res.mainScrollW = main.scrollWidth;
  res.tabBottom = tb.getBoundingClientRect().bottom; res.topTop = top.getBoundingClientRect().top;
  res.mainH = main.clientHeight; res.screenH = scr.offsetHeight; res.scrollH = main.scrollHeight;
  // horizontal overflow of visible elements
  res.overflow = [];
  for (const el of document.querySelectorAll('#app *')) {
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    if (r.right > vw + 0.5 || r.left < -0.5) { const cs = getComputedStyle(el); if (el.closest('.filters')) continue; res.overflow.push(el.className + ':' + (el.textContent||'').trim().slice(0,30) + ` [${Math.round(r.left)},${Math.round(r.right)}]`); }
  }
  // text clipping (ellipsis) in objective names
  res.clipped = [...document.querySelectorAll('.oname,.nm')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
  // tap target sizes
  res.small = [...document.querySelectorAll('#app button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 38 || r.width < 38); }).map(b => b.className + ':' + b.textContent.trim().slice(0,20) + ` ${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`);
  // dead space: bottom of last panel vs bottom of main viewport
  const panels = [...scr.children]; const last = panels[panels.length-1];
  res.lastPanelBottomGap = last ? Math.round(Math.max(main.getBoundingClientRect().bottom, scr.getBoundingClientRect().bottom) - last.getBoundingClientRect().bottom - (main.scrollHeight > main.clientHeight ? 0 : 0)) : null;
  res.fillsViewport = scr.offsetHeight >= main.clientHeight - 1;
  return res;
}'''

async def shot(page, name, full=False):
    p = f'{OUT}/{name}.png'; await page.screenshot(path=p, full_page=False); return p

async def run(w, h):
    tag = f'{w}x{h}'
    sat, sab = SAFE[(w, h)]
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=3, is_mobile=True, has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
        await ctx.add_init_script(f"""document.addEventListener('DOMContentLoaded',()=>{{const s=document.createElement('style');s.textContent=':root{{--sat:{sat}px!important;--sab:{sab}px!important}}';document.head.appendChild(s);}});
          try{{const st=JSON.parse(localStorage.getItem('system.save.v1')||'null'); if(st){{st.settings.tipDismissed=true;localStorage.setItem('system.save.v1',JSON.stringify(st));}}else{{}} }}catch(e){{}}""")
        page = await ctx.new_page()
        errs = []; page.on('pageerror', lambda e: errs.append(str(e))); page.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await page.goto(URL); await page.wait_for_timeout(900)
        # dismiss install tip if shown
        if await page.locator('.install-tip button').count(): await page.click('.install-tip button')
        results = {}
        async def check(name):
            await page.wait_for_timeout(900)
            r = await page.evaluate(CHECK_JS); results[name] = r
            p = await shot(page, f'{tag}-{name}')
            prob = []
            if r['docScrollW'] > w or r['mainScrollW'] > w: prob.append(f"h-scroll {r['docScrollW']}/{r['mainScrollW']}")
            if r['overflow']: prob.append('overflow ' + '; '.join(r['overflow'][:5]))
            if r['clipped']: prob.append('clipped ' + ', '.join(r['clipped']))
            if r['small']: prob.append('small taps ' + '; '.join(r['small'][:6]))
            if abs(r['tabBottom'] - h) > 1: prob.append(f"tabbar bottom {r['tabBottom']}")
            if not r['fillsViewport']: prob.append(f"screen {r['screenH']} < main {r['mainH']}")
            print(f'[{tag}] {name}: mainH={r["mainH"]} scrollH={r["scrollH"]} gap={r["lastPanelBottomGap"]} ' + ('OK' if not prob else 'ISSUES: ' + ' | '.join(prob)))
            if prob: issues.append((tag, name, prob))
        await check('quest')
        for t in ['status', 'items', 'shop', 'log', 'settings']:
            await page.click(f'[data-tab="{t}"]'); await check(t)
        await page.click('[data-tab="quest"]'); await page.wait_for_timeout(600)

        # ---- quest flow ----
        g0 = await page.evaluate('__SYSTEM.state.gold')
        await page.click('.obj[data-o="pushups"] .oname'); await page.click('[data-action="add"][data-o="pushups"]')
        c = await page.evaluate("__SYSTEM.state.quest.objectives[0].current"); assert c == 6, c
        await page.click('[data-action="dec"][data-o="pushups"]')
        c = await page.evaluate("__SYSTEM.state.quest.objectives[0].current"); assert c == 5, c
        for o in ['pushups', 'situps', 'squats', 'walk']:
            await page.click(f'[data-action="done"][data-o="{o}"]'); await page.wait_for_timeout(120)
        await page.wait_for_timeout(500); await shot(page, f'{tag}-quest-progress')
        # force a loot drop for test determinism
        await page.evaluate("Math._r=Math.random; Math.random=()=>0.05")
        await page.click('[data-action="done"][data-o="water"]')
        await page.wait_for_selector('.overlay .modal', timeout=3000); await page.wait_for_timeout(700)
        await shot(page, f'{tag}-quest-complete-modal')
        st = await page.evaluate('__SYSTEM.state')
        assert st['quest']['completed'] and st['streak'] == 1 and st['stats']['STR'] == 11, (st['streak'], st['stats'])
        print(f'[{tag}] quest complete: gold {g0} -> {st["gold"]}, xp {st["xp"]}, inv {st["inventory"]}')
        await page.click('.overlay .btn'); await page.wait_for_timeout(1900)
        await shot(page, f'{tag}-loot-reveal')
        await page.evaluate("Math.random=Math._r")
        await page.click('.overlay .btn'); await page.wait_for_timeout(700)
        await check('quest-cleared')

        # ---- level up via XP: give enough xp then use scroll ----
        await page.evaluate("__SYSTEM.state.inventory.scroll_l=1; __SYSTEM.state.inventory.rest=1; __SYSTEM.state.inventory.mystery=1; __SYSTEM.save(); __SYSTEM.render()")
        await page.click('[data-tab="items"]'); await page.wait_for_timeout(700)
        await check('items-full')
        await page.click('.item[data-k="scroll_l"]'); await page.wait_for_timeout(500)
        await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(500)
        await shot(page, f'{tag}-levelup-flash')
        await page.wait_for_selector('.overlay .modal', timeout=4000); await page.wait_for_timeout(600)
        await shot(page, f'{tag}-levelup-modal')
        lv = await page.evaluate('__SYSTEM.state.level'); assert lv >= 2, lv
        await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(800)  # allocate -> status
        await page.click('[data-action="alloc"][data-k="AGI"]'); await page.wait_for_timeout(300)
        assert await page.evaluate('__SYSTEM.state.stats.AGI') == 11
        await check('status-points')
        # mystery box
        await page.click('[data-tab="items"]'); await page.wait_for_timeout(500)
        await page.click('.item[data-k="mystery"]'); await page.wait_for_timeout(400)
        await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(1900)
        await shot(page, f'{tag}-mystery-box'); await page.click('.overlay .btn'); await page.wait_for_timeout(400)

        # ---- shop ----
        await page.evaluate("__SYSTEM.state.gold=400; __SYSTEM.save(); __SYSTEM.render()")
        await page.click('[data-tab="shop"]'); await page.wait_for_timeout(600)
        rid = await page.evaluate("__SYSTEM.state.rewards.find(r=>r.name==='Takeout night').id")
        await page.click(f'[data-action="buy-reward"][data-id="{rid}"]'); await page.wait_for_timeout(500)
        await shot(page, f'{tag}-shop-confirm')
        await page.click('.overlay .btn.gold'); await page.wait_for_timeout(500)
        g = await page.evaluate('__SYSTEM.state.gold'); assert g == 100, g
        await page.click('.overlay .btn'); await page.wait_for_timeout(300)
        # add custom reward
        await page.click('[data-action="reward-new"]'); await page.fill('#f-name', 'Concert tickets'); await page.fill('#f-price', '1500')
        await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(300)
        assert await page.evaluate("__SYSTEM.state.rewards.some(r=>r.name==='Concert tickets'&&r.price===1500)")
        # edit & delete
        rid2 = await page.evaluate("__SYSTEM.state.rewards.find(r=>r.name==='Concert tickets').id")
        await page.click(f'[data-action="reward-edit"][data-id="{rid2}"]'); await page.click('.overlay .btn.red'); await page.wait_for_timeout(300)
        assert not await page.evaluate("__SYSTEM.state.rewards.some(r=>r.name==='Concert tickets')")
        # not enough gold
        await page.click('[data-action="buy-item"][data-k="crystal"]'); await page.wait_for_timeout(300)
        assert await page.locator('.overlay').count() == 0
        await check('shop-after')

        # ---- side quest ----
        await page.click('[data-tab="quest"]'); await page.wait_for_timeout(400)
        await page.click('[data-action="side-new"]'); await page.fill('#f-name', 'Read 20 pages'); await page.fill('#f-gold', '20'); await page.click('#f-daily')
        await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(400)
        g = await page.evaluate('__SYSTEM.state.gold')
        await page.click('[data-action="side-done"]'); await page.wait_for_timeout(500)
        assert await page.evaluate('__SYSTEM.state.gold') == g + 20

        # ---- penalty: pretend today's quest is from yesterday and incomplete ----
        await page.evaluate("""(()=>{const s=__SYSTEM.state; const d=new Date(Date.now()-86400000);
          const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}).format(d);
          s.quest.date=p; s.quest.completed=false; s.streak=4; s.gold=200; __SYSTEM.save();})()""")
        await page.reload(); await page.wait_for_timeout(500)
        await page.wait_for_selector('.overlay.red', timeout=4000); await page.wait_for_timeout(900)
        await shot(page, f'{tag}-penalty-modal')
        st = await page.evaluate('__SYSTEM.state')
        assert st['streak'] == 0 and st['gold'] < 200 and st['penaltyQuest'], (st['streak'], st['gold'])
        print(f'[{tag}] penalty applied: gold 200 -> {st["gold"]}, penalty quest {[o["target"] for o in st["penaltyQuest"]["objectives"]]}')
        await page.click('.overlay .btn'); await page.wait_for_timeout(700)
        await check('quest-penalty')
        await page.evaluate("document.querySelector('#main').scrollTop=99999"); await page.wait_for_timeout(300)
        await shot(page, f'{tag}-quest-penalty-scrolled')
        for o in ['p_push', 'p_squat', 'p_burpee']:
            await page.click(f'[data-action="done"][data-o="{o}"]'); await page.wait_for_timeout(150)
        await page.wait_for_selector('.overlay .modal', timeout=3000); await page.click('.overlay .btn'); await page.wait_for_timeout(500)
        assert not await page.evaluate('__SYSTEM.state.penaltyQuest')
        # potion of rest
        await page.click('[data-tab="items"]'); await page.wait_for_timeout(400)
        await page.click('.item[data-k="rest"]'); await page.wait_for_timeout(400)
        await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(500)
        await page.click('.overlay [data-mval="walk"]'); await page.wait_for_timeout(600)
        assert await page.evaluate("__SYSTEM.state.quest.objectives.find(o=>o.id==='walk').skipped")
        # export/import round trip
        exported = await page.evaluate("JSON.stringify(__SYSTEM.state)")
        await page.click('[data-action="nav"][data-tab="settings"]'); await page.wait_for_timeout(400)
        async with page.expect_download() as dl: await page.click('[data-action="export"]')
        d = await dl.value; pth = await d.path(); data = json.load(open(pth)); assert data['player'] == 'Carlos Perez'
        await page.click('[data-action="import-paste"]'); await page.fill('#f-json', json.dumps(data)); await page.click('.overlay .btn:not(.ghost)')
        await page.wait_for_timeout(300); await page.click('.overlay .btn:not(.ghost)'); await page.wait_for_timeout(400)
        assert await page.evaluate('__SYSTEM.state.level') == data['level']
        await check('log-final') if False else None
        await page.click('[data-tab="log"]'); await check('log-final')
        print(f'[{tag}] JS errors: {errs}')
        if errs: issues.append((tag, 'js', errs))
        await b.close()

async def main():
    for w, h in [(390, 844), (430, 932)]:
        await run(w, h)
    print('\nISSUES:', json.dumps(issues, indent=1) if issues else 'none')
if __name__ == "__main__": asyncio.run(main())
