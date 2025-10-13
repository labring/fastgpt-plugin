import { z } from 'zod';

// Input parameter schema
export const InputType = z.object({
  token: z.string().min(1, 'Please provide a valid API token'),
  symbol_list: z
    .array(
      z.object({
        code: z.string().min(1, 'Please provide product code, e.g.: 857.HK, UNH.US')
      })
    )
    .min(1, 'At least one product code is required')
    .max(50, 'Maximum 50 product codes supported'),
  is_stock: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether it is a stock product, determines which API endpoint to use')
});

// Depth quote data item schema
const DepthItemType = z.object({
  price: z.string().describe('Price'),
  volume: z.string().describe('Volume')
});

// Single product depth quote schema
const TickItemType = z.object({
  code: z.string().describe('Product code'),
  seq: z.string().describe('Quote sequence number'),
  tick_time: z.string().describe('Quote timestamp'),
  bids: z.array(DepthItemType).describe('Bid depth list'),
  asks: z.array(DepthItemType).describe('Ask depth list')
});

// API response schema
const ApiResponseType = z.object({
  ret: z.number(),
  msg: z.string(),
  trace: z.string(),
  data: z
    .object({
      tick_list: z.array(TickItemType)
    })
    .optional()
});

// Output parameter schema
export const OutputType = z.object({
  data: z.object({
    tick_list: z.array(TickItemType),
    total_count: z.number()
  })
});

// Generate unique trace code
function generateTrace(): string {
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}`;
}

// Build query parameters
function buildQueryData(params: z.infer<typeof InputType>) {
  return {
    trace: generateTrace(),
    data: {
      symbol_list: params.symbol_list
    }
  };
}

// Get API endpoint URL
function getApiEndpoint(isStock: boolean): string {
  if (isStock) {
    return 'https://quote.alltick.io/quote-stock-b-api/depth-tick';
  } else {
    return 'https://quote.alltick.io/quote-b-api/depth-tick';
  }
}

export async function tool(params: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // Validate input parameters
    const validatedParams = InputType.parse(params);

    // Build request data
    const queryData = buildQueryData(validatedParams);
    const apiUrl = getApiEndpoint(validatedParams.is_stock);

    // Build complete request URL
    const requestUrl = `${apiUrl}?token=${encodeURIComponent(validatedParams.token)}&query=${encodeURIComponent(JSON.stringify(queryData))}`;

    // Send API request
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FastGPT-AllTick-Plugin/1.0'
      }
    });

    if (!response.ok) {
      return Promise.reject(new Error(`HTTP error: ${response.status} ${response.statusText}`));
    }

    const responseData = await response.json();

    // Validate API response format
    const validatedResponse = ApiResponseType.parse(responseData);

    // Check API return status
    if (validatedResponse.ret !== 200) {
      return Promise.reject(
        new Error(`API error: ${validatedResponse.msg} (error code: ${validatedResponse.ret})`)
      );
    }

    // Check if data exists
    if (!validatedResponse.data || !validatedResponse.data.tick_list) {
      return Promise.reject(
        new Error(
          'Failed to retrieve depth quote data, please check if the product code is correct'
        )
      );
    }

    // Return success result
    return {
      data: {
        tick_list: validatedResponse.data.tick_list,
        total_count: validatedResponse.data.tick_list.length
      }
    };
  } catch (error) {
    // Error handling - use Promise.reject
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      return Promise.reject(new Error(`Parameter validation failed: ${errorMessages}`));
    }

    if (error instanceof Error) {
      return Promise.reject(new Error(`Request failed: ${error.message}`));
    }

    return Promise.reject(new Error('Unknown error, please try again later'));
  }
}
