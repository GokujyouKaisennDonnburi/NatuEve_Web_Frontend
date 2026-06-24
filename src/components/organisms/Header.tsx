import { Badge } from "@/components/atoms/Badge";
import { SearchBox } from "@/components/molecules/SearchBox";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

export function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-950 text-sm font-semibold text-white">
            NI
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Starter kit</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">
              {APP_NAME}
            </h1>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          App Router を基本に、services / hooks / types / utils
          を分離したシンプルな構成です。
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox placeholder="画面やユーザーを検索" />
        <div className="flex items-center gap-2">
          <Badge tone="subtle">MSW ready</Badge>
          <Button variant="secondary" asChild>
            <a href={ROUTES.HOME}>Home</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
