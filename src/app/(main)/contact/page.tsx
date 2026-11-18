import { PageHeader } from "@/components/molecules/PageHeader";
import { ContactForm } from "@/components/organisms/contact/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { BACK_LINK_LABELS } from "@/constants/labels";
import { ROUTES } from "@/constants/routes";

// お問い合わせページ。送信機能は別 Issue のため、フォームはモックアップ。
export default function ContactPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-4 sm:py-6">
      <PageHeader
        title="お問い合わせ"
        backHref={ROUTES.EVENT_LIST}
        backLabel={BACK_LINK_LABELS.EVENT_LIST}
      />

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-sm leading-relaxed text-slate-700">
            なちゅいべに関するご意見・不具合の報告・通報などを受け付けています。内容を選択のうえ、ご連絡ください。
          </p>

          <ContactForm />
        </CardContent>
      </Card>
    </section>
  );
}
