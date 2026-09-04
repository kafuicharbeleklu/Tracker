import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 393, height: 852 } });
await p.goto('http://localhost:5199/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.fill('input[type="email"]', 'alice.admin@tracker.app');
await p.fill('input[type="password"]', 'demo-password');
await p.click('button:has-text("Se connecter")');
await p.waitForTimeout(3500);
await p.evaluate(() => { window.location.hash = '#/inventory'; });
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(() => {
  const row = document.querySelector('section button');
  const l1 = row.querySelector('span > span > span');
  const ty = l1.nextElementSibling;
  const l2 = l1.parentElement.nextElementSibling;
  const probe = document.createElement('span');
  probe.className = 'text-text-muted';
  document.body.appendChild(probe);
  const probe2 = document.createElement('span');
  probe2.className = 'text-text-tertiary';
  document.body.appendChild(probe2);
  return {
    tyClass: ty.className, tyColor: getComputedStyle(ty).color,
    l2Class: l2.className, l2Color: getComputedStyle(l2).color,
    probeMuted: getComputedStyle(probe).color,
    probeTertiary: getComputedStyle(probe2).color,
    bodyColor: getComputedStyle(document.body).color,
  };
}), null, 1));
await b.close();
