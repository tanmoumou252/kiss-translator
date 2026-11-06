/* eslint-disable testing-library/no-container */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useTheme } from "@mui/material/styles";
import OptionsTheme from "./OptionsTheme";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/ColorMode", () => ({
  useDarkMode: () => ({ darkMode: "light" }),
}));
jest.mock("../../hooks/SystemColorScheme", () => ({
  useSystemDarkPreference: () => false,
}));
// M3Theme 现直接接线 setting.iconStyle → 图标风格快照 store；mock 掉
// Setting 阻断其 storage/apis 重依赖链（与上方 ColorMode mock 同口径），
// 图标同步退化为 setIconStyleSnapshot(undefined) 的安全回退。
jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({ setting: {} }),
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
