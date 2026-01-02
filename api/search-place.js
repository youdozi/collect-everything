// 네이버 지도 API 검색 프록시
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;

  // 쿼리 파라미터 검증
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // 환경 변수 확인
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Naver API credentials');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Naver API credentials not configured'
    });
  }

  try {
    // 네이버 지역 검색 API 호출
    const response = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&sort=random`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data = await response.json();

    // 응답 데이터 정제
    const places = data.items.map(item => ({
      title: item.title.replace(/<\/?b>/g, ''), // HTML 태그 제거
      category: item.category,
      address: item.address,
      roadAddress: item.roadAddress,
      mapx: item.mapx,  // 경도 (x10000000)
      mapy: item.mapy,  // 위도 (x10000000)
      link: item.link,
      telephone: item.telephone
    }));

    return res.status(200).json({
      total: data.total,
      places: places
    });

  } catch (error) {
    console.error('Error fetching from Naver API:', error);
    return res.status(500).json({
      error: 'Failed to fetch place data',
      message: error.message
    });
  }
}
