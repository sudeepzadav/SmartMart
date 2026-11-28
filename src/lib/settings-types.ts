// Safe to import from both server and browser code (no database code in here).
export type StoreSettings = {
  name: string;
  address: string;
  phone: string;
  panVat: string;
  vatRate: number; // percent, for example 13
};

// Used until the shop saves its own details.
export const DEFAULT_SETTINGS: StoreSettings = {
  name: "Smart Mart",
  address: "",
  phone: "",
  panVat: "",
  vatRate: 13,
};