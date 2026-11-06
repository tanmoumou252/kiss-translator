// 安全 CSS 编译解析器：把用户草稿按卡片作用域编译（& 嵌套展开为作用域
// 后代选择器）；括号不配对等语法无效 → { css: "", valid: false } 优雅
// 降级（is-invalid 形态），绝不抛错崩页面。StylesSetting 卡片演示与
// Rules 下拉的 custom 项预览共用同一校验口径。
export function compileCss(scopeClass, raw) {
  if (!raw || !raw.trim()) return { css: "", valid: true };
  // 预处理单遍扫描：剥注释、跟踪字符串与转义状态，同时做花括号深度计数。
  // 字符串/注释内的花括号不参与深度计数，也不得被 & 规则正则误捕——否则
  // 扫描计数与真实解析器的块结构错位（content: "{" / "}"、/* & x { } */
  // 会造成误判无效或把注释当规则发射）。产出两份等长文本：
  //   stripped — 剥除注释后的草稿（字符串原样保留，输出拼装基于它）
  //   masked   — 字符串内部字符替换为 \u0000 的掩码副本（& 规则正则在它
  //              上跑，命中索引可直接映射回 stripped 取真实 sel/body）
  // 无法安全处理的输入（注释/字符串未闭合）整份判无效，作用域闸不缺口。
  let depth = 0;
  let stripped = "";
  let masked = "";
  let quote = "";
  for (let i = 0; i < raw.length; ) {
    const ch = raw[i];
    if (quote) {
      // 字符串内部：原文保留、掩码置零；转义对（\" 等）整体保留
      if (ch === "\\") {
        stripped += ch;
        masked += "\u0000";
        if (i + 1 < raw.length) {
          stripped += raw[i + 1];
          masked += "\u0000";
          i += 2;
        } else {
          i += 1;
        }
        continue;
      }
      stripped += ch;
      masked += "\u0000";
      if (ch === quote) quote = "";
      i += 1;
      continue;
    }
    if (ch === "/" && raw[i + 1] === "*") {
      // 注释整段剥除（不进 stripped/masked）；未闭合判无效
      const end = raw.indexOf("*/", i + 2);
      if (end === -1) return { css: "", valid: false };
      i = end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      stripped += ch;
      masked += ch;
      i += 1;
      continue;
    }
    if (ch === "\\") {
      // 字符串外转义：被转义标点（\{ \} 等）不参与深度计数
      stripped += ch;
      masked += "\u0000";
      if (i + 1 < raw.length) {
        stripped += raw[i + 1];
        masked += "\u0000";
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth < 0) return { css: "", valid: false };
    }
    stripped += ch;
    masked += ch;
    i += 1;
  }
  // 字符串未闭合或结束时深度非零（中途变负已即判）均无效
  if (quote || depth !== 0) return { css: "", valid: false };
  try {
    const out = [];
    // 选择器列表（逗号）会让作用域前缀只加在第一段，逗号后的成员（如
    // "&, body" → ".scope .kt-style-demo, body"）脱离卡片作用域成为全局
    // 选择器。发现即整份草稿判无效、不输出任何规则；只检查选择器 sel
    // （在掩码副本上查——字符串里的逗号不是列表分隔符），声明值里的逗号
    // （渐变 / rgb / 字体族等）位于 body / rest，不受影响。
    let hasSelectorList = false;
    // sel/body 捕获组均排除左右花括号（[^{}]*）：匹配绝不可能跨越规则
    // 边界——否则形如 "{ & a } body { color:blue }" 的输入会让 sel 吞进
    // 边界上的 }，发射出的游离 } 提前闭合作用域块、其后的 body 规则逃逸
    // 为全局选择器。未匹配的内容（嵌套块等）留在 rest，作为嵌套规则放进
    // 作用域块内，由原生 CSS 嵌套解析为后代（& 解析为作用域选择器），
    // 永不逃出作用域。
    const ruleRe = /&([^{}]*)\{([^{}]*)\}/g;
    let rest = "";
    let cursor = 0;
    let match;
    while ((match = ruleRe.exec(masked)) !== null) {
      const selStart = match.index + 1;
      const bodyStart = selStart + match[1].length + 1;
      if (match[1].includes(",")) {
        hasSelectorList = true;
      } else {
        const sel = stripped.slice(selStart, selStart + match[1].length);
        const body = stripped.slice(bodyStart, bodyStart + match[2].length);
        // 仅裁剪 sel 末尾空白：& 后的前导空格是后代组合符——
        // "& *" / "& x" 须生成 ".kt-style-demo *" / ".kt-style-demo x"，
        // trim() 会拼出 ".kt-style-demo*"（无效选择器，规则被丢弃）
        out.push(
          `.${scopeClass} .kt-style-demo${sel.trimEnd()} { ${body.trim()} }`
        );
      }
      rest += stripped.slice(cursor, match.index);
      cursor = match.index + match[0].length;
    }
    rest += stripped.slice(cursor);
    if (hasSelectorList) return { css: "", valid: false };
    if (rest.trim()) {
      out.unshift(`.${scopeClass} .kt-style-demo { ${rest.trim()} }`);
    }
    return { css: out.join("\n"), valid: true };
  } catch {
    return { css: "", valid: false };
  }
}
