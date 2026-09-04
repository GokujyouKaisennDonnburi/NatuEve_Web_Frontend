"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TERMS_OF_SERVICE } from "@/constants/termsOfService";
import type { TermsItem } from "@/constants/termsOfService";
import { useScrollLock } from "@/hooks/useScrollLock";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

// 利用規約モーダルのプロパティ
type TermsOfServiceModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// 描画用に一意なIDを付与した項（keyの安定化のため。文面データ自体は変更しない）
type KeyedTermsChild = { id: string; text: string };

type KeyedTermsItem = Omit<TermsItem, "children"> & {
  id: string;
  children?: KeyedTermsChild[];
};

type KeyedTermsArticle = Omit<
  (typeof TERMS_OF_SERVICE)["sections"][number]["articles"][number],
  "items"
> & { id: string; items: KeyedTermsItem[] };

type KeyedTermsSection = Omit<
  (typeof TERMS_OF_SERVICE)["sections"][number],
  "articles"
> & { id: string; number: number; articles: KeyedTermsArticle[] };

// lint の noArrayIndexKey 対策として、静的な文面データに描画用の一意なIDと章番号を付与する
// 静的データのためIDの生成にindexを用いても問題ない
const keyedPreamble = TERMS_OF_SERVICE.preamble.map((paragraph, index) => ({
  id: `preamble-${index}`,
  text: paragraph,
}));

const keyedSections: KeyedTermsSection[] = TERMS_OF_SERVICE.sections.map(
  (section, sectionIndex) => ({
    ...section,
    id: `section-${sectionIndex}`,
    number: sectionIndex + 1,
    articles: section.articles.map((article, articleIndex) => ({
      ...article,
      id: `section-${sectionIndex}-article-${articleIndex}`,
      items: article.items.map((item, itemIndex) => ({
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

// 番号なしの箇条書きを描画する
const renderUnorderedList = (items: KeyedTermsItem[]) => (
  <ul className="list-disc space-y-2 pl-5">
    {items.map((item) => (
      <li key={item.id} className="text-sm leading-7 text-slate-800">
        {item.text}
      </li>
    ))}
  </ul>
);

// 番号付きの項を描画する（ネストした箇条書きを含む）
const renderOrderedList = (items: KeyedTermsItem[]) => (
  <ol className="list-decimal space-y-2 pl-5">
    {items.map((item) => (
      <li key={item.id} className="text-sm leading-7 text-slate-800">
        {item.text}

        {item.children ? (
          <ul className="list-disc space-y-2 pl-5 pt-2">
            {item.children.map((child) => (
              <li key={child.id} className="text-sm leading-7 text-slate-800">
                {child.text}
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    ))}
  </ol>
);

// 利用規約モーダル（プライバシーポリシーモーダルと同一レイアウト）
export function TermsOfServiceModal({
  isOpen,
  onOpenChange,
}: Readonly<TermsOfServiceModalProps>) {
  // モーダルを閉じる
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // モーダル表示中は背景スクロールをロックし、Escapeで閉じる
  useScrollLock(isOpen);

  // 本文のスクロール領域
  const scrollRef = useRef<HTMLDivElement>(null);

  // フォーカス管理用の参照
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 開くたびに本文を先頭までスクロールして戻す
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    // 開いた時のフォーカスを記憶し、閉じるボタンへ移動する
    // （スクリーンリーダーにダイアログ内容を通知させるため）
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

      // Tab移動がダイアログ外へ抜けないようにフォーカスをループさせる
      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      // 閉じた時にトリガーへフォーカスを戻す
      previousFocus?.focus();
    };
  }, [isOpen, handleClose]);

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center px-4 py-6">
      {/* 背景クリックで閉じる */}
      <button
        type="button"
        aria-label="利用規約モーダルを閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={handleClose}
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-of-service-modal-title"
      >
        <Card className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-xl">
          {/* ヘッダー（タイトルは中央、閉じるボタンは右上） */}
          <div className="relative shrink-0 px-12 py-4">
            <h2
              id="terms-of-service-modal-title"
              className="text-center text-3xl font-bold text-slate-950"
            >
              {TERMS_OF_SERVICE.title}
            </h2>

            <Button
              ref={closeButtonRef}
              type="button"
              variant="outline"
              size="icon"
              aria-label="利用規約モーダルを閉じる"
              onClick={handleClose}
              className="absolute top-3 right-6 size-11 rounded-full border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* 本文（ウィンドウ内スクロール） */}
          <div
            ref={scrollRef}
            className="min-h-0 space-y-10 overflow-y-auto px-10 pb-12"
          >
            {keyedPreamble.map((paragraph) => (
              <p
                key={paragraph.id}
                className="text-base leading-8 text-slate-800"
              >
                {paragraph.text}
              </p>
            ))}

            {keyedSections.map((section) => (
              <section key={section.id} className="space-y-6">
                {/* 章番号はデータ側で採番せず、描画時に生成する */}
                <h3 className="text-2xl font-bold text-slate-950">
                  {section.numbered === false
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
                      <p className="text-sm leading-7 text-slate-800">
                        {article.lead}
                      </p>
                    ) : null}

                    {/* 項がある場合のみリストを描画する（leadのみの条で空リストが残らないようにする） */}
                    {article.items.length > 0
                      ? article.numbered === false
                        ? renderUnorderedList(article.items)
                        : renderOrderedList(article.items)
                      : null}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default TermsOfServiceModal;
