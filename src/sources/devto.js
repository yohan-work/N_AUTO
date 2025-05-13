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
        // published_at으로 정렬하여 최신 글 먼저 가져오기
        const response = await axios.get(`https://dev.to/api/articles?tag=${tag}&top=7&state=rising`);
        
        if (response.data && Array.isArray(response.data)) {
          // 인기 있는 아티클 처리
          const filteredArticles = response.data.slice(0, 5);
          
          for (const article of filteredArticles) {
            // 이미 추가된 아티클은 건너뛰기 (URL 기준)
            if (articles.some(a => a.url === (article.url || `https://dev.to${article.path}`))) {
              continue;
            }
            
            // 이미 추가된 비슷한 제목의 아티클은 건너뛰기
            const similarTitleExists = articles.some(a => {
              // 제목이 80% 이상 유사하면 중복으로 간주
              const shorterTitle = a.title.length < article.title.length ? a.title : article.title;
              const longerTitle = a.title.length >= article.title.length ? a.title : article.title;
              return longerTitle.toLowerCase().includes(shorterTitle.toLowerCase().substring(0, Math.floor(shorterTitle.length * 0.8)));
            });
            
            if (similarTitleExists) {
              continue;
            }
            
            // 게시 날짜 파싱
            const publishedDate = new Date(article.published_at || new Date());
            
            articles.push({
              title: article.title,
              description: article.description || `${tag} 관련 아티클`,
              url: article.url || `https://dev.to${article.path}`,
              publishedAt: publishedDate,
              reactions: article.public_reactions_count || 0
            });
          }
        }
      } catch (err) {
        console.error(`${tag} 태그 아티클 검색 중 오류:`, err.message);
      }
    }
    
    // 정렬: 1차 - 게시일, 2차 - 반응 수
    const sortedArticles = articles.sort((a, b) => {
      // 일주일 이내 게시글은 반응 수 우선 (인기 있는 최신글)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const aIsRecent = a.publishedAt >= oneWeekAgo;
      const bIsRecent = b.publishedAt >= oneWeekAgo;
      
      // 둘 다 최근 게시글이면 반응 수로 정렬
      if (aIsRecent && bIsRecent) {
        return b.reactions - a.reactions;
      }
      
      // 최근 게시글 우선
      if (aIsRecent !== bIsRecent) {
        return aIsRecent ? -1 : 1;
      }
      
      // 둘 다 오래된 글이면 날짜 기준
      return b.publishedAt - a.publishedAt;
    });
    
    // 상위 10개만 반환
    const topArticles = sortedArticles.slice(0, 10);
    
    console.log(`Dev.to에서 ${topArticles.length}개의 프론트엔드 관련 아티클을 찾았습니다.`);
    return topArticles;
  } catch (error) {
    console.error('Dev.to 아티클 데이터 가져오기 오류:', error);
    return [];
  }
} 