// Generate src/components/icons/md3/index.js and src/components/icons/index.js from @material-symbols/svg-600 (rounded).
// Usage: node src/scripts/gen-md3-icons.mjs — re-run to re-sync after upgrading the package.
// Hard-fails (exit 1, listing icon names) on: missing svg file, unexpected viewBox,
// unsupported elements (mask/g/rect/...), or anything other than exactly one <path>.
// All top-level icon bindings carry /*#__PURE__*/ (both files) so bundlers can
// drop unused icons per entry; the annotations are part of the output contract.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PKG_DIR = "node_modules/@material-symbols/svg-600/rounded";
const OUT_FILE = "src/components/icons/md3/index.js";
const DISPATCHER_FILE = "src/components/icons/index.js";

// key = component/display name (exported as `<name>Icon`, data-testid `<name>Icon`),
// value = svg file under rounded/. Base names use FILL 1 (-fill), *Outlined use FILL 0.
// *Rounded keys mirror the MUI `<Name>Rounded` fallback module (@mui/icons-material/<Name>Rounded);
// callers that historically imported Rounded variants must import the matching `<Name>RoundedIcon`
// directly — never alias a non-rounded import locally (that would silently swap the MUI variant).
const MAPPING = {
  Add: "add-fill.svg",
  Api: "api-fill.svg",
  ApiRounded: "api-fill.svg",
  ArrowDropDown: "arrow_drop_down-fill.svg",
  ArrowDropDownRounded: "arrow_drop_down-fill.svg",
  AutorenewRounded: "autorenew-fill.svg",
  Block: "block-fill.svg",
  BlockRounded: "block-fill.svg",
  BookmarkAddRounded: "bookmark_add-fill.svg",
  Bookmarks: "bookmarks-fill.svg",
  BookmarksRounded: "bookmarks-fill.svg",
  BrightnessAuto: "brightness_auto-fill.svg",
  BrightnessAutoRounded: "brightness_auto-fill.svg",
  BugReport: "bug_report-fill.svg",
  BugReportRounded: "bug_report-fill.svg",
  Cancel: "cancel-fill.svg",
  CancelRounded: "cancel-fill.svg",
  Check: "check-fill.svg",
  CheckBox: "check_box-fill.svg",
  CheckBoxOutlineBlank: "check_box_outline_blank.svg",
  CheckBoxOutlineBlankRounded: "check_box_outline_blank.svg",
  CheckBoxRounded: "check_box-fill.svg",
  CheckCircle: "check_circle-fill.svg",
  CheckCircleOutline: "check_circle.svg",
  CheckCircleRounded: "check_circle-fill.svg",
  CheckRounded: "check-fill.svg",
  ChevronRight: "chevron_right-fill.svg",
  ClearAll: "clear_all-fill.svg",
  Close: "close-fill.svg",
  CloseRounded: "close-fill.svg",
  CloudSync: "cloud_sync-fill.svg",
  CloudSyncRounded: "cloud_sync-fill.svg",
  Code: "code-fill.svg",
  CodeRounded: "code-fill.svg",
  ContentCopy: "content_copy-fill.svg",
  ContentCopyRounded: "content_copy-fill.svg",
  ContentPaste: "content_paste-fill.svg",
  CropRounded: "crop-fill.svg",
  DarkMode: "dark_mode-fill.svg",
  DarkModeRounded: "dark_mode-fill.svg",
  DataObject: "data_object-fill.svg",
  Delete: "delete-fill.svg",
  DeleteOutline: "delete.svg",
  DeleteOutlineRounded: "delete.svg",
  DeleteSweepRounded: "delete_sweep-fill.svg",
  Description: "description-fill.svg",
  DescriptionRounded: "description-fill.svg",
  DoNotDisturbOnRounded: "do_not_disturb_on-fill.svg",
  Download: "download-fill.svg",
  DownloadRounded: "download-fill.svg",
  DragIndicator: "drag_indicator-fill.svg",
  DragIndicatorRounded: "drag_indicator-fill.svg",
  Edit: "edit-fill.svg",
  Error: "error-fill.svg",
  ErrorOutline: "error.svg",
  ErrorOutlineRounded: "error.svg",
  EventNote: "event_note-fill.svg",
  ExpandLess: "keyboard_arrow_up-fill.svg",
  ExpandMore: "keyboard_arrow_down-fill.svg",
  ExpandMoreRounded: "keyboard_arrow_down-fill.svg",
  Favorite: "favorite-fill.svg",
  FavoriteBorder: "favorite.svg",
  FileDownload: "download_2-fill.svg",
  FileUpload: "upload-fill.svg",
  FileUploadRounded: "upload-fill.svg",
  FolderShared: "folder_shared-fill.svg",
  FolderSharedRounded: "folder_shared-fill.svg",
  Help: "help-fill.svg",
  HelpOutline: "help.svg",
  Image: "image-fill.svg",
  ImageRounded: "image-fill.svg",
  Info: "info-fill.svg",
  InfoRounded: "info-fill.svg",
  Keyboard: "keyboard-fill.svg",
  KeyboardArrowDown: "keyboard_arrow_down-fill.svg",
  KeyboardArrowDownRounded: "keyboard_arrow_down-fill.svg",
  KeyboardArrowUp: "keyboard_arrow_up-fill.svg",
  KeyboardArrowUpRounded: "keyboard_arrow_up-fill.svg",
  KeyboardRounded: "keyboard-fill.svg",
  Language: "language-fill.svg",
  LanguageRounded: "language-fill.svg",
  LibraryAddCheck: "library_add_check-fill.svg",
  LightMode: "light_mode-fill.svg",
  LightModeRounded: "light_mode-fill.svg",
  Lock: "lock-fill.svg",
  LockOutlined: "lock.svg",
  Menu: "menu-fill.svg",
  MenuRounded: "menu-fill.svg",
  Memory: "memory-fill.svg",
  MemoryRounded: "memory-fill.svg",
  Mic: "mic-fill.svg",
  MicRounded: "mic-fill.svg",
  MoreVert: "more_vert-fill.svg",
  MouseRounded: "mouse-fill.svg",
  MyLocation: "my_location-fill.svg",
  MyLocationOutlined: "my_location.svg",
  OpenInNew: "open_in_new-fill.svg",
  OpenInNewRounded: "open_in_new-fill.svg",
  Palette: "palette-fill.svg",
  PaletteRounded: "palette-fill.svg",
  Pause: "pause-fill.svg",
  PauseCircleOutline: "pause_circle.svg",
  PauseCircleOutlineRounded: "pause_circle.svg",
  PauseRounded: "pause-fill.svg",
  PlayArrow: "play_arrow-fill.svg",
  PlayArrowRounded: "play_arrow-fill.svg",
  PushPin: "keep-fill.svg",
  PushPinOutlined: "keep.svg",
  RadioButtonChecked: "radio_button_checked-fill.svg",
  RadioButtonUnchecked: "radio_button_unchecked-fill.svg",
  RateReviewRounded: "rate_review-fill.svg",
  Refresh: "refresh-fill.svg",
  RefreshRounded: "refresh-fill.svg",
  Remove: "remove-fill.svg",
  RemoveCircle: "do_not_disturb_on-fill.svg",
  Replay: "replay-fill.svg",
  ReplayRounded: "replay-fill.svg",
  RestartAltRounded: "restart_alt-fill.svg",
  Save: "save-fill.svg",
  Search: "search-fill.svg",
  SearchRounded: "search-fill.svg",
  Segment: "segment-fill.svg",
  SegmentRounded: "segment-fill.svg",
  SelectAll: "select_all-fill.svg",
  SelectAllRounded: "select_all-fill.svg",
  Send: "send-fill.svg",
  SendRounded: "send-fill.svg",
  SettingsRounded: "settings-fill.svg",
  Share: "share-fill.svg",
  Stop: "stop-fill.svg",
  StopRounded: "stop-fill.svg",
  Subject: "subject-fill.svg",
  Subtitles: "subtitles-fill.svg",
  SubtitlesRounded: "subtitles-fill.svg",
  SwapHorizRounded: "swap_horiz-fill.svg",
  SwapVert: "swap_vert-fill.svg",
  SwapVertRounded: "swap_vert-fill.svg",
  Sync: "sync-fill.svg",
  TextSnippet: "text_snippet-fill.svg",
  Translate: "translate-fill.svg",
  TranslateRounded: "translate-fill.svg",
  Tune: "tune-fill.svg",
  TuneRounded: "tune-fill.svg",
  UndoRounded: "undo-fill.svg",
  UnfoldLess: "unfold_less-fill.svg",
  UnfoldMore: "unfold_more-fill.svg",
  UploadFile: "upload_file-fill.svg",
  UploadFileRounded: "upload_file-fill.svg",
  Visibility: "visibility-fill.svg",
  VisibilityOff: "visibility_off-fill.svg",
  VolumeUp: "volume_up-fill.svg",
  VolunteerActivismRounded: "volunteer_activism-fill.svg",
  Warning: "warning-fill.svg",
};

