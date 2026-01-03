// ============================================
// 여행 기록장 메인 JavaScript v2.0
// ============================================

// 전역 상태
let currentTrip = null;
let currentView = 'trips'; // 'trips' or 'detail'
let expenseItemCount = 0;

// 카테고리 이모지
const CATEGORY_EMOJI = {
  cafe: '☕',
  restaurant: '🍽️',
  accommodation: '🏨',
  attraction: '🏞️',
  shopping: '🛍️',
  transport: '🚗',
  other: '📌'
};

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // 이벤트 리스너 등록
  initEventListeners();

  // 여행 목록 로드
  await loadTrips();
});

function initEventListeners() {
  // 새 여행 추가 버튼
  document.getElementById('btnNewTrip').addEventListener('click', () => {
    openModal('modalNewTrip');
  });

  // 새 여행 폼 제출
  document.getElementById('formNewTrip').addEventListener('submit', handleAddTrip);

  // 뒤로가기 버튼
  document.getElementById('btnBack').addEventListener('click', () => {
    showTripsView();
  });

  // 방문 추가 버튼
  document.getElementById('btnAddVisit').addEventListener('click', () => {
    openModal('modalAddVisit');
  });

  // 방문 추가 폼 제출
  document.getElementById('formAddVisit').addEventListener('submit', handleAddVisit);

  // 네이버 검색
  document.getElementById('btnPlaceSearch').addEventListener('click', handleNaverSearch);
  document.getElementById('placeSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNaverSearch();
    }
  });

  // 비용 항목 추가
  document.getElementById('btnAddExpense').addEventListener('click', addExpenseRow);

  // 여행 필터
  document.getElementById('tripFilter').addEventListener('change', handleTripFilter);
}

// ============================================
// 모달 관리
// ============================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');

  // 모달이 열릴 때 초기화
  if (modalId === 'modalAddVisit') {
    resetVisitForm();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
}

// 전역 함수로 노출 (HTML onclick에서 사용)
window.closeModal = closeModal;

// ============================================
// 여행 관리
// ============================================

async function loadTrips() {
  try {
    const trips = await travelDB.getAllTrips();
    renderTrips(trips);
  } catch (error) {
    console.error('Failed to load trips:', error);
    showMessage('여행 목록을 불러올 수 없습니다', 'error');
  }
}

async function handleAddTrip(e) {
  e.preventDefault();

  const tripData = {
    title: document.getElementById('tripTitle').value,
    destination: document.getElementById('tripDestination').value,
    start_date: document.getElementById('tripStartDate').value,
    end_date: document.getElementById('tripEndDate').value || null,
    total_budget: parseFloat(document.getElementById('tripBudget').value) || null,
    description: document.getElementById('tripDescription').value
  };

  try {
    await travelDB.addTrip(tripData);
    closeModal('modalNewTrip');
    document.getElementById('formNewTrip').reset();
    await loadTrips();
    showMessage('여행이 추가되었습니다! ✈️');
  } catch (error) {
    console.error('Failed to add trip:', error);
    showMessage('여행 추가에 실패했습니다', 'error');
  }
}

