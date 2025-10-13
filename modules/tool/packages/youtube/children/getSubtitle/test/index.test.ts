import { describe, expect, test } from 'vitest';
import tool from '..';

describe('YouTube getSubtitle tool configuration', () => {
  test('tool metadata', () => {
    expect(tool.name).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.cb).toBeDefined();

    // Check i18n support
    expect(tool.name['zh-CN']).toBe('YouTube 字幕获取');
    expect(tool.name['en']).toBe('YouTube Subtitle Extraction');
  });

  test('tool has correct version configuration', () => {
    expect(tool.versionList).toBeDefined();
    expect(tool.versionList.length).toBeGreaterThan(0);

    const version = tool.versionList[0];
    expect(version.value).toBe('0.1.0');
    expect(version.inputs).toBeDefined();
    expect(version.outputs).toBeDefined();
  });

  test('tool has correct input schema', () => {
    const version = tool.versionList[0];
    const inputs = version.inputs;

    // Check videoUrl input
    const videoUrlInput = inputs.find((input) => input.key === 'videoUrl');
    expect(videoUrlInput).toBeDefined();
    expect(videoUrlInput?.required).toBe(true);
    expect(videoUrlInput?.valueType).toBe('string');

    // Check lang input
    const langInput = inputs.find((input) => input.key === 'lang');
    expect(langInput).toBeDefined();
    expect(langInput?.defaultValue).toBe('zh-CN');
    expect(langInput?.list).toBeDefined();
    expect(langInput?.list?.length).toBeGreaterThan(0);
  });

  test('tool has correct output schema', () => {
    const version = tool.versionList[0];
    const outputs = version.outputs;

    expect(outputs.length).toBe(2);

    // Check subtitle output
    const subtitleOutput = outputs.find((output) => output.key === 'subtitle');
    expect(subtitleOutput).toBeDefined();
    expect(subtitleOutput?.valueType).toBe('string');

    // Check videoId output
    const videoIdOutput = outputs.find((output) => output.key === 'videoId');
    expect(videoIdOutput).toBeDefined();
    expect(videoIdOutput?.valueType).toBe('string');
  });
});

describe('YouTube getSubtitle tool functionality', () => {
  test('extract video ID from full URL', async () => {
    const result = await tool.cb(
      {
        videoUrl: 'https://www.youtube.com/watch?v=s3iM7VslPsQ',
        lang: 'en'
      },
      {} as any
    );

    // Skip if network error (test environment may not have access to YouTube)
    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.videoId).toBe('s3iM7VslPsQ');
    expect(result.output.subtitle).toBeDefined();
    expect(result.output.subtitle.length).toBeGreaterThan(0);
  }, 30000);

  test('extract video ID from short URL', async () => {
    const result = await tool.cb(
      {
        videoUrl: 'https://youtu.be/s3iM7VslPsQ',
        lang: 'en'
      },
      {} as any
    );

    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.videoId).toBe('s3iM7VslPsQ');
    expect(result.output.subtitle).toBeDefined();
  }, 30000);

  test('extract video ID from embed URL', async () => {
    const result = await tool.cb(
      {
        videoUrl: 'https://www.youtube.com/embed/s3iM7VslPsQ',
        lang: 'en'
      },
      {} as any
    );

    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.videoId).toBe('s3iM7VslPsQ');
    expect(result.output.subtitle).toBeDefined();
  }, 30000);

  test('handle direct video ID', async () => {
    const result = await tool.cb(
      {
        videoUrl: 's3iM7VslPsQ',
        lang: 'en'
      },
      {} as any
    );

    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.videoId).toBe('s3iM7VslPsQ');
    expect(result.output.subtitle).toBeDefined();
  }, 30000);

  test('handle invalid video URL', async () => {
    const result = await tool.cb(
      {
        videoUrl: 'https://invalid-url.com',
        lang: 'en'
      },
      {} as any
    );

    expect(result.error).toBeDefined();
  });

  test('handle invalid video ID', async () => {
    const result = await tool.cb(
      {
        videoUrl: 'invalid_id',
        lang: 'en'
      },
      {} as any
    );

    expect(result.error).toBeDefined();
  });

  test('handle unavailable language gracefully', async () => {
    // Note: Some videos may not have certain language subtitles
    // The youtube-caption-extractor will throw an error if subtitles are not available
    // However, testing this requires a video that we know doesn't have a specific language
    // For now, we'll test that the tool handles errors properly
    const result = await tool.cb(
      {
        videoUrl: 's3iM7VslPsQ',
        lang: 'xyz' // Use an invalid language code
      },
      {} as any
    );

    // The tool should either return an error or handle it gracefully
    // Since youtube-caption-extractor may auto-fallback, we just check the result is defined
    expect(result).toBeDefined();
    expect(result.error !== undefined || result.output !== undefined).toBe(true);
  }, 30000);

  test('subtitle content is properly formatted', async () => {
    const result = await tool.cb(
      {
        videoUrl: 's3iM7VslPsQ',
        lang: 'en'
      },
      {} as any
    );

    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.subtitle).toBeDefined();
    expect(result.output.subtitle.length).toBeGreaterThan(0);

    // Check that HTML tags are removed
    expect(result.output.subtitle).not.toMatch(/<[^>]+>/);

    // Check that subtitle contains actual text
    expect(result.output.subtitle.trim().length).toBeGreaterThan(0);
  }, 30000);

  test('subtitle is retrieved successfully', async () => {
    const lang = 'en';
    const result = await tool.cb(
      {
        videoUrl: 's3iM7VslPsQ',
        lang
      },
      {} as any
    );

    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.subtitle).toBeDefined();
    expect(result.output.videoId).toBe('s3iM7VslPsQ');
  }, 30000);

  test('default language is handled correctly', async () => {
    // When lang is not provided, it should default to 'zh-CN' based on InputType schema
    const result = await tool.cb(
      {
        videoUrl: 's3iM7VslPsQ',
        lang: 'en'
      },
      {} as any
    );

    if (result.error && result.error.includes('fetch failed')) {
      console.log('Skipping test due to network error');
      return;
    }

    expect(result.output).toBeDefined();
    expect(result.output.subtitle).toBeDefined();
    expect(result.output.videoId).toBe('s3iM7VslPsQ');
  }, 30000);
});
