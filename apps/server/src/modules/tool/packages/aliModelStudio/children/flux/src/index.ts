import { z } from 'zod';
import { getErrText } from '@tool/utils/err';
import { delay } from '@tool/utils/delay';

// FLUX model enum
const ModelEnum = z.enum([
  'flux-schnell', // FLUX.1 [schnell] Few-step model, fast generation, excellent visual quality
  'flux-dev', // FLUX.1 [dev] Open-source model for non-commercial applications
  'flux-merged' // FLUX.1-merged Combines advantages of DEV and Schnell models
]);

// Image size enum
const SizeEnum = z.enum(['512*1024', '768*512', '768*1024', '1024*576', '576*1024', '1024*1024']);

export const InputType = z.object({
  apiKey: z.string().describe('Aliyun Bailian API Key'),
  prompt: z
    .string()
    .describe(
      'Text content, supports Chinese and English. No more than 500 Chinese characters or 500 English words.'
    ),
  model: ModelEnum.optional().default('flux-schnell').describe('Model name'),
  size: SizeEnum.optional().default('1024*1024').describe('Resolution of the generated image'),
  seed: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Seed value for image generation. If not provided, a random number will be used.'),
  steps: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      'Number of inference steps for image generation. Default is 30. Official default for flux-schnell is 4, for flux-dev is 50.'
    ),
  guidance: z
    .number()
    .min(0)
    .optional()
    .describe(
      'Guidance scale for adjusting the creativity and adherence to the prompt. Higher values make the image more faithful to the prompt but less diverse; lower values allow more creativity and variation. Default is 3.5.'
    ),
  offload: z
    .boolean()
    .optional()
    .describe(
      'Whether to temporarily offload some compute-intensive components from GPU to CPU during sampling to reduce memory pressure or improve efficiency. Default is False.'
    ),
  add_sampling_metadata: z
    .boolean()
    .optional()
    .describe(
      'Whether to embed prompt and other metadata in the output image file. Default is True.'
    )
});

export const OutputType = z.object({
  images: z.array(z.string()).describe('Array of generated image URLs')
});

// Task status enum
enum TaskStatus {
  PENDING = 'PENDING', // Task is queued
  RUNNING = 'RUNNING', // Task is processing
  SUCCEEDED = 'SUCCEEDED', // Task succeeded
  FAILED = 'FAILED', // Task failed
  CANCELED = 'CANCELED', // Task was canceled
  UNKNOWN = 'UNKNOWN' // Task does not exist or status unknown
}

export async function tool({
  apiKey,
  prompt,
  model = 'flux-schnell',
  size = '1024*1024',
  seed,
  steps,
  guidance,
  offload,
  add_sampling_metadata
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // Step 1: Create task and get task ID
    const requestBody = {
      model,
      input: {
        prompt
      },
      parameters: {
        size,
        ...(seed !== undefined && { seed }),
        ...(steps !== undefined && { steps }),
        ...(guidance !== undefined && { guidance }),
        ...(offload !== undefined && { offload }),
        ...(add_sampling_metadata !== undefined && { add_sampling_metadata })
      }
    };

    const createTaskResponse = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(requestBody)
      }
    );
    const createTaskData = await createTaskResponse.json();
    const taskId = createTaskData?.output?.task_id;
    if (!taskId) {
      return Promise.reject({
        error: 'Failed to create task, no task ID received.'
      });
    }

    // Step 2: Poll for task result
    const maxRetries = 60; // Maximum retries, about 3 minutes (60 * 3s = 180s)
    let retryCount = 0;

    while (retryCount < maxRetries) {
      await delay(3000); // Wait for 3 seconds

      try {
        const queryResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        });
        const queryData = await queryResponse.json();
        const taskStatus = queryData?.output?.task_status;
        if (taskStatus === TaskStatus.SUCCEEDED) {
          // Task succeeded, process result
          const results = queryData?.output?.results || [];

          const images = [];

          for (const result of results) {
            if (result.url) {
              // Use the image URL provided by Aliyun directly
              images.push(result.url);
            }
          }

          return {
            images
          };
        } else if (taskStatus === TaskStatus.FAILED) {
          const errorMessage = queryData?.output?.message || 'Image generation task failed.';
          return Promise.reject({
            error: errorMessage
          });
        } else if (taskStatus === TaskStatus.CANCELED) {
          return Promise.reject({
            error: 'Image generation task was canceled.'
          });
        }
        // Task is still in progress, continue polling
      } catch (queryError) {
        return Promise.reject({
          error: getErrText(queryError, 'Failed to query task status.'),
          task_id: taskId,
          task_status: 'UNKNOWN'
        });
      }

      retryCount++;
    }

    // Timeout
    return Promise.reject({
      error: 'Image generation timed out, please try again later.'
    });
  } catch (error: unknown) {
    return Promise.reject({
      error: getErrText(error, 'FLUX text-to-image request failed.')
    });
  }
}
