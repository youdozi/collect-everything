// 데이터 저장소
let places = [];

// 로컬 스토리지 키
const STORAGE_KEY = 'koreanPlaces';

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

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadPlaces();
    renderPlaces();
    updateStats();

    // 이벤트 리스너
    placeForm.addEventListener('submit', handleAddPlace);
    filterCategory.addEventListener('change', renderPlaces);
    searchInput.addEventListener('input', renderPlaces);
});

// 장소 추가 핸들러
function handleAddPlace(e) {
    e.preventDefault();

    const newPlace = {
        id: Date.now(),
        name: document.getElementById('placeName').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        rating: document.getElementById('rating').value,
        description: document.getElementById('description').value,
        tags: document.getElementById('tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== ''),
        createdAt: new Date().toISOString()
    };

    places.push(newPlace);
    savePlaces();
    renderPlaces();
    updateStats();

    // 폼 초기화
    placeForm.reset();

    // 성공 메시지
    showMessage('장소가 추가되었습니다! ✅');
}

// 장소 삭제
function deletePlace(id) {
    if (confirm('정말로 이 장소를 삭제하시겠습니까?')) {
        places = places.filter(place => place.id !== id);
        savePlaces();
        renderPlaces();
        updateStats();
        showMessage('장소가 삭제되었습니다. 🗑️');
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
            place.location.toLowerCase().includes(searchTerm) ||
            place.description.toLowerCase().includes(searchTerm)
        );
    }

    // 최신순 정렬
    filteredPlaces.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
    const stars = place.rating ? '⭐'.repeat(parseInt(place.rating)) : '';
    const tagsHtml = place.tags.length > 0
        ? `<div class="place-tags">
            ${place.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
           </div>`
        : '';

    const descriptionHtml = place.description
        ? `<div class="place-description">${place.description}</div>`
        : '';

    const date = new Date(place.createdAt).toLocaleDateString('ko-KR');

    return `
        <div class="place-card">
            <div class="place-header">
                <h3 class="place-title">${categoryEmoji[place.category]} ${place.name}</h3>
                <span class="place-category category-${place.category}">
                    ${categoryNames[place.category]}
                </span>
            </div>
            <div class="place-location">📍 ${place.location}</div>
            ${stars ? `<div class="place-rating">${stars}</div>` : ''}
            ${descriptionHtml}
            ${tagsHtml}
            <div class="place-meta">
                <span>등록일: ${date}</span>
                <button class="btn-delete" onclick="deletePlace(${place.id})">삭제</button>
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
function savePlaces() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

// 로컬 스토리지에서 불러오기
function loadPlaces() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        places = JSON.parse(stored);
    }
}

// 메시지 표시
function showMessage(message) {
    // 기존 메시지가 있으면 제거
    const existingMessage = document.querySelector('.toast-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
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
    }, 2000);
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
