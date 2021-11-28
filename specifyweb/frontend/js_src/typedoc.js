// To generate documentation, run `npx typedoc`

module.exports = {
  // Input Options
  entryPoints: './lib',
  entryPointStrategy: 'expand',
  exclude: ['./lib/tests/*.*', './lib/localization/*.*', '**/*.js'],

  // Output options
  out: 'docs',
  name: 'Specify 7 (front-end)',
  includeVersion: true,
  readme: '../../../README.md',

  // Validation
  listInvalidSymbolLinks: true,
};
