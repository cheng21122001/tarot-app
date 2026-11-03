import type { BirthPlace } from '../domain/types';

// 常用城市，离线也能选。坐标取市中心，精确到 0.01°（约 1 公里），对排上升足够。
// 新疆、西藏按北京时间记出生时间，所以也用 Asia/Shanghai。
const CN = 'Asia/Shanghai';
const RAW: [string, number, number, string][] = [
  ['北京', 39.9, 116.41, CN], ['上海', 31.23, 121.47, CN], ['天津', 39.13, 117.2, CN], ['重庆', 29.56, 106.55, CN],
  ['广州', 23.13, 113.26, CN], ['深圳', 22.54, 114.06, CN], ['成都', 30.57, 104.07, CN], ['杭州', 30.27, 120.16, CN],
  ['南京', 32.06, 118.8, CN], ['武汉', 30.59, 114.31, CN], ['西安', 34.34, 108.94, CN], ['郑州', 34.75, 113.63, CN],
  ['长沙', 28.23, 112.94, CN], ['沈阳', 41.8, 123.43, CN], ['哈尔滨', 45.8, 126.53, CN], ['长春', 43.82, 125.32, CN],
  ['济南', 36.65, 117.12, CN], ['青岛', 36.07, 120.38, CN], ['大连', 38.91, 121.61, CN], ['厦门', 24.48, 118.09, CN],
  ['福州', 26.07, 119.3, CN], ['合肥', 31.82, 117.23, CN], ['南昌', 28.68, 115.86, CN], ['昆明', 25.04, 102.71, CN],
  ['贵阳', 26.65, 106.63, CN], ['南宁', 22.82, 108.37, CN], ['海口', 20.04, 110.2, CN], ['三亚', 18.25, 109.51, CN],
  ['太原', 37.87, 112.55, CN], ['石家庄', 38.04, 114.51, CN], ['呼和浩特', 40.84, 111.75, CN], ['兰州', 36.06, 103.83, CN],
  ['西宁', 36.62, 101.78, CN], ['银川', 38.49, 106.23, CN], ['乌鲁木齐', 43.83, 87.62, CN], ['拉萨', 29.65, 91.14, CN],
  ['苏州', 31.3, 120.62, CN], ['无锡', 31.49, 120.31, CN], ['常州', 31.81, 119.97, CN], ['南通', 31.98, 120.89, CN],
  ['扬州', 32.39, 119.41, CN], ['徐州', 34.26, 117.18, CN], ['宁波', 29.87, 121.54, CN], ['温州', 28.0, 120.7, CN],
  ['嘉兴', 30.75, 120.76, CN], ['绍兴', 30.0, 120.58, CN], ['金华', 29.08, 119.65, CN], ['台州', 28.66, 121.42, CN],
  ['东莞', 23.02, 113.75, CN], ['佛山', 23.02, 113.12, CN], ['珠海', 22.27, 113.58, CN], ['中山', 22.52, 113.39, CN],
  ['江门', 22.58, 113.08, CN], ['惠州', 23.11, 114.42, CN], ['汕头', 23.35, 116.68, CN], ['湛江', 21.27, 110.36, CN],
  ['泉州', 24.87, 118.68, CN], ['烟台', 37.46, 121.45, CN], ['威海', 37.51, 122.12, CN], ['潍坊', 36.71, 119.16, CN],
  ['淄博', 36.81, 118.05, CN], ['临沂', 35.1, 118.36, CN], ['济宁', 35.41, 116.59, CN], ['洛阳', 34.62, 112.45, CN],
  ['开封', 34.8, 114.31, CN], ['南阳', 33.0, 112.53, CN], ['新乡', 35.3, 113.93, CN], ['唐山', 39.63, 118.18, CN],
  ['保定', 38.87, 115.46, CN], ['邯郸', 36.63, 114.54, CN], ['包头', 40.66, 109.84, CN], ['大庆', 46.59, 125.1, CN],
  ['吉林', 43.84, 126.55, CN], ['鞍山', 41.11, 122.99, CN], ['芜湖', 31.35, 118.43, CN], ['赣州', 25.83, 114.93, CN],
  ['九江', 29.71, 116.0, CN], ['株洲', 27.83, 113.13, CN], ['衡阳', 26.89, 112.57, CN], ['岳阳', 29.36, 113.13, CN],
  ['宜昌', 30.69, 111.29, CN], ['襄阳', 32.01, 112.12, CN], ['遵义', 27.73, 106.93, CN], ['桂林', 25.27, 110.29, CN],
  ['柳州', 24.33, 109.41, CN], ['绵阳', 31.47, 104.68, CN], ['德阳', 31.13, 104.4, CN], ['南充', 30.84, 106.11, CN],
  ['宜宾', 28.77, 104.64, CN], ['泸州', 28.87, 105.44, CN], ['自贡', 29.34, 104.78, CN], ['乐山', 29.55, 103.77, CN],
  ['宝鸡', 34.36, 107.24, CN], ['咸阳', 34.33, 108.71, CN], ['天水', 34.58, 105.72, CN],
  ['香港', 22.32, 114.17, 'Asia/Hong_Kong'], ['澳门', 22.2, 113.55, 'Asia/Macau'],
  ['台北', 25.03, 121.56, 'Asia/Taipei'], ['台中', 24.15, 120.67, 'Asia/Taipei'], ['高雄', 22.63, 120.3, 'Asia/Taipei'],
  ['新加坡', 1.35, 103.82, 'Asia/Singapore'], ['吉隆坡', 3.14, 101.69, 'Asia/Kuala_Lumpur'], ['曼谷', 13.76, 100.5, 'Asia/Bangkok'],
  ['东京', 35.68, 139.69, 'Asia/Tokyo'], ['首尔', 37.57, 126.98, 'Asia/Seoul'],
  ['新德里', 28.61, 77.21, 'Asia/Kolkata'], ['孟买', 19.08, 72.88, 'Asia/Kolkata'],
  ['伦敦', 51.51, -0.13, 'Europe/London'], ['巴黎', 48.86, 2.35, 'Europe/Paris'], ['柏林', 52.52, 13.4, 'Europe/Berlin'],
  ['纽约', 40.71, -74.01, 'America/New_York'], ['洛杉矶', 34.05, -118.24, 'America/Los_Angeles'],
  ['旧金山', 37.77, -122.42, 'America/Los_Angeles'], ['温哥华', 49.28, -123.12, 'America/Vancouver'],
  ['多伦多', 43.65, -79.38, 'America/Toronto'], ['悉尼', -33.87, 151.21, 'Australia/Sydney'],
  ['墨尔本', -37.81, 144.96, 'Australia/Melbourne'], ['奥克兰', -36.85, 174.76, 'Pacific/Auckland'],
];

