import { act } from "react";
import { createRoot } from "react-dom/client";
import { css as mockCss } from "@emotion/css";
import StylesSetting, { StyleAccordion } from "./StylesSetting";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DANGEROUS_STYLE_CODE = "position: fixed; inset: 0; z-index: 2147483647;";
const CUSTOM_STYLE = {
  styleSlug: "custom-dangerous",
  styleName: "Custom Dangerous",
  styleCode: DANGEROUS_STYLE_CODE,
  source: "custom",
  isBuiltin: false,
};
const BUILTIN_STYLE = {
  styleSlug: "under_line",
  styleName: "Underline",
  styleCode: "text-decoration: underline;",
  source: "builtin",
  isBuiltin: true,
};

jest.mock("@emotion/css", () => ({
  css: jest.fn(() => "mock-preview-class"),
  keyframes: jest.fn(() => "mock-keyframes"),
}));

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key) => key,
}));

// 稳定的 setting 引用避免 useAllTextStyles 抖动；textareaGripStyle 可被
// updateSetting（字符串契约）或测试直接改写，驱动预览切换。mock 前缀变量
// 供 jest.mock 工厂引用（babel-plugin-jest-hoist 允许）。
const mockSetting = {
  uiLang: "en",
  darkMode: "auto",
  textareaGripStyle: "concentric-smooth",
  customStyles: [
    {
      styleSlug: "custom-dangerous",
      styleName: "Custom Dangerous",
      styleCode: "position: fixed; inset: 0; z-index: 2147483647;",
    },
  ],
};
const mockUpdateSetting = jest.fn((patch) => {
  if (
    patch &&
    Object.prototype.hasOwnProperty.call(patch, "textareaGripStyle")
  ) {
    mockSetting.textareaGripStyle = patch.textareaGripStyle;
  }
});

jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({ setting: mockSetting, updateSetting: mockUpdateSetting }),
}));

jest.mock("../../hooks/Confirm", () => ({
  useConfirm: () => jest.fn(async () => true),
}));

