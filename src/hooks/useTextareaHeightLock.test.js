import { act } from "react";
import { createRoot } from "react-dom/client";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import useTextareaHeightLock, {
  useTextareaGripStyle,
} from "./useTextareaHeightLock";

// useTextareaGripStyle 依赖 useSetting；以可变 mockGripSetting 驱动缺省回落
// 与存量值透传两条断言。默认导出 useTextareaHeightLock 不调用 useSetting，
// 故本 mock 对既有用例零影响。
const mockGripSetting = { textareaGripStyle: undefined };
jest.mock("./Setting", () => ({
  useSetting: () => ({ setting: mockGripSetting }),
}));

function LockHost({ lockKey, minRows = 3, onChange, disabled }) {
  const lock = useTextareaHeightLock(lockKey, undefined, disabled);
  onChange(lock);
  return (
    <div className="MuiInputBase-root">
      <TextareaAutosize
        ref={lock.textareaRef}
        minRows={minRows}
        maxRows={minRows + 5}
        data-testid={`ta-${lockKey}`}
      />
    </div>
  );
}

async function renderLock(ui) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(ui));
  const fieldRoot = container.querySelector(".MuiInputBase-root");
  const textarea = container.querySelector("textarea");
  return { container, root, fieldRoot, textarea };
}

function GripStyleHost({ onResult }) {
  onResult(useTextareaGripStyle());
  return null;
}

async function renderGripStyle() {
  let captured;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<GripStyleHost onResult={(value) => (captured = value)} />);
  });
  return { root, getCaptured: () => captured };
}

