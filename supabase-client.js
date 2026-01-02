// Supabase 클라이언트 설정
// CDN을 통해 Supabase JS 클라이언트 사용

class SupabaseClient {
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

    // Supabase 클라이언트 생성
    this.client = supabase.createClient(supabaseUrl, supabaseKey);
    this.initialized = true;
  }

  // 장소 추가
  async addPlace(placeData) {
    await this.init();

    const { data, error } = await this.client
      .from('places')
      .insert([placeData])
      .select()
      .single();

    if (error) {
      console.error('Error adding place:', error);
      throw error;
    }

    return data;
  }

  // 모든 장소 조회
  async getAllPlaces() {
    await this.init();

    const { data, error } = await this.client
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching places:', error);
      throw error;
    }

    return data || [];
  }

  // 카테고리별 장소 조회
  async getPlacesByCategory(category) {
    await this.init();

    const { data, error } = await this.client
      .from('places')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching places by category:', error);
      throw error;
    }

    return data || [];
  }

  // 장소 검색 (이름, 주소로 검색)
  async searchPlaces(searchTerm) {
    await this.init();

    const { data, error } = await this.client
      .from('places')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching places:', error);
      throw error;
    }

    return data || [];
  }

  // 장소 삭제
  async deletePlace(id) {
    await this.init();

    const { error } = await this.client
      .from('places')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting place:', error);
      throw error;
    }

    return true;
  }

  // 장소 업데이트
  async updatePlace(id, updates) {
    await this.init();

    const { data, error } = await this.client
      .from('places')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating place:', error);
      throw error;
    }

    return data;
  }

  // 통계 조회
  async getStats() {
    await this.init();

    const { data, error } = await this.client
      .from('places_stats')
      .select('*');

    if (error) {
      console.error('Error fetching stats:', error);
      return null;
    }

    return data;
  }
}

// 싱글톤 인스턴스 생성
const supabaseClient = new SupabaseClient();
