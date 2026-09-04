"use client";

/* Temporary check: writes a document seeded in Japanese that carries no recorded
 * language — the shape an older saved canvas has — and then renders the real
 * editor on top of it, so one page load exercises the whole restore path. */
import Editor from "../page";
import { KIND_SPEC, TITLE_BAR_H, WINDOW_H, WINDOW_MARGIN, Group, makeItem } from "@/lib/tokens";
import { setGlobalLang } from "@/lib/i18n";

let written = false;
function writeOlderDoc() {
  if (written || typeof window === "undefined") return;
  written = true;
  setGlobalLang("ja");
  const mk = (k: Parameters<typeof makeItem>[0]) => makeItem(k);
  const contentX = KIND_SPEC.sidebar.w + WINDOW_MARGIN;
  const side = mk("sidebar");
  const groups: Group[] = [
    { id: "g1", x: 0, y: 0, axis: "x", items: [mk("titleBar")] },
    {
      id: "g2",
      x: 0,
      y: TITLE_BAR_H,
      axis: "x",
      items: [{ ...side, label: "测试", tabs: [...(side.tabs ?? []), { icon: "inbox", label: "我加的一行" }] }],
    },
    { id: "g3", x: contentX, y: 120, axis: "x", items: [mk("dataTable")] },
    { id: "g4", x: 0, y: WINDOW_H - 28, axis: "x", items: [mk("statusBar")] },
  ];
  localStorage.setItem(
    "gpui-kit-canvas:doc",
    JSON.stringify({
      groups,
      frames: [{ id: "f1", name: "メイン", x: 0, y: 0, shell: "sidebar" }],
      paletteKey: "default:light",
      frame: "window",
      title: "",
      brief: "",
    }),
  );
  localStorage.removeItem("gpui-kit-canvas:ui");
  /* back to the module default, so the editor resolves the language itself */
  setGlobalLang("ja");
}

export default function Page() {
  writeOlderDoc();
  return <Editor />;
}
