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

  const firstStructure = await page.evaluate(() => window.__TOWER_MAP__?.structures[0]);
  expect(firstStructure).toBeTruthy();
  const box = await canvas.boundingBox();
  const mapSize = await page.evaluate(() => ({
    width: window.__TOWER_MAP__?.pixelWidth ?? 1,
    height: window.__TOWER_MAP__?.pixelHeight ?? 1
  }));
  await viewport.evaluate(
    (element, target) => {
      const zoom = target.boxWidth / target.mapWidth;
      element.scrollLeft = Math.max(0, target.x * zoom - element.clientWidth / 2);
      element.scrollTop = Math.max(0, target.y * zoom - element.clientHeight / 2);
    },
    {
      x: firstStructure!.position.x,
      y: firstStructure!.position.y,
      boxWidth: box?.width ?? 1,
      mapWidth: mapSize.width
    }
  );
  await canvas.evaluate(
    (element, target) => {
      const rect = element.getBoundingClientRect();
      const zoom = target.boxWidth / target.mapWidth;
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          clientX: rect.left + target.x * zoom,
          clientY: rect.top + target.y * zoom
        })
      );
    },
    {
      x: firstStructure!.position.x,
      y: firstStructure!.position.y,
      boxWidth: box?.width ?? 1,
      mapWidth: mapSize.width
    }
  );
  await expect(page.locator(".node-detail header strong").filter({ hasText: firstStructure!.name })).toBeVisible();

  const firstArmy = await page.evaluate(() => window.__TOWER_MAP__?.armies[0]);
  expect(firstArmy).toBeTruthy();
  const armyPoint = await page.evaluate((army) => {
    const map = window.__TOWER_MAP__!;
    const tile = map.tileMap.tiles.find((item) => item.coord.q === army.position.q && item.coord.r === army.position.r)!;
    const offset = map.config.hexSize * 0.85;
    return {
      x: tile.position.x + (army.owner === "human" ? -offset : offset),
      y: tile.position.y - offset * 0.35
    };
  }, firstArmy!);
  await viewport.evaluate(
    (element, target) => {
      const zoom = target.boxWidth / target.mapWidth;
      element.scrollLeft = Math.max(0, target.x * zoom - element.clientWidth / 2);
      element.scrollTop = Math.max(0, target.y * zoom - element.clientHeight / 2);
    },
    {
      x: armyPoint.x,
      y: armyPoint.y,
      boxWidth: box?.width ?? 1,
      mapWidth: mapSize.width
    }
  );
  await canvas.evaluate(
    (element, target) => {
      const rect = element.getBoundingClientRect();
      const zoom = target.boxWidth / target.mapWidth;
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          clientX: rect.left + target.x * zoom,
          clientY: rect.top + target.y * zoom
        })
      );
    },
    {
      x: armyPoint.x,
      y: armyPoint.y,
      boxWidth: box?.width ?? 1,
      mapWidth: mapSize.width
    }
  );
  await expect(page.locator(".node-detail header strong").filter({ hasText: firstArmy!.id })).toBeVisible();

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
  const parsed = JSON.parse(raw);
  expect(parsed.schemaVersion).toBe(2);
  expect(parsed.armies.length).toBeGreaterThan(0);
});
