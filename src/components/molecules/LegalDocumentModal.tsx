"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useScrollLock } from "@/hooks/useScrollLock";
import type {
  LegalDocumentArticle,
  LegalDocumentContent,
  LegalDocumentItem,
  LegalDocumentSection,
} from "@/types/legalDocument";

type LegalDocumentModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  content: LegalDocumentContent;
  titleId: string;
  closeLabel: string;
  bodyLabel: string;
};

type KeyedText = { id: string; text: string };

type KeyedLegalDocumentItem = Omit<LegalDocumentItem, "children"> & {
  id: string;
  children?: KeyedText[];
};

type KeyedLegalDocumentArticle = Omit<
  LegalDocumentArticle,
  "items" | "paragraphs"
> & {
  id: string;
  paragraphs: KeyedText[];
  items: KeyedLegalDocumentItem[];
};

type KeyedLegalDocumentSection = Omit<LegalDocumentSection, "articles"> & {
  id: string;
  number: number;
  articles: KeyedLegalDocumentArticle[];
};

// 番号なしの箇条書きを描画する
const renderUnorderedList = (items: KeyedLegalDocumentItem[]) => (
  <ul className="list-disc space-y-2 pl-6">
    {items.map((item) => (
      <li
        key={item.id}
        className="text-base leading-8 text-slate-800 [overflow-wrap:anywhere]"
      >
        {item.text}
      </li>
    ))}
  </ul>
);

// 番号付きの項を描画する（ネストした箇条書きを含む）
const renderOrderedList = (items: KeyedLegalDocumentItem[]) => (
  <ol className="list-decimal space-y-2 pl-6">
    {items.map((item) => (
      <li
        key={item.id}
        className="text-base leading-8 text-slate-800 [overflow-wrap:anywhere]"
      >
        {item.text}

        {item.children ? (
          <ul className="list-disc space-y-2 pl-6 pt-2">
            {item.children.map((child) => (
              <li
                key={child.id}
                className="text-base leading-8 text-slate-800 [overflow-wrap:anywhere]"
              >
                {child.text}
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    ))}
  </ol>
);

// 利用規約・プライバシーポリシーで共通利用する長文モーダル
export function LegalDocumentModal({
  isOpen,
  onOpenChange,
  content,
  titleId,
  closeLabel,
  bodyLabel,
}: Readonly<LegalDocumentModalProps>) {
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useScrollLock(isOpen);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // lint の noArrayIndexKey 対策として、静的な文面データに描画用IDを付与する
  const keyedContent = useMemo(() => {
    const preamble = content.preamble.map((paragraph, index) => ({
      id: `preamble-${index}`,
      text: paragraph,
    }));

    const sections: KeyedLegalDocumentSection[] = content.sections.map(
      (section, sectionIndex) => ({
        ...section,
        id: `section-${sectionIndex}`,
        number: sectionIndex + 1,
        articles: section.articles.map((article, articleIndex) => ({
          ...article,
          id: `section-${sectionIndex}-article-${articleIndex}`,
          paragraphs: (article.paragraphs ?? []).map(
            (paragraph, paragraphIndex) => ({
              id: `section-${sectionIndex}-article-${articleIndex}-paragraph-${paragraphIndex}`,
              text: paragraph,
            }),
          ),
          items: (article.items ?? []).map((item, itemIndex) => ({
            ...item,
            id: `section-${sectionIndex}-article-${articleIndex}-item-${itemIndex}`,
            children: item.children?.map((child, childIndex) => ({
              id: `section-${sectionIndex}-article-${articleIndex}-item-${itemIndex}-child-${childIndex}`,
              text: child,
            })),
          })),
        })),
      }),
    );

    return { preamble, sections };
  }, [content]);

  useEffect(() => {
    if (!isOpen) return;

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousFocus?.blur();
    closeButtonRef.current?.focus();

    const getFocusableElements = () => {
      if (!dialogRef.current) return [];

      return Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const isInsideDialog =
        activeElement instanceof HTMLElement &&
        dialogRef.current?.contains(activeElement) === true;

      if (!isInsideDialog) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={handleClose}
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Card className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-xl">
          <div className="relative shrink-0 py-4 pr-20 pl-5 sm:px-20">
            <h2
              id={titleId}
              className="text-center text-xl font-bold tracking-tight break-keep text-slate-950 max-[360px]:text-lg sm:text-3xl"
            >
              {content.title}
            </h2>

            <Button
              ref={closeButtonRef}
              type="button"
              variant="outline"
              size="icon"
              aria-label={closeLabel}
              onClick={handleClose}
              className="absolute top-3 right-4 size-11 rounded-full border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 sm:right-6"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <section
            ref={scrollRef}
            aria-label={bodyLabel}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: 長文を矢印キー等でスクロールできるようにするため
            tabIndex={0}
            className="min-h-0 space-y-10 overflow-x-hidden overflow-y-auto px-5 pb-12 focus-visible:outline-none sm:px-10"
          >
            {keyedContent.preamble.map((paragraph) => (
              <p
                key={paragraph.id}
                className="text-base leading-8 text-slate-800 [overflow-wrap:anywhere]"
              >
                {paragraph.text}
              </p>
            ))}

            {keyedContent.sections.map((section) => (
              <section key={section.id} className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-950">
                  {section.showHeadingNumber === false
                    ? section.heading
                    : `${section.number}. ${section.heading}`}
                </h3>

                {section.articles.map((article) => (
                  <div key={article.id} className="space-y-4">
                    {article.title ? (
                      <h4 className="text-lg font-bold text-slate-900">
                        {article.title}
                      </h4>
                    ) : null}

                    {article.lead ? (
                      <p className="text-base leading-8 text-slate-800 [overflow-wrap:anywhere]">
                        {article.lead}
                      </p>
                    ) : null}

                    {article.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.id}
                        className="text-base leading-8 text-slate-800 [overflow-wrap:anywhere]"
                      >
                        {paragraph.text}
                      </p>
                    ))}

                    {article.items.length > 0 &&
                      (article.layout === "unordered"
                        ? renderUnorderedList(article.items)
                        : renderOrderedList(article.items))}
                  </div>
                ))}
              </section>
            ))}
          </section>
        </Card>
      </div>
    </div>
  );
}
