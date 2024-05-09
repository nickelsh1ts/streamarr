module.exports = {
    ignoreFiles: ['**/*.js'],
    rules: {
      'at-rule-no-unknown': [
        true,
        {
          ignoreAtRules: [
            'apply',
            'variants',
            'responsive',
            'screen',
            'layer',
          ],
        },
      ],
      'declaration-block-trailing-semicolon': null,
      'no-descending-specificity': null,
    },
  };