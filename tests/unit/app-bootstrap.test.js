import { expect, test } from "vitest";
import { bootstrapApplication } from "../../js/app-bootstrap.js";

test("Bootstrap hält die dokumentierte Startreihenfolge ein", () => {
  const calls = [];
  const mark = name => () => calls.push(name);

  bootstrapApplication({
    applyView: mark("view"),
    setupCrossTabSync: mark("sync"),
    loadState: () => { calls.push("load"); return false; },
    initializeFallbackState: mark("fallback"),
    setupPlayerPolling: mark("polling"),
    setupPlayerNavigation: mark("navigation"),
    setupClickAway: mark("click-away"),
    setupArcaneSelects: mark("selects"),
    setupInstructionalFields: mark("fields"),
    render: mark("render"),
    enhanceArcaneSelects: mark("enhance")
  });

  expect(calls).toEqual([
    "view", "sync", "load", "fallback", "polling", "navigation",
    "click-away", "selects", "fields", "render", "enhance"
  ]);
});
