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

async function main() {
  try {
    console.log('프론트엔드 트렌드 수집 시작...');
    
    // 다양한 소스에서 데이터 수집
    const [githubTrends, npmTrends, devToArticles] = await Promise.all([
      getTrendingRepos(),
      getNpmTrends(),
      getDevToArticles()
    ]);
    
    // 노션에 데이터 추가
    const today = new Date().toISOString().split('T')[0];
    
    // GitHub 트렌드 추가
    await addTrendsToNotion('GitHub', githubTrends, today);
    
    // NPM 트렌드 추가
    await addTrendsToNotion('NPM', npmTrends, today);
    
    // Dev.to 아티클 추가
    await addTrendsToNotion('Dev.to', devToArticles, today);
    
    console.log('노션 데이터베이스 업데이트 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

async function addTrendsToNotion(source, trends, date) {
  console.log(`${source} 트렌드 노션에 추가 중...`);
  
  for (const trend of trends) {
    try {
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
    } catch (error) {
      console.error(`항목 추가 실패: ${trend.title}`, error);
    }
  }
}

main(); 