/**
 * 图钉消歧契约：划词弹窗头部「固定弹窗」按钮独家使用 PushPin/Outlined，
 * 「跟随选中文本」菜单项使用 MyLocation/Outlined。期望值由契约推导
 * （两控件图标在 hideClickAway × followSelection 全部四种组合下互不相同，
 * 且「跟随」开启=实心、关闭=空心），非抄录当前实现。
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import TranslationPanelHeader from "./Header";
import {
  PushPinIcon as Md3PushPinIcon,
  PushPinOutlinedIcon as Md3PushPinOutlinedIcon,
  MyLocationIcon as Md3MyLocationIcon,
  MyLocationOutlinedIcon as Md3MyLocationOutlinedIcon,
} from "../icons/md3";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/I18n", () => ({ useI18n: () => (key) => key }));
jest.mock("../../hooks/ColorMode", () => ({
  useDarkMode: () => ({ darkMode: "light", toggleDarkMode: jest.fn() }),
}));
jest.mock("../Logo", () => () => null);

const iconSignature = (element) =>
  Array.from(element.querySelectorAll("svg path"))
    .map((path) => path.getAttribute("d"))
    .join("|");

describe("TranslationPanelHeader pin/follow icon exclusivity", () => {
  let host;
  let container;
  let root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    container = document.createElement("div");
    host.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const renderHeader = ({ hideClickAway, followSelection }) => {
    act(() => {
      root.render(
        <TranslationPanelHeader
          hideClickAway={hideClickAway}
          setHideClickAway={() => {}}
          followSelection={followSelection}
          setFollowSelection={() => {}}
        />
      );
    });
    act(() => container.querySelector('button[title="more"]').click());
  };

  test.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])(
    "pin and follow controls never share an icon (hideClickAway=%p, followSelection=%p)",
    (hideClickAway, followSelection) => {
      renderHeader({ hideClickAway, followSelection });

      const pin = container.querySelector(
        'button[title="btn_tip_click_away"]'
      );
      const follow = container.querySelector('[role="menuitemcheckbox"]');
      expect(pin).not.toBeNull();
      expect(follow).not.toBeNull();
      expect(follow.getAttribute("aria-checked")).toBe(
        String(followSelection)
      );
      expect(iconSignature(follow)).not.toBe("");
      expect(iconSignature(pin)).not.toBe("");
      expect(iconSignature(follow)).not.toBe(iconSignature(pin));
    }
  );
});

describe("TranslationPanelHeader renders md3 Material Symbols glyphs", () => {
  let host;
  let container;
  let root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    container = document.createElement("div");
    host.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const renderHeader = ({ hideClickAway, followSelection }) => {
    act(() => {
      root.render(
        <TranslationPanelHeader
          hideClickAway={hideClickAway}
          setHideClickAway={() => {}}
          followSelection={followSelection}
          setFollowSelection={() => {}}
        />
      );
    });
    act(() => container.querySelector('button[title="more"]').click());
  };

  const md3Signature = (Icon) => {
    const holder = document.createElement("div");
    document.body.appendChild(holder);
    const iconRoot = createRoot(holder);
    act(() => {
      iconRoot.render(<Icon />);
    });
    // React 18 并发 root 的 DOM 提交发生在 act() 退出时，须在回调外查询。
    const signature = iconSignature(holder);
    act(() => iconRoot.unmount());
    holder.remove();
    return signature;
  };

  test.each([false, true])(
    "pin button uses the md3 push_pin glyph pair (hideClickAway=%p)",
    (hideClickAway) => {
      renderHeader({ hideClickAway, followSelection: false });
      const pin = container.querySelector('button[title="btn_tip_click_away"]');
      const expected = hideClickAway
        ? md3Signature(Md3PushPinOutlinedIcon)
        : md3Signature(Md3PushPinIcon);
      expect(iconSignature(pin)).toBe(expected);
      // displayName 沿用 MUI 名 → testid 迁移前后稳定（回归锁）。
      expect(pin.querySelector("svg").getAttribute("data-testid")).toBe(
        hideClickAway ? "PushPinOutlinedIcon" : "PushPinIcon"
      );
    }
  );

  test.each([false, true])(
    "follow menu item uses the md3 my_location glyph pair (followSelection=%p)",
    (followSelection) => {
      renderHeader({ hideClickAway: false, followSelection });
      const follow = container.querySelector('[role="menuitemcheckbox"]');
      const expected = followSelection
        ? md3Signature(Md3MyLocationIcon)
        : md3Signature(Md3MyLocationOutlinedIcon);
      expect(iconSignature(follow)).toBe(expected);
      expect(follow.querySelector("svg").getAttribute("data-testid")).toBe(
        followSelection ? "MyLocationIcon" : "MyLocationOutlinedIcon"
      );
    }
  );
});
