    await route.fulfill({status:200,contentType:"image/svg+xml",body:svg});
  });
  await page.addInitScript(()=>localStorage.setItem("kanji5-ui-language","en"));
  await page.goto("/");
  const card=page.locator("#root .learning-card");
  await expect(card).toBeVisible({timeout:20000});
  await card.getByRole("button",{name:"Show kanji information"}).click();
  await expect(card).toHaveClass(/is-revealed/,{timeout:10000});
  const pager=card.locator(".learning-back-page-nav");
  const nextPage=pager.locator(".pager-button").last();
  for(let i=0;i<3;i++){
    await nextPage.dispatchEvent("click");
    await page.waitForTimeout(520);
  }

  const panel=card.locator(".learning-back-page.active .stroke-order-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveClass(/is-expanded/);
  await expect(panel).toHaveAttribute("data-stroke-order-open","true");
  await expect(card.locator(".stroke-order-tool-trigger")).toHaveCount(0);
  await expect(panel.locator(".stroke-order-toggle")).toHaveCount(0);
  await expect(panel.locator("#stroke-order-content")).toHaveCount(1);
  await expect(panel).toHaveAttribute("aria-labelledby","stroke-order-title");
});

test('dictionary search exposes a stable no-results state and selection dialog restores focus',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'فرهنگ کانجی'}).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});