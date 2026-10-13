import { describe, expect, it } from 'vitest';

import {
  ToolHandlerReturnSchema,
  ToolMessageContentPartSchema,
  ToolStreamMessageSchema
} from './tool.vo';

describe('ToolMessageContentPartSchema', () => {
  it('accepts text parts', () => {
    expect(ToolMessageContentPartSchema.parse({ type: 'text', text: 'hi' })).toEqual({
      type: 'text',
      text: 'hi'
    });
  });

  it('accepts image_url parts with optional detail', () => {
    const part = {
      type: 'image_url',
      image_url: { url: 'https://example.com/a.png', detail: 'high' }
    };

    expect(ToolMessageContentPartSchema.parse(part)).toEqual(part);
  });

  it('rejects empty text parts', () => {
    expect(() => ToolMessageContentPartSchema.parse({ type: 'text', text: '' })).toThrow();
  });

  it('rejects image_url parts without url', () => {
    expect(() =>
      ToolMessageContentPartSchema.parse({ type: 'image_url', image_url: {} })
    ).toThrow();
  });

  it('rejects unknown part types', () => {
    expect(() => ToolMessageContentPartSchema.parse({ type: 'video' })).toThrow();
  });

  it('rejects invalid detail values', () => {
    expect(() =>
      ToolMessageContentPartSchema.parse({
        type: 'image_url',
        image_url: { url: 'https://example.com/a.png', detail: 'ultra' }
      })
    ).toThrow();
  });

  it('strips unknown fields inside parts', () => {
    expect(
      ToolMessageContentPartSchema.parse({ type: 'text', text: 'hi', extra: 1 })
    ).toEqual({ type: 'text', text: 'hi' });
  });
});

describe('ToolHandlerReturnSchema', () => {
  it('keeps plain tool outputs as before', () => {
    const data = { answer: 'ok', list: [1, 2] };

    expect(ToolHandlerReturnSchema.parse(data)).toEqual(data);
  });

  it('accepts empty output objects', () => {
    expect(ToolHandlerReturnSchema.parse({})).toEqual({});
  });

  it('accepts structured content parts', () => {
    const data = {
      summary: 'generated an image',
      content: [
        { type: 'text', text: 'see below' },
        { type: 'image_url', image_url: { url: 'https://example.com/a.png' } }
      ]
    };

    expect(ToolHandlerReturnSchema.parse(data)).toEqual(data);
  });

  it('keeps legacy string content untouched', () => {
    const data = { content: 'https://example.com/a.png', title: 'Result' };

    expect(ToolHandlerReturnSchema.parse(data)).toEqual(data);
  });

  it('keeps legacy object and array content untouched', () => {
    expect(
      ToolHandlerReturnSchema.parse({ content: { text: 'ordinary document text' } })
    ).toEqual({ content: { text: 'ordinary document text' } });
    expect(ToolHandlerReturnSchema.parse({ content: [1, 2, 3] })).toEqual({ content: [1, 2, 3] });
  });

  it('keeps malformed content parts untouched without wire validation', () => {
    expect(ToolHandlerReturnSchema.parse({ content: [{ type: 'text', text: '' }] })).toEqual({
      content: [{ type: 'text', text: '' }]
    });
    expect(
      ToolHandlerReturnSchema.parse({ content: [{ type: 'image_url', image_url: {} }] })
    ).toEqual({ content: [{ type: 'image_url', image_url: {} }] });
  });

  it('accepts an empty content array', () => {
    expect(ToolHandlerReturnSchema.parse({ content: [] })).toEqual({ content: [] });
  });

  it('keeps unknown top-level fields', () => {
    const data = {
      content: [{ type: 'text', text: 'hi' }],
      extra: { anything: true },
      count: 3
    };

    expect(ToolHandlerReturnSchema.parse(data)).toEqual(data);
  });
});

describe('ToolStreamMessageSchema', () => {
  it('parses a response carrying image content parts', () => {
    const message = {
      type: 'response',
      data: {
        content: [{ type: 'image_url', image_url: { url: 'https://example.com/a.png' } }]
      }
    };

    expect(ToolStreamMessageSchema.parse(message)).toEqual(message);
  });

  it('parses a legacy response whose content is a plain string', () => {
    const message = {
      type: 'response',
      data: { content: 'https://example.com/a.png' }
    };

    expect(ToolStreamMessageSchema.parse(message)).toEqual(message);
  });

  it('parses a legacy response whose content is an object', () => {
    const message = {
      type: 'response',
      data: { content: { summary: 'done', items: 2 } }
    };

    expect(ToolStreamMessageSchema.parse(message)).toEqual(message);
  });

  it('parses a legacy response whose content is an array', () => {
    const message = {
      type: 'response',
      data: { content: ['a.png', 'b.png'] }
    };

    expect(ToolStreamMessageSchema.parse(message)).toEqual(message);
  });

  it('parses stream and error messages', () => {
    const streamMessage = {
      type: 'stream',
      data: { type: 'answer', content: 'hello' }
    };
    const errorMessage = {
      type: 'error',
      data: 'something went wrong'
    };

    expect(ToolStreamMessageSchema.parse(streamMessage)).toEqual(streamMessage);
    expect(ToolStreamMessageSchema.parse(errorMessage)).toEqual(errorMessage);
  });
});
