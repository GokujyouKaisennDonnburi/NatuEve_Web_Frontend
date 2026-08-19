import Link from "next/link";

import { ROUTES } from "@/constants/routes";

// 未登録者向けのサインイン誘導バナー
type SignInPromoteBannerProps = {
  // サインイン画面へのリンク先。省略時は ROUTES.SIGNIN
  href?: string;
};

// 未登録者向けのサインイン誘導バナー
export function SignInPromoteBanner({
  href = ROUTES.SIGNIN,
}: Readonly<SignInPromoteBannerProps>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-sky-100 bg-sky-50 px-5 py-4">
      <p className="text-sm leading-6 text-sky-900">
        アカウントをお持ちの方はサインインするとワンタップで申し込めます。
      </p>
      <Link
        href={href}
        className="shrink-0 text-sm font-bold text-sky-700 hover:underline"
      >
        サインイン
      </Link>
    </div>
  );
}
