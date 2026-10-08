"use client";

import { DESKTOP_MEDIA_QUERY } from "@/constants/config";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/utils";
import { useEffect, useRef, type ReactNode } from "react";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  // FilterIconButton の aria-controls と関連付けるための ID
  id?: string;
  children: ReactNode;
};

// 狭い画面(縦長比率)では左からスライドインするオーバーレイとして、
// 広い画面(横長比率: globals.css の desktop バリアントと同じ値)では
// サイドバーとして表示する容器。
// 中身(children)は単一インスタンスのまま描画されるため、
// ドロワーとサイドバーでチェックボックスの id が重複しない。
// aside は表示/非表示の display 切替ではなく常時描画とすることで、
// スライドイン/アウトの transition を有効に保つ。
export function FilterDrawer({
  isOpen,
  onClose,
  id,
  children,
}: Readonly<FilterDrawerProps>) {
  // globals.css の desktop バリアントと同じクエリで CSS/JS の挙動を揃える
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  // オーバーレイ(ドロワー)として振る舞うのは狭い画面で開いている間のみ
  const isOverlay = isOpen && !isDesktop;
  // サイドバー(デスクトップ)または開いたドロワーとして操作可能な状態か
  const isInteractive = isOpen || isDesktop;

  const panelRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOverlay);

  // デスクトップへリサイズした際はドロワーの役目を終えるため自動で閉じる。
  // これにより開いたままの fixed オーバーレイとサイドバー表示の競合を防ぐ
  useEffect(() => {
    if (isOpen && isDesktop) onClose();
  }, [isOpen, isDesktop, onClose]);

  // オーバーレイ表示中はモーダルと同様のフォーカス管理を行う。
  // 開時にパネルへフォーカスし、Tab をパネル内でトラップ、閉時に開いた元の要素へ復帰する。
  // 既存のモーダル(LegalDocumentModal)と同じパターン。
  useEffect(() => {
    if (!isOverlay) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousFocus?.blur();

    const getFocusableElements = () => {
      if (!panelRef.current) return [];

      return Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    };

    // 初期フォーカスは先頭のコントロール(「すべてクリア」)ではなく、
    // アクセシブル名を持つパネル自身へ当てる。
    // 誤操作でドラフトを消すリスクを避けるため(LegalDocumentModal は閉じるボタンに当てる)。
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;
      const isInsideDialog =
        activeElement instanceof HTMLElement &&
        panelRef.current?.contains(activeElement) === true;

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
  }, [isOverlay, onClose]);

  return (
    <aside
      id={id}
      // 閉じている間は画面外に退避したドロワーへ操作が届かないよう inert 化する
      inert={!isInteractive}
      className={cn(
        "fixed inset-0 z-50",
        isInteractive ? "pointer-events-auto" : "pointer-events-none",
        // デスクトップ時の粘着位置は、ヘッダー直下に粘着する
        // 固定コントロール帯(EventListControls)の下端+16pxとする。
        // 帯は背景を持たず検索バー等のコントロールが直接見える設計のため、
        // これより上に粘着するとサイドバーがコントロールと重なって視認性が悪化する
        "desktop:sticky desktop:top-[calc(var(--event-list-controls-bottom)_+_16px)] desktop:z-auto desktop:block desktop:w-(--filter-sidebar-width)",
      )}
    >
      {/* バックドロップ: 押下で閉じる */}
      {isOverlay && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/50"
        />
      )}

      {/* パネル: 左からスライドイン。デスクトップではサイドバーの中身としてその場に表示 */}
      <div
        ref={panelRef}
        tabIndex={-1}
        // オーバーレイ表示時はモーダル相当のため dialog として読み上げさせる。
        // role を静的に書くと Biome の a11y チェックが未指定時の aria-modal を検出するため動的に付与する
        {...(isOverlay
          ? { role: "dialog", "aria-modal": "true", "aria-label": "絞り込み" }
          : {})}
        className={cn(
          "absolute inset-y-0 left-0 w-(--filter-sidebar-width) max-w-[85vw] overflow-y-auto bg-white shadow-xl outline-none transition-transform duration-200 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isOverlay ? "translate-x-0" : "-translate-x-full",
          // max-h はカード側(FilterSidebar)が持ち、パネルはクリップしない。
          // これによりスクロール所有者をカードに一本化し、カードの影・角丸を維持する
          "desktop:static desktop:w-auto desktop:max-w-none desktop:translate-x-0 desktop:overflow-y-visible desktop:bg-transparent desktop:shadow-none",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
