import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import MuiTranslate from "@mui/icons-material/Translate";
import { TranslateIcon } from "./index";
import { TranslateIcon as Md3TranslateIcon } from "./md3";
import { setIconStyleSnapshot } from "../../styles/m3";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderPath = (Icon) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Icon />);
  });
  const d = container.querySelector("svg path").getAttribute("d");
  act(() => root.unmount());
  container.remove();
  return d;
};

describe("icon style dispatcher", () => {
  afterEach(() => {
    setIconStyleSnapshot("md3");
  });

  test("renders md3 glyphs by default", () => {
    expect(renderPath(TranslateIcon)).toBe(renderPath(Md3TranslateIcon));
  });

  test("renders MUI glyphs when iconStyle is mui", () => {
    setIconStyleSnapshot("mui");
    const d = renderPath(TranslateIcon);
    expect(d).toBe(renderPath(MuiTranslate));
    expect(d).not.toBe(renderPath(Md3TranslateIcon));
  });

  test("forwards ref to the rendered svg node", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const ref = React.createRef();
    act(() => {
      root.render(<TranslateIcon ref={ref} />);
    });
    // forwardRef 契约：ref 落到最终渲染的 svg 根节点（md3 与 MUI 分支一致）。
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    act(() => root.unmount());
    container.remove();
  });
});
