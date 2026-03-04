declare namespace NodeJS {
  interface ProcessEnv {
    LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    LOG_FORMAT?: 'json' | 'pretty';
    NODE_ENV?: 'development' | 'production' | 'test';
    GCP_PROJECT_ID?: string;
  }
}
