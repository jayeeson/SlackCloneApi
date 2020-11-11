declare namespace NodeJS {
  export interface ProcessEnv {
    DB_USER: string | undefined;
    DB_PASS: string | undefined;
    HOST: string | undefined;
    PORT: string | undefined;
    DB_PORT: string | undefined;
  }
}