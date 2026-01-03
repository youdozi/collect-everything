// 데이터 저장소
let places = [];
let useDatabase = true; // Supabase 사용 여부

// 카테고리 이모지 맵
const categoryEmoji = {
    cafe: '☕',
    restaurant: '🍽️',
    tourist: '🏞️'
};

// 카테고리 한글 이름
const categoryNames = {
    cafe: '카페',
    restaurant: '음식점',
    tourist: '여행지'
};

// DOM 요소
const placeForm = document.getElementById('placeForm');
const placesList = document.getElementById('placesList');
const filterCategory = document.getElementById('filterCategory');
const searchInput = document.getElementById('searchInput');
const naverSearchInput = document.getElementById('naverSearchInput');
const naverSearchBtn = document.getElementById('naverSearchBtn');
const searchResults = document.getElementById('searchResults');

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 사용 가능 여부 확인
    if (typeof window.SUPABASE_URL === 'undefined' || !window.SUPABASE_URL) {
        useDatabase = false;
        showMessage('⚠️ 로컬 저장소 모드로 실행 중입니다', 'warning');
    }

    await loadPlaces();
    renderPlaces();
    updateStats();

    // 이벤트 리스너
    placeForm.addEventListener('submit', handleAddPlace);
    filterCategory.addEventListener('change', renderPlaces);
    searchInput.addEventListener('input', renderPlaces);
    naverSearchBtn.addEventListener('click', handleNaverSearch);
    naverSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNaverSearch();
    });
});