function renderStyleAccordion(customStyle) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const render = (nextStyle) => {
    root.render(
      <StyleAccordion
        customStyle={nextStyle}
        deleteStyle={jest.fn()}
        updateStyle={jest.fn()}
      />
    );
  };

  act(() => {
    render(customStyle);
  });

  return {
    container,
    rerender(nextStyle) {
      act(() => {
        render(nextStyle);
      });
    },
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function renderStylesSetting() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<StylesSetting />);
  });

  return {
    container,
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function getCompiledStyleCode() {
  return mockCss.mock.calls.flatMap((call) => call.slice(1)).join("\n");
}

function getSummaryTranslation(container) {
  return Array.from(
    container.querySelectorAll(".kt-style-card__summary span")
  ).find((span) => span.textContent === "style_preview_translation");
}

describe("StylesSetting style previews", () => {
  beforeEach(() => {
    mockCss.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("keeps custom CSS out of compact summaries while previewing built-ins", () => {
    const customView = renderStyleAccordion(CUSTOM_STYLE);

    expect(getCompiledStyleCode()).not.toContain(DANGEROUS_STYLE_CODE);
    expect(getSummaryTranslation(customView.container).className).toBe("");
    customView.cleanup();

    mockCss.mockClear();
    const builtinView = renderStyleAccordion(BUILTIN_STYLE);

    expect(getCompiledStyleCode()).toContain(BUILTIN_STYLE.styleCode);
    expect(mockCss).toHaveBeenCalledTimes(1);
    builtinView.cleanup();
  });

  test("retains full custom CSS in the expanded editor", () => {
    const view = renderStyleAccordion(CUSTOM_STYLE);

    expect(getCompiledStyleCode()).not.toContain(DANGEROUS_STYLE_CODE);
    act(() => {
      view.container.querySelector(".MuiAccordionSummary-root").click();
    });
    expect(getCompiledStyleCode()).toContain(DANGEROUS_STYLE_CODE);
    view.cleanup();
  });

  test("keeps a local draft until the persisted style changes", () => {
    const view = renderStyleAccordion(CUSTOM_STYLE);
    act(() => {
      view.container.querySelector(".MuiAccordionSummary-root").click();
    });

    const nameInput = view.container.querySelector('input[name="styleName"]');
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set.call(nameInput, "Local style draft");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    view.rerender(CUSTOM_STYLE);
    expect(view.container.querySelector('input[name="styleName"]').value).toBe(
      "Local style draft"
    );

    const persistedUpdate = {
      ...CUSTOM_STYLE,
      styleName: "Persisted style",
      styleCode: "color: rebeccapurple;",
    };
    view.rerender(persistedUpdate);
    expect(view.container.querySelector('input[name="styleName"]').value).toBe(
      "Persisted style"
    );
    const saveButton = Array.from(
      view.container.querySelectorAll("button")
    ).find((button) => button.textContent === "save");
    expect(saveButton.disabled).toBe(true);

    view.cleanup();
  });

  test("keeps a dirty draft when only the style object identity changes", () => {
    const view = renderStyleAccordion(CUSTOM_STYLE);
    act(() => {
      view.container.querySelector(".MuiAccordionSummary-root").click();
    });

    const nameInput = view.container.querySelector('input[name="styleName"]');
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set.call(nameInput, "Local style draft");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // useAllTextStyles 在 customStyles 每次写入时都会 .map() 出全新的样式对象：
    // 引用是新的、内容一个字没变。这种身份抖动不得冲掉未保存的草稿。
    view.rerender({ ...CUSTOM_STYLE });
    expect(view.container.querySelector('input[name="styleName"]').value).toBe(
      "Local style draft"
    );

    view.cleanup();
  });

  test("keeps an expanded style draft mounted while the manager is hidden", () => {
    const view = renderStylesSetting();

    expect(view.container.querySelector(".kt-style-manager")).toBeNull();

    const openButton = Array.from(
      view.container.querySelectorAll("button")
    ).find((button) => button.textContent === "edit");
    act(() => openButton.click());

    const manager = view.container.querySelector(".kt-style-manager");
    expect(manager).not.toBeNull();
    expect(manager.hidden).toBe(false);

    act(() => {
      manager.querySelector(".MuiAccordionSummary-root").click();
    });

    const nameInput = manager.querySelector('input[name="styleName"]');
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set.call(nameInput, "Unsaved style draft");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const hideButton = Array.from(
      view.container.querySelectorAll("button")
    ).find((button) => button.textContent === "hide");
    act(() => hideButton.click());

    expect(view.container.querySelector(".kt-style-manager")).toBe(manager);
    expect(manager.hidden).toBe(true);

    const reopenButton = Array.from(
      view.container.querySelectorAll("button")
    ).find((button) => button.textContent === "edit");
    act(() => reopenButton.click());

    expect(manager.hidden).toBe(false);
    expect(manager.querySelector('input[name="styleName"]')).toBe(nameInput);
    expect(nameInput.value).toBe("Unsaved style draft");

    view.cleanup();
  });
});

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("StylesSetting textarea grip section", () => {
  function renderGripSection() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = () => {
      act(() => {
        root.render(<StylesSetting />);
      });
    };
    render();
    return {
      container,
      root,
      rerender: render,
      async cleanup() {
        await act(async () => root.unmount());
        container.remove();
      },
    };
  }

  async function openGripSelect(container) {
    const select = container.querySelector(
      ".kt-settings-select [role='combobox']"
    );
    expect(select).not.toBeNull();
    await act(async () => {
      select.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await Promise.resolve();
    });
    return select;
  }

  beforeEach(() => {
    mockUpdateSetting.mockClear();
    mockSetting.textareaGripStyle = "concentric-smooth";
  });

  afterEach(async () => {
    await flushMicrotasks();
    document.body.innerHTML = "";
  });

  test("renders the grip section select with exactly 16 options", async () => {
    const view = renderGripSection();
    await openGripSelect(view.container);
    const options = document.body.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(16);
    await act(async () => view.root.unmount());
    view.container.remove();
  });

  test("persists the selected grip style as a plain string value", async () => {
    const view = renderGripSection();
    await openGripSelect(view.container);
    await act(async () => {
      [...document.body.querySelectorAll('[role="option"]')]
        .find((option) => option.getAttribute("data-value") === "upstream-chrome")
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    // SettingsSelect onChange 契约：收到的是解包字符串，非 event 对象。
    expect(mockUpdateSetting).toHaveBeenCalledWith({
      textareaGripStyle: "upstream-chrome",
    });
    await act(async () => view.root.unmount());
    view.container.remove();
  });

  test("previews the real grip component and follows the live variant", async () => {
    const view = renderGripSection();

    // 默认 concentric-smooth：预览复用真实组件（role=separator 在场 + 双弧），
    // 且具备无障碍名称（与真实接入端同口径的 field_resize_height）。
    let separator = view.container.querySelector('[role="separator"]');
    expect(separator).not.toBeNull();
    expect(separator.querySelectorAll("svg path")).toHaveLength(2);
    expect(separator.getAttribute("aria-label")).toBe("field_resize_height");

    // 切到 upstream-chrome：同一 separator 内 SVG 随 variant 变为单条斜杠。
    mockSetting.textareaGripStyle = "upstream-chrome";
    view.rerender();
    separator = view.container.querySelector('[role="separator"]');
    expect(separator).not.toBeNull();
    expect(separator.querySelector("svg path").getAttribute("d")).toBe(
      "M15 3L3 15h2.5L15 5.5V3zM15 8L8 15h2.5l4.5-4.5V8zM15 13l-2 2h2v-2z"
    );

    // 切到 firefox-native：separator 消失，预览 textarea 放开原生纵向 resize。
    mockSetting.textareaGripStyle = "firefox-native";
    view.rerender();
    expect(view.container.querySelector('[role="separator"]')).toBeNull();
    const previewTextarea = view.container.querySelector("textarea");
    expect(previewTextarea.style.resize).toBe("vertical");

    await act(async () => view.root.unmount());
    view.container.remove();
  });
});
