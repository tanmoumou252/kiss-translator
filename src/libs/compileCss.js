// 安全 CSS 编译解析器：把用户草稿按卡片作用域编译（& 嵌套展开为作用域
// 后代选择器）；括号不配对等语法无效 → { css: "", valid: false } 优雅
// 降级（is-invalid 形态），绝不抛错崩页面。StylesSetting 卡片演示与
// Rules 下拉的 custom 项预览共用同一校验口径。
// 顶层逗号检测：仅括号深度为 0 的逗号才是选择器列表分隔符。括号内的
// 逗号是函数式伪类参数（":not(.a, .b)" 展开后整体仍挂在作用域前缀下，
// 非逃逸），不判无效。杂散 ")" 不下探负深度——括号不闭合的残稿中逗号
// 按顶层处理，作用域闸保守不缺口。输入为掩码副本，字符串内逗号已置零。
function hasTopLevelComma(sel) {
  let parenDepth = 0;
  for (let i = 0; i < sel.length; i += 1) {
    const ch = sel[i];
    if (ch === "(") {
      parenDepth += 1;
    } else if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (ch === "," && parenDepth === 0) {
      return true;
    }
  }
  return false;
}

// 作用域类名 slug 净化：[A-Za-z0-9_-] 逐字符恒等（既有夹具类名
// kt-scope-custom-a 等不受影响），其余字符按码点 uXXXX 编码。编码对"含不
// 安全字符的 slug"彼此单射——任意两个 forged slug 不会碰撞；安全 slug 与
// 编码结果的理论碰撞只能由伪造 slug 精心构造，超出预览作用域隔离的威胁
// 模型（防御目标是逗号/空白不得进入选择器生成选择器列表逃逸）。
export function sanitizeScopeSlug(slug) {
  return String(slug).replace(/[^A-Za-z0-9_-]/g, (ch) =>
    `u${ch.codePointAt(0).toString(16).padStart(4, "0")}`
  );
}

// 判定 & 匹配是否为"选择器中缀 &"（& 前有祖先选择器文本，如
// "html.dark &"）：在掩码副本上从 match.index-1 向左跳过空白，先遇 {
// 或 } 或文本起点 → 规则边界，按顶层规则提取；先遇其他非空白字符 →
// 中缀 &，不提取（整条随后续切片并入 rest，由原生 CSS 嵌套解析
// & = 父选择器，祖先条件保留且永不逃出作用域）。; 视为前一条声明结束/
// 新规则开始的边界（与 } 同权）：声明后跟随的 &（如 "color: red;
// &:hover"）是新规则起点，按顶层规则平铺提取——掩码副本中字符串内
// 字符已置 \u0000（非空白，判中缀，保守安全；字符串内的 ; 不会被越过
// 字符串边界的扫描触及），注释已剥除。
function isMidSelectorAmp(masked, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const ch = masked[i];
    if (ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r") {
      return ch !== "{" && ch !== "}" && ch !== ";";
    }
  }
  return false;
}

export function compileCss(scopeClass, raw) {
  // 非字符串闸：导入/同步通道可能注入非字符串 styleCode（如 123），
  // raw.trim() 会抛 TypeError 崩页面——非字符串整份判无效，空/纯空白
  // 字符串保持 valid:true 的既有语义。
  if (typeof raw !== "string") return { css: "", valid: false };
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
    // 为全局选择器。只有花括号深度为 0 的顶层 & 规则才被提取展开；位于
    // 媒体查询或其他规则块内的嵌套 & 规则若被提取会丢失外层上下文，故
    // 原样留在 rest（连同其所在块），作为嵌套规则放进作用域块内，由原生
    // CSS 嵌套解析为后代（& 解析为作用域选择器），永不逃出作用域。
    const ruleRe = /&([^{}]*)\{([^{}]*)\}/g;
    let rest = "";
    let cursor = 0;
    // 掩码副本中字符串内括号已置零、注释已剥除、预扫描保证全文深度非负，
    // 故逐字符累计花括号深度即真实块结构深度；匹配自带的成对括号净深度
    // 为零，扫描游标越过整个匹配即可。
    let depth = 0;
    let scanPos = 0;
    let match;
    while ((match = ruleRe.exec(masked)) !== null) {
      for (let j = scanPos; j < match.index; j += 1) {
        if (masked[j] === "{") depth += 1;
        else if (masked[j] === "}") depth -= 1;
      }
      scanPos = match.index + match[0].length;
      // 逗号闸对任意深度的 & 规则均生效：嵌套的 "&, body" 经原生解析后
      // body 同样会脱离卡片作用域；只认选择器顶层逗号（见 hasTopLevelComma）
      if (hasTopLevelComma(match[1])) {
        hasSelectorList = true;
      } else if (depth === 0 && !isMidSelectorAmp(masked, match.index)) {
        const selStart = match.index + 1;
        const bodyStart = selStart + match[1].length + 1;
        const sel = stripped.slice(selStart, selStart + match[1].length);
        const body = stripped.slice(bodyStart, bodyStart + match[2].length);
        // 仅裁剪 sel 末尾空白：& 后的前导空格是后代组合符——
        // "& *" / "& x" 须生成 ".kt-style-demo *" / ".kt-style-demo x"，
        // trim() 会拼出 ".kt-style-demo*"（无效选择器，规则被丢弃）
        out.push(
          `.${scopeClass} .kt-style-demo${sel.trimEnd()} { ${body.trim()} }`
        );
        // 仅顶层规则推进游标；嵌套匹配不推进——其文本随后续切片并入 rest
        rest += stripped.slice(cursor, match.index);
        cursor = match.index + match[0].length;
      }
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
