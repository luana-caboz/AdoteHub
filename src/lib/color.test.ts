import { test } from "node:test";
import assert from "node:assert/strict";
import { brandInk, brandStyle, brandTint, contrastRatio, isHexColor, onColor } from "./color.ts";

const SAMPLES = ["#1f6b4f", "#c23d17", "#f59e0b", "#ffee00", "#7c3aed", "#808080", "#ffffff", "#000000", "#fbf7f1", "#ff7a59"];

test("isHexColor aceita só #rrggbb", () => {
  assert.equal(isHexColor("#1F6B4F"), true);
  for (const bad of ["1f6b4f", "#1f6b4", "#1f6b4fg", "#1f6b4f00", "", null, undefined, 12]) {
    assert.equal(isHexColor(bad), false, String(bad));
  }
});

test("onColor: sempre 4.5:1 e nunca fixa o branco", () => {
  for (const c of SAMPLES) {
    assert.ok(contrastRatio(c, onColor(c)) >= 4.5, `${c} -> ${onColor(c)}`);
  }
  assert.equal(onColor("#1f6b4f"), "#ffffff");
  assert.notEqual(onColor("#ffee00"), "#ffffff");
  assert.notEqual(onColor("#f59e0b"), "#ffffff");
});

test("brandInk: texto legível sobre creme, papel e o -50; mantém a cor quando já passa", () => {
  for (const c of SAMPLES) {
    const ink = brandInk(c);
    for (const bg of ["#fbf7f1", "#ffffff", brandTint(c)]) {
      assert.ok(contrastRatio(ink, bg) >= 4.5, `${c} -> ${ink} sobre ${bg}`);
    }
  }
  assert.equal(brandInk("#1f6b4f"), "#1f6b4f");
  assert.notEqual(brandInk("#ffee00"), "#ffee00");
});

test("brandTint clareia a cor (variante -50)", () => {
  assert.ok(contrastRatio(brandTint("#1f6b4f"), "#ffffff") < 1.3);
});

test("brandStyle: sem cor de apoio, o apoio é a principal", () => {
  const s = brandStyle("#1f6b4f", "#c23d17", null) as Record<string, string>;
  assert.equal(s["--brand-3"], "#1f6b4f");
  assert.equal(s["--brand-3-ink"], s["--brand-ink"]);
  assert.equal(s["--brand-3-50"], s["--brand-50"]);
});

test("brandStyle: cor de apoio própria e valor inválido cai na principal", () => {
  const own = brandStyle("#1f6b4f", "#c23d17", "#ffee00") as Record<string, string>;
  assert.equal(own["--brand-3"], "#ffee00");
  assert.equal(own["--brand-3-contrast"], onColor("#ffee00"));
  const bad = brandStyle("#1f6b4f", "#c23d17", "azul") as Record<string, string>;
  assert.equal(bad["--brand-3"], "#1f6b4f");
});

test("brandStyle: contraste calculado para os três papéis", () => {
  const s = brandStyle("#ffee00", "#f59e0b", "#7c3aed") as Record<string, string>;
  for (const n of ["brand", "brand-2", "brand-3"]) {
    assert.ok(contrastRatio(s[`--${n}`], s[`--${n}-contrast`]) >= 4.5, n);
    assert.ok(contrastRatio(s[`--${n}-ink`], "#ffffff") >= 4.5, `${n}-ink`);
  }
});
