import PageHeader from "@/components/PageHeader";
import SettingsForm from "@/components/SettingsForm";
import { getSettings } from "@/lib/settings";

// Always read fresh data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader title="Settings" subtitle="Store details shown on receipts." />
      <SettingsForm initial={settings} />
    </>
  );
}