export const CITIES: BirthPlace[] = RAW.map(([name, lat, lon, tz]) => ({ name, lat, lon, tz }));

export const COMMON_TIMEZONES: [string, string][] = [
  ['Asia/Shanghai', '北京时间（中国大陆）'],
  ['Asia/Hong_Kong', '香港'],
  ['Asia/Taipei', '台湾'],
  ['Asia/Macau', '澳门'],
  ['Asia/Singapore', '新加坡'],
  ['Asia/Kuala_Lumpur', '马来西亚'],
  ['Asia/Bangkok', '泰国'],
  ['Asia/Tokyo', '日本'],
  ['Asia/Seoul', '韩国'],
  ['Asia/Kolkata', '印度'],
  ['Europe/London', '英国'],
  ['Europe/Paris', '法国'],
  ['Europe/Berlin', '德国'],
  ['America/New_York', '美国东部'],
  ['America/Chicago', '美国中部'],
  ['America/Los_Angeles', '美国西部'],
  ['America/Toronto', '加拿大东部'],
  ['America/Vancouver', '加拿大西部'],
  ['Australia/Sydney', '澳大利亚东部'],
  ['Pacific/Auckland', '新西兰'],
];

export function searchCities(q: string): BirthPlace[] {
  const s = q.trim();
  if (!s) return [];
  return CITIES.filter((c) => c.name.includes(s) || s.includes(c.name)).slice(0, 6);
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  country_code?: string;
  admin1?: string;
}

// 联网搜小地方（县、镇、国外城市）：Open-Meteo 的免费地名服务，不用密钥，支持中文。
export async function searchOnline(q: string, signal?: AbortSignal): Promise<BirthPlace[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=8&language=zh&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`geocoding ${res.status}`);
  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? [])
    .filter((r) => r.timezone)
    .map((r) => ({
      name: [r.name, r.admin1 && r.admin1 !== r.name ? r.admin1 : '', r.country && r.country !== '中国' ? r.country : ''].filter(Boolean).join('，'),
      lat: Math.round(r.latitude * 100) / 100,
      lon: Math.round(r.longitude * 100) / 100,
      // 新疆在时区库里是 UTC+6，但出生证明按北京时间记。
      tz: r.country_code === 'CN' ? CN : r.timezone!,
    }));
}
