import { DurableObject } from "cloudflare:workers";

// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    // Below are sample demo methods for demonstrating durable object usage
    // Please remove and replace them with your own durable object methods
    async getCounterValue() {
      let value = (await this.ctx.storage.get("value")) || 0;
      return value;
    }
  
    async increment(amount = 1) {
      let value: number = (await this.ctx.storage.get("value")) || 0;
      value += amount;
      // You do not have to worry about a concurrent request having modified the value in storage.
      // "input gates" will automatically protect against unwanted concurrency.
      // Read-modify-write is safe.
      await this.ctx.storage.put("value", value);
      return value;
    }
  
    async decrement(amount = 1) {
      let value: number = (await this.ctx.storage.get("value")) || 0;
      value -= amount;
      await this.ctx.storage.put("value", value);
      return value;
    }
}