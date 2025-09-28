import { z } from 'zod';
import { searchCity } from '../../../src/utils/searchCity';
import { getWeatherIn15Days } from '../../../src/utils/getWeather';

export const InputType = z.object({
  apiKey: z.string().min(1, 'API密钥不能为空').describe('墨迹天气API密钥'),
  city: z.string(),
  end_time: z.string(),
  province: z.string(),
  start_time: z.string(),
  towns: z.string()
});

export const OutputType = z.object({
  data: z.array(
    z.object({
      conditionDay: z.string(),
      conditionIdDay: z.string(),
      conditionIdNight: z.string(),
      conditionNight: z.string(),
      humidity: z.string(),
      moonphase: z.string(),
      moonrise: z.string(),
      moonset: z.string(),
      pop: z.string(),
      predictDate: z.string(),
      qpf: z.string(),
      sunrise: z.string(),
      sunset: z.string(),
      tempDay: z.string(),
      tempNight: z.string(),
      updatetime: z.string(),
      uvi: z.string(),
      windDegreesDay: z.string(),
      windDegreesNight: z.string(),
      windDirDay: z.string(),
      windDirNight: z.string(),
      windLevelDay: z.string(),
      windLevelNight: z.string(),
      windSpeedDay: z.string(),
      windSpeedNight: z.string()
    })
  )
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
    return {
      data: []
    };
  }

  try {
    const weatherIn15Days = await getWeatherIn15Days(cityId, apiKey);
    const forecastsInRange = weatherIn15Days.filter((item: { predictDate: string }) => {
      const predictDate = item.predictDate;
      return predictDate >= start_time && predictDate <= end_time;
    });
    return {
      data: forecastsInRange
    };
  } catch {
    return {
      data: []
    };
  }
}
