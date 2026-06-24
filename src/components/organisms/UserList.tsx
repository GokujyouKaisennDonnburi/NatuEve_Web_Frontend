"use client";

import { Loading } from "@/components/atoms/Loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";

export function UserList() {
  const { users, error, isLoading, refetch } = useUser();

  return (
    <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>MSW サンプル API</CardTitle>
          <CardDescription>
            `GET /api/users` をモックして、API
            未完成でも画面開発できるようにしています。
          </CardDescription>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={() => {
            void refetch();
          }}
        >
          再取得
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading label="ユーザーを取得中" />
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">ユーザーがまだありません。</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-950">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
