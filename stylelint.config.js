module.exports = {
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['apply', 'variants', 'responsive', 'screen', 'layer'],
      },
    ],
    'no-descending-specificity': null,
  },
};
