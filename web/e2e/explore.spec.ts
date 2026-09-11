import { test, expect } from "@playwright/test";
test("synonym search, detail, states and keyboard image viewer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://synthetic.supabase.co/**", (route) =>
    route.abort(),
  );
  await page.goto("/taxa");
  await page.getByLabel("Scientific name, Korean name, or synonym").fill("Synthetic synonym");
  await page.getByRole("link").filter({ hasText: "Synthetic taxon A" }).click();
  await expect(
    page.getByRole("heading", { name: "Synthetic taxon A" }),
  ).toBeVisible();
  await expect(page.getByText("CY0001", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Morphology & Documentation", exact: true }).click();
  await expect(page.getByText("Not documented", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Photos", exact: true }).click();
  const trigger = page.getByRole("button", { name: "View photo IM000001" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("img", { name: "Unable to load photograph" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toContainText("IM000002");
  await page.getByRole("button", { name: "Large size", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Standard size", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
test("parent morphology includes descendants only when requested", async ({
  page,
}) => {
  await page.route("https://synthetic.supabase.co/**", (route) =>
    route.abort(),
  );
  await page.goto("/morphology/MO0001");
  await page.getByLabel("Photo taxon", {exact:true}).selectOption("TX000001");
  await expect(
    page.getByRole("button", { name: "View photo IM000001" }),
  ).toBeVisible();
  await page.getByLabel("Include descendant features").uncheck();
  await expect(
    page.getByText("No published photographs", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View photo IM000001" }),
  ).toHaveCount(0);
});
test("mobile, no image duplication and unknown IDs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://synthetic.supabase.co/**", (route) =>
    route.abort(),
  );
  await page.goto("/gallery");
  await expect(page.locator(".photo-button")).toHaveCount(0);
  await page.getByLabel("Photo taxon", {exact:true}).selectOption("TX000001");
  await expect(
    page.getByRole("button", { name: "View photo IM000001" }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const response = await page.goto("/taxa/TX_UNKNOWN");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Record not found")).toBeVisible();
});

test("species tree prunes empty branches but global tree preserves them", async ({page}) => {
 await page.route("https://synthetic.supabase.co/**", route => route.abort());
 await page.goto("/taxa/TX000001/photos");
 const tree = page.getByRole("navigation", {name:"Taxon photo morphology tree"});
 await expect(tree.getByRole("link", {name:"Synthetic root (2)", exact:true})).toBeVisible();
 await expect(tree.getByRole("link", {name:"Synthetic child (2)", exact:true})).toBeVisible();
 await expect(tree.locator('a[href*="MO0003"]')).toHaveCount(0);
 await tree.getByRole("link", {name:"Synthetic root (2)", exact:true}).click();
 await expect(page.locator('.photo-button')).toHaveCount(2);
 await page.getByRole("link", {name:"Selected feature only", exact:true}).click();
 await expect(page.locator('.photo-button')).toHaveCount(0);
 await page.goto("/morphology");
 await expect(page.locator('a[href="/morphology/MO0003"]')).toBeVisible();
 await page.goto("/taxa/TX000002/photos");
 await expect(page.getByText("No photographs recorded.", {exact:false})).toBeVisible();
 await expect(page.getByRole("navigation", {name:"Taxon photo morphology tree"})).toHaveCount(0);
});

test("initial lists stay empty until a search or taxonomy selection", async ({page}) => {
 for (const url of ["/", "/taxa"]) {
  await page.goto(url);
  await expect(page.locator(".taxon-row")).toHaveCount(0);
  await page.getByLabel("Scientific name, Korean name, or synonym").fill("Synthetic synonym");
  await expect(page.locator(".taxon-row")).toHaveCount(1);
  await page.getByLabel("Scientific name, Korean name, or synonym").fill("  ");
  await expect(page.locator(".taxon-row")).toHaveCount(0);
  await page.getByRole("button", {name:"Browse taxonomy",exact:true}).click();
  await expect(page.locator(".taxon-row")).toHaveCount(0);
  await page.getByLabel("Order", {exact:true}).selectOption("Synthetic order");
  await expect(page.locator(".taxon-row")).toHaveCount(1);
  await page.getByLabel("Order", {exact:true}).selectOption("");
  await expect(page.locator(".taxon-row")).toHaveCount(0);
 }
});
test("contributors navigation, content and private email omission", async ({page}) => {
 await page.goto("/");
 await page.getByRole("link", {name:"Contributors",exact:true}).click();
 await expect(page.getByRole("heading", {name:"Synthetic contributor",exact:true})).toBeVisible();
 await expect(page.getByText("Synthetic institution", {exact:true})).toBeVisible();
 await expect(page.locator('.contributor-card').getByRole("link", {name:"visible@example.org"})).toBeVisible();
 await expect(page.getByText("hidden@example.org", {exact:true})).toHaveCount(0);
 const data = await page.request.get("/data/contributors.json");
 expect(await data.text()).not.toContain("hidden@example.org");
});

test("gallery defers every photo request until taxon selection", async ({page}) => {
 const requested: string[]=[];
 page.on("request",r=>{if(r.url().includes("/data/taxa/"))requested.push(r.url());});
 await page.goto("/gallery");
 await expect(page.getByText("Select a taxon to display photographs.")).toBeVisible();
 expect(requested).toEqual([]);
 await page.getByLabel("Photo taxon",{exact:true}).selectOption("TX000001");
 await expect(page.locator(".photo-button")).toHaveCount(2);
 expect(requested.every(url=>url.endsWith("TX000001.json"))).toBeTruthy();
 await page.getByLabel("Photo taxon",{exact:true}).selectOption("");
 await expect(page.locator(".photo-button")).toHaveCount(0);
});
test("comparison uses one exact node and keeps all selected species separate", async ({page}) => {
 await page.route("https://synthetic.supabase.co/**",route=>route.abort());
 await page.goto("/morphology/MO0002");
 await page.getByRole("link",{name:"Compare morphology across taxa →"}).click();
 await expect(page.getByLabel("Feature to compare",{exact:true})).toHaveValue("MO0002");
 for(const id of ["TX000001","TX000002","TX000003"])await page.getByLabel("Add a taxon to compare",{exact:true}).selectOption(id);
 await expect(page.locator(".photo-button")).toHaveCount(0);
 await page.getByRole("button",{name:"Compare 3 taxa",exact:true}).click();
 const a=page.getByRole("article",{name:"합성 분류군 comparison photographs",exact:true});
 const b=page.getByRole("article",{name:"Synthetic taxon B comparison photographs",exact:true});
 const c=page.getByRole("article",{name:"Synthetic taxon C comparison photographs",exact:true});
 await expect(a.locator(".photo-button")).toHaveCount(2);
 await expect(c.locator(".photo-button")).toHaveCount(1);
 await expect(b.getByText("No photographs recorded for this feature.",{exact:false})).toBeVisible();
 await expect(a.getByRole("button",{name:"View photo IM000003"})).toHaveCount(0);
 await c.getByRole("button",{name:"View photo IM000003"}).click();
 await expect(c.getByRole("dialog")).toBeVisible();
 await page.keyboard.press("Escape");
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByLabel("Feature to compare",{exact:true}).selectOption("MO0001");
 await page.getByRole("button",{name:"Compare 3 taxa",exact:true}).click();
 await expect(page.locator(".photo-button")).toHaveCount(0);
 await expect(page.locator(".comparison-column")).toHaveCount(3);
});

test("Excel-managed copy is applied and Korean morphology terminology is preserved", async ({page}) => {
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Edited in Excel",exact:true})).toBeVisible();
 await page.goto("/morphology");
 await expect(page.getByText("합성 용어",{exact:true}).first()).toBeVisible();
 await expect(page.getByRole("heading",{name:"Morphology",exact:true})).toBeVisible();
});

test("morphology branches expand by keyboard and gallery options use scientific names", async ({page}) => {
 await page.goto('/morphology');
 const branch=page.locator('details[data-morphology-id="MO0001"]');
 const child=page.locator('a[href="/morphology/MO0002"]');
 await expect(child).toBeHidden();
 await branch.locator('summary').focus();
 await page.keyboard.press('Enter');
 await expect(child).toBeVisible();
 await expect(page.locator('a[href="/morphology/MO0001"]')).toBeVisible();
 await branch.locator('summary').click();
 await expect(child).toBeHidden();
 await page.goto('/gallery');
 const select=page.getByLabel('Photo taxon',{exact:true});
 await expect(select.locator('option[value="TX000001"]')).toHaveText('Synthetic taxon A');
 await select.selectOption('TX000001');
 await expect(page.locator('.photo-button')).toHaveCount(2);
});