const failures = [];
const icons = [];

for (const [name, file] of Object.entries(MAPPING)) {
  const full = path.join(PKG_DIR, file);
  if (!existsSync(full)) {
    failures.push(`${name}: missing ${file}`);
    continue;
  }
  const svg = readFileSync(full, "utf8");
  if (!svg.includes('viewBox="0 -960 960 960"')) {
    failures.push(`${name}: unexpected viewBox in ${file}`);
    continue;
  }
  if (/<(?:mask|g|circle|rect|clipPath|use|text|linearGradient|radialGradient)\b/i.test(svg)) {
    failures.push(`${name}: unsupported element in ${file}`);
    continue;
  }
  const dAttrs = [...svg.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)];
  if (dAttrs.length !== 1) {
    failures.push(`${name}: expected exactly 1 <path>, got ${dAttrs.length} in ${file}`);
    continue;
  }
  icons.push([name, dAttrs[0][1]]);
}

if (failures.length > 0) {
  console.error(`gen-md3-icons: ${failures.length} failure(s):`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

icons.sort(([a], [b]) => a.localeCompare(b));

const lines = [];
lines.push(
  "// Generated by src/scripts/gen-md3-icons.mjs — source: @material-symbols/svg-600/rounded/*.svg. Do not edit by hand."
);
lines.push('import { createSvgIcon } from "@mui/material/utils";');
lines.push('import React from "react";');
lines.push("");
for (const [name, d] of icons) {
  lines.push(
    `export const ${name}Icon = /*#__PURE__*/ createSvgIcon(/*#__PURE__*/ React.createElement("path", { d: ${JSON.stringify(d)}, transform: "scale(0.025) translate(0, 960)" }), "${name}");`
  );
  lines.push("");
}
mkdirSync(path.dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, `${lines.join("\n").trimEnd()}\n`, "utf8");

const dispatcherLines = [];
dispatcherLines.push(
  "// Generated by src/scripts/gen-md3-icons.mjs — style dispatcher over ./md3 and @mui/icons-material. Do not edit by hand."
);
dispatcherLines.push('import React, { useSyncExternalStore } from "react";');
dispatcherLines.push(
  'import { getIconStyleSnapshot, subscribeIconStyle } from "../../styles/m3";'
);
dispatcherLines.push("");
for (const [name] of icons) {
  dispatcherLines.push(`import { ${name}Icon as Md3${name}Icon } from "./md3";`);
  dispatcherLines.push(`import Mui${name} from "@mui/icons-material/${name}";`);
}
dispatcherLines.push("");
for (const [name] of icons) {
  dispatcherLines.push(
    `export const ${name}Icon = /*#__PURE__*/ React.forwardRef(function ${name}Icon(props, ref) {`
  );
  dispatcherLines.push(
    `  const iconStyle = useSyncExternalStore(subscribeIconStyle, getIconStyleSnapshot);`
  );
  dispatcherLines.push(`  const Icon =`);
  dispatcherLines.push(`    iconStyle === "mui" ? Mui${name} : Md3${name}Icon;`);
  dispatcherLines.push(`  return <Icon {...props} ref={ref} />;`);
  dispatcherLines.push(`});`);
  dispatcherLines.push("");
}
mkdirSync(path.dirname(DISPATCHER_FILE), { recursive: true });
writeFileSync(
  DISPATCHER_FILE,
  `${dispatcherLines.join("\n").trimEnd()}\n`,
  "utf8"
);
console.log(
  `gen-md3-icons: wrote ${icons.length} icons to ${OUT_FILE} and dispatcher to ${DISPATCHER_FILE}`
);
