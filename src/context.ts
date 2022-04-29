import { randomUUID } from 'crypto';

export class Context {
  private contextId: string;
  private properties: { [key: string]: any } = {};
  private forks: Array<Context> = [];

  constructor(private id = randomUUID()) {
    this.contextId = this.id;
  }

  public getProperty(key: string): any {
    return this.properties[key];
  }

  public setProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  public fork(id: string): void {
    this.forks = [...this.forks, new Context(id)];
  }

  public setForkProperty(id: string, key: string, value: any): void {
    const fork = this.forks.find((fork) => fork.contextId === id);
    if (fork) {
      fork.setProperty(key, value);
    }
  }

  public getForkProperty(id: string, key: string): any {
    const fork = this.forks.find((fork) => fork.contextId === id);
    if (fork) {
      return fork.getProperty(key);
    }
    return undefined;
  }
}

export function createContext(): Context {
  return new Context();
}
