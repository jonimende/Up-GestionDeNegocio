// src/vite-env.d.ts

interface ImportMetaEnv {
  readonly VITE_CURRENCY_API_KEY: string;
  // Agrega aquí otras variables de entorno que uses, con readonly
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
