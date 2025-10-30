module.exports = {
  '*.{ts,js}': (filenames) => [
    `eslint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`
  ]
};