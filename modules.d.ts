declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string | undefined;
    DB_USER: string | undefined;
    DB_PASS: string | undefined;
    HOST: string | undefined;
    PORT: string | undefined;
    DB_PORT: string | undefined;
    TOKEN_SECRET: string | undefined;
  }
}
