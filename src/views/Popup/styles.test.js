import { POPUP_STYLES } from "./styles";
import { getCssAtRuleBodies } from "../../styles/testUtils";

describe("Safari popup sizing", () => {
  test("keeps an intrinsic preferred width within the available container", () => {
    const shellRule = POPUP_STYLES.match(/\.kt-popup-shell\s*\{([^}]*)\}/)?.[1];
    const scrollRule = POPUP_STYLES.match(
      /\.kt-popup-scroll\s*\{([^}]*)\}/
    )?.[1];

    expect(shellRule).toContain("width: 396px");
    expect(shellRule).toContain("max-width: 100%");
    expect(shellRule).toContain("min-width: 0");
    expect(POPUP_STYLES).not.toMatch(
      /\.kt-popup-shell:not\(\.kt-popup-shell--window\)\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/
    );
    expect(shellRule).not.toMatch(/max-(?:width|height):\s*100v[wh]/);
    expect(scrollRule).toContain("height: auto");
    expect(scrollRule).toContain("overflow: visible");
    expect(scrollRule).not.toContain("100vh");
    expect(POPUP_STYLES).not.toContain("kt-popup-scroll--expanded");
    expect(POPUP_STYLES).not.toContain("kt-popup-scroll--text");
    expect(POPUP_STYLES).not.toMatch(
      /\.kt-popup-style-chips--open\s*\{[^}]*overflow-y:\s*auto;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-chrome\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/
    );
    expect(POPUP_STYLES).not.toMatch(/@media\s*\(max-height:/);
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch\.MuiSwitch-root\s*\{[^}]*width:\s*46px;[^}]*height:\s*28px;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch \.MuiSwitch-switchBase\.Mui-checked\s*\{[^}]*transform:\s*translateX\(18px\);/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch \.MuiSwitch-switchBase\.Mui-checked \+ \.MuiSwitch-track\s*\{[^}]*background:\s*var\(--kt-pri\);/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch \.MuiSwitch-input\s*\{[^}]*left:\s*0;[^}]*width:\s*46px;[^}]*height:\s*28px;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch \.MuiSwitch-switchBase\.Mui-checked \.MuiSwitch-input\s*\{[^}]*left:\s*-18px;/
    );
    expect(POPUP_STYLES).not.toMatch(
      /\.kt-popup-advanced-row \.MuiSwitch-input/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch \.MuiSwitch-switchBase\.Mui-disabled \+ \.MuiSwitch-track\s*\{[^}]*background:\s*var\(--kt-onv\);[^}]*opacity:\s*\.12;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-main-switch \.MuiSwitch-switchBase\.Mui-checked\.Mui-disabled \+ \.MuiSwitch-track\s*\{[^}]*background:\s*var\(--kt-onv\);[^}]*opacity:\s*\.12;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-advanced-row \.MuiSwitch-root\s*\{[^}]*margin:\s*-2px -4px;[^}]*\}/
    );
    expect(POPUP_STYLES).not.toMatch(
      /\.kt-popup-advanced-row \.MuiSwitch-root\s*\{[^}]*transform:/
    );
    expect(POPUP_STYLES).not.toMatch(
      /@media\s*\(max-width:\s*395px\)[\s\S]*?\.kt-popup-shell\s*\{\s*width:\s*100vw;/
    );
  });
});

describe("popup keyboard focus", () => {
  test("uses a rounded keyboard-only ring for compact language selectors", () => {
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-language-select \.MuiSelect-select\s*\{[^}]*border-radius:\s*inherit;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-language-select \.MuiSelect-select\.MuiInputBase-input:focus\s*\{[^}]*outline:\s*3px solid var\(--kt-pri\);[^}]*background:\s*transparent;/
    );
    const focusVisibleBodies = getCssAtRuleBodies(
      POPUP_STYLES,
      "@supports selector(:focus-visible)"
    );
    expect(
      focusVisibleBodies.some(
        (body) =>
          /\.MuiSelect-select\.MuiInputBase-input:focus\s*\{[^}]*outline:\s*none;/.test(
            body
          ) &&
          /\.MuiSelect-select\.MuiInputBase-input:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--kt-pri\);/.test(
            body
          )
      )
    ).toBe(true);
  });

  test("does not clip service focus rings in the collapsed row", () => {
    const servicesRule = POPUP_STYLES.match(
      /\.kt-popup-services\s*\{([^}]*)\}/
    )?.[1];

    expect(servicesRule).toContain("overflow: visible");
    expect(servicesRule).not.toContain("overflow: hidden");
  });

  test("keeps the disabled language swap arrow visibly dark", () => {
    const swapRule = POPUP_STYLES.match(
      /\.kt-popup-swap\.MuiIconButton-root\.Mui-disabled\s*\{([^}]*)\}/
    )?.[1];

    expect(swapRule).toContain("color: var(--kt-line)");
    expect(swapRule).toContain("opacity: 1");
  });
});