// 네이버 지도 검색
async function handleNaverSearch() {
    const query = naverSearchInput.value.trim();
    if (!query) {
        showMessage('검색어를 입력하세요', 'warning');
        return;
    }

    searchResults.innerHTML = '<div class="search-loading">🔍 검색 중...</div>';

    try {
        const response = await fetch(`/api/search-place?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error('검색 실패');
        }

        const data = await response.json();

        if (!data.places || data.places.length === 0) {
            searchResults.innerHTML = '<div class="search-loading">검색 결과가 없습니다</div>';
            return;
        }

        renderSearchResults(data.places);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `
            <div class="search-error">
                ❌ 검색 중 오류가 발생했습니다.
                네이버 API 설정을 확인하세요.
            </div>
        `;
    }
}

// 검색 결과 렌더링
function renderSearchResults(results) {
    searchResults.innerHTML = results.map((place, index) => `
        <div class="search-result-item">
            <div class="search-result-info">
                <h4>${place.title}</h4>
                <p>📍 ${place.roadAddress || place.address}</p>
                <span class="search-result-category">${place.category}</span>
            </div>
            <button class="btn-add-from-search" onclick="addFromSearch(${index})">
                추가하기
            </button>
        </div>
    `).join('');

    // 검색 결과를 전역 변수에 저장
    window.searchResultsData = results;
}

// 검색 결과에서 장소 추가
async function addFromSearch(index) {
    const place = window.searchResultsData[index];

    // 카테고리 자동 분류
    let category = 'tourist'; // 기본값
    const categoryLower = place.category.toLowerCase();
    if (categoryLower.includes('카페') || categoryLower.includes('cafe')) {
        category = 'cafe';
    } else if (categoryLower.includes('음식') || categoryLower.includes('restaurant') || categoryLower.includes('맛집')) {
        category = 'restaurant';
    }

    const newPlace = {
        name: place.title,
        category: category,
        address: place.address,
        road_address: place.roadAddress,
        latitude: place.mapy / 10000000, // 좌표 변환
        longitude: place.mapx / 10000000,
        naver_category: place.category,
        phone: place.telephone || null,
        user_rating: null,
        description: '',
        tags: []
    };

    try {
        if (useDatabase) {
            await supabaseClient.addPlace(newPlace);
        } else {
            newPlace.id = Date.now();
            newPlace.created_at = new Date().toISOString();
            places.push(newPlace);
            savePlacesToLocal();
        }

        await loadPlaces();
        renderPlaces();
        updateStats();
        showMessage(`${place.title}이(가) 추가되었습니다! ✅`);

        // 검색 결과 초기화
        searchResults.innerHTML = '';
        naverSearchInput.value = '';
    } catch (error) {
        console.error('Error adding place:', error);
        showMessage('장소 추가 실패: ' + error.message, 'error');
    }
}

// 장소 추가 핸들러
async function handleAddPlace(e) {
    e.preventDefault();

    const tags = document.getElementById('tags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

    const newPlace = {
        name: document.getElementById('placeName').value,
        category: document.getElementById('category').value,
        address: document.getElementById('location').value,
        road_address: null,
        latitude: null,
        longitude: null,
        user_rating: document.getElementById('rating').value ? parseInt(document.getElementById('rating').value) : null,
        description: document.getElementById('description').value,
        tags: tags,
        phone: null,
        naver_category: null
    };

    try {
        if (useDatabase) {
            await supabaseClient.addPlace(newPlace);
        } else {
            newPlace.id = Date.now();
            newPlace.created_at = new Date().toISOString();
            places.push(newPlace);
            savePlacesToLocal();
        }

        await loadPlaces();
        renderPlaces();
        updateStats();

        // 폼 초기화
        placeForm.reset();
        showMessage('장소가 추가되었습니다! ✅');
    } catch (error) {
        console.error('Error adding place:', error);
        showMessage('장소 추가 실패: ' + error.message, 'error');
    }
}

// 장소 삭제
async function deletePlace(id) {
    if (!confirm('정말로 이 장소를 삭제하시겠습니까?')) {
        return;
    }

    try {
        if (useDatabase) {
            await supabaseClient.deletePlace(id);
        } else {
            places = places.filter(place => place.id !== id);
            savePlacesToLocal();
        }

        await loadPlaces();
        renderPlaces();
        updateStats();
        showMessage('장소가 삭제되었습니다. 🗑️');
    } catch (error) {
        console.error('Error deleting place:', error);
        showMessage('삭제 실패: ' + error.message, 'error');
    }
}

// 장소 렌더링
function renderPlaces() {
    const category = filterCategory.value;
    const searchTerm = searchInput.value.toLowerCase();

    // 필터링
    let filteredPlaces = places;

    if (category !== 'all') {
        filteredPlaces = filteredPlaces.filter(place => place.category === category);
    }

    if (searchTerm) {
        filteredPlaces = filteredPlaces.filter(place =>
            place.name.toLowerCase().includes(searchTerm) ||
            (place.address && place.address.toLowerCase().includes(searchTerm)) ||
            (place.description && place.description.toLowerCase().includes(searchTerm))
        );
    }

    // 최신순 정렬
    filteredPlaces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 렌더링
    if (filteredPlaces.length === 0) {
        placesList.innerHTML = `
            <div class="empty-state">
                <p>검색 결과가 없습니다.</p>
                <p>다른 조건으로 검색해보세요!</p>
            </div>
        `;
        return;
    }

    placesList.innerHTML = filteredPlaces.map(place => createPlaceCard(place)).join('');
}

// 장소 카드 생성
function createPlaceCard(place) {
    const stars = place.user_rating ? '⭐'.repeat(parseInt(place.user_rating)) : '';
    const tagsHtml = place.tags && place.tags.length > 0
        ? `<div class="place-tags">
            ${place.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
           </div>`
        : '';

    const descriptionHtml = place.description
        ? `<div class="place-description">${place.description}</div>`
        : '';

    const address = place.road_address || place.address;
    const date = new Date(place.created_at).toLocaleDateString('ko-KR');

    return `
        <div class="place-card">
            <div class="place-header">
                <h3 class="place-title">${categoryEmoji[place.category]} ${place.name}</h3>
                <span class="place-category category-${place.category}">
                    ${categoryNames[place.category]}
                </span>
            </div>
            <div class="place-location">📍 ${address}</div>
            ${stars ? `<div class="place-rating">${stars}</div>` : ''}
            ${descriptionHtml}
            ${tagsHtml}
            <div class="place-meta">
                <span>등록일: ${date}</span>
                <button class="btn-delete" onclick="deletePlace('${place.id}')">삭제</button>
            </div>
        </div>
    `;
}

// 통계 업데이트
function updateStats() {
    document.getElementById('totalCount').textContent = places.length;
    document.getElementById('cafeCount').textContent =
        places.filter(p => p.category === 'cafe').length;
    document.getElementById('restaurantCount').textContent =
        places.filter(p => p.category === 'restaurant').length;
    document.getElementById('touristCount').textContent =
        places.filter(p => p.category === 'tourist').length;
}

// 로컬 스토리지에 저장
function savePlacesToLocal() {
    localStorage.setItem('koreanPlaces', JSON.stringify(places));
}

// 데이터 불러오기 (Supabase 또는 로컬)
async function loadPlaces() {
    try {
        if (useDatabase) {
            places = await supabaseClient.getAllPlaces();
        } else {
            const stored = localStorage.getItem('koreanPlaces');
            places = stored ? JSON.parse(stored) : [];
        }
    } catch (error) {
        console.error('Error loading places:', error);
        showMessage('데이터 로드 실패, 로컬 모드로 전환합니다', 'warning');
        useDatabase = false;
        const stored = localStorage.getItem('koreanPlaces');
        places = stored ? JSON.parse(stored) : [];
    }
}

// 메시지 표시
function showMessage(message, type = 'success') {
    // 기존 메시지가 있으면 제거
    const existingMessage = document.querySelector('.toast-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
