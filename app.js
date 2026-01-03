// ============================================
// 여행 기록장 메인 JavaScript v2.0
// ============================================

// 전역 상태
let currentTrip = null;
let currentView = 'trips'; // 'trips' or 'detail'
let expenseItemCount = 0;
let currentEditingVisit = null; // 수정 중인 방문 기록

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

  // Web Share Target 처리 (iOS/Android 공유 기능)
  handleWebShareTarget();

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

  // 카카오 장소 검색
  document.getElementById('btnPlaceSearch').addEventListener('click', handleKakaoSearch);
  document.getElementById('placeSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleKakaoSearch();
    }
  });

  // 비용 항목 추가
  document.getElementById('btnAddExpense').addEventListener('click', () => addExpenseRow());

  // 여행 필터
  document.getElementById('tripFilter').addEventListener('change', handleTripFilter);

  // 자동화 메뉴 입력 이벤트 리스너
  // 방법 1: URL 자동 스크래핑
  document.getElementById('btnAutoScrape').addEventListener('click', autoScrapeFromUrl);

  // 방법 2: 스크린샷 OCR
  document.getElementById('btnUploadScreenshot').addEventListener('click', () => {
    document.getElementById('menuScreenshot').click();
  });
  document.getElementById('menuScreenshot').addEventListener('change', handleScreenshotOCR);

  // 방법 3: 텍스트 파싱
  document.getElementById('btnParseText').addEventListener('click', handleTextParse);
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
    <div class="visit-item" data-visit-id="${visit.id}">
      <div class="visit-header">
        <div>
          <div class="visit-title">${visit.place.name}</div>
          <div class="visit-time">${visitDate}</div>
        </div>
        <div class="visit-actions">
          <span class="visit-category">${category}</span>
          <button class="btn-icon" onclick="handleEditVisit('${visit.id}')" title="수정">
            ✏️
          </button>
          <button class="btn-icon btn-delete" onclick="handleDeleteVisit('${visit.id}')" title="삭제">
            🗑️
          </button>
        </div>
      </div>
      ${rating ? `<div class="visit-rating">${rating}</div>` : ''}
      ${visit.place.address ? `<div class="visit-location">📍 ${visit.place.address}</div>` : ''}
      ${visit.notes ? `<div class="visit-notes">${visit.notes}</div>` : ''}
      ${expensesHtml}
    </div>
  `;
}

// ============================================
// 방문 수정/삭제
// ============================================

// 방문 기록 삭제
window.handleDeleteVisit = async function(visitId) {
  if (!confirm('이 방문 기록을 삭제하시겠습니까?\n관련된 모든 비용 내역도 함께 삭제됩니다.')) {
    return;
  }

  try {
    await travelDB.deleteVisit(visitId);
    await loadTripDetail(currentTrip.id);
    showMessage('방문 기록이 삭제되었습니다', 'success');
  } catch (error) {
    console.error('Failed to delete visit:', error);
    showMessage('삭제에 실패했습니다', 'error');
  }
};

// 방문 기록 수정
window.handleEditVisit = async function(visitId) {
  try {
    // 방문 기록 가져오기
    const visits = await travelDB.getVisitsByTrip(currentTrip.id);
    const visit = visits.find(v => v.id === visitId);

    if (!visit) {
      showMessage('방문 기록을 찾을 수 없습니다', 'error');
      return;
    }

    // 수정 모드 설정
    currentEditingVisit = visit;

    // 모달 열기
    openModal('modalAddVisit');

    // 모달 제목 변경
    const modalTitle = document.querySelector('#modalAddVisit h2');
    if (modalTitle) {
      modalTitle.textContent = '방문 기록 수정 ✏️';
    }

    // 폼에 기존 데이터 입력
    document.getElementById('visitPlaceName').value = visit.place.name || '';
    document.getElementById('visitCategory').value = visit.place.category || 'other';
    document.getElementById('visitAddress').value = visit.place.address || '';

    // 방문 날짜/시간
    const visitDateTime = new Date(visit.visit_date).toISOString().slice(0, 16);
    document.getElementById('visitDate').value = visitDateTime;

    // 평점
    document.getElementById('visitRating').value = visit.rating || '';

    // 메모
    document.getElementById('visitNotes').value = visit.notes || '';

    // 기존 비용 항목 추가
    const expenseContainer = document.getElementById('expenseItems');
    expenseContainer.innerHTML = '';

    if (visit.expenses && visit.expenses.length > 0) {
      visit.expenses.forEach(expense => {
        addExpenseRow(expense.item_name, expense.price, expense.quantity);
      });
    }

    // 제출 버튼 텍스트 변경
    const submitBtn = document.querySelector('#formAddVisit button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = '수정 완료';
    }

    showMessage('수정할 내용을 변경하고 "수정 완료"를 눌러주세요', 'success');

  } catch (error) {
    console.error('Failed to load visit for editing:', error);
    showMessage('방문 기록을 불러올 수 없습니다', 'error');
  }
};

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
    // 수정 모드인지 확인
    const isEditMode = currentEditingVisit !== null;

    // 1. 장소 추가 또는 기존 장소 가져오기
    const placeData = {
      name: document.getElementById('visitPlaceName').value,
      category: document.getElementById('visitCategory').value,
      address: document.getElementById('visitAddress').value,
      naver_place_id: document.getElementById('selectedPlaceId').value || null
    };

    const place = await travelDB.upsertPlace(placeData);

    // 2. 방문 기록 추가 또는 수정
    const visitData = {
      trip_id: currentTrip.id,
      place_id: place.id,
      visit_date: document.getElementById('visitDate').value,
      rating: document.getElementById('visitRating').value ?
        parseInt(document.getElementById('visitRating').value) : null,
      notes: document.getElementById('visitNotes').value
    };

    let visit;
    if (isEditMode) {
      // 수정 모드: 기존 방문 기록 업데이트
      visit = await travelDB.updateVisit(currentEditingVisit.id, visitData);

      // 기존 비용 항목 삭제 (새로 추가할 것이므로)
      if (currentEditingVisit.expenses && currentEditingVisit.expenses.length > 0) {
        for (const expense of currentEditingVisit.expenses) {
          await travelDB.deleteExpense(expense.id);
        }
      }
    } else {
      // 생성 모드: 새 방문 기록 추가
      visit = await travelDB.addVisit(visitData);
    }

    // 3. 비용 항목 추가
    const expenses = collectExpenseData(visit.id);
    if (expenses.length > 0) {
      await travelDB.addExpenses(expenses);
    }

    // 완료
    closeModal('modalAddVisit');
    await loadTripDetail(currentTrip.id);

    if (isEditMode) {
      showMessage('방문 기록이 수정되었습니다! ✏️');
    } else {
      showMessage('방문 기록이 추가되었습니다! 📝');
    }
  } catch (error) {
    console.error('Failed to save visit:', error);
    showMessage(currentEditingVisit ? '방문 수정에 실패했습니다' : '방문 추가에 실패했습니다', 'error');
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

  // 수정 모드 초기화
  currentEditingVisit = null;

  // 모달 제목 및 버튼 텍스트 복원
  const modalTitle = document.querySelector('#modalAddVisit h2');
  if (modalTitle) {
    modalTitle.textContent = '방문 기록 추가';
  }

  const submitBtn = document.querySelector('#formAddVisit button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = '추가';
  }

  // 현재 날짜/시간 설정
  const now = new Date();
  const dateString = now.toISOString().slice(0, 16);
  document.getElementById('visitDate').value = dateString;
}

// ============================================
// 카카오 장소 검색
// ============================================

async function handleKakaoSearch() {
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

function addExpenseRow(itemName = '', itemPrice = '', itemQuantity = 1) {
  const container = document.getElementById('expenseItems');
  const rowId = ++expenseItemCount;

  const row = document.createElement('div');
  row.className = 'expense-input-row';
  row.innerHTML = `
    <div class="form-group" style="margin: 0;">
      <input type="text" name="expenseName" placeholder="항목명 (예: 아메리카노)" value="${itemName}" required>
    </div>
    <div class="form-group" style="margin: 0;">
      <input type="number" name="expensePrice" placeholder="가격" value="${itemPrice}" min="0" required>
    </div>
    <div class="form-group" style="margin: 0;">
      <input type="number" name="expenseQuantity" placeholder="수량" value="${itemQuantity || 1}" min="1">
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

