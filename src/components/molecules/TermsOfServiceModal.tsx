"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TERMS_OF_SERVICE } from "@/constants/termsOfService";
import { useScrollLock } from "@/hooks/useScrollLock";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

// 利用規約モーダルのプロパティ
type TermsOfServiceModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

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

  useEffect(() => {
    if (!isOpen) return;

    // 開くたびに本文を先頭までスクロールして戻す
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
            {TERMS_OF_SERVICE.preamble.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8 text-slate-800">
                {paragraph}
              </p>
            ))}

            {TERMS_OF_SERVICE.sections.map((section) => (
              <section key={section.heading} className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-950">
                  {section.heading}
                </h3>

                {section.articles.map((article) => (
                  <div key={article.title} className="space-y-4">
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

                    {article.numbered === false ? (
                      <ul className="list-disc space-y-2 pl-5">
                        {article.items.map((item) => (
                          <li
                            key={item.text}
                            className="text-sm leading-7 text-slate-800"
                          >
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ol className="list-decimal space-y-2 pl-5">
                        {article.items.map((item) => (
                          <li
                            key={item.text}
                            className="text-sm leading-7 text-slate-800"
                          >
                            {item.text}

                            {item.children ? (
                              <ul className="list-disc space-y-2 pl-5 pt-2">
                                {item.children.map((child) => (
                                  <li
                                    key={child}
                                    className="text-sm leading-7 text-slate-800"
                                  >
                                    {child}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
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
