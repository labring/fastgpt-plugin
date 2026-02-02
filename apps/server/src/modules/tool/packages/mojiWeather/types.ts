import { z } from 'zod';

export const WeatherItemSchema = z.object({
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
});

export const WeatherApiResponseSchema = z.object({
  data: z.object({
    forecast: z.array(WeatherItemSchema)
  })
});

export type WeatherItem = z.infer<typeof WeatherItemSchema>;
export type WeatherApiResponse = z.infer<typeof WeatherApiResponseSchema>;