function renderTrips(trips) {
  const container = document.getElementById('tripsList');

  if (trips.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>아직 등록된 여행이 없습니다</p>
        <p>새 여행을 추가해보세요!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = trips.map(trip => createTripCard(trip)).join('');
}

function createTripCard(trip) {
  const startDate = new Date(trip.start_date).toLocaleDateString('ko-KR');
  const endDate = trip.end_date ? new Date(trip.end_date).toLocaleDateString('ko-KR') : '진행중';

  const budget = trip.total_budget ? `${trip.total_budget.toLocaleString()}원` : '-';
  const spent = trip.total_spent ? `${trip.total_spent.toLocaleString()}원` : '0원';

  return `
    <div class="trip-card" onclick="showTripDetail('${trip.id}')">
      <div class="trip-card-header">
        <h3>${trip.title}</h3>
        <div class="trip-card-date">${startDate} ~ ${endDate}</div>
      </div>
      ${trip.destination ? `<div class="trip-card-destination">📍 ${trip.destination}</div>` : ''}
      <div class="trip-card-stats">
        <div class="trip-stat">
          <span class="trip-stat-label">예산</span>
          <span class="trip-stat-value">${budget}</span>
        </div>
        <div class="trip-stat">
          <span class="trip-stat-label">지출</span>
          <span class="trip-stat-value">${spent}</span>
        </div>
      </div>
    </div>
  `;
}

// 전역 함수로 노출
window.showTripDetail = async function(tripId) {
  try {
    const trip = await travelDB.getTrip(tripId);
    currentTrip = trip;
    await loadTripDetail(tripId);
    showDetailView();
  } catch (error) {
    console.error('Failed to load trip detail:', error);
    showMessage('여행 정보를 불러올 수 없습니다', 'error');
  }
};

async function loadTripDetail(tripId) {
  try {
    const [trip, visits] = await Promise.all([
      travelDB.getTrip(tripId),
      travelDB.getVisitsByTrip(tripId)
    ]);

    // 헤더 업데이트
    document.getElementById('detailTripTitle').textContent = trip.title;
    const startDate = new Date(trip.start_date).toLocaleDateString('ko-KR');
    const endDate = trip.end_date ? new Date(trip.end_date).toLocaleDateString('ko-KR') : '진행중';
    document.getElementById('detailTripDate').textContent = `${startDate} ~ ${endDate}`;

    // 통계 업데이트
    document.getElementById('detailBudget').textContent =
      trip.total_budget ? `${trip.total_budget.toLocaleString()}원` : '-';
    document.getElementById('detailSpent').textContent =
      `${(trip.total_spent || 0).toLocaleString()}원`;
    document.getElementById('detailVisitCount').textContent = `${visits.length}곳`;

    // 방문 목록 렌더링
    renderVisits(visits);
  } catch (error) {
    console.error('Failed to load trip detail:', error);
    throw error;
  }
}

function renderVisits(visits) {
  const container = document.getElementById('visitsList');

  if (visits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>아직 방문 기록이 없습니다</p>
        <p>방문한 장소를 추가해보세요!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = visits.map(visit => createVisitItem(visit)).join('');
}

function createVisitItem(visit) {
  const visitDate = new Date(visit.visit_date).toLocaleString('ko-KR');
  const rating = visit.rating ? '⭐'.repeat(visit.rating) : '';
  const category = CATEGORY_EMOJI[visit.place.category] || '📌';

  let expensesHtml = '';
  if (visit.expenses && visit.expenses.length > 0) {
    const totalExpense = visit.expenses.reduce((sum, e) => sum + (e.price * e.quantity), 0);
    expensesHtml = `
      <div class="visit-expenses">
        <strong>💰 지출 내역 (총 ${totalExpense.toLocaleString()}원)</strong>
        <div class="expense-list">
          ${visit.expenses.map(e => `
            <div class="expense-item">
              <span class="expense-name">${e.item_name} ${e.quantity > 1 ? `x${e.quantity}` : ''}</span>
              <span class="expense-price">${(e.price * e.quantity).toLocaleString()}원</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="visit-item">
      <div class="visit-header">
        <div>
          <div class="visit-title">${visit.place.name}</div>
          <div class="visit-time">${visitDate}</div>
        </div>
        <div class="visit-category">${category}</div>
      </div>
      ${rating ? `<div class="visit-rating">${rating}</div>` : ''}
      ${visit.place.address ? `<div class="visit-location">📍 ${visit.place.address}</div>` : ''}
      ${visit.notes ? `<div class="visit-notes">${visit.notes}</div>` : ''}
      ${expensesHtml}
    </div>
  `;
}

// ============================================
// 방문 추가
// ============================================

async function handleAddVisit(e) {
  e.preventDefault();

  if (!currentTrip) {
    showMessage('여행을 선택해주세요', 'error');
    return;
  }

  try {
    // 1. 장소 추가 또는 기존 장소 가져오기
    const placeData = {
      name: document.getElementById('visitPlaceName').value,
      category: document.getElementById('visitCategory').value,
      address: document.getElementById('visitAddress').value,
      naver_place_id: document.getElementById('selectedPlaceId').value || null
    };

    const place = await travelDB.upsertPlace(placeData);

    // 2. 방문 기록 추가
    const visitData = {
      trip_id: currentTrip.id,
      place_id: place.id,
      visit_date: document.getElementById('visitDate').value,
      rating: document.getElementById('visitRating').value ?
        parseInt(document.getElementById('visitRating').value) : null,
      notes: document.getElementById('visitNotes').value
    };

    const visit = await travelDB.addVisit(visitData);

    // 3. 비용 항목 추가
    const expenses = collectExpenseData(visit.id);
    if (expenses.length > 0) {
      await travelDB.addExpenses(expenses);
    }

    // 완료
    closeModal('modalAddVisit');
    await loadTripDetail(currentTrip.id);
    showMessage('방문 기록이 추가되었습니다! 📝');
  } catch (error) {
    console.error('Failed to add visit:', error);
    showMessage('방문 추가에 실패했습니다', 'error');
  }
}

function collectExpenseData(visitId) {
  const expenses = [];
  const container = document.getElementById('expenseItems');
  const rows = container.querySelectorAll('.expense-input-row');

  rows.forEach(row => {
    const name = row.querySelector('[name="expenseName"]').value.trim();
    const price = parseFloat(row.querySelector('[name="expensePrice"]').value);
    const quantity = parseInt(row.querySelector('[name="expenseQuantity"]').value);

    if (name && price) {
      expenses.push({
        visit_id: visitId,
        item_name: name,
        category: 'food', // 기본값, 추후 개선 가능
        price: price,
        quantity: quantity || 1
      });
    }
  });

  return expenses;
}

function resetVisitForm() {
  document.getElementById('formAddVisit').reset();
  document.getElementById('selectedPlaceId').value = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('expenseItems').innerHTML = '';
  expenseItemCount = 0;

  // 현재 날짜/시간 설정
  const now = new Date();
  const dateString = now.toISOString().slice(0, 16);
  document.getElementById('visitDate').value = dateString;
}

// ============================================
// 네이버 검색
// ============================================

async function handleNaverSearch() {
  const query = document.getElementById('placeSearchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '<div class="search-loading">🔍 검색 중...</div>';

  try {
    const response = await fetch(`/api/search-place?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      resultsContainer.innerHTML = '<div class="search-loading">검색 결과가 없습니다</div>';
      return;
    }

    renderSearchResults(data.places);
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = `
      <div class="search-error">
        검색 중 오류가 발생했습니다
      </div>
    `;
  }
}

function renderSearchResults(places) {
  const container = document.getElementById('searchResults');
  container.innerHTML = places.map((place, index) => `
    <div class="search-result-item" onclick="selectPlace(${index})">
      <strong>${place.title}</strong>
      <div style="font-size: 0.9em; color: #6c757d;">
        ${place.roadAddress || place.address}
      </div>
    </div>
  `).join('');

  // 검색 결과 저장
  window.searchResultsData = places;
}

window.selectPlace = function(index) {
  const place = window.searchResultsData[index];

  // 폼에 자동 입력
  document.getElementById('visitPlaceName').value = place.title;
  document.getElementById('visitAddress').value = place.roadAddress || place.address;

  // 카테고리 자동 분류
  const categoryLower = place.category.toLowerCase();
  let category = 'other';
  if (categoryLower.includes('카페') || categoryLower.includes('cafe')) {
    category = 'cafe';
  } else if (categoryLower.includes('음식') || categoryLower.includes('restaurant')) {
    category = 'restaurant';
  } else if (categoryLower.includes('숙박') || categoryLower.includes('호텔')) {
    category = 'accommodation';
  } else if (categoryLower.includes('관광') || categoryLower.includes('명소')) {
    category = 'attraction';
  }
  document.getElementById('visitCategory').value = category;

  // 검색 결과 숨기기
  document.getElementById('searchResults').innerHTML = '';

  showMessage('장소가 선택되었습니다', 'success');
};

// ============================================
// 비용 항목 관리
// ============================================

function addExpenseRow() {
  const container = document.getElementById('expenseItems');
  const rowId = ++expenseItemCount;

  const row = document.createElement('div');
  row.className = 'expense-input-row';
  row.innerHTML = `
    <div class="form-group" style="margin: 0;">
      <input type="text" name="expenseName" placeholder="항목명 (예: 아메리카노)" required>
    </div>
    <div class="form-group" style="margin: 0;">
      <input type="number" name="expensePrice" placeholder="가격" min="0" required>
    </div>
    <div class="form-group" style="margin: 0;">
      <input type="number" name="expenseQuantity" placeholder="수량" min="1" value="1">
    </div>
    <button type="button" class="btn-remove" onclick="removeExpenseRow(this)">×</button>
  `;

  container.appendChild(row);
}

window.removeExpenseRow = function(button) {
  button.closest('.expense-input-row').remove();
};

// ============================================
// 뷰 전환
// ============================================

function showTripsView() {
  document.getElementById('tripsView').style.display = 'block';
  document.getElementById('tripDetailView').style.display = 'none';
  currentView = 'trips';
  currentTrip = null;
  loadTrips();
}

function showDetailView() {
  document.getElementById('tripsView').style.display = 'none';
  document.getElementById('tripDetailView').style.display = 'block';
  currentView = 'detail';
}

// ============================================
// 필터
// ============================================

async function handleTripFilter() {
  const filter = document.getElementById('tripFilter').value;
  const trips = await travelDB.getAllTrips();

  let filtered = trips;
  const now = new Date();

  if (filter === 'upcoming') {
    filtered = trips.filter(t => new Date(t.start_date) > now);
  } else if (filter === 'past') {
    filtered = trips.filter(t => new Date(t.start_date) <= now);
  }

  renderTrips(filtered);
}

// ============================================
// 유틸리티
// ============================================

function showMessage(message, type = 'success') {
  const existingMessage = document.querySelector('.toast-message');
  if (existingMessage) existingMessage.remove();

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
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// MCP 웹 스크래핑 (선택적 기능)
// ============================================

// 이 함수는 MCP 웹 브라우저가 설정되어 있을 때만 작동합니다
// 사용자가 "메뉴 자동 가져오기" 버튼을 클릭하면 Claude에게 요청하는 방식
async function scrapeMenuWithMCP(placeUrl) {
  // MCP를 사용한 스크래핑은 Claude에게 직접 요청
  // 예: "이 네이버 플레이스 링크에서 메뉴와 가격 가져와줘"
  // Claude가 브라우저를 조작해서 정보를 수집하고 JSON으로 반환

  // 실제 구현은 백엔드 API 또는 Claude와의 통신이 필요
  console.log('MCP scraping would be triggered for:', placeUrl);

  // 예상 반환 형식:
  // return {
  //   menus: [
  //     { name: "아메리카노", price: 4500 },
  //     { name: "카페라떼", price: 5000 }
  //   ]
  // };
}
