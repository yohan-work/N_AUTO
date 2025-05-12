import axios from 'axios';

export async function getDevToArticles() {
  try {
    console.log('Dev.to 프론트엔드 관련 아티클 가져오는 중...');
    
    // 프론트엔드 관련 태그 목록
    const frontendTags = [
      'javascript', 'react', 'vue', 'typescript', 'frontend', 
      'webdev', 'css', 'html', 'angular', 'svelte'
    ];
    
    const articles = [];
    
    // 각 태그별로 최신 아티클 검색
    for (const tag of frontendTags) {
      try {
        const response = await axios.get(`https://dev.to/api/articles?tag=${tag}&top=5`);
        
        if (response.data && Array.isArray(response.data)) {
          // 최신 아티클 3개만 처리
          const filteredArticles = response.data.slice(0, 3);
          
          for (const article of filteredArticles) {
            // 이미 추가된 아티클은 건너뛰기
            if (articles.some(a => a.title === article.title)) {
              continue;
            }
            
            articles.push({
              title: article.title,
              description: article.description || `${tag} 관련 아티클`,
              url: article.url || `https://dev.to${article.path}`
            });
          }
        }
      } catch (err) {
        console.error(`${tag} 태그 아티클 검색 중 오류:`, err.message);
      }
    }
    
    // 중복 제거하고 최신순으로 정렬 (최대 10개)
    const uniqueArticles = articles.slice(0, 10);
    
    console.log(`Dev.to에서 ${uniqueArticles.length}개의 프론트엔드 관련 아티클을 찾았습니다.`);
    return uniqueArticles;
  } catch (error) {
    console.error('Dev.to 아티클 데이터 가져오기 오류:', error);
    return [];
  }
} 