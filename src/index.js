import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { getTrendingRepos } from './sources/github.js';
import { getNpmTrends } from './sources/npm.js';
import { getDevToArticles } from './sources/devto.js';

// 환경 변수 로드
dotenv.config();

// Notion 클라이언트 설정
const notion = new Client({ 
  auth: process.env.NOTION_API_KEY 
});
const databaseId = process.env.NOTION_DATABASE_ID;

// 전역 설정
const CONFIG = {
  // 데이터 수집 설정
  ITEMS_PER_SOURCE: 15,  // 각 소스에서 가져올 최대 항목 수
  UPDATE_EXISTING: true, // 기존 항목 업데이트 여부
  MIN_DAYS_FOR_UPDATE: 1, // 최소 몇 일이 지난 항목을 업데이트할지
  MAX_DAYS_AGO: 14       // 최대 몇 일 전 데이터까지 수집할지
};

async function main() {
  try {
    console.log('프론트엔드 트렌드 수집 시작...');
    
    // 다양한 소스에서 데이터 수집
    const [githubTrends, npmTrends, devToArticles] = await Promise.all([
      getTrendingRepos(CONFIG.ITEMS_PER_SOURCE),
      getNpmTrends(CONFIG.ITEMS_PER_SOURCE),
      getDevToArticles(CONFIG.ITEMS_PER_SOURCE, CONFIG.MAX_DAYS_AGO)
    ]);
    
    console.log(`총 ${githubTrends.length + npmTrends.length + devToArticles.length}개의 항목을 수집했습니다.`);
    
    // 노션에 데이터 추가
    const today = new Date().toISOString().split('T')[0];
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    // GitHub 트렌드 추가
    const githubStats = await addTrendsToNotion('GitHub', githubTrends, today);
    totalAdded += githubStats.added;
    totalUpdated += githubStats.updated;
    totalSkipped += githubStats.skipped;
    
    // NPM 트렌드 추가
    const npmStats = await addTrendsToNotion('NPM', npmTrends, today);
    totalAdded += npmStats.added;
    totalUpdated += npmStats.updated;
    totalSkipped += npmStats.skipped;
    
    // Dev.to 아티클 추가
    const devtoStats = await addTrendsToNotion('Dev.to', devToArticles, today);
    totalAdded += devtoStats.added;
    totalUpdated += devtoStats.updated;
    totalSkipped += devtoStats.skipped;
    
    console.log('=== 노션 데이터베이스 업데이트 완료! ===');
    console.log(`총 처리: ${totalAdded}개 추가, ${totalUpdated}개 업데이트, ${totalSkipped}개 건너뜀`);
    
    if (totalAdded === 0 && totalUpdated === 0) {
      console.log('⚠️ 주의: 새로 추가되거나 업데이트된 항목이 없습니다.');
      console.log('💡 팁: CONFIG.MAX_DAYS_AGO 값을 늘리거나 CONFIG.MIN_DAYS_FOR_UPDATE 값을 줄여보세요.');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 기존 데이터베이스 항목 검사 함수
async function findExistingTrend(title, url, source) {
  try {
    // URL로 중복 확인 (더 정확한 방법)
    const urlResponse = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'URL',
        url: {
          equals: url
        }
      }
    });
    
    if (urlResponse.results.length > 0) {
      return urlResponse.results[0]; // 있으면 페이지 객체 반환
    }
    
    // 제목으로 중복 확인 (URL이 변경되었을 수 있음)
    const titleResponse = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: '제목',
            title: {
              contains: title
            }
          },
          {
            property: '소스',
            select: {
              equals: source
            }
          }
        ]
      }
    });
    
    if (titleResponse.results.length > 0) {
      return titleResponse.results[0]; // 있으면 페이지 객체 반환
    }
    
    return null; // 중복 없음
  } catch (error) {
    console.error(`중복 검사 중 오류: ${title}`, error);
    return null; // 오류 발생 시 중복이 없다고 가정
  }
}

// 기존 항목을 업데이트해야 하는지 확인
function shouldUpdateExisting(existingPage) {
  try {
    // 마지막 업데이트 날짜 확인
    const lastEditedTime = new Date(existingPage.last_edited_time);
    const now = new Date();
    const diffDays = Math.floor((now - lastEditedTime) / (1000 * 60 * 60 * 24));
    
    // 설정된 일수보다 오래되었으면 업데이트
    return diffDays >= CONFIG.MIN_DAYS_FOR_UPDATE;
  } catch (error) {
    console.error('날짜 계산 오류:', error);
    return false;
  }
}

async function addTrendsToNotion(source, trends, date) {
  console.log(`${source} 트렌드 노션에 추가 중...`);
  
  let addedCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  
  for (const trend of trends) {
    try {
      // 중복 검사 (페이지 객체 반환)
      const existingPage = await findExistingTrend(trend.title, trend.url, source);
      
      if (existingPage) {
        // 기존 항목 발견
        if (CONFIG.UPDATE_EXISTING && shouldUpdateExisting(existingPage)) {
          // 기존 항목 업데이트
          await notion.pages.update({
            page_id: existingPage.id,
            properties: {
              날짜: {
                date: {
                  start: date  // 날짜 최신으로 업데이트
                }
              },
              설명: {
                rich_text: [
                  {
                    text: {
                      content: trend.description || ''
                    }
                  }
                ]
              },
              // 추가 정보가 있다면 더 업데이트할 수 있음
            }
          });
          console.log(`업데이트됨: ${trend.title}`);
          updatedCount++;
        } else {
          console.log(`중복 항목 건너뜀: ${trend.title}`);
          skippedCount++;
        }
        continue;
      }
      
      // 새 항목 추가
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          제목: {
            title: [
              {
                text: {
                  content: trend.title
                }
              }
            ]
          },
          날짜: {
            date: {
              start: date
            }
          },
          소스: {
            select: {
              name: source
            }
          },
          URL: {
            url: trend.url
          },
          설명: {
            rich_text: [
              {
                text: {
                  content: trend.description || ''
                }
              }
            ]
          }
        }
      });
      
      console.log(`추가됨: ${trend.title}`);
      addedCount++;
    } catch (error) {
      console.error(`항목 추가 실패: ${trend.title}`, error);
    }
  }
  
  console.log(`${source} 처리 완료: ${addedCount}개 추가, ${updatedCount}개 업데이트, ${skippedCount}개 건너뜀`);
  return { added: addedCount, updated: updatedCount, skipped: skippedCount };
}

main(); 