import { useEffect, useReducer } from "react";
import browser from "webextension-polyfill";
import Setting from "../interfaces/setting";
import { settingReducer } from "../reducer/setting";

export default function useGlobalSetting() {
  const [globalSetting, dispatchGlobalSetting] = useReducer(
    settingReducer,
    {} as Setting
  );

  const updateSetting = (setting: Setting) => {
    dispatchGlobalSetting({
      type: "chatDisplayMethod",
      value: setting.chatDisplayMethod,
    });
    dispatchGlobalSetting({ type: "position", value: setting.position });
    dispatchGlobalSetting({
      type: "pointBoxAuto",
      value: setting.autoPointClick,
    });
    dispatchGlobalSetting({ type: "darkTheme", value: setting.darkTheme });
    dispatchGlobalSetting({
      type: "chatTime",
      value: setting.chatTime,
    });
    dispatchGlobalSetting({
      type: "miniLanguage",
      value: setting.miniLanguage,
    });
    dispatchGlobalSetting({
      type: "miniFontSize",
      value: setting.miniFontSize,
    });
    dispatchGlobalSetting({
      type: "miniChatTime",
      value: setting.miniChatTime,
    });
  };

  useEffect(() => {
    browser.storage.local
      .get([
        "chatDisplayMethod",
        "position",
        "pointBoxAuto",
        "darkTheme",
        "chatTime",
        "miniLanguage",
        "miniFontSize",
        "miniChatTime",
      ])
      .then((res) => {
        updateSetting({
          chatDisplayMethod: res.chatDisplayMethod,
          position: res.position,
          pointBoxAuto: res.pointBoxAuto,
          darkTheme: res.darkTheme,
          chatTime: res.chatTime,
          miniChatTime: res.miniChatTime,
          miniLanguage: res.miniLanguage,
          miniFontSize: res.miniFontSize,
        } as Setting);
      });
  }, []);

  useEffect(() => {
    browser.storage.local.set({
      chatDisplayMethod: globalSetting.chatDisplayMethod,
      position: globalSetting.position,
      pointBoxAuto: globalSetting.pointBoxAuto,
      darkTheme: globalSetting.darkTheme,
      chatTime: globalSetting.chatTime,
      miniLanguage: globalSetting.miniLanguage,
      miniFontSize: globalSetting.miniFontSize,
      miniChatTime: globalSetting.miniChatTime,
    });
  }, [globalSetting]);

  return { globalSetting, dispatchGlobalSetting };
}
