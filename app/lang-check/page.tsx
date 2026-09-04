"use client";

/* Temporary check: a document seeded in one language, re-read in another. */
import { KIND_SPEC, TITLE_BAR_H, WINDOW_H, WINDOW_MARGIN, Group, localizeGroups, makeItem } from "@/lib/tokens";
import { setGlobalLang } from "@/lib/i18n";

const build = (): Group[] => {
  const mk = (k: Parameters<typeof makeItem>[0]) => makeItem(k);
  const contentX = KIND_SPEC.sidebar.w + WINDOW_MARGIN;
  return [
    { id: "g1", x: 0, y: 0, axis: "x", items: [mk("titleBar")] },
    { id: "g2", x: 0, y: TITLE_BAR_H, axis: "x", items: [mk("sidebar")] },
    { id: "g3", x: contentX, y: 60, axis: "x", items: [mk("breadcrumb")] },
    { id: "g4", x: contentX, y: 100, axis: "x", items: [mk("dataTable")] },
    { id: "g5", x: 0, y: WINDOW_H - 28, axis: "x", items: [mk("statusBar")] },
    { id: "g6", x: 400, y: 300, axis: "x", items: [mk("dialog")] },
    { id: "g7", x: 400, y: 400, axis: "x", items: [mk("tree")] },
    /* both default to 标签 in Chinese, which the flat table cannot disambiguate */
    { id: "g8", x: 600, y: 500, axis: "x", items: [mk("tag")] },
    { id: "g9", x: 700, y: 500, axis: "x", items: [mk("label")] },
  ];
};

const show = (gs: Group[]) =>
  gs
    .flatMap((g) => g.items)
    .map((it) => {
      const bits = [it.kind, it.label];
      if (it.supporting) bits.push(it.supporting);
      if (it.confirm) bits.push(`confirm=${it.confirm}`);
      if (it.tabs) bits.push(`tabs=[${it.tabs.map((t) => t.label).join(" | ")}]`);
      if (it.columns) bits.push(`cols=[${it.columns.map((c) => c.label).join(" | ")}]`);
      return bits.join("  ·  ");
    })
    .join("\n");

export default function Page() {
  setGlobalLang("zh");
  const zh = build();
  setGlobalLang("ja");
  const ja = build();
  /* an author's own words, which must survive untouched */
  ja[1].items[0] = { ...ja[1].items[0], label: "测试", tabs: [...(ja[1].items[0].tabs ?? []), { icon: "inbox", label: "我加的一行" }] };
  return (
    <pre style={{ whiteSpace: "pre-wrap", padding: 24, fontSize: 12, lineHeight: 1.7 }}>
      {`=== seeded in ja ===\n${show(ja)}\n\n=== re-read in zh ===\n${show(localizeGroups(ja, "zh"))}\n\n=== re-read in en ===\n${show(localizeGroups(ja, "en"))}\n\n=== seeded in zh, re-read in en ===\n${show(localizeGroups(zh, "en"))}`}
    </pre>
  );
}