describe("useTextareaHeightLock", () => {
  let setItemSpy;

  beforeEach(() => {
    setItemSpy = jest.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  test("starts unlocked and leaves the InputBase root untouched", async () => {
    let lock;
    const { root, fieldRoot } = await renderLock(
      <LockHost lockKey="fresh-test" onChange={(api) => (lock = api)} />
    );
    expect(lock.lockedHeight).toBeNull();
    expect(fieldRoot.style.height).toBe("");
    expect(fieldRoot.classList).not.toContain("kt-height-locked");
    await act(async () => root.unmount());
  });

  test("pins the locked height on the root across host re-renders", async () => {
    let lock;
    const { root, fieldRoot } = await renderLock(
      <LockHost lockKey="pin-test" onChange={(api) => (lock = api)} />
    );
    await act(async () => lock.applyHeight(180));
    expect(fieldRoot.style.height).toBe("180px");
    expect(fieldRoot.classList).toContain("kt-height-locked");

    // Host re-render (a prop change makes TextareaAutosize resync) keeps
    // the root anchor and the pixel height.
    await act(async () =>
      root.render(
        <LockHost lockKey="pin-test" minRows={4} onChange={(api) => (lock = api)} />
      )
    );
    expect(fieldRoot.style.height).toBe("180px");
    expect(fieldRoot.classList).toContain("kt-height-locked");
    await act(async () => root.unmount());
  });

  test("restores the locked height and the root anchor after remount within the same session", async () => {
    let lock;
    const first = await renderLock(
      <LockHost lockKey="remember-me" onChange={(api) => (lock = api)} />
    );
    await act(async () => lock.applyHeight(220));
    await act(async () => first.root.unmount());

    let lock2;
    const second = await renderLock(
      <LockHost lockKey="remember-me" onChange={(api) => (lock2 = api)} />
    );
    expect(second.fieldRoot.style.height).toBe("220px");
    expect(second.fieldRoot.classList).toContain("kt-height-locked");
    await act(async () => second.root.unmount());
  });

  test("keeps two locks with different keys independent", async () => {
    let lockA;
    let lockB;
    const first = await renderLock(
      <LockHost lockKey="inst-a" onChange={(api) => (lockA = api)} />
    );
    const second = await renderLock(
      <LockHost lockKey="inst-b" onChange={(api) => (lockB = api)} />
    );
    await act(async () => lockA.applyHeight(150));
    expect(first.fieldRoot.style.height).toBe("150px");
    expect(first.fieldRoot.classList).toContain("kt-height-locked");
    expect(lockB.lockedHeight).toBeNull();
    expect(second.fieldRoot.style.height).toBe("");
    expect(second.fieldRoot.classList).not.toContain("kt-height-locked");
    await act(async () => first.root.unmount());
    await act(async () => second.root.unmount());
  });

  test("keeps the session memory out of any storage", async () => {
    let lock;
    const { root } = await renderLock(
      <LockHost lockKey="no-storage" onChange={(api) => (lock = api)} />
    );
    await act(async () => lock.applyHeight(120));
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("no-storage")).toBeNull();
    await act(async () => root.unmount());
  });

  test("useTextareaGripStyle falls back to the default concentric arc", async () => {
    mockGripSetting.textareaGripStyle = undefined;
    const { root, getCaptured } = await renderGripStyle();
    expect(getCaptured()).toBe("concentric-smooth");
    await act(async () => root.unmount());
  });

  test("useTextareaGripStyle passes through a stored grip style value", async () => {
    mockGripSetting.textareaGripStyle = "hidden";
    const { root, getCaptured } = await renderGripStyle();
    expect(getCaptured()).toBe("hidden");
    await act(async () => root.unmount());
    mockGripSetting.textareaGripStyle = undefined;
  });

  test("releaseHeight clears the session memory and restores the root", async () => {
    let lock;
    const first = await renderLock(
      <LockHost lockKey="release-me" onChange={(api) => (lock = api)} />
    );
    await act(async () => lock.applyHeight(180));
    expect(lock.lockedHeight).toBe(180);
    expect(first.fieldRoot.style.height).toBe("180px");
    expect(first.fieldRoot.classList).toContain("kt-height-locked");

    await act(async () => lock.releaseHeight());
    expect(lock.lockedHeight).toBeNull();
    expect(first.fieldRoot.style.height).toBe("");
    expect(first.fieldRoot.classList).not.toContain("kt-height-locked");

    // 会话记忆同步清除：同 key 卸载重挂载不再恢复高度。
    await act(async () => first.root.unmount());
    let lock2;
    const second = await renderLock(
      <LockHost lockKey="release-me" onChange={(api) => (lock2 = api)} />
    );
    expect(lock2.lockedHeight).toBeNull();
    expect(second.fieldRoot.style.height).toBe("");
    expect(second.fieldRoot.classList).not.toContain("kt-height-locked");
    await act(async () => second.root.unmount());
  });

  test("releaseHeight leaves a clean disabled lock untouched", async () => {
    let lock;
    const { root, fieldRoot } = await renderLock(
      <LockHost
        lockKey="disabled-release"
        disabled
        onChange={(api) => (lock = api)}
      />
    );
    await act(async () => lock.applyHeight(120));
    await act(async () => lock.releaseHeight());
    expect(lock.lockedHeight).toBeNull();
    expect(fieldRoot.style.height).toBe("");
    expect(fieldRoot.classList).not.toContain("kt-height-locked");
    await act(async () => root.unmount());
  });

  test("releaseHeight clears leftover root residue even while disabled", async () => {
    let lock;
    const { root, fieldRoot } = await renderLock(
      <LockHost
        lockKey="disabled-residue-release"
        disabled
        onChange={(api) => (lock = api)}
      />
    );
    // 停用（firefox-native）翻转前写入的锁定残留：disabled 下 applyHeight
    // 早退无法经其制造，手动注入 root 类与内联高度。
    await act(async () => {
      fieldRoot.classList.add("kt-height-locked");
      fieldRoot.style.height = "180px";
    });
    expect(fieldRoot.style.height).toBe("180px");
    expect(fieldRoot.classList).toContain("kt-height-locked");

    await act(async () => lock.releaseHeight());
    // DOM 清理不受 disabled 早退影响：类与内联高度被幂等移除（「彻底解
    // 锁」在停用翻转场景同样成立）。
    expect(fieldRoot.style.height).toBe("");
    expect(fieldRoot.classList).not.toContain("kt-height-locked");
    await act(async () => root.unmount());
  });
});
