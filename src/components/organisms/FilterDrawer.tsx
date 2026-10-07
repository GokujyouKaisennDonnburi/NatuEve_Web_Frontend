"use client";

import { useScrollLock } from "@/hooks/useScrollLock";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  // FilterIconButton の aria-controls と関連付けるための ID
  id?: string;
  // 呼び出し側のレイアウト(グリッド配置・デスクトップ時のサイドバー化)は className で受け取る
  className?: string;
  children: ReactNode;
};

// 狭い画面(< xl)では左からスライドインするオーバーレイとして、
// 広い画面(xl 以上)では className で渡されたサイドバーとして表示する容器。
// 中身(children)は単一インスタンスのまま描画されるため、
// ドロワーとサイドバーでチェックボックスの id が重複しない。
export function FilterDrawer({
  isOpen,
  onClose,
  id,
  className,
  children,
}: Readonly<FilterDrawerProps>) {
  // デスクトップではドロワーではなくサイドバーとして表示されるためスクロールロックは不要
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  useScrollLock(isOpen && !isDesktop);

  // Escape キーでも閉じられるようにする
  useEffect(() => {
    if (!isOpen || isDesktop) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDesktop, onClose]);

  return (
    <aside
      id={id}
      className={cn(
        isOpen ? "fixed inset-0 z-50" : "hidden",
        className,
      )}
    >
      {/* バックドロップ: 押下で閉じる */}
      {isOpen && (
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
        className={cn(
          "absolute inset-y-0 left-0 w-[342px] max-w-[85vw] overflow-y-auto bg-white shadow-xl transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "xl:static xl:w-auto xl:max-w-none xl:translate-x-0 xl:bg-transparent xl:shadow-none xl:overflow-visible",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
