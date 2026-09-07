"use client";

import { LegalDocumentModal } from "@/components/molecules/LegalDocumentModal";
import { TERMS_OF_SERVICE } from "@/constants/termsOfService";

type TermsOfServiceModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// 利用規約モーダル
export function TermsOfServiceModal({
  isOpen,
  onOpenChange,
}: Readonly<TermsOfServiceModalProps>) {
  return (
    <LegalDocumentModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      content={TERMS_OF_SERVICE}
      titleId="terms-of-service-modal-title"
      closeLabel="利用規約モーダルを閉じる"
      bodyLabel="利用規約の本文"
    />
  );
}

export default TermsOfServiceModal;
