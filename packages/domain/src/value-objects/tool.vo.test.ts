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

  it('rejects content that is not a parts array', () => {
    expect(() =>
      ToolHandlerReturnSchema.parse({ content: 'https://example.com/a.png' })
    ).toThrow();
  });

  it('rejects invalid content parts', () => {
    expect(() => ToolHandlerReturnSchema.parse({ content: [{ type: 'text', text: '' }] })).toThrow();
    expect(() =>
      ToolHandlerReturnSchema.parse({ content: [{ type: 'image_url', image_url: {} }] })
    ).toThrow();
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

  it('rejects a response whose content is not structured', () => {
    expect(() =>
      ToolStreamMessageSchema.parse({
        type: 'response',
        data: { content: 'https://example.com/a.png' }
      })
    ).toThrow();
  });
});
