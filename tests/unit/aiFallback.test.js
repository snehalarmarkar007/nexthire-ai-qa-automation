const { getAIResponseWithFallback } = require('../../src/aiFallback');

describe('getAIResponseWithFallback()', () => {
  test('TC-U24: returns gemini-flash response when primary model succeeds', async () => {
    const result = await getAIResponseWithFallback([]);
    expect(result.model).toBe('gemini-flash');
    expect(result.attempts).toEqual([{ model: 'gemini-flash', status: 'success' }]);
  });

  test('TC-U25: falls back to llama-3 when gemini-flash fails', async () => {
    const result = await getAIResponseWithFallback(['gemini-flash']);
    expect(result.model).toBe('llama-3');
    expect(result.attempts).toEqual([
      { model: 'gemini-flash', status: 'failed' },
      { model: 'llama-3', status: 'success' },
    ]);
  });

  test('TC-U26: falls back to mistral-7b when the first two models fail', async () => {
    const result = await getAIResponseWithFallback(['gemini-flash', 'llama-3']);
    expect(result.model).toBe('mistral-7b');
    expect(result.attempts).toHaveLength(3);
  });

  test('TC-U27: throws ALL_MODELS_UNAVAILABLE when every model fails', async () => {
    await expect(
      getAIResponseWithFallback(['gemini-flash', 'llama-3', 'mistral-7b'])
    ).rejects.toThrow('ALL_MODELS_UNAVAILABLE');
  });
});
