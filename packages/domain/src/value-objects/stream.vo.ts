import { Readable } from 'node:stream';

type StreamConsumer<T> = (data: T) => void | Promise<void>;
type StreamInitializer<T> = (stream: StreamData<T>) => void;

export class StreamData<T> {
  private readonly stream: Readable;
  private closed = false;

  constructor(initializer?: StreamInitializer<T>) {
    this.stream = new Readable({
      objectMode: true,
      read() {}
    });

    initializer?.(this);
  }

  static create<T>(initializer?: StreamInitializer<T>): StreamData<T> {
    return new StreamData<T>(initializer);
  }

  write(data: T): void {
    this.ensureWritable();
    this.stream.push(data);
  }

  send(data: T): void {
    this.write(data);
  }

  close(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.stream.push(null);
  }

  end(): void {
    this.close();
  }

  fail(error: Error): void {
    this.closed = true;
    this.stream.destroy(error);
  }

  toReadable(): Readable {
    return this.stream;
  }

  onData(listener: StreamConsumer<T>): this {
    this.stream.on('data', listener as (chunk: unknown) => void);
    return this;
  }

  onEnd(listener: () => void): this {
    this.stream.on('end', listener);
    return this;
  }

  onError(listener: (error: Error) => void): this {
    this.stream.on('error', listener);
    return this;
  }

  async consume(consumer: StreamConsumer<T>): Promise<void> {
    for await (const chunk of this.values()) {
      await consumer(chunk);
    }
  }

  async *values(): AsyncGenerator<T, void, void> {
    for await (const chunk of this.stream) {
      yield chunk as T;
    }
  }

  private ensureWritable(): void {
    if (this.closed || this.stream.destroyed) {
      throw new Error('StreamData is already closed');
    }
  }
}
