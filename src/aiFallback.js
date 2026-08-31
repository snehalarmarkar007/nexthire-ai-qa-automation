/**
 * Simulated version of Next Hire AI's multi-model fallback strategy.
 * Production hits OpenRouter with Gemini Flash -> LLaMA 3 -> Mistral 7B.
 * Here each "model" is a stub function so the fallback CONTROL FLOW
 * can be tested deterministically without real API keys or network calls.
 */

class ModelUnavailableError extends Error {
  constructor(model) {
    super(`Model unavailable: ${model}`);
    this.model = model;
  }
}

async function callModel(modelName, forceFail = []) {
  if (forceFail.includes(modelName)) {
    throw new ModelUnavailableError(modelName);
  }
  return { model: modelName, response: `response-from-${modelName}` };
}

/**
 * Tries each model in order until one succeeds.
 * @param {string[]} forceFail - list of model names to simulate as failing (for tests)
 */
async function getAIResponseWithFallback(forceFail = []) {
  const modelChain = ['gemini-flash', 'llama-3', 'mistral-7b'];
  const attempts = [];

  for (const model of modelChain) {
    try {
      const result = await callModel(model, forceFail);
      attempts.push({ model, status: 'success' });
      return { ...result, attempts };
    } catch (err) {
      attempts.push({ model, status: 'failed' });
    }
  }

  const error = new Error('ALL_MODELS_UNAVAILABLE');
  error.attempts = attempts;
  throw error;
}

module.exports = { getAIResponseWithFallback, callModel, ModelUnavailableError };
