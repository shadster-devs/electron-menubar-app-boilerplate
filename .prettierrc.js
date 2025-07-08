module.exports = {
  // Print width - line length that prettier will wrap on
  printWidth: 80,

  // Tab width - number of spaces per indentation level
  tabWidth: 2,

  // Use tabs instead of spaces
  useTabs: false,

  // Semicolons at the end of statements
  semi: true,

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Quote props in objects only when necessary
  quoteProps: 'as-needed',

  // Use single quotes in JSX
  jsxSingleQuote: true,

  // Trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: 'es5',

  // Spaces between brackets in object literals
  bracketSpacing: true,

  // Put > on the same line instead of new line in JSX
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter
  arrowParens: 'avoid',

  // Format only files that have a pragma comment
  requirePragma: false,

  // Insert pragma comment at the top of formatted files
  insertPragma: false,

  // Prose wrap - how to handle markdown text
  proseWrap: 'preserve',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Vue files script and style tags indentation
  vueIndentScriptAndStyle: false,

  // Line ending type
  endOfLine: 'lf',

  // Control whether prettier formats quoted code embedded in the file
  embeddedLanguageFormatting: 'auto',

  // Enforce single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,
}; 