"use client";

import { useEffect, useState } from "react";

// File の配列を表示用の object URL に変換し、不要になったら解放する。
// files は参照が変わるたびに作り直すため、呼び出し側で参照を安定させて渡す。
// URL は描画後に作るため、files が変わった直後の1回の描画では前回の URL（初回は空配列）が返り、
// その URL はその描画の確定時に解放される。
export function useObjectUrls(files: readonly File[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextUrls = files.map((file) => URL.createObjectURL(file));
    setUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  return urls;
}
