import { test, expect } from "@playwright/test";

test("navigation, terminology, researcher sections and invitation in both languages", async ({page}) => {
  await page.goto('/contributors');
  await expect(page.locator('header nav a')).toHaveText(['Taxa','Morphology','Photo Gallery','Statistics','Contributors']);
  await expect(page).toHaveTitle('Contributors | Pteridophyte Digital Flora');
  const leads=page.getByRole('region',{name:'Lead Researchers',exact:true});
  const researchers=page.getByRole('region',{name:'Researchers',exact:true});
  await expect(leads.getByRole('heading',{name:'Synthetic contributor'})).toBeVisible();
  await expect(researchers.getByRole('heading',{name:'Private contact contributor'})).toBeVisible();
  await expect(page.locator('.contributor-invitation')).toContainText('please contact a lead researcher');
  await expect(page.locator('.contributor-invitation a[href^="mailto:"]')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText('hidden@example.org');
  await page.getByRole('button',{name:'Switch to Korean'}).click();
  await expect(page.locator('header nav a')).toHaveText(['분류군','형태 탐색','사진 도감','통계','참여자']);
  await expect(page.getByRole('region',{name:'대표 연구자',exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'연구자',exact:true})).toBeVisible();
  await expect(page.locator('.contributor-invitation')).toContainText('대표 연구자에게 연락해 주세요');
  await page.goto('/');
  await expect(page.getByText('한국의 양치류',{exact:true})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('고사리류');
});
