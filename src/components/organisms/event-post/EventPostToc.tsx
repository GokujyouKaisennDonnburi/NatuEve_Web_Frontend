"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import {
  EVENT_POST_TOC_SECTIONS,
  type EventPostTocSectionId,
} from "./eventPostTocSections";

// イベント投稿フォームの目次。クリックで該当セクションへジャンプし、
// スクロール位置に応じて現在地をハイライトする。
export function EventPostToc() {
  const [activeId, setActiveId] = useState<EventPostTocSectionId>(
    EVENT_POST_TOC_SECTIONS[0].id,
  );

  useEffect(() => {
    const sectionElements = EVENT_POST_TOC_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((element): element is HTMLElement => element !== null);

    if (sectionElements.length === 0) {
      return;
    }

    // 画面上部付近の帯（-96px 〜 上から30%の位置）に入っているセクションを
    // 現在地とみなす。複数該当した場合は目次の並び順で一番上のものを採用する。
    const visibleIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }

        const current = EVENT_POST_TOC_SECTIONS.find((section) =>
          visibleIds.has(section.id),
        );
        if (current) {
          setActiveId(current.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    sectionElements.forEach((element) => {
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="目次" className="sticky top-8">
      <p className="mb-3 px-3 text-sm font-semibold text-slate-800">目次</p>
      <ul className="space-y-1">
        {EVENT_POST_TOC_SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-slate-800 transition-colors",
                  isActive ? "bg-[#d8eab8] font-bold" : "hover:bg-slate-100",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    isActive ? "bg-[var(--brand-green)]" : "bg-slate-300",
                  )}
                />
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
