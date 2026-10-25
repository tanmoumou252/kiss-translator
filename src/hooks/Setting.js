import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import Alert from "@mui/material/Alert";
import {
  STOKEY_SETTING,
  DEFAULT_SETTING,
  KV_SETTING_KEY,
  MSG_SET_LOGLEVEL,
} from "../config";
import { useStorage } from "./Storage";
import Loading from "./Loading";
import { logger } from "../libs/log";
import { sendBgMsg } from "../libs/msg";
import { isExt } from "../libs/client";
import { normalizeStoredSetting } from "../libs/storage";
import { setIconColorSnapshot, setIconStyleSnapshot } from "../styles/m3";
import { cloneStorageValue, isSameStorageValue } from "../libs/storageEquality";

// Share settings and their persistence operations with descendant components.
const SettingContext = createContext({
  setting: DEFAULT_SETTING,
  updateSetting: () => {},
  reloadSetting: () => {},
});

/** Normalize settings in memory and persist only user mutations. */
export function SettingProvider({ children, context }) {
  const isOptionsPage = useMemo(() => context === "options", [context]);

  const {
    data: rawSetting,
    isLoading,
    update,
    reload,
  } = useStorage(STOKEY_SETTING, DEFAULT_SETTING, KV_SETTING_KEY);
  const setting = useMemo(
    () => (rawSetting ? normalizeStoredSetting(rawSetting) : rawSetting),
    [rawSetting]
  );
  const logLevel = setting?.logLevel;

  // Keep the Options logger and extension background logger in sync.
  useEffect(() => {
    if (!isOptionsPage) return;

    (async () => {
      try {
        logger.setLevel(logLevel);
        if (isExt) {
          await sendBgMsg(MSG_SET_LOGLEVEL, logLevel);
        }
      } catch (error) {
        logger.child("setting").error("Failed to fetch log level, using default.", error);
      }
    })();
  }, [isOptionsPage, logLevel]);

  const updateSetting = useCallback(
    (objOrFn) => {
      const input =
        typeof objOrFn === "function" ? objOrFn : cloneStorageValue(objOrFn);
      return update((previous) => {
        // Rebase user edits on the latest normalized value inside the lock.
        const current = normalizeStoredSetting(previous);
        const patch = typeof input === "function" ? input(current) : input;
        // Imported backups may introduce legacy fields again.
        const next = normalizeStoredSetting({ ...current, ...patch });
        // A no-op must not persist compatibility transforms or create an upload.
        return isSameStorageValue(current, next) ? previous : next;
      });
    },
    [update]
  );

  // Merge a child patch against the current value when the reducer is replayed.
  const updateChild = useCallback(
    (key) => (obj) => {
      const patch = { ...obj };
      return updateSetting((prev) => ({
        ...prev,
        [key]: { ...(prev?.[key] || {}), ...patch },
      }));
    },
    [updateSetting]
  );

  // 首个真实 setting 到达的那次渲染期间同步图标快照：图标分发器在子组件
  // 渲染时经 useSyncExternalStore 读快照选图标，若等下面的 useLayoutEffect，
  // 首次提交的 DOM 会先落默认档（md3/默认色）再被提交后修正。渲染期标记
  // 保证仅同步一次；后续变化仍走 useLayoutEffect。
  const syncedIconSnapshotRef = useRef(false);
  if (!syncedIconSnapshotRef.current && setting) {
    syncedIconSnapshotRef.current = true;
    setIconStyleSnapshot(setting.iconStyle);
    setIconColorSnapshot(setting.iconColor);
  }

  // 把图标外观键同步给 m3.js 快照 store（M3Theme/图标分发器经
  // useSyncExternalStore 消费，避免它们直接 import 本模块拖入重依赖图）。
  // useLayoutEffect：浏览器提交前生效，切换档位零闪烁。
  useLayoutEffect(() => {
    setIconStyleSnapshot(setting?.iconStyle);
    setIconColorSnapshot(setting?.iconColor);
  }, [setting?.iconStyle, setting?.iconColor]);

  const value = useMemo(
    () => ({
      context,
      setting,
      updateSetting,
      updateChild,
      reloadSetting: reload,
    }),
    [context, setting, updateSetting, updateChild, reload]
  );

  // Show loading feedback in Options before the first storage read completes.
  if (isLoading) {
    return isOptionsPage ? <Loading /> : null;
  }

  // Options can explain a failed read; embedded views stay hidden.
  if (!setting) {
    return isOptionsPage ? (
      <center>
        <Alert severity="error" sx={{ maxWidth: 600, margin: "60px auto" }}>
          <p>数据加载出错，请刷新页面或卸载后重新安装。</p>
          <p>
            Data loading error, please refresh the page or uninstall and
            reinstall.
          </p>
        </Alert>
      </center>
    ) : null;
  }

  return (
    <SettingContext.Provider value={value}>{children}</SettingContext.Provider>
  );
}

export function useSetting() {
  return useContext(SettingContext);
}
