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

// 狭い画面(縦長比率)では左からスライドインするオーバーレイとして、
// 広い画面(横長比率: globals.css の desktop バリアントと同じ 4:3 以上)では
// className で渡されたサイドバーとして表示する容器。
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
  // globals.css の desktop バリアントと同じクエリで CSS/JS の挙動を揃える
  const isDesktop = useMediaQuery("(min-aspect-ratio: 4/3)");
  useScrollLock(isOpen && !isDesktop);

  // デスクトップへリサイズした際はドロワーの役目を終えるため自動で閉じる。
  // これにより開いたままの fixed オーバーレイとサイドバー表示の競合を防ぐ
  useEffect(() => {
    if (isOpen && isDesktop) onClose();
  }, [isOpen, isDesktop, onClose]);

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
          "desktop:static desktop:w-auto desktop:max-w-none desktop:translate-x-0 desktop:bg-transparent desktop:shadow-none desktop:overflow-visible",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