describe("popup translation controls", () => {
  test("centers the header and compact controls with symmetric padding", () => {
    const headerRule = POPUP_STYLES.match(
      /\.kt-popup-header\s*\{([^}]*)\}/
    )?.[1];
    const moreServiceRule = POPUP_STYLES.match(
      /\.kt-popup-more-service\s*\{([^}]*)\}/
    )?.[1];

    expect(headerRule).toContain("padding: 7px 14px");
    expect(moreServiceRule).toContain("padding-inline: 10px");
  });

  test("uses a rounded, theme-aware language menu", () => {
    const menuRule = POPUP_STYLES.match(
      /\.kt-popup-language-menu\.MuiPaper-root\s*\{([^}]*)\}/
    )?.[1];

    expect(menuRule).toContain("border-radius: 4px");
    expect(menuRule).toContain("background: var(--kt-sf1)");
    expect(menuRule).toContain("color: var(--kt-on)");
    expect(menuRule).toContain("max-height: min(280px, calc(100% - 32px))");
    expect(menuRule).toContain("overflow-y: auto");
    expect(menuRule).not.toContain("overflow: hidden");
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-language-select \.MuiSelect-icon\s*\{[^}]*transition:\s*transform/
    );
    const hoverBodies = getCssAtRuleBodies(
      POPUP_STYLES,
      "@media (hover: hover)"
    );
    expect(
      hoverBodies.some(
        (body) =>
          /\.kt-popup-language-menu \.MuiMenuItem-root:hover/.test(body) &&
          /\.kt-popup-language-menu \.MuiMenuItem-root\.Mui-selected:hover/.test(
            body
          )
      )
    ).toBe(true);
  });

  test("rotates the more-services icon when expanded", () => {
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-more-service\[aria-expanded="true"\] svg\s*\{[^}]*transform:\s*rotate\(180deg\);/
    );
  });

  test("keeps the all-styles disclosure inside the chip flow", () => {
    const moreStyleRule = POPUP_STYLES.match(
      /\.kt-popup-style-more\s*\{([^}]*)\}/
    )?.[1];

    expect(moreStyleRule).toContain("min-height: 44px");
    expect(moreStyleRule).toContain("flex-direction: row");
    expect(moreStyleRule).toContain("background: var(--kt-sf2)");
    expect(moreStyleRule).not.toContain("margin:");
  });

  test("uses restrained shapes for page translation controls", () => {
    const heroRule = POPUP_STYLES.match(/\.kt-popup-hero\s*\{([^}]*)\}/)?.[1];
    const serviceRule = POPUP_STYLES.match(
      /\.kt-popup-service\s*\{([^}]*)\}/
    )?.[1];

    expect(heroRule).toContain("border-radius: 16px");
    expect(serviceRule).toContain("border-radius: 8px");
    expect(serviceRule).toContain("font-weight: 650");
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-site__select\s*\{[^}]*border-radius:\s*8px;/
    );
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-style-chip\s*\{[^}]*font-weight:\s*650;/
    );
  });
});

