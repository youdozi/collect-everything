// 인기 검색어 조회 API
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

  const { days = 30, minResults = 5 } = req.query;

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Supabase not configured'
      });
    }

    // Supabase 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 인기 검색어 함수 호출
    const { data, error } = await supabase.rpc('get_popular_searches', {
      days: parseInt(days),
      min_results: parseInt(minResults)
    });

    if (error) throw error;

    // 카테고리 자동 추론
    const keywordsWithCategory = data.map(item => {
      let emoji = '🔍';
      let category = 'other';

      if (item.search_query.includes('카페')) {
        emoji = '☕';
        category = 'cafe';
      } else if (item.search_query.includes('맛집') || item.search_query.includes('음식')) {
        emoji = '🍽️';
        category = 'restaurant';
      } else if (item.search_query.includes('숙소') || item.search_query.includes('호텔')) {
        emoji = '🏨';
        category = 'accommodation';
      } else if (item.search_query.includes('관광') || item.search_query.includes('여행')) {
        emoji = '🏞️';
        category = 'attraction';
      }

      return {
        keyword: item.search_query,
        search_count: parseInt(item.search_count),
        avg_result_count: parseInt(item.avg_result_count),
        last_searched: item.last_searched,
        emoji,
        category
      };
    });

    return res.status(200).json({
      total: keywordsWithCategory.length,
      keywords: keywordsWithCategory
    });

  } catch (error) {
    console.error('Get popular searches error:', error);
    return res.status(500).json({
      error: 'Failed to get popular searches',
      message: error.message
    });
  }
}
