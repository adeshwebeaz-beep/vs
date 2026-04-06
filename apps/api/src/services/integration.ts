export interface IntegrationAdapter<TConfig = unknown, TInputs = unknown, TOutput = unknown> {
  validate(config: TConfig): Promise<{ valid: boolean; errors?: string[] }>;
  trigger(config: TConfig): Promise<{ subscribed: boolean; externalId?: string }>;
  execute(config: TConfig, inputs: TInputs): Promise<TOutput>;
}

export class IntegrationRateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  canProceed(provider: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const current = this.buckets.get(provider);
    if (!current || current.resetAt <= now) {
      this.buckets.set(provider, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    if (current.count >= limitPerMinute) return false;
    current.count += 1;
    return true;
  }
}
