// ==UserScript==
// @name         X Bookmarks Cleaner (Visible/Loaded)
// @namespace    rimexe0
// @version      1.0.0
// @description Adds a button at the bottom right of x to remove visible and loaded bookmarks. thats it
// @author      rimexe0
// @license     MIT
// @description  Remove bookmarks with throttling from X/Twitter bookmarks page
// @match        https://x.com/i/bookmarks*
// @match        https://twitter.com/i/bookmarks*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const cfg = {
    clickDelayMin: 1200,
    clickDelayMax: 2200,
    settleMs: 500,
    cooldownEvery: 8,
    cooldownMs: 7000,
    noProgressLimit: 3
  };

  let running = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  const inViewport = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.left < window.innerWidth && r.right > 0;
  };

  const getTweetCards = () => [...document.querySelectorAll('article[data-testid="tweet"]')];

  const getRemoveBtn = (tweet) =>
    tweet.querySelector(
      '[data-testid="removeBookmark"], button[aria-label*="Remove Bookmark"], button[aria-label*="Remove bookmark"]'
    );

  const getButtons = (mode = "visible") => {
    const tweets = getTweetCards().filter((t) => (mode === "visible" ? inViewport(t) : true));
    const btns = tweets.map(getRemoveBtn).filter(Boolean);
    return [...new Set(btns)];
  };

  async function removeLoop(mode) {
    running = true;
    setStatus(`Running (${mode})...`);
    let removed = 0;
    let noProgress = 0;

    while (running && noProgress < cfg.noProgressLimit) {
      const buttons = getButtons(mode);
      if (!buttons.length) {
        noProgress++;
        await sleep(800);
        continue;
      }

      let removedThisPass = 0;

      for (const btn of buttons) {
        if (!running) break;
        if (!document.contains(btn)) continue;

        btn.scrollIntoView({ block: "center", behavior: "instant" });
        await sleep(rand(150, 450));
        btn.click();

        removed++;
        removedThisPass++;
        setStatus(`Removed: ${removed}`);

        await sleep(cfg.settleMs);

        if (removed % cfg.cooldownEvery === 0) {
          setStatus(`Removed: ${removed} | cooldown...`);
          await sleep(cfg.cooldownMs);
        } else {
          await sleep(rand(cfg.clickDelayMin, cfg.clickDelayMax));
        }
      }

      noProgress = removedThisPass ? 0 : noProgress + 1;
    }

    running = false;
    setStatus(`Done. Removed ${removed}.`);
  }

  function stopLoop() {
    running = false;
    setStatus("Stopping...");
  }

  function makeButton(text, onClick) {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.cssText = `
      all: unset;
      cursor: pointer;
      background: #111;
      color: #fff;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 8px 10px;
      font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    `;
    b.addEventListener("click", onClick);
    return b;
  }

  const root = document.createElement("div");
  root.style.cssText = `
    position: fixed;
    right: 14px;
    bottom: 14px;
    z-index: 999999;
    background: rgba(255,255,255,0.95);
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 10px;
    min-width: 220px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    color: #111;
    font: 12px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  `;

  const title = document.createElement("div");
  title.textContent = "Bookmarks Cleaner";
  title.style.cssText = "font-weight: 700; margin-bottom: 8px;";

  const row = document.createElement("div");
  row.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;";

  const status = document.createElement("div");
  status.textContent = "Idle";
  status.style.cssText = "font-size: 11px; color: #333;";

  function setStatus(txt) {
    status.textContent = txt;
  }

  row.appendChild(makeButton("Remove Visible", () => !running && removeLoop("visible")));
  row.appendChild(makeButton("Remove Loaded", () => !running && removeLoop("loaded")));
  row.appendChild(makeButton("Stop", stopLoop));

  root.appendChild(title);
  root.appendChild(row);
  root.appendChild(status);
  document.body.appendChild(root);
})();
