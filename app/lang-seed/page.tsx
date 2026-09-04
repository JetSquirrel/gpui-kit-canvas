"use client";

/* Temporary check: writes a document seeded in Japanese and carrying no
 * recorded language, which is the shape an older saved canvas has. */
import { useEffect, useState } from "react";
import { KIND_SPEC, TITLE_BAR_H, WINDOW_H, WINDOW_MARGIN, Group, makeItem } from "@/lib/tokens";
import { setGlobalLang } from "@/lib/i18n";

export default function Page() {
  const [done, setDone] = useState("");
  useEffect(() => {
    setGlobalLang("ja");
    const mk = (k: Parameters<typeof makeItem>[0]) => makeItem(k);
    const contentX = KIND_SPEC.sidebar.w + WINDOW_MARGIN;
    const side = mk("sidebar");
    const groups: Group[] = [
      { id: "g1", x: 0, y: 0, axis: "x", items: [mk("titleBar")] },
      { id: "g2", x: 0, y: TITLE_BAR_H, axis: "x", items: [{ ...side, label: "测试", tabs: [...(side.tabs ?? []), { icon: "inbox", label: "我加的一行" }] }] },
      { id: "g3", x: contentX, y: 100, axis: "x", items: [mk("dataTable")] },
      { id: "g4", x: 0, y: WINDOW_H - 28, axis: "x", items: [mk("statusBar")] },
    ];
    /* no `lang` field: that is what an older document looks like */
    localStorage.setItem(
      "gpui-kit-canvas:doc",
      JSON.stringify({ groups, frames: [{ id: "f1", name: "メイン", x: 0, y: 0, shell: "sidebar" }], paletteKey: "default:light", frame: "window", title: "", brief: "" }),
    );
    localStorage.removeItem("gpui-kit-canvas:ui");
    setDone("seeded");
  }, []);
  return <pre style={{ padding: 24 }}>{done || "…"}</pre>;
}
