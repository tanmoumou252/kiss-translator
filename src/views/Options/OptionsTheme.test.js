/* eslint-disable testing-library/no-container */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useTheme } from "@mui/material/styles";
import OptionsTheme from "./OptionsTheme";
import { AddIcon } from "../../components/icons";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/ColorMode", () => ({
  useDarkMode: () => ({ darkMode: "light" }),
}));
jest.mock("../../hooks/SystemColorScheme", () => ({
  useSystemDarkPreference: () => false,
}));
// M3Theme 现直接接线 setting.iconStyle → 图标风格快照 store；mock 掉
// Setting 阻断其 storage/apis 重依赖链（与上方 ColorMode mock 同口径）。
// mock 引用模块级可变量，图标切换集成用例须先后提供 mui / lucide 设置
// 验证设置变化同步反映到分发器渲染（命名前缀 mock* 为 jest.mock 工厂
// 越界引用的仓库既定惯例）。
let mockIconSetting = {};
jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({ setting: mockIconSetting }),
}));

let capturedTheme;

function ThemeProbe() {
  capturedTheme = useTheme();
  return null;
}

test("dropdown paper radius stays a raw 12px in sx and styleOverrides", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <OptionsTheme>
        <ThemeProbe />
      </OptionsTheme>
    );
  });

  // A numeric borderRadius inside `sx` is multiplied by
  // theme.shape.borderRadius (12 * 12 = 144px) and clips the first/last
  // options, so the value must remain a length string.
  const selectPaperSx =
    capturedTheme.components.MuiSelect.defaultProps.MenuProps.PaperProps.sx;
  expect(selectPaperSx(capturedTheme).borderRadius).toBe("12px");

  const menuPaper = capturedTheme.components.MuiMenu.styleOverrides.paper({
    theme: capturedTheme,
  });
  expect(menuPaper.borderRadius).toBe("12px");

  act(() => root.unmount());
  container.remove();
});

function IconProbe() {
  return <AddIcon data-testid="probe-icon" />;
}

test("reflects iconStyle setting changes on dispatched icons", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  // mui 设置：分发器选 MUI 件——svg 直接挂 path（fill 实心形态），无
  // lucide 的 stroke 描边 g 组
  mockIconSetting = { iconStyle: "mui" };
  act(() => {
    root.render(
      <OptionsTheme>
        <IconProbe />
      </OptionsTheme>
    );
  });
  const muiSvg = container.querySelector("svg");
  expect(muiSvg).not.toBeNull();
  expect(muiSvg.querySelector("path")).not.toBeNull();
  expect(muiSvg.querySelector("g[stroke='currentColor']")).toBeNull();

  // 切到 lucide：M3Theme 同步 effect 推快照 → 分发器改选 Lucide 件——
  // 描边形态特征（g[fill=none][stroke=currentColor]）真实反映到渲染。
  // 本仓库 lucide 件经 createSvgIcon 包装，stroke 在内层 g 而非 svg 根
  mockIconSetting = { iconStyle: "lucide" };
  act(() => {
    root.render(
      <OptionsTheme>
        <IconProbe />
      </OptionsTheme>
    );
  });
  const lucideSvg = container.querySelector("svg");
  expect(lucideSvg).not.toBeNull();
  expect(lucideSvg.querySelector("g[stroke='currentColor']")).not.toBeNull();
  expect(lucideSvg.querySelector("g[fill='none']")).not.toBeNull();

  mockIconSetting = {};
  act(() => {
    root.unmount();
  });
  container.remove();
});
