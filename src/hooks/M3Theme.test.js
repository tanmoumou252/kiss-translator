/* eslint-disable testing-library/no-container, testing-library/no-unnecessary-act */
import { act } from "react";
import { createRoot } from "react-dom/client";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import M3Theme from "./M3Theme";
import MuiAlert from "@mui/material/Alert";
import MuiAutocomplete from "@mui/material/Autocomplete";
import MuiChip from "@mui/material/Chip";
import MuiCircularProgress from "@mui/material/CircularProgress";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import MuiTextField from "@mui/material/TextField";
import {
  ArrowDropDownIcon as Md3ArrowDropDownIcon,
  CancelIcon as Md3CancelIcon,
  CheckCircleIcon as Md3CheckCircleIcon,
  CloseIcon as Md3CloseIcon,
  ErrorIcon as Md3ErrorIcon,
  InfoIcon as Md3InfoIcon,
  WarningIcon as Md3WarningIcon,
} from "../components/icons/md3";
import { calculateAdaptivePrimaryFamily, M3_FONT_FAMILY, resolveIconColor, setIconColorSnapshot, setIconStyleSnapshot } from "../styles/m3";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("./ColorMode", () => ({
  useDarkMode: () => ({ darkMode: "auto" }),
}));
jest.mock("./SystemColorScheme", () => ({
  useSystemDarkPreference: () => true,
}));

