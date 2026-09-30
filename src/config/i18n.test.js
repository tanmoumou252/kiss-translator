import { I18N, UI_LANGS, newI18n } from "./i18n";
import { RU_I18N } from "./i18n.ru";

test("covers every supported locale for every registered label", () => {
  const locales = UI_LANGS.map(([locale]) => locale);
  const missing = Object.entries(I18N).flatMap(([key, translations]) =>
    locales
      .filter((locale) => !translations[locale])
      .map((locale) => `${key}:${locale}`)
  );

  expect(missing).toEqual([]);
});

// i18n.js 以 `I18N[key].ru = RU_I18N[key] ?? I18N[key].en` 英文兜底填充
// ru（i18n.js 合并段），上述全语言遍历断言对 ru 缺键恒绿——RU_I18N 的
// 键完整性必须单独对账。本断言锁定 textarea 拉伸手柄功能域 18 键：任一
// 键在 RU_I18N 缺失或为空即红（俄语用户静默回退英文文案的回归守护）。
test("ships every textarea grip label as a native Russian translation", () => {
  const gripKeys = [
    "field_resize_height",
    "field_resize_unlock_hint",
    "settings_textarea_grip_style",
    "settings_textarea_grip_style_desc",
    "grip_style_concentric_smooth",
    "grip_style_concentric_triple",
    "grip_style_corner_pill",
    "grip_style_dotted_concentric",
    "grip_style_dotted_single",
    "grip_style_triple_chevrons",
    "grip_style_diagonal_arrow",
    "grip_style_dual_pills",
    "grip_style_expanding_beads",
    "grip_style_chevrons_star",
    "grip_style_symmetric_division",
    "grip_style_percent_style",
    "grip_style_orbit_satellite",
    "grip_style_hidden",
  ];
  const missing = gripKeys.filter(
    (key) =>
      !Object.prototype.hasOwnProperty.call(RU_I18N, key) || !RU_I18N[key]
  );
  expect(missing).toEqual([]);
});

test("provides distinct popup loading and domain status labels", () => {
  expect(I18N.popup_loading.en).toBe("Loading…");
  expect(I18N.popup_loading.en).not.toBe(I18N.popup_translating.en);
  expect(I18N.popup_domain_allowed.en).toBe("Not blocked");
  expect(I18N.popup_domain_allowed.en).not.toBe(I18N.popup_domain_active.en);
  expect(I18N.popup_more_services.en).toBe("More translation services");
});

test("integrates Russian translations with M3 labels and product identity", () => {
  expect(UI_LANGS.map(([locale]) => locale)).toContain("ru");
  expect(I18N.app_name.ru).toBe("KISS Translator");
  expect(I18N.translate.ru).toBe("Перевести");
  expect(I18N.discard_api_changes_confirm.ru).toBe(
    I18N.discard_api_changes_confirm.en
  );
});

test("provides default text when key is not found", () => {
  const i18n = newI18n("en");
  expect(i18n("nonexistent_key")).toBe("nonexistent_key");
  expect(i18n("nonexistent_key", "Fallback")).toBe("Fallback");
  expect(i18n("nonexistent_key", "")).toBe("");
  expect(i18n("app_name")).not.toBe("app_name");
});
