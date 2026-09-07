"use client";

import { LegalDocumentModal } from "@/components/molecules/LegalDocumentModal";
import { PRIVACY_POLICY } from "@/constants/privacyPolicy";

type PrivacyPolicyModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// プライバシーポリシーモーダル
export function PrivacyPolicyModal({
  isOpen,
  onOpenChange,
}: Readonly<PrivacyPolicyModalProps>) {
  return (
    <LegalDocumentModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      content={PRIVACY_POLICY}
      titleId="privacy-policy-modal-title"
      closeLabel="プライバシーポリシーモーダルを閉じる"
      bodyLabel="プライバシーポリシーの本文"
    />
  );
}

export default PrivacyPolicyModal;
