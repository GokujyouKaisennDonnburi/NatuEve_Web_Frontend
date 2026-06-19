import { Badge } from "@/components/atoms/Badge";
import { Loading } from "@/components/atoms/Loading";
import { Header } from "@/components/organisms/Header";
import { UserList } from "@/components/organisms/UserList";
import { MainTemplate } from "@/components/templates/MainTemplate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_DESCRIPTION, APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <MainTemplate>
      <Header />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Card className="border-slate-200/80 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur">
          <CardHeader className="space-y-4">
            <Badge tone="accent">Next.js 15 / Tailwind CSS 4 / Biome 2</Badge>
            <CardTitle className="max-w-2xl text-3xl leading-tight text-slate-950 sm:text-5xl">
              {APP_NAME}{" "}
              の基本構成を、迷いにくい形でまとめた初期セットアップです。
            </CardTitle>
            <CardDescription className="max-w-2xl text-base text-slate-600 sm:text-lg">
              {APP_DESCRIPTION} Atomic
              Design、services、types、hooks、utils、constants、mocks を分けて、
              初心者チームでも役割が見えやすい構成にしています。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={ROUTES.DOCS}>
                ドキュメントを見る
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="secondary" asChild>
              <Link href={ROUTES.USERS}>モックデータを確認</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-teal-200/80 bg-teal-950 text-white shadow-lg shadow-teal-950/20">
          <CardHeader>
            <CardTitle className="text-xl">導入済み</CardTitle>
            <CardDescription className="text-teal-100">
              開発時にそのまま使える基盤を含めています。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-teal-50">
            <p>・Bun 前提の依存関係とスクリプト</p>
            <p>・Biome によるフォーマットと静的チェック</p>
            <p>・MSW 2 の browser / server 構成</p>
            <p>・shadcn/ui 用の components.json と ui コンポーネント</p>
            <p>・`@` を `src` に向けたパスエイリアス</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <UserList />

        <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>サンプル UI</CardTitle>
            <CardDescription>
              Atom と molecule の組み合わせ例です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge>Badge atom</Badge>
            <Loading label="Loading atom" />
            <p className="text-sm leading-6 text-slate-600">
              実装の起点として、ここから画面単位の organism や template
              を追加していけます。
            </p>
          </CardContent>
        </Card>
      </section>
    </MainTemplate>
  );
}
