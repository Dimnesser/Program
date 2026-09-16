/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  /** Optional live exchange-rate endpoint returning `{ base, date, rates }`. */
  readonly VITE_RATES_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
