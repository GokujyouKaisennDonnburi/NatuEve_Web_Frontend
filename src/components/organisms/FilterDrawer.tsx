"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useScrollLock } from "@/hooks/useScrollLock";
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
// aside は表示/非表示の display 切替ではなく常時描画とすることで、
// スライドイン/アウトの transition を有効に保つ。
export function FilterDrawer({
  isOpen,
  onClose,
  id,
  className,
  children,
}: Readonly<FilterDrawerProps>) {
  // globals.css の desktop バリアントと同じクエリで CSS/JS の挙動を揃える
  const isDesktop = useMediaQuery("(min-aspect-ratio: 4/3)");
  // オーバーレイ(ドロワー)として振る舞うのは狭い画面で開いている間のみ
  const isOverlay = isOpen && !isDesktop;
  // サイドバー(デスクトップ)または開いたドロワーとして操作可能な状態か
  const isInteractive = isOpen || isDesktop;

  useScrollLock(isOverlay);

  // デスクトップへリサイズした際はドロワーの役目を終えるため自動で閉じる。
  // これにより開いたままの fixed オーバーレイとサイドバー表示の競合を防ぐ
  useEffect(() => {
    if (isOpen && isDesktop) onClose();
  }, [isOpen, isDesktop, onClose]);

  // Escape キーでも閉じられるようにする
  useEffect(() => {
    if (!isOverlay) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOverlay, onClose]);

  return (
    <aside
      id={id}
      // 閉じている間は画面外に退避したドロワーへ操作が届かないよう inert 化する
      inert={!isInteractive}
      className={cn(
        "fixed inset-0 z-50",
        className,
        isInteractive ? "pointer-events-auto" : "pointer-events-none",
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
        className={cn(
          "absolute inset-y-0 left-0 w-[342px] max-w-[85vw] overflow-y-auto bg-white shadow-xl transition-transform duration-200 ease-out",
          isOverlay ? "translate-x-0" : "-translate-x-full",
          "desktop:static desktop:w-auto desktop:max-w-none desktop:translate-x-0 desktop:bg-transparent desktop:shadow-none desktop:overflow-visible",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
