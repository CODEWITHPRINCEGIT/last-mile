import type { Metadata } from "next";
import { AccountWorkspace } from "../../components/account/AccountWorkspace";

export const metadata: Metadata = {
  title: "Create Account | Last-Mile Study Engine",
  description: "Create or access your Last-Mile Study Engine account.",
};

export default function AccountPage() {
  return <AccountWorkspace />;
}
