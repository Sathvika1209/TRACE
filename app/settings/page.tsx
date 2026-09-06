import { getCurrentUser } from "@/app/actions/auth";
import { MarketDataService } from "@/server/market/service";
import { AppShell } from "@/components/trace/AppShell";
import { SettingsContainer } from "@/components/trace/SettingsContainer";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const marketDataService = new MarketDataService();
  const providerName = marketDataService.getProviderName();

  const userObj = user
    ? {
        id: user.id,
        email: user.email,
      }
    : null;

  return (
    <AppShell>
      <SettingsContainer user={userObj} providerName={providerName} />
    </AppShell>
  );
}
