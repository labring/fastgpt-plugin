import { z } from 'zod';
import { searchCity } from '../../../utils';
import { getWeatherIn15Days } from '../../../utils';
import { WeatherItemSchema } from '../../../types';

export const InputType = z
  .object({
    apiKey: z.string().min(1, 'API密钥不能为空').describe('墨迹天气API密钥'),
    city: z.string().optional(),
    province: z.string().optional(),
    towns: z.string().optional(),
    start_time: z.string(),
    end_time: z.string()
  })
  .refine(
    (data) => {
      return Boolean(
        (data.city && data.city.trim()) ||
          (data.province && data.province.trim()) ||
          (data.towns && data.towns.trim())
      );
    },
    { message: '省份、城市、区县至少填写一个' }
  );

export const OutputType = z.object({
  data: z.array(WeatherItemSchema)
});

export async function tool({
  apiKey,
  city,
  end_time,
  province,
  start_time,
  towns
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const cityId = searchCity({ city, province, towns });
  if (!cityId) {
    return Promise.reject('Can not find city');
  }

  try {
    const weatherIn15Days = await getWeatherIn15Days(cityId, apiKey);
    const forecastsInRange = weatherIn15Days.filter((item) => {
      const predictDate = item.predictDate;
      return predictDate >= start_time && predictDate <= end_time;
    });
    return {
      data: forecastsInRange
    };
  } catch {
    return Promise.reject('No weather data available');
  }
}
