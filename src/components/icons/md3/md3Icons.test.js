// Generated icons module smoke (green-guard): the module under test exists only
// after `node src/scripts/gen-md3-icons.mjs` has run, so this file never serves
// as a red-light probe — it guards the generated artifact's shape.
import { act } from "react";
import { createRoot } from "react-dom/client";
import * as Md3 from "./index";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Documented alias groups (one Symbols glyph serving multiple legacy MUI names).
const ALIAS_GROUPS = [
  [
    "KeyboardArrowDownIcon",
    "KeyboardArrowDownRoundedIcon",
    "ExpandMoreIcon",
    "ExpandMoreRoundedIcon",
  ],
  ["KeyboardArrowUpIcon", "KeyboardArrowUpRoundedIcon", "ExpandLessIcon"],
  ["ArrowDropDownIcon", "ArrowDropDownRoundedIcon"],
  ["ApiIcon", "ApiRoundedIcon"],
  ["BookmarksIcon", "BookmarksRoundedIcon"],
  ["BrightnessAutoIcon", "BrightnessAutoRoundedIcon"],
  ["BugReportIcon", "BugReportRoundedIcon"],
  ["CancelIcon", "CancelRoundedIcon"],
  ["CheckCircleIcon", "CheckCircleRoundedIcon"],
  ["CheckIcon", "CheckRoundedIcon"],
  ["CloudSyncIcon", "CloudSyncRoundedIcon"],
  ["CloseIcon", "CloseRoundedIcon"],
  ["CodeIcon", "CodeRoundedIcon"],
  ["ContentCopyIcon", "ContentCopyRoundedIcon"],
  ["DarkModeIcon", "DarkModeRoundedIcon"],
  ["DeleteOutlineIcon", "DeleteOutlineRoundedIcon"],
  ["DescriptionIcon", "DescriptionRoundedIcon"],
  ["DownloadIcon", "DownloadRoundedIcon"],
  ["DragIndicatorIcon", "DragIndicatorRoundedIcon"],
  ["FileUploadIcon", "FileUploadRoundedIcon"],
  ["FolderSharedIcon", "FolderSharedRoundedIcon"],
  ["ImageIcon", "ImageRoundedIcon"],
  ["InfoIcon", "InfoRoundedIcon"],
  ["KeyboardIcon", "KeyboardRoundedIcon"],
  ["LanguageIcon", "LanguageRoundedIcon"],
  ["LightModeIcon", "LightModeRoundedIcon"],
  ["MemoryIcon", "MemoryRoundedIcon"],
  ["MenuIcon", "MenuRoundedIcon"],
  ["MicIcon", "MicRoundedIcon"],
  ["OpenInNewIcon", "OpenInNewRoundedIcon"],
  ["PaletteIcon", "PaletteRoundedIcon"],
  ["PauseCircleOutlineIcon", "PauseCircleOutlineRoundedIcon"],
  ["PauseIcon", "PauseRoundedIcon"],
  ["PlayArrowIcon", "PlayArrowRoundedIcon"],
  ["RefreshIcon", "RefreshRoundedIcon"],
  ["RemoveCircleIcon", "DoNotDisturbOnRoundedIcon"],
  ["ReplayIcon", "ReplayRoundedIcon"],
  ["SearchIcon", "SearchRoundedIcon"],
  ["SegmentIcon", "SegmentRoundedIcon"],
  ["SelectAllIcon", "SelectAllRoundedIcon"],
  ["SendIcon", "SendRoundedIcon"],
  ["StopIcon", "StopRoundedIcon"],
  ["SubtitlesIcon", "SubtitlesRoundedIcon"],
  ["SwapVertIcon", "SwapVertRoundedIcon"],
  ["TranslateIcon", "TranslateRoundedIcon"],
  ["TuneIcon", "TuneRoundedIcon"],
  ["UploadFileIcon", "UploadFileRoundedIcon"],
  ["BlockIcon", "BlockRoundedIcon"],
  ["ErrorOutlineIcon", "ErrorOutlineRoundedIcon"],
  ["CheckBoxOutlineBlankIcon", "CheckBoxOutlineBlankRoundedIcon"],
  ["CheckBoxIcon", "CheckBoxRoundedIcon"],
];

const renderIconSvg = (Icon) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Icon />);
  });
  // React 18 并发 root 的 DOM 提交发生在 act() 退出时，须在回调外查询。
  const svg = container.querySelector("svg");
  act(() => root.unmount());
  container.remove();
  return svg;
};

describe("md3 icons module (generated)", () => {
  const entries = Object.entries(Md3);

  test("exports exactly the mapped icon components", () => {
    expect(entries).toHaveLength(153);
    for (const [name, Icon] of entries) {
      // createSvgIcon 返回 memo(forwardRef)，typeof 为 "object" 属正常组件形态。
      expect(
        typeof Icon === "function" || Boolean(Icon && Icon.$$typeof)
      ).toBe(true);
      expect(name.endsWith("Icon")).toBe(true);
    }
  });

  test("every icon renders a single non-empty path in a 24px viewBox", () => {
    for (const [name, Icon] of entries) {
      const svg = renderIconSvg(Icon);
      expect(svg).not.toBeNull();
      const paths = svg.querySelectorAll("path");
      expect(paths).toHaveLength(1);
      expect(paths[0].getAttribute("d")).not.toBe("");
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    }
  });

  test("path data are pairwise distinct outside documented alias groups", () => {
    const dByIcon = Object.fromEntries(
      entries.map(
        ([name, Icon]) => [name, renderIconSvg(Icon).querySelector("path").getAttribute("d")]
      )
    );
    const aliased = (a, b) =>
      ALIAS_GROUPS.some((group) => group.includes(a) && group.includes(b));
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i][0];
        const b = entries[j][0];
        if (aliased(a, b)) {
          expect(dByIcon[a]).toBe(dByIcon[b]);
        } else {
          expect(dByIcon[a]).not.toBe(dByIcon[b]);
        }
      }
    }
  });

  test("data-testid follows the displayName convention", () => {
    for (const [name, Icon] of entries) {
      const svg = renderIconSvg(Icon);
      expect(svg.getAttribute("data-testid")).toBe(name);
    }
  });
});
