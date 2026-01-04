// 카카오 로컬 API 검색 프록시
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

  const { query, lat, lng, radius } = req.query;

  // 쿼리 파라미터 검증 (query 또는 lat/lng 중 하나는 필수)
  if (!query && (!lat || !lng)) {
    return res.status(400).json({
      error: 'Either query or lat/lng parameters are required'
    });
  }

  // 환경 변수 확인
  const restApiKey = process.env.KAKAO_REST_API_KEY;

  if (!restApiKey) {
    console.error('Missing Kakao API credentials');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Kakao REST API key not configured'
    });
  }

  try {
    let apiUrl;

    // 좌표 기반 검색 (GPS) - 주요 카테고리 검색
    if (lat && lng) {
      const searchRadius = radius || 500; // 기본 500m

      // 카테고리 코드: CE7(카페), FD6(음식점), AD5(숙박), AT4(관광명소)
      const categories = ['CE7', 'FD6', 'AD5', 'AT4'];
      const allPlaces = [];

      // 여러 카테고리를 순차적으로 검색
      for (const categoryCode of categories) {
        const categoryUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${categoryCode}&x=${lng}&y=${lat}&radius=${searchRadius}&size=5&sort=distance`;

        const categoryResponse = await fetch(categoryUrl, {
          headers: {
            'Authorization': `KakaoAK ${restApiKey}`
          }
        });

        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          allPlaces.push(...categoryData.documents);
        }
      }

      // 거리순 정렬 및 중복 제거
      const uniquePlaces = Array.from(
        new Map(allPlaces.map(item => [item.id, item])).values()
      ).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      // 응답 데이터 정제
      const places = uniquePlaces.map(item => ({
        title: item.place_name,
        category: item.category_name,
        address: item.address_name,
        roadAddress: item.road_address_name,
        mapx: parseFloat(item.x),
        mapy: parseFloat(item.y),
        link: item.place_url,
        telephone: item.phone,
        id: item.id,
        categoryGroupCode: item.category_group_code,
        categoryGroupName: item.category_group_name,
        distance: item.distance
      }));

      return res.status(200).json({
        total: places.length,
        places: places
      });
    }
    // 키워드 검색
    else {
      apiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`;

      // 카카오 로컬 검색 API 호출
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `KakaoAK ${restApiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Kakao API error:', response.status, errorText);
        throw new Error(`Kakao API error: ${response.status}`);
      }

      const data = await response.json();

      // 응답 데이터 정제
      const places = data.documents.map(item => ({
        title: item.place_name,
        category: item.category_name,
        address: item.address_name,
        roadAddress: item.road_address_name,
        mapx: parseFloat(item.x),
        mapy: parseFloat(item.y),
        link: item.place_url,
        telephone: item.phone,
        id: item.id,
        categoryGroupCode: item.category_group_code,
        categoryGroupName: item.category_group_name,
        distance: item.distance
      }));

      return res.status(200).json({
        total: data.meta.total_count,
        places: places
      });
    }

  } catch (error) {
    console.error('Error fetching from Kakao API:', error);
    return res.status(500).json({
      error: 'Failed to fetch place data',
      message: error.message
    });
  }
}
