"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// 目次の1項目。id は対応するセクション要素の id 属性と一致させる。
export type PageTocSection = {
  id: string;
  label: string;
};

type PageTocProps = {
  sections: readonly PageTocSection[];
  className?: string;
};

// ページ内目次。クリックで該当セクションへジャンプし、
// スクロール位置に応じて現在地をハイライトする。
// イベント投稿フォームとイベント詳細画面で見た目・挙動を共有する。
export function PageToc({ sections, className }: Readonly<PageTocProps>) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sectionElements.length === 0) {
      return;
    }

    // 画面上部付近の帯（-96px 〜 上から30%の位置）に入っているセクションを
    // 現在地とみなす。複数該当した場合は目次の並び順で一番上のものを採用する。
    const visibleIds = new Set<string>();
    const lastSectionId = sections[sections.length - 1].id;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }

        const current = sections.find((section) => visibleIds.has(section.id));
        if (current) {
          setActiveId(current.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    sectionElements.forEach((element) => {
      observer.observe(element);
    });

    // 直前のセクションが背が高いと、最後のセクションが短い場合に上の帯へ
    // 一度も入らないままページ最下部に到達することがある。その場合は
    // 帯の判定によらず最後のセクションを強制的にアクティブとみなす。
    let ticking = false;
    const handleScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        const isAtBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        if (isAtBottom) {
          setActiveId(lastSectionId);
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <nav aria-label="目次" className={cn("sticky top-8", className)}>
      <p className="mb-3 px-3 text-sm font-semibold text-slate-800">目次</p>
      <ul className="space-y-1">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
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
