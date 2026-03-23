import { cosineSimilarity, searchByEmbedding } from '../embeddings'
import type { EmbeddingIndex } from '../embeddings'

describe('lib/embeddings', () => {
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [1, 2, 3]
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
    })

    it('returns 0 for orthogonal vectors', () => {
      const a = [1, 0]
      const b = [0, 1]
      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5)
    })

    it('returns -1 for opposite vectors', () => {
      const a = [1, 0]
      const b = [-1, 0]
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5)
    })

    it('returns 0 for zero vectors', () => {
      const a = [0, 0]
      const b = [1, 2]
      expect(cosineSimilarity(a, b)).toBe(0)
    })
  })

  describe('searchByEmbedding', () => {
    const mockIndex: EmbeddingIndex = {
      articles: [
        { slug: 'a', title: 'Article A', summary: 'Sum A', embedding: [1, 0, 0] },
        { slug: 'b', title: 'Article B', summary: 'Sum B', embedding: [0, 1, 0] },
        { slug: 'c', title: 'Article C', summary: 'Sum C', embedding: [0.9, 0.1, 0] },
      ],
    }

    it('returns results sorted by score descending', () => {
      const queryVec = [1, 0, 0]
      const results = searchByEmbedding(queryVec, mockIndex)
      expect(results.length).toBe(2)
      expect(results[0].slug).toBe('a')
      expect(results[0].score).toBeGreaterThan(results[1].score)
    })

    it('filters results below threshold', () => {
      const queryVec = [0, 0, 1]
      const results = searchByEmbedding(queryVec, mockIndex, 0.3)
      expect(results.length).toBe(0)
    })

    it('respects topK parameter', () => {
      const queryVec = [1, 0, 0]
      const results = searchByEmbedding(queryVec, mockIndex, 0.01, 1)
      expect(results.length).toBe(1)
      expect(results[0].slug).toBe('a')
    })
  })
})
