import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  PROMPT_CATEGORY_BATCH_SYSTEM,
  PROMPT_CATEGORY_DICTIONARY,
  PROMPT_CATEGORY_SUBTITLE,
  PROMPT_CATEGORY_USER,
} from "../../config";
import Prompts from "./Prompts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLElement.prototype.scrollTo = jest.fn();

const mockUsePromptList = jest.fn();
const mockConfirm = jest.fn();

jest.mock("../../hooks/Prompt", () => ({
  usePromptList: () => mockUsePromptList(),
}));

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key, fallback) => fallback || key,
}));

jest.mock("../../hooks/Confirm", () => ({
  useConfirm: () => mockConfirm,
}));

// 手柄样式：部分 mock（requireActual 保留真实默认导出 useTextareaHeightLock），
// 只替换 useTextareaGripStyle 以驱动 5 端 firefox-native / upstream-chrome 行为。
// 同时 mock ./Setting：requireActual 加载真实 hook 会静态 import ./Setting，进而
// 拉入 Storage→apis→query-string(ESM) 整条持久化链，本测试未转译 query-string 会
// 解析失败。Setting 用最小 mock 斩断该链；真实默认导出不调用 useSetting，零影响。
jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({ setting: {} }),
}));
const mockUseTextareaGripStyle = jest.fn(() => "concentric-smooth");
jest.mock("../../hooks/useTextareaHeightLock", () => {
  const actual = jest.requireActual("../../hooks/useTextareaHeightLock");
  // 必须显式回补 __esModule：requireActual 的 __esModule 为非枚举属性，
  // 纯 {...actual} 展开会丢失它，导致消费方对 hook 的默认导入被 Babel 的
  // _interopRequireDefault 重新包一层而拿不到函数本体。
  return {
    ...actual,
    __esModule: true,
    useTextareaGripStyle: () => mockUseTextareaGripStyle(),
  };
});

function createPrompt(category, overrides = {}) {
  return {
    slug: `prompt_${category.replaceAll(" ", "_")}`,
    category,
    name: category,
    systemPrompt: "system prompt",
    userPrompt: "user prompt",
    ...overrides,
  };
}

