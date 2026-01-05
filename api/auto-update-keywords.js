const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // Vercel Cron 요청 검증
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 지난 7일간 인기 검색어 가져오기
    const { data: popularSearches, error: searchError } = await supabase.rpc('get_popular_searches', {
      days: 7,
      min_results: 10
    });

    if (searchError) {
      throw searchError;
    }

    if (!popularSearches || popularSearches.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No popular searches found',
        added: 0
      });
    }

    // 상위 5개를 인기 키워드로 자동 추가
    const topKeywords = popularSearches.slice(0, 5);
    let addedCount = 0;

    for (const search of topKeywords) {
      // 중복 체크
      const { data: existing } = await supabase
        .from('popular_keywords')
        .select('id')
        .eq('keyword', search.search_query)
        .single();

      if (!existing) {
        // 이모지와 카테고리 추론
        let emoji = '🔍';
        let category = 'other';

        if (search.search_query.includes('카페')) {
          emoji = '☕';
          category = 'cafe';
        } else if (search.search_query.includes('맛집') || search.search_query.includes('음식')) {
          emoji = '🍽️';
          category = 'restaurant';
        } else if (search.search_query.includes('숙소') || search.search_query.includes('호텔')) {
          emoji = '🏨';
          category = 'accommodation';
        } else if (search.search_query.includes('관광') || search.search_query.includes('여행')) {
          emoji = '🏞️';
          category = 'attraction';
        }

        // 현재 최대 order 값 가져오기
        const { data: maxOrder } = await supabase
          .from('popular_keywords')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1)
          .single();

        const newOrder = (maxOrder?.display_order || 0) + 1;

        // 키워드 추가
        const { error: insertError } = await supabase
          .from('popular_keywords')
          .insert({
            keyword: search.search_query,
            emoji: emoji,
            category: category,
            display_order: newOrder,
            is_active: true
          });

        if (!insertError) {
          addedCount++;
        }
      }
    }

    console.log(`✅ Auto-updated keywords: ${addedCount} added`);

    return res.status(200).json({
      success: true,
      message: `Successfully added ${addedCount} new keywords`,
      added: addedCount,
      candidates: topKeywords.map(k => k.search_query),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Auto-update error:', error);
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
