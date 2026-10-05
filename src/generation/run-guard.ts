export class GenerationRunGuard {
  private active = false;

  async run(task: () => Promise<void>): Promise<boolean> {
    if (this.active) return false;
    this.active = true;
    try {
      await task();
      return true;
    } finally {
      this.active = false;
    }
  }
}
