import citiesData from '../data/cities.json';

export interface CityInfo {
  province: string;
  city: string;
  towns: string;
}

// normalize the city name
function normalize(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const suffixes = [
    '特别行政区',
    '自治州',
    '自治区',
    '地区',
    '盟',
    '市辖区',
    '自治县',
    '旗',
    '州',
    '区',
    '县',
    '市',
    '省'
  ];
  let res = trimmed;
  for (const s of suffixes) {
    if (res.endsWith(s)) {
      res = res.slice(0, res.length - s.length);
      break;
    }
  }
  return res;
}

// fuzzy match city
function fuzzyMatch(input: string, target: string): boolean {
  const a = normalize(input);
  const b = normalize(target);
  // Null values match each other
  if (!a && !b) return true;
  // The null value does not match the non-null value
  if (!a || !b) return false;
  // The value matches if it is equal to the target or contains the target
  return a === b || a.includes(b) || b.includes(a);
}

// search city
export function searchCity(cityInfo: CityInfo): string | null {
  const inProv = cityInfo.province || '';
  const inCity = cityInfo.city || '';
  const inTowns = cityInfo.towns || '';

  for (const city of citiesData.cities) {
    const provOk = inProv ? fuzzyMatch(inProv, city.province) : true;
    const cityOk = inCity ? fuzzyMatch(inCity, city.city) : true;
    const townsOk = inTowns ? fuzzyMatch(inTowns, city.towns) : true;
    if (provOk && cityOk && townsOk) {
      return city.cityId;
    }
  }
  return null;
}
