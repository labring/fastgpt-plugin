import axios from 'axios';

type WeatherIn15Days = [
  {
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
  }
];

export async function getWeatherIn15Days(cityId: string) {
  const baseUrl = 'http://aliv18.data.moji.com';
  const path = '/whapi/json/alicityweather/forecast15days';
  // auth value
  const AppCode = 'a13de8269f304f9fb9376eb4e2a988b6';

  const formData = new FormData();
  formData.set('cityId', cityId);

  const res = await axios.post(`${baseUrl}${path}`, formData, {
    headers: {
      Authorization: `APPCODE ${AppCode}`
    },
    timeout: 10000
  });
  const weatherIn15Days: WeatherIn15Days = res.data?.data.forecast ?? [];
  return weatherIn15Days;
}
