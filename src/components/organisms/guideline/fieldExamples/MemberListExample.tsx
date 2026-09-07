import { Send } from "lucide-react";

type MemberRow = {
  username: string;
  mailAddress: string;
  partySize: number;
  isAnonymous: boolean;
  appliedAt: string;
};

// 8.4 の見本用ダミーデータ（実データではない）
const MEMBERS: MemberRow[] = [
  {
    username: "佐藤 花子",
    mailAddress: "hanako@example.com",
    partySize: 2,
    isAnonymous: false,
    appliedAt: "8月1日 10:00",
  },
  {
    username: "匿名希望",
    mailAddress: "guest@example.com",
    partySize: 1,
    isAnonymous: true,
    appliedAt: "8月2日 15:30",
  },
];

// 実際の参加者一覧（EventMemberListModal）と同じ見た目の見本。
// モーダルは開いたまま埋め込むとページのスクロールをロックしてしまうため、
// 同じデザインの一覧をダミーデータで静的に再現する。
export function MemberListExample() {
  return (
    <div className="my-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-200 px-8 py-6">
        <div>
          <p className="text-2xl font-bold text-slate-900">参加者一覧</p>
          <p className="mt-2 text-slate-500">里山観察ワークショップ（見本）</p>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="min-w-[120px] rounded-2xl bg-lime-50 px-4 py-3">
              <p className="text-xs font-medium text-lime-700">参加組数</p>
              <p className="mt-1 text-3xl font-bold text-lime-700">
                2<span className="ml-1 text-lg">組</span>
              </p>
            </div>
            <div className="min-w-[120px] rounded-2xl bg-sky-50 px-4 py-3">
              <p className="text-xs font-medium text-sky-700">合計人数</p>
              <p className="mt-1 text-3xl font-bold text-sky-700">
                3<span className="ml-1 text-lg">名</span>
              </p>
            </div>
          </div>

          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-sky-500 px-6 text-sm font-semibold text-white">
            <Send className="h-4 w-4 text-white" />
            全体連絡
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full table-fixed">
            <thead className="bg-slate-100">
              <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-600">
                <th className="w-[35%] px-6 py-3">ユーザー名</th>
                <th className="w-[30%] px-6 py-3">メールアドレス</th>
                <th className="w-[15%] px-6 py-3 text-center">参加人数</th>
                <th className="w-[20%] px-6 py-3 text-right">申し込み日時</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((member) => (
                <tr
                  key={member.mailAddress}
                  className="border-b border-slate-200 last:border-0"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#97C459] text-sm font-bold text-[#1E2C10]">
                        {member.username.charAt(0)}
                      </span>
                      <p className="font-semibold text-slate-900">
                        {member.username}
                      </p>
                      {member.isAnonymous ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          匿名参加
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500">
                    {member.mailAddress}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xl font-bold text-lime-700">
                      {member.partySize}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">名</span>
                  </td>
                  <td className="px-6 py-5 text-right text-slate-500">
                    {member.appliedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
