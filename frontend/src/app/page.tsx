import { redirect } from "next/navigation";

export default function RootPage() {
  // Default language: en
  redirect("/en");
}
