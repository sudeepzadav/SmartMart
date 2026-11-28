import { db } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings-types";
import type { StoreSettings } from "@/lib/settings-types";

// Server only. Returns the saved store details, or the defaults if none are saved yet.
export async function getSettings(): Promise<StoreSettings> {
  const s = await db.storeSetting.findUnique({ where: { key: "store" } });
  if (!s) return DEFAULT_SETTINGS;
  return {
    name: s.name,
    address: s.address ?? "",
    phone: s.phone ?? "",
    panVat: s.panVat ?? "",
    vatRate: s.vatRate,
  };
}