import { expect, test, type Page } from '@playwright/test';

const tab = (page: Page, name: string) => page.getByRole('tab', { name }).click();

test('GM-01: record, citations, arguments and the SLP procedure in the GUI', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');

  await test.step('Notebook reads the record and catches the planted defects', async () => {
    await expect(page.getByTestId('extract').first()).toBeVisible();
    await expect(page.locator('[data-testid=extract][data-kind=party]')).toHaveCount(2);
    await expect(page.locator('[data-testid=extract][data-kind=citation]')).toHaveCount(7);
    const bad = page.locator('[data-testid=extract][data-status=failed], [data-testid=extract][data-status=unresolved]');
    expect(await bad.count()).toBeGreaterThanOrEqual(2);
  });

  await test.step('Documents show both OCR readings where engines disagree', async () => {
    await tab(page, 'Documents');
    await page.getByRole('button', { name: /FIR/ }).click();
    await expect(page.getByTestId('ocr-disagreement')).toHaveCount(1);
  });

  await test.step('Lawyer confirms checked items and discards the bad ones', async () => {
    await tab(page, 'Notebook');
    await page.getByTestId('confirm-all').click();
    while ((await page.getByTestId('discard').count()) > 0) await page.getByTestId('discard').first().click();
    await expect(page.locator('[data-testid=extract][data-status=checked]')).toHaveCount(0);
  });

  await test.step('Citation verifier checks every citation at four levels', async () => {
    await tab(page, 'Citations');
    await page.getByTestId('verify-citations').click();
    await expect(page.getByTestId('citation')).toHaveCount(7);
    const outcome = (level: string, value: string) => page.locator(`[data-level=${level}][data-outcome=${value}]`);
    await expect(outcome('pinpoint', 'failed')).toHaveCount(1);
    await expect(outcome('support', 'failed')).toHaveCount(1);
    await expect(outcome('standing', 'failed')).toHaveCount(1);
    await expect(outcome('identity', 'unresolved')).toHaveCount(2);

    await page.getByTestId('capture-sc').click();
    await expect(outcome('identity', 'unresolved')).toHaveCount(1);
    await expect(page.getByText('Source tier: sc-official')).toHaveCount(1);
  });

  await test.step('Studio and MOTO propose; validation drops arguments on failed authorities', async () => {
    await tab(page, 'Studio');
    await page.getByTestId('run-studio').click();
    await page.getByTestId('run-moto').click();
    await expect(page.locator('[data-testid=claim][data-origin=studio]')).toHaveCount(2);
    expect(await page.getByTestId('dropped').count()).toBeGreaterThan(0);
    await expect(page.locator('[data-testid=dropped]').first()).toContainText('unverified verification');
  });

  await test.step('Case Conference: the lawyer accepts with written reasons', async () => {
    await tab(page, 'Conference');
    for (const kind of ['question-of-law', 'ground']) {
      const item = page.getByTestId('agenda-item').filter({ hasText: kind }).first();
      await item.getByLabel('Rationale').fill('Custody of over two years is on the record and the authority is good law.');
      await item.getByRole('button', { name: 'accept' }).click();
    }
    await tab(page, 'Studio');
    await expect(page.locator('[data-testid=claim][data-status=accepted]')).toHaveCount(2);
  });

  await test.step('SLP advances through procedure and stops where the rules are not met', async () => {
    await tab(page, 'SLP');
    for (let i = 0; i < 6; i++) await page.getByTestId('advance').click();
    await expect(page.getByTestId('slp-state')).toHaveText('SLP: authorities');
    await expect(page.locator('[data-guard=citations-verified][data-ok=false]')).toBeVisible();
  });

  await test.step('Ledger chain is intact and the evaluation agent passes', async () => {
    await tab(page, 'Ledger');
    await expect(page.getByTestId('chain')).toContainText('intact');
    await expect(page.locator('[data-testid=eval][data-suite=notebook]')).toHaveAttribute('data-pass', 'true');
    await expect(page.locator('[data-testid=eval][data-suite=citations]')).toHaveAttribute('data-pass', 'true');
  });

  expect(errors).toEqual([]);
});
