import { POST } from '@tool/utils/request';

type WeatherItem = {
  conditionDay: string;
  conditionIdDay: string;
  conditionIdNight: string;
  conditionNight: string;
  humidity: string;
  moonphase: string;
  moonrise: string;
  moonset: string;
  pop: string;
  predictDate: string;
  qpf: string;
  sunrise: string;
  sunset: string;
  tempDay: string;
  tempNight: string;
  updatetime: string;
  uvi: string;
  windDegreesDay: string;
  windDegreesNight: string;
  windDirDay: string;
  windDirNight: string;
  windLevelDay: string;
  windLevelNight: string;
  windSpeedDay: string;
  windSpeedNight: string;
};

type WeatherApiResponse = {
  data: {
    forecast: WeatherItem[];
  };
};

export async function getWeatherIn15Days(cityId: string, apiKey: string) {
  const baseUrl = 'http://aliv18.data.moji.com';
  const path = '/whapi/json/alicityweather/forecast15days';

  const formData = new FormData();
  formData.set('cityId', cityId);

  const res = await POST<WeatherApiResponse>(`${baseUrl}${path}`, formData, {
    headers: {
      Authorization: `APPCODE ${apiKey}`
    },
    timeout: 10000
  });

  const weatherIn15Days: WeatherItem[] = res.data?.data?.forecast ?? [];
  return weatherIn15Days;
}
