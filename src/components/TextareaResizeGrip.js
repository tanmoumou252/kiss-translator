import { useRef } from "react";
import Box from "@mui/material/Box";

// 命中热区 24×24，大于 18×18 视觉弧线：按哪里能触发由代码定义，跨浏览器一致。
const HOT_ZONE_PX = 24;
// 拖动/键盘可调的最小目标高度（单行 23px + small 根节点纵向 padding 17px）。
const MIN_TARGET_HEIGHT_PX = 40;
// 方向键单次步进（Shift ×4）。
const KEYBOARD_STEP_PX = 12;
// 高度上界相对视口底部的安全留白。
const VIEWPORT_GUTTER_PX = 8;

// 样式注册表：key → { fill, content }（18×18 viewBox，currentColor 着色）。
// root fill 随资产族而变：描边族 fill="none"，填充族（点阵/波点/上游斜杠）
// root fill="currentColor" 供 circle/path 继承；混合族（星芒/除号/百分号/伴
// 星）root fill="none" 且各填充圆自带 fill="currentColor"。图形数据一律按
// 计划「SVG 资产索引表」从 .kilo/输入框拉伸手柄样式全集.md 逐条照抄，严禁重绘。
const GRIP_SVGS = {
  "concentric-smooth": {
    fill: "none",
    content: (
      <>
        <path
          d="M15 5V9C15 12.3137 12.3137 15 9 15H5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 6.5V9C12 10.6569 10.6569 12 9 12H6.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  "concentric-triple": {
    fill: "none",
    content: (
      <>
        <path
          d="M15 6V9C15 12.3137 12.3137 15 9 15H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M12 7V8.5C12 10.433 10.433 12 8.5 12H7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M9 7.5V8C9 8.5523 8.5523 9 8 9H7.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  "corner-pill": {
    fill: "none",
    content: (
      <path
        d="M14 6V9.5C14 11.985 11.985 14 9.5 14H6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    ),
  },
  "dotted-concentric": {
    fill: "currentColor",
    content: (
      <>
        <circle cx="15" cy="5.8" r="1.15" />
        <circle cx="14.6" cy="9.2" r="1.15" />
        <circle cx="13.2" cy="13.2" r="1.15" />
        <circle cx="9.2" cy="14.6" r="1.15" />
        <circle cx="5.8" cy="15" r="1.15" />
        <circle cx="12" cy="7.2" r="1.15" />
        <circle cx="10.8" cy="10.8" r="1.15" />
        <circle cx="7.2" cy="12" r="1.15" />
      </>
    ),
  },
  "dotted-single": {
    fill: "currentColor",
    content: (
      <>
        <circle cx="15" cy="5.5" r="1.1" />
        <circle cx="15" cy="8.5" r="1.1" />
        <circle cx="14.2" cy="11.2" r="1.1" />
        <circle cx="12.8" cy="12.8" r="1.1" />
        <circle cx="11.2" cy="14.2" r="1.1" />
        <circle cx="8.5" cy="15" r="1.1" />
        <circle cx="5.5" cy="15" r="1.1" />
      </>
    ),
  },
  "triple-chevrons": {
    fill: "none",
    content: (
      <>
        <path
          d="M15 9V12.5C15 13.88 13.88 15 12.5 15H9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 6.5V9.8C12 11.02 11.02 12 9.8 12H6.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 4V7.1C9 8.15 8.15 9 7.1 9H4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  "diagonal-arrow": {
    fill: "none",
    content: (
      <>
        <line
          x1="6"
          y1="6"
          x2="14"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M9.5 14H14V9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  "dual-pills": {
    fill: "none",
    content: (
      <>
        <line
          x1="14"
          y1="8"
          x2="8"
          y2="14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="14.5"
          y1="11.5"
          x2="11.5"
          y2="14.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  "expanding-beads": {
    fill: "currentColor",
    content: (
      <>
        <circle cx="7.5" cy="7.5" r="1.1" />
        <circle cx="11" cy="11" r="1.55" />
        <circle cx="14.5" cy="14.5" r="2.0" />
      </>
    ),
  },
  "chevrons-star": {
    fill: "none",
    content: (
      <>
        <path
          d="M15 9V12.5C15 13.88 13.88 15 12.5 15H9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 6.5V9.8C12 11.02 11.02 12 9.8 12H6.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="8.2" r="1.5" fill="currentColor" />
      </>
    ),
  },
  "symmetric-division": {
    fill: "none",
    content: (
      <>
        <line
          x1="14"
          y1="8"
          x2="8"
          y2="14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="13.8" cy="13.8" r="1.4" fill="currentColor" />
        <circle cx="8.2" cy="8.2" r="1.4" fill="currentColor" />
      </>
    ),
  },
  "percent-style": {
    fill: "none",
    content: (
      <>
        <line
          x1="8"
          y1="8"
          x2="14"
          y2="14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="13.8" cy="8.2" r="1.4" fill="currentColor" />
        <circle cx="8.2" cy="13.8" r="1.4" fill="currentColor" />
      </>
    ),
  },
  "orbit-satellite": {
    fill: "none",
    content: (
      <>
        <path
          d="M15 5.5V9C15 12.3137 12.3137 15 9 15H5.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="10" cy="10" r="1.8" fill="currentColor" />
      </>
    ),
  },
  // 完全隐藏：渲染空图形、保留 24×24 热区（content 为 null）。
  hidden: { fill: "none", content: null },
  // 上游 Chromium 手绘经典斜杠：fill 放 svg 根（资产源 :170），path 不带 fill。
  "upstream-chrome": {
    fill: "currentColor",
    content: (
      <path d="M15 3L3 15h2.5L15 5.5V3zM15 8L8 15h2.5l4.5-4.5V8zM15 13l-2 2h2v-2z" />
    ),
  },
};

// 视觉为两条同心圆弧的内联 SVG（18×18 viewBox，外弧半径 6px、内弧半径
// 3px，层间恒定 3px 同心间距，stroke-width 1.8、round 端点）：弧线曲率
// 与 InputBase root 的大圆角同心内收，贴合圆角轮廓且不溢出输入框显示
// 范围；竖直排布的单向弧束与上下拖高语义一致。颜色由 currentColor 承
// 载，透明度基础 0.38、hover 0.9、active 1；SVG 样式统一经父级 Box 的
// "& svg" 选择器注入，保证 MUI sx 真实生效。

/**
 * 自绘 textarea 缩放手柄：24×24 命中热区 + 同心圆弧 SVG 视觉（InputBase
 * root 右下角；弧线 18×18 距输入框右/下边框各 4px，与容器圆角同心内收；
 * SVG 样式由父级 Box 的 "& svg" 选择器承载）。
 *
 * 测量基准恒为 closest(".MuiInputBase-root")：与 useTextareaHeightLock 的
 * 锁定写入对象同一口径，避免与 textarea 的 content-box 几何错位。
 *
 * Pointer Events 单路径：pointerdown 记起点并 setPointerCapture（capture
 * 不可用时事件仍绑在手柄上），pointermove 现测现算 clamp 后回调 onResize，
 * pointerup/pointercancel/lostpointercapture 闭合会话。键盘 ArrowDown 增高、
 * ArrowUp 减高（步进 12px，Shift ×4）。高度状态与回写由
 * useTextareaHeightLock 负责，本组件只上报新高度；是否渲染由消费方按
 * 内容门控决定。
 *
 * @param {Object} props
 * @param {{current: HTMLTextAreaElement|null}} props.target 目标 textarea ref。
 * @param {(height: number) => void} props.onResize 高度变更回调。
 * @param {number|null} [props.value] 当前锁定高度（aria-valuenow）。
 * @param {string} props.label 无障碍名称（aria-label + title）。
 * @param {string} [props.variant] 手柄样式 key（见 GRIP_SVGS），缺省回落
 *   "concentric-smooth"；未知值同样回落，保证永不渲染空手柄。
 */
export default function TextareaResizeGrip({
  target,
  onResize,
  value,
  label,
  variant = "concentric-smooth",
}) {
  const sessionRef = useRef(null);
  // 命中未知 key 回落默认双弧；hidden 命中自身（content=null，保留热区空图形）。
  const grip = GRIP_SVGS[variant] ?? GRIP_SVGS["concentric-smooth"];

  const getBaselineEl = () => {
    const el = target.current;
    if (!el) return null;
    return el.closest(".MuiInputBase-root");
  };

  const clampHeight = (height) => {
    const rounded = Number.isFinite(height)
      ? Math.round(height)
      : MIN_TARGET_HEIGHT_PX;
    const baselineEl = getBaselineEl();
    if (!baselineEl) return Math.max(MIN_TARGET_HEIGHT_PX, rounded);
    // 视口上限每次现测现算，禁止缓存。
    const { top } = baselineEl.getBoundingClientRect();
    const viewportMax = Math.floor(
      window.innerHeight - top - VIEWPORT_GUTTER_PX
    );
    const max = Number.isFinite(viewportMax)
      ? Math.max(MIN_TARGET_HEIGHT_PX, viewportMax)
      : MIN_TARGET_HEIGHT_PX;
    return Math.min(Math.max(rounded, MIN_TARGET_HEIGHT_PX), max);
  };

  const endSession = (event) => {
    if (!sessionRef.current) return;
    sessionRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (error) {
      // jsdom 与旧浏览器可能未实现 pointer capture，忽略即可。
    }
  };

  const handlePointerDown = (event) => {
    const baselineEl = getBaselineEl();
    if (!baselineEl || event.button !== 0) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      // capture 失败不阻断拖拽：事件仍绑定在手柄元素上。
    }
    sessionRef.current = {
      startY: event.clientY,
      startHeight: baselineEl.offsetHeight,
    };
  };

  const handlePointerMove = (event) => {
    const session = sessionRef.current;
    if (!session) return;
    onResize(
      clampHeight(session.startHeight + (event.clientY - session.startY))
    );
  };

  const handleKeyDown = (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const baselineEl = getBaselineEl();
    const baseHeight = baselineEl
      ? baselineEl.offsetHeight
      : MIN_TARGET_HEIGHT_PX;
    const step = KEYBOARD_STEP_PX * (event.shiftKey ? 4 : 1);
    const delta = event.key === "ArrowDown" ? step : -step;
    onResize(clampHeight(baseHeight + delta));
  };

  return (
    <Box
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      title={label}
      tabIndex={0}
      aria-valuemin={MIN_TARGET_HEIGHT_PX}
      aria-valuenow={typeof value === "number" ? Math.round(value) : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endSession}
      onPointerCancel={endSession}
      onLostPointerCapture={endSession}
      onKeyDown={handleKeyDown}
      sx={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: HOT_ZONE_PX,
        height: HOT_ZONE_PX,
        // 禁用字段（如 preset 提示词）内保持手柄可交互。
        pointerEvents: "auto",
        cursor: "ns-resize",
        touchAction: "none",
        borderRadius: "4px",
        // 颜色经 currentColor 下传给 SVG 弧线：基础 onSurfaceVariant
        // 叠 68% 透明度融入，hover onSurface，active primary。
        color: "color-mix(in srgb, var(--kt-onv) 68%, transparent)",
        // SVG 全部视觉样式经父级 "& svg" 选择器承载（裸 svg 上的 sx
        // 无编译路径会静默失效）：定位右/下各 4px、基态透明度 0.38，
        // 过渡只作用于 opacity/transform，且不拦截指针与选区。
        "& svg": {
          position: "absolute",
          right: "4px",
          bottom: "4px",
          opacity: 0.38,
          transform: "scale(1)",
          transition:
            "opacity 0.2s cubic-bezier(0.2, 0, 0, 1), transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
          pointerEvents: "none",
          userSelect: "none",
        },
        "&:hover": {
          color: "var(--kt-on)",
          "& svg": {
            opacity: 0.9,
            transform: "scale(1.08)",
          },
        },
        "&:active": {
          color: "var(--kt-pri)",
          "& svg": {
            opacity: 1,
            transform: "scale(0.95)",
          },
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "var(--kt-pri)",
          outlineOffset: "-2px",
        },
      }}
    >
      {/* 定位/透明度/过渡等样式由父级 Box 的 "& svg" 选择器承载。 */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill={grip.fill}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {grip.content}
      </svg>
    </Box>
  );
}