test("scopes the resolved Material 3 palette to its root", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <M3Theme>
        <span>content</span>
        <IconButton aria-label="default icon">D</IconButton>
        <IconButton aria-label="primary icon" color="primary">
          P
        </IconButton>
        <ThemeProbe />
      </M3Theme>
    );
  });

  const themeRoot = container.querySelector(".kt-m3-root");
  expect(themeRoot.dataset.theme).toBe("dark");
  expect(themeRoot.style.getPropertyValue("--kt-pri")).toBe("#a5bfc5");
  expect(themeRoot.querySelector("style").textContent).toContain(
    "@keyframes kt-m3-pop"
  );
  expect(capturedTheme.shape.borderRadius).toBe(12);
  expect(
    capturedTheme.components.MuiPaper.styleOverrides.root.colorScheme
  ).toBe("dark");
  expect(
    capturedTheme.components.MuiFilledInput.styleOverrides.root
  ).toMatchObject({
    borderRadius: 12,
    overflow: "hidden",
  });
  const filledInputRoot =
    capturedTheme.components.MuiFilledInput.styleOverrides.root;
  const filledInputHover =
    filledInputRoot["&:not(.Mui-disabled, .Mui-focused):hover"];
  expect(filledInputHover.backgroundColor).toBe("#2D2F31");
  expect(filledInputHover["@media (hover: none)"].backgroundColor).toBe(
    "#282A2C"
  );
  expect(filledInputRoot["&.Mui-error"].borderColor).toBe("#F2B8B5");
  expect(filledInputRoot["&.Mui-error.Mui-focused"].borderColor).toBe(
    "#F2B8B5"
  );
  expect(
    capturedTheme.components.MuiSelect.styleOverrides.select["&:focus"]
  ).toMatchObject({
    borderRadius: "inherit",
    backgroundColor: "transparent",
  });
  expect(capturedTheme.components.MuiSelect.styleOverrides.icon).toMatchObject({
    transition: "transform .2s ease",
  });
  expect(
    capturedTheme.components.MuiButton.styleOverrides.root.transition
  ).toContain("border-color .3s");
  expect(
    capturedTheme.components.MuiButton.styleOverrides.root["&.Mui-focusVisible"]
  ).toEqual({
    outline: "3px solid #a5bfc5",
    outlineOffset: 2,
  });
  expect(capturedTheme.components.MuiCard.styleOverrides.root).toMatchObject({
    borderRadius: 12,
  });
  expect(capturedTheme.components.MuiTab.styleOverrides.root).toMatchObject({
    fontWeight: 650,
    transition: "background-color .2s ease, color .2s ease",
  });
  expect(
    capturedTheme.components.MuiTab.styleOverrides.root["&&.Mui-focusVisible"]
  ).toMatchObject({
    outline: "none",
    boxShadow: "inset 0 0 0 3px #a5bfc5",
  });
  const menuItemRoot = capturedTheme.components.MuiMenuItem.styleOverrides.root;
  expect(menuItemRoot).toMatchObject({
    borderRadius: 8,
    color: "#E3E3E3",
    transition:
      "background-color .2s ease, color .2s ease, box-shadow .2s ease",
  });
  expect(menuItemRoot["&.Mui-selected"]).toMatchObject({
    // 默认 hue 191.4 深色 accent 家族（calculateAdaptiveAccentFamilies(191.4, "dark") 契约推导）。
    backgroundColor: "#384143",
    color: "#abbbbe",
  });
  expect(menuItemRoot["&&.Mui-focusVisible"]).toMatchObject({
    outline: "none",
    backgroundColor: "#2D2F31",
    boxShadow: "inset 0 0 0 3px #a5bfc5",
  });
  const iconButtonRoot =
    capturedTheme.components.MuiIconButton.styleOverrides.root;
  const defaultIconButton = iconButtonRoot({
    ownerState: { color: "default" },
  });
  const primaryIconButton = iconButtonRoot({
    ownerState: { color: "primary" },
  });
  // 默认 hue 191.4 深色对冲公式自适应色（calculateAdaptiveIconColor(191.4, "dark") 契约推导，基准 69）。
  expect(defaultIconButton.color).toBe("#a5bfc5");
  expect(defaultIconButton["&:hover"].backgroundColor).toBe("#282A2C");
  expect(
    defaultIconButton["&:hover"]["@media (hover: none)"].backgroundColor
  ).toBe("transparent");
  expect(primaryIconButton.color).toBe(undefined);
  expect(primaryIconButton["&:hover"]).toBe(undefined);
  expect(defaultIconButton["&.Mui-focusVisible"]).toEqual({
    outline: "3px solid #a5bfc5",
    outlineOffset: 2,
  });
  expect(
    capturedTheme.components.MuiSlider.styleOverrides.thumb[
      "&.Mui-focusVisible"
    ]
  ).toMatchObject({ outline: "3px solid #a5bfc5", outlineOffset: 2 });
  expect(
    capturedTheme.components.MuiRadio.styleOverrides.root["&.Mui-focusVisible"]
  ).toMatchObject({ outline: "3px solid #a5bfc5", outlineOffset: 0 });
  expect(
    capturedTheme.components.MuiToggleButton.styleOverrides.root[
      "&.Mui-selected"
    ]
  ).toMatchObject({
    // 默认 hue 191.4 深色 accent 家族（calculateAdaptiveAccentFamilies(191.4, "dark") 契约推导）。
    backgroundColor: "#384143",
    color: "#abbbbe",
  });
  expect(
    capturedTheme.components.MuiListItemButton.styleOverrides.root[
      "&&.Mui-focusVisible"
    ].boxShadow
  ).toBe("inset 0 0 0 3px #a5bfc5");
  expect(
    capturedTheme.components.MuiAccordionSummary.styleOverrides.root[
      "&&.Mui-focusVisible"
    ].boxShadow
  ).toBe("inset 0 0 0 3px #a5bfc5");
  expect(
    capturedTheme.components.MuiLoadingButton.styleOverrides.loadingIndicator
      .color
  ).toBe("#a5bfc5");
  // Portal 场景（MuiMenu/MuiDialog 挂 body，脱离 .kt-m3-root 的 CSS 变量
  // 作用域）下列表项图标色必须是主题实值：var(--kt-icon) 在 Portal 内
  // 不可达会回落继承色，故 styleOverrides 必须内联解析后的 icon 色。
  expect(
    capturedTheme.components.MuiListItemIcon.styleOverrides.root
  ).toEqual({
    color: "#a5bfc5",
  });
  expect(
    capturedTheme.components.MuiDialog.styleOverrides.paper.borderRadius
  ).toBe(28);
  expect(
    capturedTheme.components.MuiMenu.styleOverrides.paper.borderRadius
  ).toBe(4);
  expect(
    capturedTheme.components.MuiTooltip.styleOverrides.tooltip.borderRadius
  ).toBe(4);
  expect(
    capturedTheme.components.MuiBackdrop.styleOverrides.root[
      "@media (prefers-reduced-motion: reduce)"
    ].transitionDuration
  ).toBe("0.01ms !important");
  // rgb(165, 191, 197) 即 #a5bfc5 的 getComputedStyle 序列化形态（默认 hue 191.4 深色对冲公式自适应，基准 69，契约推导）。
  expect(
    getComputedStyle(container.querySelector('[aria-label="default icon"]'))
      .color
      ).toBe("rgb(165, 191, 197)");
  expect(
    getComputedStyle(container.querySelector('[aria-label="primary icon"]'))
      .color
  ).toBe("rgb(165, 191, 197)");

  act(() => root.unmount());
  container.remove();
});