// Keep the background and content panel full-width with fluid layout.
describe("separate translation window layout", () => {
  const windowShellRule = POPUP_STYLES.match(
    /\.kt-popup-shell--window\s*\{([^}]*)\}/
  )?.[1];
  const panelRule = POPUP_STYLES.match(
    /\.kt-popup-shell--window \.kt-popup-text-panel,[^{]*\{([^}]*)\}/
  )?.[1];

  test("lets the shell span the whole window", () => {
    expect(windowShellRule).toContain("width: 100%");
    // A fixed shell width would expose a different background at either side.
    expect(windowShellRule).not.toMatch(/width:\s*min\(/);
  });

  test("expands the content panel across the full window width", () => {
    expect(panelRule).toContain("width: 100%");
    expect(panelRule).toContain("min-width: 0");
    expect(panelRule).not.toMatch(/width:\s*min\(/);
    expect(panelRule).toContain("margin: 0");
    expect(panelRule).not.toContain("margin-inline: auto");
  });

  test("does not animate geometry while fitting the standalone window", () => {
    expect(POPUP_STYLES).toMatch(
      /\.kt-popup-shell--window \.kt-popup-text-panel\s*\{[^}]*animation:\s*none;/
    );
    expect(POPUP_STYLES).not.toMatch(
      /@media\s*\(max-width:\s*395px\)[\s\S]*?\.kt-popup-shell--window\s*\{[^}]*width:\s*100vw;/
    );
  });

  test("measures full height against the dynamic viewport", () => {
    // Dynamic units account for the mobile browser toolbar.
    expect(windowShellRule).toContain("min-height: 100dvh");
    expect(windowShellRule).not.toContain("min-height: 100vh");
  });

  test("leaves the result textarea resize behavior to TranCont inline styles", () => {
    // 意见 B：窗口模式 CSS 不得压制 hidden 态原生 resize——
    // resize:none 与 height:auto !important 均须移除，由内联样式全态接管。
    const textareaRule = POPUP_STYLES.match(
      /\.kt-popup-shell--window \.kt-translation-result textarea:not\(\[aria-hidden="true"\]\)\s*\{([^}]*)\}/
    )?.[1];
    expect(textareaRule).toBeDefined();
    expect(textareaRule).not.toMatch(/resize\s*:/);
    expect(textareaRule).not.toMatch(/height:\s*auto\s*!important/);
    // 保留布局声明：flex/min-height 承载窗口拉伸，overflow-y 维持滚动语义。
    expect(textareaRule).toContain("flex: 1");
    expect(textareaRule).toContain("min-height: 140px");
    expect(textareaRule).toContain("overflow-y: auto !important");
  });
});

// 未锁定 + 非 hidden 手柄态下，结果 textarea 无任何内联高度（TranCont
// 内联仅接管 resize，锁定态高度由 useTextareaHeightLock 的 rootProps 承
// 载），窗口模式的高度唯一来源是本文件布局链。此处逐跳锁死链路，防止
// 任一 flex/min-height 声明被误删后未锁定态塌成内容高度。
describe("popup window result textarea flex chain", () => {
  test("stretches the unlocked result textarea via an unbroken flex chain", () => {
    const panelRule = POPUP_STYLES.match(
      /\.kt-popup-shell--window \.kt-popup-text-panel\s*\{([^}]*)\}/
    )?.[1];
    expect(panelRule).toContain("display: flex");
    expect(panelRule).toContain("flex-direction: column");
    expect(panelRule).toContain("min-height: 100dvh");

    const resultRule = POPUP_STYLES.match(
      /\.kt-popup-shell--window \.kt-translation-result\s*\{([^}]*)\}/
    )?.[1];
    expect(resultRule).toContain("flex: 1");
    expect(resultRule).toContain("display: flex");
    expect(resultRule).toContain("flex-direction: column");
    expect(resultRule).toContain("min-height: 180px");

    // flexRule 以联合选择器前缀（> .MuiFormControl-root）锚定 styles.js
    // 中 `.MuiInputBase-root { flex: 1; }` 这条规则；`align-items: stretch`
    // 是其后的另一条独立规则，须单独匹配断言，不能复用同一条捕获。
    const flexRule = POPUP_STYLES.match(
      /\.kt-translation-result > \.MuiFormControl-root,\s*\.kt-popup-shell--window \.kt-translation-result \.MuiInputBase-root\s*\{([^}]*)\}/
    )?.[1];
    expect(flexRule).toContain("flex: 1");

    // align-items: stretch 与 flexRule 是两条独立规则（联合规则的第二个
    // 成员选择器与本正则前缀同形，单次 match 会先命中联合规则体），
    // matchAll 收集全部同名选择器规则体后以 some 断言，免除排版格式依赖。
    const inputBaseBodies = [
      ...POPUP_STYLES.matchAll(
        /\.kt-popup-shell--window \.kt-translation-result \.MuiInputBase-root\s*\{([^}]*)\}/g
      ),
    ].map((m) => m[1]);
    expect(
      inputBaseBodies.some((body) => body.includes("align-items: stretch"))
    ).toBe(true);

    const textareaRule = POPUP_STYLES.match(
      /\.kt-popup-shell--window \.kt-translation-result textarea:not\(\[aria-hidden="true"\]\)\s*\{([^}]*)\}/
    )?.[1];
    expect(textareaRule).toContain("flex: 1");
    expect(textareaRule).toContain("min-height: 140px");
  });

  test("never reintroduces a css height or resize override on the result textarea", () => {
    const textareaRule = POPUP_STYLES.match(
      /\.kt-popup-shell--window \.kt-translation-result textarea:not\(\[aria-hidden="true"\]\)\s*\{([^}]*)\}/
    )?.[1];
    expect(textareaRule).toBeDefined();
    expect(textareaRule).not.toMatch(/(?:^|[^-])height\s*:/);
    expect(textareaRule).not.toMatch(/resize\s*:/);
  });
});
