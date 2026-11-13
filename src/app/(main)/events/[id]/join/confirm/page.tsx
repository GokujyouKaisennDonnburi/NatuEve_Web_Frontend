import { EventJoinConfirmContent } from "@/components/organisms/EventJoinConfirmContent";

type EventJoinConfirmPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

// 確認メールのリンク（{WEB_BASE_URL}/events/{id}/join/confirm?token=...）の受け口。
// ゲスト申込の確定は単回使用トークンを守るため、このページを開いただけでは確定せず、
// クライアント側の確定ボタンで API を呼ぶ。
export default async function EventJoinConfirmPage({
  params,
  searchParams,
}: Readonly<EventJoinConfirmPageProps>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.token === "string" ? query.token.trim() : "";

  return <EventJoinConfirmContent eventId={id} token={token} />;
}
