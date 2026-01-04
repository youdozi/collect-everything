// ============================================
// Supabase 클라이언트 - 여행 기록장 v2.0
// ============================================

class TravelDBClient {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  // Supabase 초기화
  async init() {
    if (this.initialized) return;

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      throw new Error('Supabase not configured');
    }

    this.client = supabase.createClient(supabaseUrl, supabaseKey);
    this.initialized = true;
  }

  // ==================== 여행 (Trips) ====================

  // 모든 여행 조회
  async getAllTrips() {
    await this.init();
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // 여행 추가
  async addTrip(tripData) {
    await this.init();
    const { data, error } = await this.client
      .from('trips')
      .insert([tripData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 여행 조회 (ID)
  async getTrip(tripId) {
    await this.init();
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  }

  // 여행 수정
  async updateTrip(tripId, updates) {
    await this.init();
    const { data, error } = await this.client
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 여행 삭제
  async deleteTrip(tripId) {
    await this.init();
    const { error } = await this.client
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
    return true;
  }

  // ==================== 장소 (Places) ====================

  // 장소 추가 또는 기존 장소 반환
  async upsertPlace(placeData) {
    await this.init();

    // 네이버 장소 ID가 있으면 먼저 검색
    if (placeData.naver_place_id) {
      const { data: existing } = await this.client
        .from('places')
        .select('*')
        .eq('naver_place_id', placeData.naver_place_id)
        .single();

      if (existing) return existing;
    }

    // 없으면 새로 추가
    const { data, error } = await this.client
      .from('places')
      .insert([placeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 장소 검색
  async searchPlaces(searchTerm) {
    await this.init();
    const { data, error } = await this.client
      .from('places')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  // ==================== 방문 (Visits) ====================

  // 여행의 모든 방문 조회
  async getVisitsByTrip(tripId) {
    await this.init();
    const { data, error } = await this.client
      .from('visits')
      .select(`
        *,
        place:places(*),
        expenses(*)
      `)
      .eq('trip_id', tripId)
      .order('visit_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 방문 추가
  async addVisit(visitData) {
    await this.init();
    const { data, error } = await this.client
      .from('visits')
      .insert([visitData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 방문 수정
  async updateVisit(visitId, updates) {
    await this.init();
    const { data, error } = await this.client
      .from('visits')
      .update(updates)
      .eq('id', visitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 방문 삭제
  async deleteVisit(visitId) {
    await this.init();
    const { error } = await this.client
      .from('visits')
      .delete()
      .eq('id', visitId);

    if (error) throw error;
    return true;
  }

  // ==================== 비용 (Expenses) ====================

  // 비용 항목 추가
  async addExpense(expenseData) {
    await this.init();
    const { data, error } = await this.client
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 비용 항목 일괄 추가
  async addExpenses(expensesArray) {
    await this.init();
    const { data, error } = await this.client
      .from('expenses')
      .insert(expensesArray)
      .select();

    if (error) throw error;
    return data;
  }

  // 방문의 모든 비용 조회
  async getExpensesByVisit(visitId) {
    await this.init();
    const { data, error } = await this.client
      .from('expenses')
      .select('*')
      .eq('visit_id', visitId);

    if (error) throw error;
    return data || [];
  }

  // 비용 수정
  async updateExpense(expenseId, updates) {
    await this.init();
    const { data, error } = await this.client
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 비용 삭제
  async deleteExpense(expenseId) {
    await this.init();
    const { error } = await this.client
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
    return true;
  }

  // ==================== 통계 ====================

  // 여행별 지출 통계
  async getTripExpenseStats(tripId) {
    await this.init();
    const { data, error } = await this.client
      .from('expense_by_category')
      .select('*')
      .eq('trip_id', tripId);

    if (error) throw error;
    return data || [];
  }

  // 여행 요약 정보
  async getTripSummary(tripId) {
    await this.init();
    const { data, error } = await this.client
      .from('trip_summary')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== 사진 (Photos) ====================

  // 사진 추가
  async addPhoto(photoData) {
    await this.init();
    const { data, error } = await this.client
      .from('photos')
      .insert([photoData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 방문의 모든 사진 조회
  async getPhotosByVisit(visitId) {
    await this.init();
    const { data, error } = await this.client
      .from('photos')
      .select('*')
      .eq('visit_id', visitId)
      .order('taken_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 사진 삭제
  async deletePhoto(photoId) {
    await this.init();
    const { error } = await this.client
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
    return true;
  }

  // 원시 클라이언트 접근 (키워드 관리 등에서 사용)
  async getClient() {
    await this.init();
    return this.client;
  }
}

// 싱글톤 인스턴스 생성
const travelDB = new TravelDBClient();

// 전역으로 노출 (하위 호환성)
window.supabaseClient = null;

// Supabase 클라이언트를 전역으로 사용 가능하도록 초기화
(async () => {
  await travelDB.init();
  window.supabaseClient = travelDB.client;
})();
