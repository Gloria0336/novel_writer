import { expect, test } from "@playwright/test";

test("map sandbox opens, renders, selects, and exports JSON", async ({ page }) => {
  await page.goto("/");
  const canvas = page.getByTestId("tower-map-canvas");
  const viewport = page.getByTestId("map-viewport");
  await expect(canvas).toBeVisible();

  const initialBox = await canvas.boundingBox();
  await canvas.hover();
  await page.mouse.wheel(0, -1600);
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(initialBox?.width ?? 0);

  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).toBeTruthy();
  await viewport.evaluate((element) => {
    element.scrollLeft = 20;
    element.scrollTop = 20;
  });
  const beforePan = await viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  await page.mouse.move((viewportBox?.x ?? 0) + (viewportBox?.width ?? 0) / 2, (viewportBox?.y ?? 0) + (viewportBox?.height ?? 0) / 2);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move((viewportBox?.x ?? 0) + (viewportBox?.width ?? 0) / 2 - 80, (viewportBox?.y ?? 0) + (viewportBox?.height ?? 0) / 2 - 60, {
    steps: 5
  });
  await page.mouse.up({ button: "middle" });
  const afterPan = await viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  expect(afterPan.left + afterPan.top).toBeGreaterThan(beforePan.left + beforePan.top);

  const hasPaint = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    const ctx = canvasElement.getContext("2d");
    if (!ctx) return false;
    const { width, height } = canvasElement;
    const image = ctx.getImageData(Math.floor(width / 2), Math.floor(height / 2), 12, 12).data;
    return Array.from(image).some((value) => value !== 0);
  });
  expect(hasPaint).toBe(true);

  const firstNode = await page.evaluate(() => window.__TOWER_MAP__?.nodes[0]);
  expect(firstNode).toBeTruthy();
  const box = await canvas.boundingBox();
  const mapSize = await page.evaluate(() => ({
    width: window.__TOWER_MAP__?.pixelWidth ?? 1,
    height: window.__TOWER_MAP__?.pixelHeight ?? 1
  }));
  await canvas.click({
    position: {
      x: ((firstNode!.position.x / mapSize.width) * (box?.width ?? 1)),
      y: ((firstNode!.position.y / mapSize.height) * (box?.height ?? 1))
    }
  });
  await expect(page.locator(".node-detail header strong").filter({ hasText: firstNode!.name })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-json").click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const payload = await download.createReadStream();
  let raw = "";
  await new Promise<void>((resolve, reject) => {
    payload.on("data", (chunk) => {
      raw += chunk.toString();
    });
    payload.on("end", resolve);
    payload.on("error", reject);
  });
  expect(JSON.parse(raw).schemaVersion).toBe(1);
});