test.each(["object", "callback"])(
  "compact %s typography keeps M3 defaults and generates pixel sizes on small-root pages",
  (kind) => {
    const originalFontSize = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "10px";
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const typography = {
      pxToRem: (size) => `${size}px`,
      body1: { fontSize: 14 },
      body2: { fontSize: 13 },
      caption: { fontSize: 12 },
      button: { fontSize: 13 },
    };

    try {
      act(() => {
        root.render(
          <M3Theme
            options={{
              typography: kind === "callback" ? () => typography : typography,
            }}
          >
            <Typography variant="h6">Heading</Typography>
            <Typography variant="body1" id="compact-body">
              Body
            </Typography>
            <Typography variant="body2" id="compact-detail">
              Detail
            </Typography>
            <Typography variant="caption" id="compact-caption">
              Caption
            </Typography>
            <Button>Action</Button>
          </M3Theme>
        );
      });

      const style = (selector) =>
        getComputedStyle(container.querySelector(selector));
      expect(style("h6").fontSize).toBe("20px");
      expect(style("#compact-body").fontSize).toBe("14px");
      expect(style("#compact-detail").fontSize).toBe("13px");
      expect(style("#compact-caption").fontSize).toBe("12px");
      expect(style("button").fontSize).toBe("13px");
      expect(style("button").fontFamily.replace(/,\s*/g, ",")).toBe(
        M3_FONT_FAMILY.replace(/,\s*/g, ",")
      );
      expect(style("button").fontWeight).toBe("650");
      expect(style("button").textTransform).toBe("none");
    } finally {
      act(() => root.unmount());
      container.remove();
      document.documentElement.style.fontSize = originalFontSize;
    }
  }
);

