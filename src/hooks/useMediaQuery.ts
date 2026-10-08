"use client";

import { useEffect, useState } from "react";

// matchMedia のマッチ状態を購読する共通フック。
// SSR / マウント前は window が参照できないため false を返す。
// 既存実装(EventReportImageCarousel)と同様に change イベントで追従する。
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    mediaQueryList.addEventListener("change", handleChange);
    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
