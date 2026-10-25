import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioBtn, BrowserTtsBtn } from "./AudioBtn";
import { canSpeak, speak, stopSpeech } from "../../libs/speech";
import { invokeSavedService } from "../../providers/savedService";
import { getSettingWithDefault } from "../../libs/storage";
jest.mock("../../providers/savedService", () => ({
  invokeSavedService: jest.fn(),
}));
jest.mock("../../libs/storage", () => ({ getSettingWithDefault: jest.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("a saved legacy SystemTTS instance plays through speak without requiring a provider snapshot", async () => {
  getSettingWithDefault.mockResolvedValue({
    transApis: [
      {
        apiSlug: "legacy-speech",
        apiType: "SystemTTS",
        enabledCapabilities: ["speak"],
      },
    ],
  });
  invokeSavedService.mockReturnValue({
    result: Promise.resolve({ status: "ended" }),
    cancel: jest.fn(),
    assets: { clear: jest.fn() },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(<BrowserTtsBtn text="hello" serviceId="legacy-speech" />)
    );
    await act(async () => container.querySelector("button").click());
    expect(invokeSavedService).toHaveBeenCalledWith("legacy-speech", "speak", {
      text: "hello",
      language: "en-US",
    });
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

jest.mock("../../libs/speech", () => ({
  canSpeak: jest.fn(),
  speak: jest.fn(),
  stopSpeech: jest.fn(),
}));

let mockAudioState;

jest.mock("../../hooks/Audio", () => ({
  useAudio: () =>
    mockAudioState || {
      error: null,
      ready: true,
      playing: false,
      onPlay: jest.fn(),
      onPause: jest.fn(),
    },
}));

jest.mock("query-string", () => ({
  stringify: jest.fn(() => ""),
}));

function renderBrowserTtsBtn(props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<BrowserTtsBtn text="hello" lang="en" {...props} />);
  });

  return { container, root };
}

describe("BrowserTtsBtn", () => {
  beforeEach(() => {
    canSpeak.mockReturnValue(true);
    speak.mockReset();
    stopSpeech.mockReset();
    mockAudioState = undefined;
    document.body.innerHTML = "";
  });

  test("does not render when browser speech is unsupported", () => {
    canSpeak.mockReturnValue(false);

    const { container, root } = renderBrowserTtsBtn();

    expect(container.querySelector("button")).toBeNull();

    act(() => {
      root.unmount();
    });
  });

  test("keeps focus while speaking and stops native speech on repeated activation", () => {
    let onEnd;
    speak.mockImplementation((text, lang, callbacks) => {
      onEnd = callbacks.onEnd;
      return true;
    });

    const { container, root } = renderBrowserTtsBtn();
    const button = container.querySelector("button");

    act(() => {
      button.focus();
      button.click();
      // The second activation arrives before React renders the busy state.
      button.click();
    });

    expect(speak).toHaveBeenCalledTimes(1);
    // 朗读中的再次激活＝停止：取消原生 TTS，而非忽略点击。
    expect(stopSpeech).toHaveBeenCalledTimes(1);
    // 停止即刻复位：不再停留在"朗读中"的停止态，可直接再次朗读。
    expect(button.className).not.toContain("MuiIconButton-colorPrimary");
    expect(button.disabled).toBe(false);
    // 停止语义生效后按钮恒可操作，不再宣称 aria-disabled。
    expect(button.getAttribute("aria-disabled")).toBe("false");
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(button.getAttribute("aria-pressed")).toBe("false");

    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(speak).toHaveBeenCalledTimes(2);
    expect(stopSpeech).toHaveBeenCalledTimes(1);
    expect(button.className).toContain("MuiIconButton-colorPrimary");
    expect(document.activeElement).toBe(button);

    act(() => {
      onEnd();
    });

    expect(button.className).not.toContain("MuiIconButton-colorPrimary");
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("false");
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(document.activeElement).toBe(button);

    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(speak).toHaveBeenCalledTimes(3);
    expect(button.className).toContain("MuiIconButton-colorPrimary");

    act(() => {
      root.unmount();
    });
  });

  test("releases its activation guard when speech cannot start", () => {
    speak.mockReturnValue(false);
    const { container, root } = renderBrowserTtsBtn();
    const button = container.querySelector("button");
    act(() => {
      button.focus();
      button.click();
    });
    expect(button.getAttribute("aria-disabled")).toBe("false");
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(document.activeElement).toBe(button);
    act(() => button.click());
    expect(speak).toHaveBeenCalledTimes(2);
    act(() => root.unmount());
  });
});

describe("AudioBtn", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("exposes a named ready action and pauses from the playing state", () => {
    const onPlay = jest.fn();
    const onPause = jest.fn();
    mockAudioState = {
      error: null,
      ready: true,
      playing: false,
      onPlay,
      onPause,
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => root.render(<AudioBtn src="audio" title="Speak word" />));
    const button = container.querySelector("button");
    expect(button.getAttribute("aria-label")).toBe("Speak word");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    act(() => button.click());
    expect(onPlay).toHaveBeenCalledTimes(1);

    mockAudioState = { ...mockAudioState, playing: true };
    act(() =>
      root.render(
        <AudioBtn src="audio" title="Speak word" pauseTitle="Pause word" />
      )
    );
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Pause word");
    act(() => button.click());
    expect(onPause).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
  });
});

describe("AudioBtn md3 stop affordance (playing states)", () => {
  beforeEach(() => {
    canSpeak.mockReturnValue(true);
    speak.mockReset();
    mockAudioState = undefined;
    getSettingWithDefault.mockReset();
    getSettingWithDefault.mockResolvedValue({ transApis: [] });
    document.body.innerHTML = "";
  });

  test("basic AudioBtn swaps to the md3 pause glyph while playing", () => {
    mockAudioState = {
      error: null,
      ready: true,
      playing: true,
      onPlay: jest.fn(),
      onPause: jest.fn(),
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() =>
      root.render(
        <AudioBtn src="audio" title="Speak word" pauseTitle="Pause word" />
      )
    );
    const button = container.querySelector("button");
    expect(button.getAttribute("aria-label")).toBe("Pause word");
    expect(button.querySelector('[data-testid="PauseIcon"]')).not.toBeNull();
    expect(button.querySelector('[data-testid="StopIcon"]')).toBeNull();

    act(() => root.unmount());
  });

  test("NativeTtsBtn swaps to the stop glyph and stopTitle while speaking", () => {
    let onEnd;
    speak.mockImplementation((text, lang, callbacks) => {
      onEnd = callbacks.onEnd;
      return true;
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() =>
      root.render(
        <BrowserTtsBtn
          text="hello"
          lang="en"
          title="Read aloud"
          stopTitle="Stop reading"
        />
      )
    );
    const button = container.querySelector("button");

    act(() => button.click());
    expect(button.querySelector('[data-testid="StopIcon"]')).not.toBeNull();
    expect(button.getAttribute("title")).toBe("Stop reading");
    expect(button.getAttribute("aria-label")).toBe("Stop reading");

    act(() => onEnd());
    expect(button.querySelector('[data-testid="StopIcon"]')).toBeNull();
    expect(button.getAttribute("title")).toBe("Read aloud");

    act(() => root.unmount());
  });

  test("NativeTtsBtn stop click resets immediately without waiting for a terminal event", () => {
    stopSpeech.mockClear();
    const onEndCalls = [];
    speak.mockImplementation((text, lang, callbacks) => {
      onEndCalls.push(callbacks.onEnd);
      return true;
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() =>
      root.render(
        <BrowserTtsBtn
          text="hello"
          lang="en"
          title="Read aloud"
          stopTitle="Stop reading"
        />
      )
    );
    const button = container.querySelector("button");

    act(() => button.click());
    expect(button.getAttribute("title")).toBe("Stop reading");

    act(() => button.click());
    expect(stopSpeech).toHaveBeenCalledTimes(1);
    // 停止即刻回到可再次朗读的状态，不依赖停止路径是否回送终态事件。
    expect(button.getAttribute("title")).toBe("Read aloud");

    // 迟到的旧朗读终态事件不得改写当前状态。
    act(() => onEndCalls[0]());
    expect(button.getAttribute("title")).toBe("Read aloud");

    act(() => root.unmount());
    container.remove();
  });

  test("NativeTtsBtn keeps the restarted session when the previous speech's terminal event arrives", () => {
    const onEndCalls = [];
    speak.mockImplementation((text, lang, callbacks) => {
      onEndCalls.push(callbacks.onEnd);
      return true;
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() =>
      root.render(
        <BrowserTtsBtn
          text="hello"
          lang="en"
          title="Read aloud"
          stopTitle="Stop reading"
        />
      )
    );
    const button = container.querySelector("button");

    act(() => button.click());
    act(() => button.click());
    act(() => button.click());
    expect(button.getAttribute("title")).toBe("Stop reading");

    // 第一次朗读的终态事件在重启后才到达：不得复位第二次朗读。
    act(() => onEndCalls[0]());
    expect(button.getAttribute("title")).toBe("Stop reading");

    // 第二次朗读自身的终态事件正常收束。
    act(() => onEndCalls[1]());
    expect(button.getAttribute("title")).toBe("Read aloud");

    act(() => root.unmount());
    container.remove();
  });

  test("CloudTtsBtn swaps to the stop glyph and stopTitle while playing", async () => {
    // Cloud 播放态由悬置的服务 promise 维持：setPlaying(true) 在首个 await 前
    // 同步发生，result 永不 resolve → playing 持续为 true。
    invokeSavedService.mockReturnValue({
      result: new Promise(() => {}),
      cancel: jest.fn(),
      assets: { clear: jest.fn(), get: jest.fn() },
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() =>
      root.render(
        <BrowserTtsBtn
          text="hello"
          serviceId="tts-service"
          title="Read aloud"
          stopTitle="Stop reading"
        />
      )
    );
    const button = container.querySelector("button");
    expect(button).not.toBeNull();

    await act(async () => {
      button.click();
    });
    expect(button.querySelector('[data-testid="StopIcon"]')).not.toBeNull();
    expect(button.getAttribute("title")).toBe("Stop reading");
    expect(button.getAttribute("aria-label")).toBe("Stop reading");

    act(() => root.unmount());
  });
});
