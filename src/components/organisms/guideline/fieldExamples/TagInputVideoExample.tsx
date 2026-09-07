// 3.2 のタグ入力・追加欄の操作説明動画。
// preload="metadata" により、ページ表示時に動画全体を読み込まない。
export function TagInputVideoExample() {
  return (
    <div className="my-5">
      {/* biome-ignore lint/a11y/useMediaCaption: 操作画面を録画した無音動画のため字幕は付与しない */}
      <video
        src="/videos/guideline_tag_input.mp4"
        controls
        playsInline
        preload="metadata"
        aria-label="タグ入力・追加欄の操作説明動画"
        className="w-full rounded-xl border border-[#DCE8C8]"
      />
    </div>
  );
}
