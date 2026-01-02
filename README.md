# 🇰🇷 국내 장소 정보 모음

국내 카페, 음식점, 여행지 정보를 **네이버 지도에서 검색**하고 쉽게 수집 및 관리할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🔥 새로운 기능 (v2.0)
- **🔍 네이버 지도 검색**: 네이버 API로 실제 장소 검색
- **☁️ 클라우드 DB**: Supabase PostgreSQL 데이터베이스 연동
- **🌐 서버리스**: Vercel Serverless Functions로 API 프록시
- **📍 자동 정보 입력**: 주소, 전화번호, 카테고리 자동 채움
- **💾 하이브리드 저장**: DB 미설정 시 로컬 스토리지로 자동 전환

### 기존 기능
- **장소 추가**: 카페, 음식점, 여행지 정보를 간편하게 등록
- **카테고리 분류**: 세 가지 카테고리로 장소를 체계적으로 관리
- **평점 시스템**: 1~5점 별점으로 장소 평가
- **태그 기능**: 장소의 특징을 태그로 표시
- **검색 & 필터**: 장소명, 위치로 검색하고 카테고리별 필터링
- **통계 대시보드**: 카테고리별 장소 수 실시간 확인

## 🏗️ 아키텍처

```
프론트엔드 (HTML/CSS/JS)
    ↓
Vercel Serverless Functions
    ↓
네이버 지도 API
    +
Supabase PostgreSQL DB
```

## 🚀 빠른 시작

### 간단한 로컬 실행 (DB 없이)

```bash
# 저장소 클론
git clone <repository-url>
cd collect-everything

# 로컬 서버 실행
python -m http.server 8000
# 또는
npx http-server -p 8000

# 브라우저에서 http://localhost:8000 접속
```

⚠️ **로컬에서는 로컬 스토리지 모드로 작동**합니다. 네이버 검색 기능은 Vercel 배포 후 사용 가능합니다.

### 완전한 설정 (DB + 네이버 API)

자세한 설정은 **[SETUP.md](./SETUP.md)** 문서를 참조하세요.

**요약:**
1. Supabase 프로젝트 생성 및 테이블 설정
2. 네이버 개발자 센터에서 API 키 발급
3. Vercel에 배포 및 환경 변수 설정

## 📦 프로젝트 구조

```
collect-everything/
├── index.html              # 메인 HTML 파일
├── style.css               # 스타일시트
├── app.js                  # 메인 JavaScript 로직
├── supabase-client.js      # Supabase DB 클라이언트
├── config.example.js       # 환경 변수 예제
├── config.js               # 환경 변수 (gitignore)
├── api/
│   └── search-place.js     # Vercel Serverless Function (네이버 API)
├── supabase-schema.sql     # DB 스키마
├── package.json            # NPM 설정
├── .env.example            # Vercel 환경 변수 예제
├── SETUP.md                # 설정 가이드
└── README.md               # 이 파일
```

## 🛠️ 기술 스택

### 프론트엔드
- HTML5
- CSS3 (Flexbox, Animations)
- Vanilla JavaScript (ES6+)

### 백엔드 & 인프라
- **Vercel**: Hosting & Serverless Functions
- **Supabase**: PostgreSQL Database
- **네이버 지도 API**: 장소 검색

## 📝 사용 방법

### 1. 네이버 지도에서 검색

1. "네이버 지도에서 검색" 섹션에 검색어 입력 (예: "강남 카페")
2. 검색 결과에서 원하는 장소의 "추가하기" 버튼 클릭
3. 자동으로 주소, 전화번호, 카테고리가 입력되어 저장됨

### 2. 직접 장소 추가

1. "새 장소 추가" 섹션에서 정보 직접 입력
   - 장소명: 필수
   - 카테고리: 카페/음식점/여행지 중 선택
   - 위치: 필수
   - 평점: 선택사항 (1~5점)
   - 설명: 선택사항
   - 태그: 쉼표로 구분
2. "장소 추가" 버튼 클릭

### 3. 장소 검색 및 관리

- **카테고리 필터**: 드롭다운에서 원하는 카테고리 선택
- **검색**: 검색창에 장소명 또는 위치 입력
- **삭제**: 각 장소 카드의 "삭제" 버튼 클릭

## 💾 데이터 저장

### 클라우드 모드 (Supabase 설정 시)
- PostgreSQL 데이터베이스에 영구 저장
- 어디서나 접속 가능
- 무료 500MB 제공

### 로컬 모드 (Supabase 미설정 시)
- 브라우저 로컬 스토리지에 저장
- 같은 브라우저에서만 접근 가능
- 브라우저 캐시 삭제 시 데이터 손실

## 🌐 배포

### Vercel (추천)

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

자세한 배포 방법은 [SETUP.md](./SETUP.md) 참조

## 📊 무료 할당량

| 서비스 | 무료 제공량 |
|--------|------------|
| **Vercel** | 100GB 대역폭/월, 무제한 요청 |
| **Supabase** | 500MB DB, 무제한 API 요청 |
| **네이버 API** | 25,000건/일 |

일반적인 개인 사용에는 충분합니다!

## 🔒 보안

- API 키는 Vercel 환경 변수에 안전하게 저장
- Supabase Row Level Security (RLS) 적용
- config.js는 .gitignore에 포함 (버전 관리 제외)

## 🎨 주요 특징

- **직관적인 UI**: 한국어 기반의 사용하기 쉬운 인터페이스
- **아름다운 디자인**: 모던한 그라디언트와 카드 레이아웃
- **실시간 업데이트**: 통계와 목록이 실시간으로 업데이트
- **부드러운 애니메이션**: 사용자 경험을 향상시키는 자연스러운 전환 효과
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원

## 🔮 향후 계획

- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 이미지 업로드 기능
- [ ] 카카오맵/네이버맵 연동
- [ ] 즐겨찾기 기능
- [ ] 방문 기록 및 체크리스트
- [ ] 다크 모드 지원
- [ ] 데이터 내보내기/가져오기 (CSV, JSON)
- [ ] PWA (모바일 앱처럼 설치 가능)

## 🐛 문제 해결

### 네이버 검색이 작동하지 않을 때
1. Vercel 환경 변수 설정 확인
2. 네이버 개발자 센터에서 도메인 추가 확인
3. 브라우저 콘솔(F12)에서 에러 메시지 확인

### 데이터가 저장되지 않을 때
1. config.js 파일 존재 및 설정 확인
2. Supabase 프로젝트 활성 상태 확인
3. 브라우저 콘솔에서 에러 확인

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

---

**Made with ❤️ for Korean food and travel lovers**

🌟 이 프로젝트가 유용하다면 Star를 눌러주세요!