// showToast는 showMessage의 별칭
const showToast = showMessage;

// ============================================
// 자동화 메뉴 입력 - 3가지 방법
// ============================================

// 방법 1: Playwright 서버 스크래핑
async function autoScrapeFromUrl() {
  const urlInput = document.getElementById('autoScrapeUrl');
  const url = urlInput.value.trim();
  const btn = document.getElementById('btnAutoScrape');

  if (!url || !url.includes('place.naver.com')) {
    showToast('올바른 플레이스 URL을 입력하세요', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '가져오는 중...';
  btn.classList.add('loading');

  try {
    const response = await fetch(`/api/scrape-naver-place?placeUrl=${encodeURIComponent(url)}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '데이터를 가져올 수 없습니다');
    }

    const { place, menus } = result.data;

    // 장소 정보 자동 입력
    if (place.name) document.getElementById('visitPlaceName').value = place.name;
    if (place.address) document.getElementById('visitAddress').value = place.address;

    // 카테고리 자동 선택
    if (place.category) {
      const category = detectCategory(place.category);
      if (category) document.getElementById('visitCategory').value = category;
    }

    // 메뉴 자동 추가
    if (menus && menus.length > 0) {
      menus.forEach(menu => {
        if (menu.price && menu.price > 0) {
          addExpenseRow(menu.name, menu.price);
        }
      });
      showToast(`${menus.length}개 메뉴가 자동으로 추가되었습니다!`, 'success');
    } else {
      showToast('장소 정보는 입력되었으나 메뉴를 찾을 수 없습니다', 'warning');
    }

    urlInput.value = '';

  } catch (error) {
    console.error('Auto scrape error:', error);
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '자동으로 가져오기';
    btn.classList.remove('loading');
  }
}

// 방법 2: Tesseract.js OCR
async function handleScreenshotOCR() {
  const fileInput = document.getElementById('menuScreenshot');
  const file = fileInput.files[0];
  const statusDiv = document.getElementById('ocrStatus');

  if (!file) {
    showToast('이미지를 선택하세요', 'error');
    return;
  }

  statusDiv.className = 'ocr-status loading';
  statusDiv.textContent = '📸 이미지 분석 중... (10-20초 소요)';

  try {
    const worker = await Tesseract.createWorker('kor');

    const { data: { text } } = await worker.recognize(file, {
      logger: info => {
        if (info.status === 'recognizing text') {
          const progress = Math.round(info.progress * 100);
          statusDiv.textContent = `📸 이미지 분석 중... ${progress}%`;
        }
      }
    });

    await worker.terminate();

    // 텍스트에서 메뉴 파싱
    const menus = parseMenuText(text);

    if (menus.length > 0) {
      menus.forEach(menu => addExpenseRow(menu.name, menu.price));
      statusDiv.className = 'ocr-status success';
      statusDiv.textContent = `✅ ${menus.length}개 메뉴가 인식되었습니다!`;
      showToast(`${menus.length}개 메뉴 추가 완료`, 'success');
    } else {
      statusDiv.className = 'ocr-status error';
      statusDiv.textContent = '❌ 메뉴를 찾을 수 없습니다. 직접 입력해주세요.';
      showToast('메뉴를 인식하지 못했습니다', 'warning');
    }

    fileInput.value = '';

  } catch (error) {
    console.error('OCR error:', error);
    statusDiv.className = 'ocr-status error';
    statusDiv.textContent = '❌ 이미지 분석 실패';
    showToast('OCR 처리 중 오류가 발생했습니다', 'error');
  }
}

// 방법 3: 텍스트 파싱
function handleTextParse() {
  const textarea = document.getElementById('menuTextInput');
  const text = textarea.value.trim();

  if (!text) {
    showToast('텍스트를 입력하세요', 'error');
    return;
  }

  const menus = parseMenuText(text);

  if (menus.length > 0) {
    menus.forEach(menu => addExpenseRow(menu.name, menu.price));
    showToast(`${menus.length}개 메뉴가 추가되었습니다!`, 'success');
    textarea.value = '';
  } else {
    showToast('메뉴 형식을 인식할 수 없습니다.\n예: "아메리카노 4,500원"', 'error');
  }
}

// 텍스트에서 메뉴/가격 파싱
function parseMenuText(text) {
  const menus = [];

  // 정규식 패턴들
  const patterns = [
    // "아메리카노 4,500원" 또는 "아메리카노 4500원"
    /(.+?)\s+([\d,]+)\s*원/g,
    // "아메리카노 - 4,500" 또는 "아메리카노: 4500"
    /(.+?)\s*[:-]\s*([\d,]+)/g,
    // "4,500 아메리카노" (가격이 먼저)
    /([\d,]+)\s*원?\s+(.+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let name, priceText;

      if (pattern.source.startsWith('([')) {
        // 가격이 먼저인 패턴
        priceText = match[1];
        name = match[2];
      } else {
        // 이름이 먼저인 패턴
        name = match[1];
        priceText = match[2];
      }

      const cleanName = name.trim().replace(/[•\-*]/g, '').trim();
      const price = parseInt(priceText.replace(/[^0-9]/g, ''));

      if (cleanName && price && price > 0 && price < 1000000) {
        // 중복 제거
        if (!menus.find(m => m.name === cleanName)) {
          menus.push({ name: cleanName, price });
        }
      }
    }

    if (menus.length > 0) break;
  }

  return menus;
}

// 카테고리 자동 감지
function detectCategory(categoryText) {
  const text = categoryText.toLowerCase();

  if (text.includes('카페') || text.includes('cafe') || text.includes('coffee')) {
    return 'cafe';
  }
  if (text.includes('음식') || text.includes('식당') || text.includes('restaurant')) {
    return 'restaurant';
  }
  if (text.includes('숙소') || text.includes('호텔') || text.includes('모텔') || text.includes('펜션')) {
    return 'accommodation';
  }
  if (text.includes('관광') || text.includes('명소') || text.includes('여행')) {
    return 'attraction';
  }
  if (text.includes('쇼핑') || text.includes('마트') || text.includes('백화점')) {
    return 'shopping';
  }

  return null;
}

// ============================================
// Web Share Target API (iOS/Android 공유)
// ============================================

function handleWebShareTarget() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  const sharedText = urlParams.get('text');
  const sharedTitle = urlParams.get('title');

  if (sharedUrl || sharedText) {
    // 플레이스 URL이 공유된 경우 (네이버/카카오)
    if (sharedUrl && (sharedUrl.includes('place.naver.com') || sharedUrl.includes('place.map.kakao.com'))) {
      // 방문 추가 모달 열기
      setTimeout(() => {
        openModal('modalAddVisit');

        // URL 입력란에 자동 입력
        document.getElementById('autoScrapeUrl').value = sharedUrl;

        showToast('플레이스 링크가 입력되었습니다. "자동으로 가져오기" 버튼을 눌러주세요!', 'success');
      }, 500);

      // URL 파라미터 제거 (새로고침 시 재실행 방지)
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 텍스트가 공유된 경우 (메뉴 목록 등)
    else if (sharedText) {
      setTimeout(() => {
        openModal('modalAddVisit');
        document.getElementById('menuTextInput').value = sharedText;

        showToast('텍스트가 입력되었습니다. "자동 변환" 버튼을 눌러주세요!', 'success');
      }, 500);

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}
