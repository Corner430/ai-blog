export interface EmbeddingArticle {
  slug: string
  title: string
  summary: string
  embedding: number[]
}

export interface EmbeddingIndex {
  articles: EmbeddingArticle[]
}

export interface SearchResult {
  slug: string
  title: string
  summary: string
  score: number
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0
  return dotProduct / denominator
}

export function searchByEmbedding(
  queryEmbedding: number[],
  index: EmbeddingIndex,
  threshold = 0.3,
  topK = 10
): SearchResult[] {
  const scored = index.articles
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      score: cosineSimilarity(queryEmbedding, article.embedding),
    }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored
}
