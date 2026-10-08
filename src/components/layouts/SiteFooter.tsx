import Link from "next/link";
import type { ReactNode } from "react";

import { ROUTES } from "@/constants/routes";

const FOOTER_LINK_CLASS_NAME =
  "-mx-2 inline-flex rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-[#F2F7E8] hover:text-[#315E26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-[#FAFCF7]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 2xl:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-6 lg:gap-8">
          {/* サイト名 */}
          <div className="col-span-2 flex flex-col gap-2">
            <Link
              href={ROUTES.HOME}
              className="-m-1 inline-flex items-center gap-2 rounded-md p-1 transition-colors duration-200 hover:bg-[#F2F7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-end gap-2">
                <span className="text-lg font-bold text-emerald-700">
                  なちゅいべ
                </span>
                <span className="text-[11px] text-slate-500">
                  by NatuPortal
                </span>
              </div>
            </Link>
            {/* キャッチコピー */}
            <p className="text-[13px] leading-relaxed text-slate-600">
              散らばっていた自然観察イベントを一箇所に。
              <br />
              生態系を守り、未来へ繋ぐ活動を応援します。
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon label="X">
                <XIcon />
              </SocialIcon>
              <SocialIcon label="YouTube">
                <YouTubeIcon />
              </SocialIcon>
              <SocialIcon label="Instagram">
                <InstagramIcon />
              </SocialIcon>
            </div>
          </div>

          {/* さがす */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900">さがす</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={ROUTES.EVENT_LIST}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  イベントを探す
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COMING_SOON}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  カテゴリ一覧
                </Link>
              </li>
            </ul>
          </div>

          {/* 主催者の方へ */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900">主催者の方へ</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={ROUTES.EVENT_POST}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  イベントを投稿する
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.GUIDELINE}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  ガイドライン
                </Link>
              </li>
            </ul>
          </div>

          {/* 質問 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900">質問</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={ROUTES.COMING_SOON}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  よくある質問
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COMING_SOON}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>

          {/* 運営 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900">運営</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={ROUTES.COMING_SOON}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  なちゅぽーたるへ
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COMING_SOON}
                  className={FOOTER_LINK_CLASS_NAME}
                >
                  運営団体について
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span
      aria-disabled="true"
      aria-label={label}
      role="img"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 cursor-default"
    >
      {children}
    </span>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