test("partial component options preserve M3 button defaults and focus treatment", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    act(() => {
      root.render(
        <M3Theme
          options={{
            components: {
              MuiButton: {
                defaultProps: { size: "small" },
                styleOverrides: {
                  root: { minHeight: 32 },
                  sizeSmall: { fontSize: 12 },
                },
              },
            },
          }}
        >
          <Button>Action</Button>
          <ThemeProbe />
        </M3Theme>
      );
    });

    const button = getComputedStyle(container.querySelector("button"));
    expect(button.minHeight).toBe("32px");
    expect(button.fontSize).toBe("12px");
    expect(button.borderRadius).toBe("999px");
    expect(capturedTheme.components.MuiButton.defaultProps).toMatchObject({
      disableElevation: true,
      size: "small",
    });
    expect(
      capturedTheme.components.MuiButton.styleOverrides.root[
        "&.Mui-focusVisible"
      ]
    ).toEqual({
      outline: "3px solid #a5bfc5",
      outlineOffset: 2,
    });
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

let capturedTheme;

function ThemeProbe() {
  capturedTheme = useTheme();
  return null;
}

test("renders alert severity and close icons from md3 Material Symbols", () => {
  // MUI 默认 error/close 图标与 md3 组件同名（ErrorOutline/Close），testid 无法
  // 区分新旧，故以 path d 签名与 md3 组件逐一相等作断言（期望值由拍板映射推导）。
  const md3Path = (Icon) => {
    const holder = document.createElement("div");
    document.body.appendChild(holder);
    const iconRoot = createRoot(holder);
    act(() => {
      iconRoot.render(<Icon />);
    });
    const d = holder.querySelector("svg path").getAttribute("d");
    act(() => iconRoot.unmount());
    holder.remove();
    return d;
  };

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <M3Theme>
        <MuiAlert severity="error">boom</MuiAlert>
        <MuiAlert severity="warning">warn</MuiAlert>
        <MuiAlert severity="info">info</MuiAlert>
        <MuiAlert severity="success" onClose={jest.fn()}>
          ok
        </MuiAlert>
      </M3Theme>
    );
  });

  const alerts = [...container.querySelectorAll(".MuiAlert-root")];
  expect(alerts).toHaveLength(4);
  const severityPath = (alert) =>
    alert.querySelector(".MuiAlert-icon svg path").getAttribute("d");
  expect(severityPath(alerts[0])).toBe(md3Path(Md3ErrorIcon));
  expect(severityPath(alerts[1])).toBe(md3Path(Md3WarningIcon));
  expect(severityPath(alerts[2])).toBe(md3Path(Md3InfoIcon));
  expect(severityPath(alerts[3])).toBe(md3Path(Md3CheckCircleIcon));
  const closePath = alerts[3].querySelector(
    ".MuiAlert-action button svg path"
  );
  expect(closePath.getAttribute("d")).toBe(md3Path(Md3CloseIcon));

  act(() => root.unmount());
  container.remove();
});

