import {test,expect} from "@playwright/test";

test("language persists across pages and reload; research names remain intact", async ({page}) => {
  const errors:string[]=[];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.getByText("Pteridophytes of Korea",{exact:true})).toBeVisible();
  await expect(page.locator(".stats")).toHaveCount(0);
  await page.getByRole("button",{name:"Switch to Korean"}).click();
  await expect(page.locator("html")).toHaveAttribute("lang","ko");
  await expect(page.getByRole("button",{name:"이름으로 검색"})).toBeVisible();
  await page.getByRole("link",{name:"형태 탐색",exact:true}).click();
  await expect(page.getByRole("heading",{name:"형태 탐색",exact:true})).toBeVisible();
  await expect(page.getByText("합성 용어",{exact:true}).first()).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang","ko");
  await page.goto("/taxa/TX000001/photos?node=MO0002&include=false");
  await page.getByRole("button",{name:"영어로 전환"}).click();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page).toHaveURL(/node=MO0002&include=false/);
  await expect(page.getByRole("heading",{name:"Synthetic taxon A",exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test("statistics uses exact-feature coverage and works on mobile in Korean", async ({page}) => {
  await page.goto("/statistics");
  const taxa = page.locator('[data-rank="taxa"]');
  await expect(taxa.getByRole("img")).toHaveAttribute("aria-label","2 of 3 with morphology-linked photographs");
  await page.getByLabel("Morphological feature",{exact:true}).selectOption("MO0001");
  await expect(taxa.getByRole("img")).toHaveAttribute("aria-label","0 of 3 with morphology-linked photographs");
  await page.getByLabel("Morphological feature",{exact:true}).selectOption("MO0002");
  await expect(taxa.getByRole("img")).toHaveAttribute("aria-label","2 of 3 with morphology-linked photographs");
  await page.setViewportSize({width:390,height:844});
  await page.getByRole("button",{name:"Switch to Korean"}).click();
  await expect(page.getByRole("heading",{name:"통계",exact:true})).toBeVisible();
  await expect(page.locator(".coverage-card")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
