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

    // 30일 이상 된 검색 로그 삭제
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('search_logs')
      .delete()
      .lt('searched_at', thirtyDaysAgo.toISOString());

    if (error) {
      throw error;
    }

    console.log('✅ Old search logs cleaned up:', new Date().toISOString());

    return res.status(200).json({
      success: true,
      message: 'Old search logs deleted successfully',
      cutoffDate: thirtyDaysAgo.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