describe("md3 builtin icon contracts (B7-2)", () => {
  const md3Path = (Icon) => {
    const holder = document.createElement("div");
    document.body.appendChild(holder);
    const iconRoot = createRoot(holder);
    act(() => {
      iconRoot.render(<Icon />);
    });
    const d = holder.querySelector("svg path").getAttribute("d");
    act(() => iconRoot.unmount());
    holder.remove();
    return d;
  };

  const renderThemed = (children) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(<M3Theme>{children}<ThemeProbe /></M3Theme>);
    });
    return { container, unmount: () => {
      act(() => root.unmount());
      container.remove();
    } };
  };

  afterEach(() => {
    setIconStyleSnapshot("md3");
    setIconColorSnapshot("#90b2ba");
  });

  test("injects md3 Select arrow, Chip deleteIcon, Autocomplete popupIcon and rounds CircularProgress", () => {
    const { container, unmount } = renderThemed(
      <>
        <MuiSelect value="a">
          <MuiMenuItem value="a">a</MuiMenuItem>
        </MuiSelect>
        <MuiChip label="chip" onDelete={jest.fn()} />
        <MuiAutocomplete
          options={[]}
          renderInput={(params) => <MuiTextField {...params} />}
        />
        <MuiCircularProgress variant="determinate" value={50} />
      </>
    );
    // React 18：DOM 查询在 act() 退出后执行。Select 箭头与 Chip 删除钮的
    // MUISelect-icon / MuiChip-deleteIcon 类名直接落在图标 svg 根上。
    expect(
      container.querySelector("svg.MuiSelect-icon path").getAttribute("d")
    ).toBe(md3Path(Md3ArrowDropDownIcon));
    expect(
      container.querySelector("svg.MuiChip-deleteIcon path").getAttribute("d")
    ).toBe(md3Path(Md3CancelIcon));
    expect(
      container.querySelector(".MuiAutocomplete-popupIndicator svg path").getAttribute("d")
    ).toBe(md3Path(Md3ArrowDropDownIcon));
    expect(
      capturedTheme.components.MuiAutocomplete?.defaultProps?.popupIcon
    ).toBeTruthy();
    expect(
      capturedTheme.components.MuiAutocomplete?.defaultProps?.clearIcon
    ).toBeTruthy();
    expect(
      capturedTheme.components.MuiChip?.defaultProps?.deleteIcon
    ).toBeTruthy();
    expect(
      getComputedStyle(
        container.querySelector(".MuiCircularProgress-circle")
      ).strokeLinecap
    ).toBe("round");
    // 图标色通道随行断言：暗色（mock prefersDark=true）＝默认 hue 191.4
    // 的对冲公式自适应色（L = 69 - 2.5·sin(191.4°) + 1.5·cos(382.8°) ≈ 70.88）。
    expect(
      container.querySelector(".kt-m3-root").style.getPropertyValue("--kt-icon")
    ).toBe("#a5bfc5");
    unmount();
  });

  test("drops icon defaultProps and keeps MUI builtin glyphs when iconStyle is mui", () => {
    setIconStyleSnapshot("mui");
    const { container, unmount } = renderThemed(
      <>
        <MuiSelect value="a">
          <MuiMenuItem value="a">a</MuiMenuItem>
        </MuiSelect>
        <MuiChip label="chip" onDelete={jest.fn()} />
        <MuiAlert severity="error">boom</MuiAlert>
      </>
    );
    expect(
      capturedTheme.components.MuiSelect.defaultProps?.IconComponent
    ).toBeUndefined();
    expect(
      capturedTheme.components.MuiChip?.defaultProps?.deleteIcon
    ).toBeUndefined();
    expect(
      capturedTheme.components.MuiAutocomplete?.defaultProps?.popupIcon
    ).toBeUndefined();
    expect(
      capturedTheme.components.MuiAlert.defaultProps?.iconMapping
    ).toBeUndefined();
    // DOM 侧证：Select 箭头不再是 md3 d 签名（MUI 内置 ArrowDropDown 坐标系不同）。
    expect(
      container.querySelector("svg.MuiSelect-icon path").getAttribute("d")
    ).not.toBe(md3Path(Md3ArrowDropDownIcon));
    unmount();
  });

  test("resolves continuous icon hue adaptively per theme, passes valid hex, falls back on invalid", () => {
    // 深色对冲公式映射（基准 69）；浅色同色相下压（L=34）。字面量由契约公式推导。
    expect(resolveIconColor("#ba9090", "dark")).toBe("#c4a4a4");
    expect(resolveIconColor("#ba9090", "light")).toBe("#723b3b");
    expect(resolveIconColor("#90b2ba", "dark")).toBe("#a5bfc5");
    expect(resolveIconColor("#a590ba", "light")).toBe("#573b72");
    // 任意合法 6 位 Hex 透传（normalize 后按色相映射）。
    expect(resolveIconColor("  #90B2BA  ", "light")).toBe("#3b6872");
    // 非法/缺省回落默认（默认 hue 191.4 的模式自适应色）。
    expect(resolveIconColor("#ABC", "dark")).toBe("#a5bfc5");
    expect(resolveIconColor(undefined, "light")).toBe("#3b6872");
    expect(resolveIconColor("nope", "dark")).toBe("#a5bfc5");
  });

  test("palette primary and contrastText follow the adaptive primary family", () => {
    setIconColorSnapshot("#ba9090");
    const { unmount } = renderThemed(<Button>Action</Button>);
    // palette.primary.main/contrastText 出自 resolveM3Colors 返回值（M3Theme.js :83），
    // 家族覆盖后随色相跟随（hue 0 的深色家族）。
    const family = calculateAdaptivePrimaryFamily(0, "dark");
    expect(capturedTheme.palette.primary.main).toBe(family.primary);
    expect(capturedTheme.palette.primary.contrastText).toBe(family.onPrimary);
    unmount();
  });
});
