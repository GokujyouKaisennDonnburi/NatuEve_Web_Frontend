import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function DocsPage() {
  return (
    <section className="mx-auto w-full max-w-2xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/40 backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
        Preview
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        ドキュメントページ
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        今後実装予定のページです。
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href={ROUTES.HOME}>HOMEへ戻る</Link>
        </Button>
      </div>
    </section>
  );
}
