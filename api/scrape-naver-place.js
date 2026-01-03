import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';

/**
 * Vercel Serverless Function - 네이버 플레이스 자동 스크래핑
 *
 * 사용법: /api/scrape-naver-place?placeUrl=https://m.place.naver.com/...
 *
 * ⚠️ 주의사항:
 * - 네이버 이용약관 확인 필요
 * - 개인 사용 권장, 대량 요청 시 IP 차단 가능
 * - 페이지 구조 변경 시 셀렉터 업데이트 필요
 */
export default async function handler(req, res) {
  const { placeUrl } = req.query;

  // URL 검증
  if (!placeUrl || !placeUrl.includes('place.naver.com')) {
    return res.status(400).json({
      error: '올바른 네이버 플레이스 URL을 입력하세요',
      example: 'https://m.place.naver.com/restaurant/1234567890'
    });
  }

  let browser = null;

  try {
    // 1. Chromium 브라우저 실행 (Vercel 환경 최적화)
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 812 },
      locale: 'ko-KR',
    });

    const page = await context.newPage();

    // 2. 네이버 플레이스 페이지 방문
    console.log('Navigating to:', placeUrl);
    await page.goto(placeUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 3. 페이지 로딩 대기
    await page.waitForTimeout(2000);

    // 4. 장소 기본 정보 추출
    const placeInfo = await page.evaluate(() => {
      // 2026년 1월 기준 네이버 플레이스 모바일 셀렉터
      const getName = () => {
        const selectors = [
          '.place_header .Fc1rA',
          '.place_section .GHAhO',
          'h1.Fc1rA',
          '[class*="place_name"]'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.textContent.trim();
        }
        return null;
      };

      const getCategory = () => {
        const selectors = [
          '.place_header .DJJvD',
          '.categorys .YzBgS',
          '[class*="category"]'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.textContent.trim();
        }
        return null;
      };

      const getAddress = () => {
        const selectors = [
          '.place_section_content .LDgIH',
          '.addr .LDgIH',
          '[class*="address"]'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.textContent.trim();
        }
        return null;
      };

      const getPhone = () => {
        const selectors = [
          '.place_section_content .xlx7Q',
          '.tel .xlx7Q',
          '[class*="phone"]'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.textContent.trim();
        }
        return null;
      };

      return {
        name: getName(),
        category: getCategory(),
        address: getAddress(),
        phone: getPhone(),
      };
    });

    // 5. 메뉴 정보 추출
    const menus = await page.evaluate(() => {
      const menuItems = [];

      // 여러 가능한 셀렉터 시도
      const selectors = [
        '.place_section_content .list_menu li',
        '.menu_list li',
        '[class*="MenuList"] li',
        '.list_menu .item'
      ];

      let menuElements = [];
      for (const sel of selectors) {
        menuElements = document.querySelectorAll(sel);
        if (menuElements.length > 0) break;
      }

      menuElements.forEach(menuEl => {
        // 메뉴명 추출
        const nameSelectors = [
          '.place_menu_name',
          '.name',
          '[class*="menu_name"]',
          'strong'
        ];
        let name = null;
        for (const sel of nameSelectors) {
          const el = menuEl.querySelector(sel);
          if (el) {
            name = el.textContent.trim();
            break;
          }
        }

        // 가격 추출
        const priceSelectors = [
          '.place_menu_price',
          '.price',
          '[class*="menu_price"]',
          'em'
        ];
        let priceText = null;
        for (const sel of priceSelectors) {
          const el = menuEl.querySelector(sel);
          if (el) {
            priceText = el.textContent.trim();
            break;
          }
        }

        if (name) {
          const price = priceText
            ? parseInt(priceText.replace(/[^0-9]/g, ''))
            : null;

          menuItems.push({
            name,
            price,
            priceText: priceText || '가격 정보 없음'
          });
        }
      });

      return menuItems;
    });

    // 6. 평점 및 리뷰 수 추출
    const rating = await page.evaluate(() => {
      const ratingSelectors = [
        '.place_section_content .PXMot em',
        '.rating em',
        '[class*="rating"]'
      ];
      for (const sel of ratingSelectors) {
        const el = document.querySelector(sel);
        if (el) return parseFloat(el.textContent.trim());
      }
      return null;
    });

    await browser.close();

    // 7. 결과 반환
    return res.status(200).json({
      success: true,
      data: {
        place: placeInfo,
        menus: menus,
        rating: rating,
        scrapedAt: new Date().toISOString(),
        source: placeUrl
      },
      meta: {
        menuCount: menus.length,
        hasPrice: menus.filter(m => m.price).length
      }
    });

  } catch (error) {
    console.error('Scraping error:', error);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      success: false,
      error: '페이지를 가져올 수 없습니다',
      details: error.message,
      tip: '네이버 플레이스 모바일 URL을 사용하세요 (m.place.naver.com)'
    });
  }
}

// Vercel 설정
export const config = {
  maxDuration: 60, // 최대 60초 (Vercel Pro 플랜 필요)
};