function renderPrompts(promptsOrCategory, options = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let prompts = Array.isArray(promptsOrCategory)
    ? promptsOrCategory
    : [createPrompt(promptsOrCategory)];
  const promptListValue = {
    addPrompt: jest.fn(),
    updatePrompt: jest.fn(),
    deletePrompt: jest.fn(),
    copyPrompt: jest.fn(),
    isPresetPromptSlug: options.isPresetPromptSlug || (() => false),
  };

  const setPrompts = (nextPrompts) => {
    prompts = nextPrompts;
    mockUsePromptList.mockReturnValue({
      prompts,
      ...promptListValue,
    });
  };

  setPrompts(prompts);

  act(() => {
    root.render(<Prompts />);
  });

  return {
    container,
    promptListValue,
    rerender(nextPrompts) {
      setPrompts(nextPrompts);
      act(() => {
        root.render(<Prompts />);
      });
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("Prompts", () => {
  afterEach(() => {
    mockUsePromptList.mockReset();
    mockConfirm.mockReset();
    document.body.innerHTML = "";
  });

  test("shows system and user prompt fields for dictionary prompts", () => {
    const { container, unmount } = renderPrompts(PROMPT_CATEGORY_DICTIONARY);

    expect(container.textContent).toContain("系统提示词");
    expect(container.textContent).toContain("用户提示词");
    const resizableTextareas = container.querySelectorAll(
      'textarea.kt-resizable-textarea:not([aria-hidden="true"])'
    );
    expect(resizableTextareas).toHaveLength(2);
    resizableTextareas.forEach((textarea) => {
      expect(textarea.closest(".kt-resizable-text-field")).not.toBeNull();
      expect(
        getComputedStyle(textarea.closest(".MuiInputBase-root")).overflow
      ).toBe("visible");
      expect(getComputedStyle(textarea).resize).toBe("none");
      const fieldRoot = textarea.closest(".MuiInputBase-root");
      // 内容门控（有内容 → 在场）：夹具提示词非空。
      const grip = fieldRoot.querySelector('[role="separator"]');
      expect(grip).not.toBeNull();
      // 清空内容 → 手柄不在场；回填 → 重新在场（字段 onChange 经
      // CodeField rest 透传，CodeField.js:15 `{...rest}`；原生 setter
      // 先例同 TranForm.test.js 900-907）。
      const setTextareaValue = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      ).set;
      act(() => {
        setTextareaValue.call(textarea, "");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      });
      expect(fieldRoot.querySelector('[role="separator"]')).toBeNull();
      act(() => {
        setTextareaValue.call(textarea, "filled");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      });
      expect(fieldRoot.querySelector('[role="separator"]')).not.toBeNull();
      // 键盘锁定锚。
      act(() => {
        fieldRoot
          .querySelector('[role="separator"]')
          .dispatchEvent(
            new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })
          );
      });
      expect(fieldRoot.classList).toContain("kt-height-locked");
      expect(fieldRoot.style.height).toBe("40px");
    });

    unmount();
  });

  test("keeps user prompt field visibility scoped to prompt categories that use it", () => {
    const visibleCategories = [
      PROMPT_CATEGORY_USER,
      PROMPT_CATEGORY_DICTIONARY,
      PROMPT_CATEGORY_BATCH_SYSTEM,
    ];
    const hiddenCategories = [PROMPT_CATEGORY_SUBTITLE];

    for (const category of visibleCategories) {
      const { container, unmount } = renderPrompts(category);
      expect(container.textContent).toContain("用户提示词");
      unmount();
    }

    for (const category of hiddenCategories) {
      const { container, unmount } = renderPrompts(category);
      expect(container.textContent).not.toContain("用户提示词");
      unmount();
    }
  });

  test("marks the editor as container responsive and caps the stacked list", () => {
    const { container, unmount } = renderPrompts(PROMPT_CATEGORY_USER);
    const editor = container.querySelector(".kt-prompt-editor");

    expect(editor.classList).toContain(
      "kt-prompt-editor--container-responsive"
    );
    expect(
      container.querySelector(".kt-prompt-editor__list-panel")
    ).not.toBeNull();
    expect(
      container.querySelector(".kt-prompt-editor__detail-panel")
    ).not.toBeNull();

    expect(
      getComputedStyle(container.querySelector(".kt-prompt-editor__list-panel"))
        .maxHeight
    ).toBe("min(40vh, 360px)");
    expect(
      getComputedStyle(
        container.querySelector(".kt-prompt-editor__detail-panel")
      ).overscrollBehavior
    ).not.toBe("contain");
    unmount();
  });

  test("exposes selection while preserving keyboard and mouse behavior", async () => {
    const firstPrompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "first_prompt",
      name: "First prompt",
    });
    const secondPrompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "second_prompt",
      name: "Second prompt",
    });
    const { container, unmount } = renderPrompts([firstPrompt, secondPrompt]);
    const promptList = container.querySelector(".kt-prompt-editor__list");
    const promptButtons = Array.from(
      promptList.querySelectorAll('[role="button"]')
    );

    expect(promptList.classList).not.toContain("MuiList-padding");
    expect(getComputedStyle(promptList).width).toBe("100%");
    expect(getComputedStyle(promptList).boxSizing).toBe("border-box");
    expect(promptButtons).toHaveLength(2);
    expect(promptButtons[0].getAttribute("aria-pressed")).toBe("true");
    expect(promptButtons[1].getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      promptButtons[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
    });

    expect(promptButtons[0].getAttribute("aria-pressed")).toBe("false");
    expect(promptButtons[1].getAttribute("aria-pressed")).toBe("true");

    await act(async () => promptButtons[0].click());

    expect(promptButtons[0].getAttribute("aria-pressed")).toBe("true");
    expect(promptButtons[1].getAttribute("aria-pressed")).toBe("false");
    unmount();
  });

  test("confirms before switching away from unsaved changes", async () => {
    const firstPrompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "first_prompt",
      name: "First prompt",
    });
    const secondPrompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "second_prompt",
      name: "Second prompt",
    });
    const { container, unmount } = renderPrompts([firstPrompt, secondPrompt]);
    const nameInput = container.querySelector('input[name="name"]');

    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set.call(nameInput, "Changed prompt");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    mockConfirm.mockResolvedValueOnce(false);
    const secondPromptButton = Array.from(
      container.querySelectorAll('[role="button"]')
    ).find((button) => button.textContent === "Second prompt");
    await act(async () => secondPromptButton.click());
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "discard_prompt_changes_confirm",
      })
    );
    expect(container.querySelector('input[name="name"]').value).toBe(
      "Changed prompt"
    );

    mockConfirm.mockResolvedValueOnce(true);
    await act(async () => secondPromptButton.click());
    expect(container.querySelector('input[name="name"]').value).toBe(
      "Second prompt"
    );
    unmount();
  });

  test("keeps a dirty draft when only the prompt object identity changes", () => {
    const prompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "first_prompt",
      name: "First prompt",
    });
    const { container, rerender, unmount } = renderPrompts([prompt]);
    const nameInput = container.querySelector('input[name="name"]');

    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set.call(nameInput, "Changed prompt");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Preserve the unsaved draft when list rebuilding produces an equivalent object.
    rerender([{ ...prompt }]);
    expect(container.querySelector('input[name="name"]').value).toBe(
      "Changed prompt"
    );

    unmount();
  });

  test("confirms before creating a prompt from a template", async () => {
    const customPrompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "custom_prompt",
      name: "Custom prompt",
    });
    const presetPrompt = createPrompt(PROMPT_CATEGORY_USER, {
      slug: "preset_prompt",
      name: "Preset prompt",
    });
    const { container, promptListValue, unmount } = renderPrompts(
      [customPrompt, presetPrompt],
      {
        isPresetPromptSlug: (slug) => slug === "preset_prompt",
      }
    );
    promptListValue.addPrompt.mockReturnValue("new_prompt");
    const nameInput = container.querySelector('input[name="name"]');

    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set.call(nameInput, "Changed prompt");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "新增提示词"
    );
    await act(async () => addButton.click());
    const templateMenuItem = Array.from(
      document.body.querySelectorAll('[role="menuitem"]')
    ).find((item) => item.textContent === "Preset prompt");

    mockConfirm.mockResolvedValueOnce(false);
    await act(async () => templateMenuItem.click());
    expect(promptListValue.addPrompt).not.toHaveBeenCalled();

    mockConfirm.mockResolvedValueOnce(true);
    await act(async () => templateMenuItem.click());
    expect(promptListValue.addPrompt).toHaveBeenCalledWith(
      presetPrompt,
      "Preset prompt"
    );
    unmount();
  });
});

