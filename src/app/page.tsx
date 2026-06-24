import { ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect(ROUTES.SIGNIN);
}
