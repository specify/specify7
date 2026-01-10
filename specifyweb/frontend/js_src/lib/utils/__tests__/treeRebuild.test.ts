import { parseRebuildResponse } from '../treeRebuild';

describe('parseRebuildResponse', () => {
  describe('valid responses', () => {
    it('parses a response with data wrapper', () => {
      const response = {
        data: { changed: { accepted: 5, synonyms: 3, total: 8 } },
      };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 5, synonyms: 3, total: 8 });
    });

    it('parses a response without data wrapper', () => {
      const response = { changed: { accepted: 10, synonyms: 2, total: 12 } };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 10, synonyms: 2, total: 12 });
    });

    it('parses a JSON string response', () => {
      const jsonString = JSON.stringify({
        changed: { accepted: 7, synonyms: 1, total: 8 },
      });
      const result = parseRebuildResponse(jsonString);
      expect(result).toEqual({ accepted: 7, synonyms: 1, total: 8 });
    });

    it('handles partial changed data', () => {
      const response = { changed: { accepted: 5 } };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 5, synonyms: 0, total: 5 });
    });

    it('calculates total when not provided', () => {
      const response = { changed: { accepted: 3, synonyms: 2 } };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 3, synonyms: 2, total: 5 });
    });
  });

  describe('invalid responses', () => {
    it('handles null response', () => {
      const result = parseRebuildResponse(null);
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });

    it('handles undefined response', () => {
      const result = parseRebuildResponse(undefined);
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });

    it('handles empty object', () => {
      const result = parseRebuildResponse({});
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });

    it('handles malformed JSON string', () => {
      const result = parseRebuildResponse('invalid json {');
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });

    it('handles non-object primitive', () => {
      expect(parseRebuildResponse('string')).toEqual({
        accepted: 0,
        synonyms: 0,
        total: 0,
      });
      expect(parseRebuildResponse(123)).toEqual({
        accepted: 0,
        synonyms: 0,
        total: 0,
      });
      expect(parseRebuildResponse(true)).toEqual({
        accepted: 0,
        synonyms: 0,
        total: 0,
      });
    });

    it('handles response with null changed', () => {
      const response = { changed: null };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });

    it('handles response with invalid changed values', () => {
      const response = { changed: { accepted: 'not a number', synonyms: null } };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });
  });

  describe('edge cases', () => {
    it('handles zero values', () => {
      const response = { changed: { accepted: 0, synonyms: 0, total: 0 } };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });

    it('handles large numbers', () => {
      const response = {
        changed: { accepted: 999999, synonyms: 888888, total: 1888887 },
      };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 999999, synonyms: 888888, total: 1888887 });
    });

    it('handles nested data wrapper', () => {
      const response = {
        data: {
          data: { changed: { accepted: 5, synonyms: 3, total: 8 } },
        },
      };
      const result = parseRebuildResponse(response);
      expect(result).toEqual({ accepted: 0, synonyms: 0, total: 0 });
    });
  });
});
