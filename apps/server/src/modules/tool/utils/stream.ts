import type { StreamMessageType } from '@tool/type/req';
import type { Response } from 'express';

export class StreamManager {
  private response: Response;

  constructor(response: Response) {
    this.response = response;
    this.initStream();
  }

  get connected() {
    return !this.response.writableEnded;
  }

  private initStream() {
    // Stream response header
    this.response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    this.response.on('close', () => {
      this.response.end();
    });
  }

  sendMessage(message: StreamMessageType) {
    if (!this.connected) {
      return;
    }

    try {
      this.response.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Failed to send Stream message:', error);
    }
  }

  close() {
    if (this.connected) {
      this.response.end();
    }
  }
}
