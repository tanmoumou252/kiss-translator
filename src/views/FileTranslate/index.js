import React from "react";
import { FileTranslationProvider } from "./State";
import FileTranslateView from "./FileTranslateView";
import { SettingProvider } from "../../hooks/Setting";

export default function FileTranslatePage() {
  return (
    <SettingProvider context="fileTranslate">
      <FileTranslationProvider>
        <FileTranslateView />
      </FileTranslationProvider>
    </SettingProvider>
  );
}
