import { ArrowDown, ShieldAlert } from "lucide-react";

// 6.3 用：顔写真を掲載する前の確認フローの説明イメージ
export function PhotoConsentGraphic() {
  return (
    <div className="my-5 rounded-xl border-2 border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#333] shadow-sm">
          参加者の顔が写っています
        </p>
        <ArrowDown className="size-5 text-[#85A928]" />
        <p className="rounded-full bg-[#EEF5DF] px-4 py-2 text-sm font-bold text-[#3B5220]">
          本人の了承を得ていますか？
        </p>
        <p className="text-xs text-[#85A928]">※説明用のイメージです</p>
      </div>
    </div>
  );
}

const PERSONAL_INFO_ITEMS = [
  "学生証",
  "電話番号",
  "メールアドレス",
  "車両ナンバー",
];

// 6.4 用：個人情報が含まれる画像の注意例の説明イメージ（実データではない）
export function PersonalInfoCheckGraphic() {
  return (
    <div className="my-5 rounded-xl border-2 border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <ShieldAlert className="size-8 text-[#D97706]" />
        <ul className="flex flex-wrap justify-center gap-2">
          {PERSONAL_INFO_ITEMS.map((item) => (
            <li
              key={item}
              className="rounded-lg border-2 border-rose-400 bg-white px-3 py-1.5 text-sm font-bold text-rose-600"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm font-bold text-[#3B5220]">
          公開前に確認しましょう
        </p>
        <p className="text-xs text-[#85A928]">
          ※説明用のイメージです（実データではありません）
        </p>
      </div>
    </div>
  );
}
