import type { Metadata } from "next";
import { LaunchWorkspace } from "../../components/launch/LaunchWorkspace";

export const metadata: Metadata = {
  title: "Launch App | Last-Mile Study Engine",
  description: "Start a focused study session with the Last-Mile Study Engine.",
};

export default function LaunchPage() {
  return <LaunchWorkspace />;
}
