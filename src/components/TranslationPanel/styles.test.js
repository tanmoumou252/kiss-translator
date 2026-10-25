import { TRANSLATION_PANEL_STYLES } from "./styles";

// 选中/按下/hover 态统一走次强调 token 的静态契约（规则文本不变式）。
describe("TranslationPanel pressed/checked states use the secondary accent tokens", () => {
  const stateRules = TRANSLATION_PANEL_STYLES.split("\n")
    .filter((line) => line.includes("{"))
    .filter((line) =>
      /aria-pressed="true"|aria-checked="true"|button:hover/.test(line)
    );

  test("pressed, checked and hover state rules consume the secondary tokens", () => {
    expect(stateRules.length).toBe(5);
    for (const rule of stateRules) {
      expect(rule).toContain("var(--kt-secc)");
      expect(rule).toContain("var(--kt-onsecc)");
    }
  });

  test("state rules no longer consume the primary container tokens", () => {
    for (const rule of stateRules) {
      expect(rule).not.toContain("--kt-pric");
      expect(rule).not.toContain("--kt-onpric");
    }
  });
});
