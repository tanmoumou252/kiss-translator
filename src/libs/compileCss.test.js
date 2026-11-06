import { compileCss, sanitizeScopeSlug } from "./compileCss";

describe("compileCss nested-rule preservation", () => {
  // 契约：仅深度 0 的顶层 & 规则被展开为作用域后代选择器；位于媒体查询
  // 或其他规则块内的 & 规则必须原样保留在 rest 中，交由原生 CSS 嵌套
  // 解析——提取会丢失外层上下文，产生与用户草稿语义不符的全局化规则。
  test("keeps an & rule inside a media query nested for native CSS resolution", () => {
    const { css, valid } = compileCss(
      "kt-scope-x",
      "@media (min-width: 100px) { & a { color: red } }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(
      ".kt-scope-x .kt-style-demo { @media (min-width: 100px) { & a { color: red } } }"
    );
    // 绝不允许 & 规则被展开后逃逸到媒体查询外成为顶层规则
    expect(css).not.toMatch(/\.kt-style-demo a \{/);
  });

  test("keeps an & rule nested inside a plain block rule", () => {
    const { css, valid } = compileCss(
      "kt-scope-x",
      "body { & b { color: blue } }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(
      ".kt-scope-x .kt-style-demo { body { & b { color: blue } } }"
    );
    expect(css).not.toMatch(/\.kt-style-demo b \{/);
  });

  test("extracts only top-level & rules and preserves nested ones without loss", () => {
    const { css, valid } = compileCss(
      "kt-scope-x",
      "&:hover { color: blue } @media screen { & a { color: red } }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(
      ".kt-scope-x .kt-style-demo { @media screen { & a { color: red } } }\n" +
        ".kt-scope-x .kt-style-demo:hover { color: blue }"
    );
    // 嵌套内容不得被游标处理删除或重复发射
    expect(css.match(/color: red/g)).toHaveLength(1);
    expect(css.match(/color: blue/g)).toHaveLength(1);
  });

  test("still rejects a selector list inside a nested & rule", () => {
    const { css, valid } = compileCss(
      "kt-scope-x",
      "@media screen { &, body { color: red } }"
    );
    // 逗号作用域闸对任意深度的 & 规则均生效
    expect(valid).toBe(false);
    expect(css).toBe("");
  });

  test("accepts a comma inside a functional pseudo-class argument", () => {
    // 括号内的逗号是函数式伪类参数：":not(.a, .b)" 展开后整体仍挂在
    // 作用域前缀下，非选择器列表，不得误判整份无效
    const { css, valid } = compileCss(
      "kt-scope-x",
      "&:not(.a, .b) { color: red }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(".kt-scope-x .kt-style-demo:not(.a, .b) { color: red }");
  });

  test("accepts commas inside a string in the selector", () => {
    // 掩码副本中字符串内逗号已置零，[data-x="a,b"] 非选择器列表
    const { css, valid } = compileCss(
      "kt-scope-x",
      '&[data-x="a,b"] { color: red }'
    );
    expect(valid).toBe(true);
    expect(css).toBe('.kt-scope-x .kt-style-demo[data-x="a,b"] { color: red }');
  });

  test("still rejects a selector list comma after a functional pseudo-class closes", () => {
    // 伪类括号闭合后再出现的逗号是真实的列表分隔符：第二个成员 body
    // 会脱离卡片作用域，仍须整份判无效
    const { css, valid } = compileCss(
      "kt-scope-x",
      "&:not(a), body { color: red }"
    );
    expect(valid).toBe(false);
    expect(css).toBe("");
  });
});

describe("compileCss non-string input gate", () => {
  test("returns invalid for non-string styleCode without throwing", () => {
    // 导入/同步通道可能注入非字符串 styleCode（如 123）：raw.trim() 会抛
    // TypeError 崩页面，违反文件头"绝不抛错"契约——非字符串整份判无效
    expect(compileCss("kt-scope-x", 123)).toEqual({ css: "", valid: false });
    expect(compileCss("kt-scope-x", null)).toEqual({ css: "", valid: false });
    expect(compileCss("kt-scope-x", undefined)).toEqual({
      css: "",
      valid: false,
    });
    expect(compileCss("kt-scope-x", {})).toEqual({ css: "", valid: false });
  });

  test("keeps empty and whitespace-only strings valid", () => {
    // 空串语义不变：valid:true、无规则输出（空白样式卡片不进 invalid 形态）
    expect(compileCss("kt-scope-x", "")).toEqual({ css: "", valid: true });
    expect(compileCss("kt-scope-x", "   ")).toEqual({ css: "", valid: true });
  });
});

describe("compileCss mid-selector & preservation", () => {
  test("keeps the ancestor condition of a prefixed & rule nested", () => {
    // "html.dark &" 中 & 前有祖先文本：不得提取为无条件规则，也不得把
    // 祖先文本残留成垃圾 rest 块——整条留 rest 走原生 CSS 嵌套，祖先条件
    // 保留且永不逃出作用域
    const { css, valid } = compileCss(
      "kt-scope-x",
      "html.dark & { color: red }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(".kt-scope-x .kt-style-demo { html.dark & { color: red } }");
    // 绝不允许无 dark 条件的 color 规则被发射
    expect(css).not.toMatch(/^\.kt-scope-x \.kt-style-demo \{ color: red/m);
    // 垃圾 rest 块（祖先文本被拆出）不得出现
    expect(css).not.toContain("{ html.dark }");
  });

  test("still extracts a & rule that follows a closed block", () => {
    // & 前是规则边界 }：仍是顶层规则起点，按现状提取
    const { css, valid } = compileCss("kt-scope-x", "x { y:z } & a { b:c }");
    expect(valid).toBe(true);
    expect(css).toBe(
      ".kt-scope-x .kt-style-demo { x { y:z } }\n.kt-scope-x .kt-style-demo a { b:c }"
    );
  });

  test("still extracts a & rule at the start of the draft", () => {
    // 文首 &：无祖先文本，按现状提取
    const { css, valid } = compileCss("kt-scope-x", "& a { b:c }");
    expect(valid).toBe(true);
    expect(css).toBe(".kt-scope-x .kt-style-demo a { b:c }");
  });

  test("treats a declaration-ending semicolon as a rule boundary", () => {
    // 声明结束的 ; 与 } 同为规则边界：; 之后的 & 是新规则起点而非选择器
    // 中缀——展开为两条平铺规则（前一条声明 + & 规则），与 } 边界行为
    // 一致，且对无原生 CSS 嵌套的环境保持平铺兼容
    const { css, valid } = compileCss(
      "kt-scope-x",
      "color: red; &:hover { color: blue }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(
      ".kt-scope-x .kt-style-demo { color: red; }\n" +
        ".kt-scope-x .kt-style-demo:hover { color: blue }"
    );
    // 绝不允许 & 规则整体滞留 rest 成单块嵌套形态
    expect(css).not.toMatch(/color: red; &:hover/);
  });

  test("still keeps a & selector-suffix mid-rule when no boundary precedes", () => {
    // 无边界字符（html.dark 紧邻 &）：中缀判定不回归
    const { css, valid } = compileCss(
      "kt-scope-x",
      "html.dark & { color: red }"
    );
    expect(valid).toBe(true);
    expect(css).toBe(".kt-scope-x .kt-style-demo { html.dark & { color: red } }");
  });
});

describe("sanitizeScopeSlug", () => {
  test("maps safe slugs identically", () => {
    // [A-Za-z0-9_-] 逐字符恒等：现有夹具类名（kt-scope-custom-a 等）不变
    ["custom-a", "marker", "x", "custom_9f3b", "A-Z_0-9", "a"].forEach(
      (slug) => {
        expect(sanitizeScopeSlug(slug)).toBe(slug);
      }
    );
  });

  test("encodes unsafe slugs without commas or spaces", () => {
    const outputs = [
      sanitizeScopeSlug("x, body"),
      sanitizeScopeSlug("x body"),
      sanitizeScopeSlug("x;body"),
      sanitizeScopeSlug("样式"),
      sanitizeScopeSlug("x.y"),
    ];
    outputs.forEach((out) => {
      expect(out).not.toMatch(/[,\s]/);
    });
  });

  test("keeps distinct unsafe slugs distinct (injective encoding)", () => {
    const outputs = [
      sanitizeScopeSlug("x, body"),
      sanitizeScopeSlug("x body"),
      sanitizeScopeSlug("x,  body"),
      sanitizeScopeSlug("xbody"),
      sanitizeScopeSlug("x_u002c_body"),
    ];
    expect(new Set(outputs).size).toBe(outputs.length);
  });
});
