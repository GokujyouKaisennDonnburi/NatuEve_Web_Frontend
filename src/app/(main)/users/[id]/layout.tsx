import { PAGE_TITLES } from "@/constants/pageTitles";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: PAGE_TITLES.USER_PROFILE,
    alternates: {
      canonical: `/users/${id}`,
    },
  };
}

export default function UserProfileLayout({ children }: Props) {
  return children;
}
