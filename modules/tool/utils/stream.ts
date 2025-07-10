import type { Response } from 'express';
import type { StreamMessage } from '../type/stream';

export class StreamManager {
  private response: Response;
  private isConnected: boolean = false;

  constructor(response: Response) {
    this.response = response;
    this.initStream();
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

    this.isConnected = true;

    this.response.on('close', () => {
      this.isConnected = false;
    });

    this.response.on('error', () => {
      this.isConnected = false;
    });
  }

  sendMessage(message: StreamMessage) {
    if (!this.isConnected) {
      return;
    }

    try {
      this.response.write(`${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Failed to send Stream message:', error);
    }
  }

  close() {
    if (this.isConnected) {
      try {
        this.response.end();
      } catch (error) {
        console.error('Error closing Stream connection:', error);
      } finally {
        this.isConnected = false;
      }
    }
  }

  get connected() {
    return this.isConnected;
  }
}
