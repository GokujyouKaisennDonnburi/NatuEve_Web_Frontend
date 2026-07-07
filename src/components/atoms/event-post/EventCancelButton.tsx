"use client";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { deleteEvent } from "@/services/event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type EventCancelButtonProps = {
  eventId: string;
};

export function EventCancelButton({ eventId }: EventCancelButtonProps) {
  const router = useRouter();

  const handleCancel = async () => {
    if (!window.confirm("本当にこのイベント投稿をキャンセルしますか？")) {
      return;
    }

    try {
      await deleteEvent(eventId);
      toast.success("イベント投稿を削除しました。");
      router.push(ROUTES.EVENT_LIST);
    } catch (error) {
      console.error("イベント投稿の削除に失敗しました:", error);
      toast.error(
        "イベント投稿の削除に失敗しました。時間をおいて再度お試しください。",
      );
    }
  };

  return (
    <Button
      size="lg"
      className="w-full cursor-pointer rounded-full bg-red-600 px-6 py-6 text-base font-semibold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-red-500/30 focus-visible:ring-red-500/30"
      onClick={handleCancel}
    >
      投稿をキャンセルする
    </Button>
  );
}
