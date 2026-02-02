import { z } from 'zod';
import { getErrText } from '@tool/utils/err';
import { delay } from '@tool/utils/delay';

// Model enumeration
const ModelEnum = z.enum([
  'wanx2.1-t2i-turbo', // Tongyi Wanxiang Text-to-Image 2.1 - Faster generation speed, general-purpose model
  'wanx2.1-t2i-plus', // Tongyi Wanxiang Text-to-Image 2.1 - Richer image details, slightly slower
  'wanx2.0-t2i-turbo' // Tongyi Wanxiang Text-to-Image 2.0 - Excels at textured portraits and creative design, cost-effective
]);

// Image size enumeration
const SizeEnum = z.enum([
  '512*512',
  '512*1024',
  '768*768',
  '768*1024',
  '1024*512',
  '1024*768',
  '1024*1024',
  '1280*720',
  '1440*720'
]);

export const InputType = z.object({
  apiKey: z.string().describe('Alibaba Cloud Bailian API Key'),
  prompt: z
    .string()
    .describe(
      'Positive prompt describing the desired image content. Supports Chinese and English, up to 800 characters'
    ),
  model: ModelEnum.optional().default('wanx2.1-t2i-turbo').describe('Model name'),
  negative_prompt: z
    .string()
    .optional()
    .describe(
      'Negative prompt describing content that should not appear in the image, up to 500 characters'
    ),
  size: SizeEnum.optional().default('1024*1024').describe('Output image resolution'),
  n: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .default(1)
    .describe('Number of images to generate, range 1-4'),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .optional()
    .describe('Random seed to control the randomness of model generation'),
  prompt_extend: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Whether to enable intelligent prompt rewriting, uses large model to intelligently rewrite input prompt'
    ),
  watermark: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to add watermark, located at bottom right corner of image')
});

export const OutputType = z.object({
  images: z.array(z.string()).describe('Array of generated image URLs')
});

// Task status enumeration
enum TaskStatus {
  PENDING = 'PENDING', // Task in queue
  RUNNING = 'RUNNING', // Task processing
  SUCCEEDED = 'SUCCEEDED', // Task execution successful
  FAILED = 'FAILED', // Task execution failed
  CANCELED = 'CANCELED', // Task cancellation successful
  UNKNOWN = 'UNKNOWN' // Task does not exist or status unknown
}

export async function tool({
  apiKey,
  prompt,
  model = 'wanx2.1-t2i-turbo',
  negative_prompt,
  size = '1024*1024',
  n = 1,
  seed,
  prompt_extend = false,
  watermark = false
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // Step 1: Create task and get task ID
    const createTaskResponse = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model,
          input: {
            prompt,
            ...(negative_prompt && { negative_prompt })
          },
          parameters: {
            size,
            n,
            ...(seed !== undefined && { seed }),
            prompt_extend,
            watermark
          }
        })
      }
    );

    const createTaskData = await createTaskResponse.json();
    const taskId = createTaskData?.output?.task_id;
    if (!taskId) {
      return Promise.reject({
        error: 'Failed to create task, task ID not obtained'
      });
    }

    // Step 2: Poll for task results
    const maxRetries = 60; // Maximum retry count, about 3 minutes (60 * 3 seconds = 180 seconds)
    let retryCount = 0;

    while (retryCount < maxRetries) {
      await delay(3000); // Wait 3 seconds

      try {
        const queryResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        });

        const queryData = await queryResponse.json();
        const taskStatus = queryData?.output?.task_status;
        if (taskStatus === TaskStatus.SUCCEEDED) {
          // Task successful, process results
          const results = queryData?.output?.results || [];

          // Print results JSON structure
          const images = [];

          for (const result of results) {
            if (result.url) {
              // Use Alibaba Cloud provided image URL directly, no need to upload to local storage
              images.push(result.url);
            }
          }

          return {
            images
          };
        } else if (taskStatus === TaskStatus.FAILED) {
          return Promise.reject({
            error: 'Image generation task failed'
          });
        } else if (taskStatus === TaskStatus.CANCELED) {
          return Promise.reject({
            error: 'Image generation task was canceled'
          });
        }
        // Task still in progress, continue polling
      } catch (queryError) {
        return Promise.reject({
          error: getErrText(queryError, 'Failed to query task status')
        });
      }

      retryCount++;
    }

    // Timeout
    return Promise.reject({
      error: 'Image generation timeout, please try again later'
    });
  } catch (error: any) {
    return Promise.reject({
      error: getErrText(error, 'Text-to-image request failed')
    });
  }
}
