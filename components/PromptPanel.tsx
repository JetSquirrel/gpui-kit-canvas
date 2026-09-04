"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPrompt } from "@/lib/prompt";
import { Doc, Palette } from "@/lib/tokens";
import { Icon } from "./KitNode";
import { Field, IconBtn, Segmented } from "./ui";
import { t, useLang } from "@/lib/i18n";

export function PromptPanel({
  doc,
  widths,
  palette: p,
  onDoc,
}: {
  doc: Doc;
  widths: Record<string, number>;
  palette: Palette;
  onDoc: (patch: Partial<Doc>) => void;
}) {
  const lang = useLang();
  const generated = useMemo(() => buildPrompt(doc, widths, undefined, lang), [doc, widths, lang]);
  const edited = doc.promptEdit !== undefined;
  const text = edited ? doc.promptEdit! : generated;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {}
  };

  const projectButton = (icon: string, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="kit-press"
      style={{
        flex: 1,
        height: 42,
        borderRadius: 21,
        border: "none",
        background: p.secondary,
        color: p.secondaryForeground,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
      }}
    >
      <Icon name={icon} size={19} />
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 12, gap: 10 }}>
      <Field
        value={doc.title}
        onChange={(title) => onDoc({ title })}
        placeholder={t("appName", lang)}
        p={p}
        icon="window-restore"
      />
      <Field
        value={doc.brief}
        onChange={(brief) => onDoc({ brief })}
        placeholder={t("brief", lang)}
        p={p}
        icon="info"
        multiline
        rows={3}
      />
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: p.mutedForeground }}>{t("promptTargetHint", lang)}</p>
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}>
        <textarea
          className="no-scrollbar kit-field"
          value={text}
          onChange={(e) => onDoc({ promptEdit: e.target.value })}
          spellCheck={false}
          aria-label={t("prompt", lang)}
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            borderRadius: 18,
            border: "none",
            background: p.muted,
            padding: edited ? "14px 14px 48px" : 14,
            fontSize: 13,
            lineHeight: 1.75,
            color: p.foreground,
            fontFamily: "inherit",
            resize: "none",
            boxSizing: "border-box",
          }}
        />
        {edited && (
          <div style={{ position: "absolute", right: 8, bottom: 8 }}>
            <IconBtn icon="undo" p={p} size={32} onClick={() => onDoc({ promptEdit: undefined })} title={t("promptReset", lang)} />
          </div>
        )}
      </div>
      <button
        onClick={copy}
        className="kit-press"
        style={{
          height: 48,
          borderRadius: 24,
          border: "none",
          background: copied ? p.muted : p.primary,
          color: copied ? p.mutedForeground : p.primaryForeground,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background 160ms, color 160ms",
        }}
      >
        <Icon name={copied ? "check" : "content_copy"} size={20} />
        {copied ? t("copied", lang) : t("copyPrompt", lang)}
      </button>
    </div>
  );
}
