import type { Response } from 'express';
import type { SSEMessage } from '../type/stream';
import { SSEMessageType } from '../type/stream';

export class SSEManager {
  private response: Response;
  private isConnected: boolean = false;

  constructor(response: Response) {
    this.response = response;
    this.initSSE();
  }

  private initSSE() {
    // SSE response header
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

  sendMessage(message: SSEMessage) {
    if (!this.isConnected) {
      return;
    }

    try {
      this.response.write(`${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Failed to send SSE message:', error);
    }
  }

  sendData(data: any, toolId?: string) {
    this.sendMessage({
      type: SSEMessageType.DATA,
      data
    });
  }

  sendSuccess(data: any, toolId?: string) {
    this.sendMessage({
      type: SSEMessageType.SUCCESS,
      data
    });

    this.close();
  }

  sendError(data: any, toolId?: string) {
    this.sendMessage({
      type: SSEMessageType.ERROR,
      data
    });

    setTimeout(() => {
      this.close();
    }, 1000);
  }

  close() {
    if (this.isConnected) {
      try {
        this.response.end();
      } catch (error) {
        console.error('Error closing SSE connection:', error);
      } finally {
        this.isConnected = false;
      }
    }
  }

  get connected() {
    return this.isConnected;
  }
}
