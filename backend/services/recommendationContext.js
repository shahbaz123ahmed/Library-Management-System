class RecommendationContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async execute({ user, category, bookId }) {
    if (!this.strategy) {
      throw new Error("Recommendation strategy not set.");
    }
    return this.strategy.getRecommendations({ user, category, bookId });
  }
}

module.exports = RecommendationContext;
