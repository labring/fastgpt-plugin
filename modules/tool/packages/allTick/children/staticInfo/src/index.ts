import { z } from 'zod';

// Input parameter schema
export const InputType = z.object({
  token: z.string().min(1, 'Please provide a valid API token'),
  symbol: z.string().min(1, 'Please provide stock code, e.g.: 857.HK, UNH.US, 000001.SZ')
});

// Stock basic information schema
const StaticInfoItemType = z.object({
  board: z.string().optional().describe('Stock board'),
  bps: z.string().optional().describe('Book value per share'),
  circulating_shares: z.string().optional().describe('Circulating shares'),
  currency: z.string().optional().describe('Trading currency'),
  dividend_yield: z.string().optional().describe('Dividend yield'),
  eps: z.string().optional().describe('Earnings per share'),
  eps_ttm: z.string().optional().describe('Earnings per share (TTM)'),
  exchange: z.string().optional().describe('Product exchange'),
  hk_shares: z.string().optional().describe('Hong Kong shares (HK stocks only)'),
  lot_size: z.string().optional().describe('Lot size'),
  name_cn: z.string().optional().describe('Simplified Chinese product name'),
  name_en: z.string().optional().describe('English product name'),
  name_hk: z.string().optional().describe('Traditional Chinese product name'),
  symbol: z.string().describe('Product code'),
  total_shares: z.string().optional().describe('Total shares')
});

// API response schema
const ApiResponseType = z.object({
  ret: z.number(),
  msg: z.string(),
  trace: z.string(),
  data: z
    .object({
      static_info_list: z.array(StaticInfoItemType)
    })
    .optional()
});

// Output parameter schema
export const OutputType = z.object({
  data: z.object({
    static_info_list: z.array(StaticInfoItemType),
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
      symbol_list: [{ code: params.symbol }]
    }
  };
}

export async function tool(params: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // Validate input parameters
    const validatedParams = InputType.parse(params);

    // Build request data
    const queryData = buildQueryData(validatedParams);

    // Use stock basic information API endpoint
    const apiUrl = 'https://quote.alltick.io/quote-stock-b-api/static_info';

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
    if (!validatedResponse.data || !validatedResponse.data.static_info_list) {
      return Promise.reject(
        new Error(
          'Failed to retrieve stock basic information, please check if the stock code is correct'
        )
      );
    }

    // Return success result
    return {
      data: {
        static_info_list: validatedResponse.data.static_info_list,
        total_count: validatedResponse.data.static_info_list.length
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
