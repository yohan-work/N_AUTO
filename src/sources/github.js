import axios from 'axios';
import * as cheerio from 'cheerio';

export async function getTrendingRepos() {
  try {
    console.log('GitHub 트렌딩 프론트엔드 레포지토리 가져오는 중...');
    
    // GitHub 트렌딩 페이지에서 JavaScript 프로젝트 스크래핑
    const response = await axios.get('https://github.com/trending/javascript?since=daily');
    const $ = cheerio.load(response.data);
    
    const repos = [];
    
    // 트렌딩 레포지토리 목록 추출
    $('article.Box-row').each((index, element) => {
      if (index >= 10) return; // 상위 10개만 가져오기(더 많은 데이터 확보)
      
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
      const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'frontend', 'ui', 'component', 'web', 'css', 'html', 'javascript', 'typescript'];
      
      const isRelevant = frontendKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || 
        description.toLowerCase().includes(keyword)
      );
      
      if (isRelevant) {
        repos.push({
          title,
          description,
          url,
          stars,
          source: 'js'
        });
      }
    });
    
    // TypeScript 프로젝트도 가져오기
    const tsResponse = await axios.get('https://github.com/trending/typescript?since=daily');
    const $ts = cheerio.load(tsResponse.data);
    
    $ts('article.Box-row').each((index, element) => {
      if (index >= 10) return; // 상위 10개만 가져오기(더 많은 데이터 확보)
      
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
      const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'frontend', 'ui', 'component', 'web', 'css', 'html'];
      
      const isRelevant = frontendKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || 
        description.toLowerCase().includes(keyword)
      );
      
      if (isRelevant) {
        repos.push({
          title,
          description,
          url,
          stars,
          source: 'ts'
        });
      }
    });
    
    // 인기도(스타 수)로 정렬하고 상위 결과만 반환
    const sortedRepos = repos.sort((a, b) => b.stars - a.stars).slice(0, 10);
    
    console.log(`GitHub에서 ${sortedRepos.length}개의 프론트엔드 관련 레포지토리를 찾았습니다.`);
    return sortedRepos;
  } catch (error) {
    console.error('GitHub 트렌딩 데이터 가져오기 오류:', error);
    return [];
  }
}