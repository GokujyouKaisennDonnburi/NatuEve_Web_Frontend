import { permanentRedirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

// 恒久的な転送（308）にし、検索エンジンの評価をトップページ（ROUTES.HOME）にまとめる（#398）。
export default function HomePage() {
  permanentRedirect(ROUTES.HOME);
}
