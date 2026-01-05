// 자동 키워드 생성 API
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const restApiKey = process.env.KAKAO_REST_API_KEY;

    if (!restApiKey) {
      return res.status(500).json({
        error: 'Kakao API key not configured'
      });
    }

    // 주요 지역
    const regions = [
      '강남', '홍대', '제주', '부산', '성수', '여의도',
      '인천', '대구', '광주', '대전', '경주', '전주',
      '강릉', '속초', '여수', '포항', '울산', '수원'
    ];

    // 카테고리
    const categories = [
      { name: '카페', emoji: '☕', category: 'cafe' },
      { name: '맛집', emoji: '🍽️', category: 'restaurant' },
      { name: '숙소', emoji: '🏨', category: 'accommodation' },
      { name: '관광지', emoji: '🏞️', category: 'attraction' }
    ];

    const validKeywords = [];

    // 각 조합 생성 및 검증
    for (const region of regions) {
      for (const cat of categories) {
        const keyword = `${region} ${cat.name}`;

        try {
          // 카카오 API로 검증
          const apiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&size=1`;
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `KakaoAK ${restApiKey}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const resultCount = data.meta.total_count;

            // 결과가 10개 이상인 것만 추가
            if (resultCount >= 10) {
              validKeywords.push({
                keyword: keyword,
                emoji: cat.emoji,
                category: cat.category,
                result_count: resultCount,
                region: region,
                category_name: cat.name
              });
            }
          }

          // API 호출 제한 방지 (100ms 대기)
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Failed to validate keyword: ${keyword}`, error);
        }
      }
    }

    // 결과 많은 순으로 정렬
    validKeywords.sort((a, b) => b.result_count - a.result_count);

    return res.status(200).json({
      total: validKeywords.length,
      keywords: validKeywords
    });

  } catch (error) {
    console.error('Auto-generate keywords error:', error);
    return res.status(500).json({
      error: 'Failed to generate keywords',
      message: error.message
    });
  }
}
