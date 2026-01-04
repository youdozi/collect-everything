// ============================================
// Supabase Auth 클라이언트
// ============================================

class AuthClient {
  constructor() {
    this.client = null;
    this.currentUser = null;
    this.currentUserProfile = null;
  }

  async init() {
    if (this.client) return;

    const { createClient } = supabase;
    this.client = createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    // 현재 세션 확인
    const { data: { session } } = await this.client.auth.getSession();
    if (session) {
      this.currentUser = session.user;
      await this.loadUserProfile();
    }

    // 인증 상태 변경 리스너
    this.client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session) {
        this.currentUser = session.user;
        this.loadUserProfile();
      } else {
        this.currentUser = null;
        this.currentUserProfile = null;
      }

      // UI 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: this.currentUser, profile: this.currentUserProfile }
      }));
    });
  }

  // ============================================
  // 사용자 프로필 로드
  // ============================================

  async loadUserProfile() {
    if (!this.currentUser) return null;

    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;
      this.currentUserProfile = data;
      return data;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  // ============================================
  // 회원가입
  // ============================================

  async signUp(email, password, displayName = null) {
    await this.init();

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) throw error;

    // 이메일 확인 필요 여부 체크
    if (data.user && !data.session) {
      return {
        success: true,
        message: '이메일 확인 링크를 전송했습니다. 이메일을 확인해주세요.',
        needsEmailConfirmation: true
      };
    }

    return {
      success: true,
      message: '회원가입이 완료되었습니다!',
      user: data.user
    };
  }

  // ============================================
  // 로그인
  // ============================================

  async signIn(email, password) {
    await this.init();

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this.currentUser = data.user;
    await this.loadUserProfile();

    return {
      success: true,
      user: data.user,
      profile: this.currentUserProfile
    };
  }

  // ============================================
  // 로그아웃
  // ============================================

  async signOut() {
    await this.init();

    const { error } = await this.client.auth.signOut();
    if (error) throw error;

    this.currentUser = null;
    this.currentUserProfile = null;

    return { success: true };
  }

  // ============================================
  // 현재 사용자 정보
  // ============================================

  async getCurrentUser() {
    await this.init();
    return this.currentUser;
  }

  async getCurrentUserProfile() {
    await this.init();
    if (!this.currentUserProfile && this.currentUser) {
      await this.loadUserProfile();
    }
    return this.currentUserProfile;
  }

  // ============================================
  // 권한 확인
  // ============================================

  async isAdmin() {
    const profile = await this.getCurrentUserProfile();
    return profile?.role === 'admin';
  }

  async isViewer() {
    const profile = await this.getCurrentUserProfile();
    return profile?.role === 'viewer';
  }

  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // ============================================
  // 비밀번호 재설정
  // ============================================

  async resetPassword(email) {
    await this.init();

    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    if (error) throw error;

    return {
      success: true,
      message: '비밀번호 재설정 링크를 이메일로 전송했습니다.'
    };
  }

  async updatePassword(newPassword) {
    await this.init();

    const { error } = await this.client.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return {
      success: true,
      message: '비밀번호가 변경되었습니다.'
    };
  }

  // ============================================
  // 프로필 업데이트
  // ============================================

  async updateProfile(updates) {
    await this.init();

    if (!this.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    // role은 업데이트 불가 (RLS 정책에서 막힘)
    const { role, ...safeUpdates } = updates;

    const { data, error } = await this.client
      .from('users')
      .update(safeUpdates)
      .eq('id', this.currentUser.id)
      .select()
      .single();

    if (error) throw error;

    this.currentUserProfile = data;
    return data;
  }
}

// 전역 인스턴스 생성
const authClient = new AuthClient();

// 전역 객체로 노출
window.authClient = authClient;
