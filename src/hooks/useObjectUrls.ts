"use client";

import { useEffect, useState } from "react";

// URL がまだ無いときに返す空配列。描画のたびに新しい配列を作らないよう共通にする。
const NO_URLS: string[] = [];

// File の配列を表示用の object URL に変換し、不要になったら解放する。
// files は参照が変わるたびに作り直すため、呼び出し側で参照を安定させて渡す。
// URL は描画後に作るため、files が変わった直後の1回の描画ではまだ URL が無く、空配列を返す
// （前の files の URL はその描画の確定時に解放されるため、返さない）。
export function useObjectUrls(files: readonly File[]): string[] {
  // 作った URL と、その元になった files の組
  const [created, setCreated] = useState<{
    files: readonly File[];
    urls: string[];
  } | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setCreated({ files, urls });

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  // 今の files から作った URL のときだけ返す
  return created?.files === files ? created.urls : NO_URLS;
}