describe("Prompts textarea grip style", () => {
  afterEach(() => {
    mockUseTextareaGripStyle.mockReset();
    mockUseTextareaGripStyle.mockReturnValue("concentric-smooth");
    mockUsePromptList.mockReset();
    mockConfirm.mockReset();
    document.body.innerHTML = "";
  });

  test("firefox-native drops the grip, unlocks native resize and keeps the class", () => {
    mockUseTextareaGripStyle.mockReturnValue("firefox-native");
    const { container, unmount } = renderPrompts(PROMPT_CATEGORY_DICTIONARY);
    const textareas = container.querySelectorAll(
      'textarea.kt-resizable-textarea:not([aria-hidden="true"])'
    );
    expect(textareas.length).toBeGreaterThan(0);
    textareas.forEach((textarea) => {
      const fieldRoot = textarea.closest(".MuiInputBase-root");
      // 内容门控已满足（systemPrompt 非空），原生模式仍不渲染 separator。
      expect(fieldRoot.querySelector('[role="separator"]')).toBeNull();
      expect(getComputedStyle(textarea).resize).toBe("vertical");
      // kt-resizable-textarea 恒定附加（现状一致）。
      expect(textarea.classList.contains("kt-resizable-textarea")).toBe(true);
      // 高度锁停用契约：不存在 .kt-height-locked 祖先。
      expect(textarea.closest(".kt-height-locked")).toBeNull();
    });
    unmount();
  });

  test("upstream-chrome renders the grip with the slashed variant and locks resize", () => {
    mockUseTextareaGripStyle.mockReturnValue("upstream-chrome");
    const { container, unmount } = renderPrompts(PROMPT_CATEGORY_DICTIONARY);
    const textarea = container.querySelector(
      'textarea.kt-resizable-textarea:not([aria-hidden="true"])'
    );
    const fieldRoot = textarea.closest(".MuiInputBase-root");
    const grip = fieldRoot.querySelector('[role="separator"]');
    expect(grip).not.toBeNull();
    expect(getComputedStyle(textarea).resize).toBe("none");
    expect(grip.querySelector("svg path").getAttribute("d")).toBe(
      "M15 3L3 15h2.5L15 5.5V3zM15 8L8 15h2.5l4.5-4.5V8zM15 13l-2 2h2v-2z"
    );
    unmount();
  });
});
