import axios from 'axios';
import * as cheerio from 'cheerio';

export async function getTrendingRepos(maxItems = 10) {
  try {
    console.log('GitHub 트렌딩 프론트엔드 레포지토리 가져오는 중...');
    
    // 수집할 기간 및 언어 설정
    const periods = ['daily', 'weekly']; // daily, weekly 모두 확인
    const languages = ['javascript', 'typescript'];
    
    const repos = [];
    
    // 여러 기간, 여러 언어에 대한 데이터 수집
    for (const period of periods) {
      for (const language of languages) {
        try {
          // GitHub 트렌딩 페이지에서 프로젝트 스크래핑
          const response = await axios.get(`https://github.com/trending/${language}?since=${period}`);
          const $ = cheerio.load(response.data);
          
          // 트렌딩 레포지토리 목록 추출
          $('article.Box-row').each((index, element) => {
            if (index >= 15) return; // 더 많은 데이터 수집
            
            const $element = $(element);
            
            // 레포지토리 정보 추출
            const repoPath = $element.find('h2 a').attr('href').substring(1);
            const title = $element.find('h2').text().trim().replace(/\s+/g, ' ');
            const description = $element.find('p').text().trim();
            const url = `https://github.com/${repoPath}`;
            
            // 스타 수 추출 (인기도 판단용)
            let stars = 0;
            const starsText = $element.find('span.d-inline-block.float-sm-right').text().trim();
            if (starsText) {
              const match = starsText.match(/\d+/);
              if (match) stars = parseInt(match[0], 10);
            }
            
            // 필터링: 프론트엔드 관련 키워드 확인
            const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'frontend', 'ui', 'component', 'web', 'css', 'html', 'javascript', 'typescript', 'nextjs', 'redux', 'tailwind'];
            
            const isRelevant = frontendKeywords.some(keyword => 
              title.toLowerCase().includes(keyword) || 
              description.toLowerCase().includes(keyword)
            );
            
            // 중복 확인 (이미 다른 기간/언어에서 추가된 레포인지)
            const isDuplicate = repos.some(repo => repo.url === url);
            
            if (isRelevant && !isDuplicate) {
              repos.push({
                title,
                description,
                url,
                stars,
                source: language,
                period: period
              });
            }
          });
          
          console.log(`GitHub ${language} ${period} 트렌드를 수집했습니다.`);
        } catch (error) {
          console.error(`GitHub ${language} ${period} 트렌드 수집 중 오류:`, error.message);
        }
      }
    }
    
    // 인기도(스타 수)로 정렬하고 요청된 개수만 반환
    const sortedRepos = repos.sort((a, b) => b.stars - a.stars).slice(0, maxItems);
    
    console.log(`GitHub에서 ${sortedRepos.length}개의 프론트엔드 관련 레포지토리를 찾았습니다.`);
    return sortedRepos;
  } catch (error) {
    console.error('GitHub 트렌딩 데이터 가져오기 오류:', error);
    return [];
  }
}