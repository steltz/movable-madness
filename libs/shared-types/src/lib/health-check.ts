export interface ServiceStatus {
  name: string;
  status: 'up' | 'down';
  latency?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services?: ServiceStatus[];
}
