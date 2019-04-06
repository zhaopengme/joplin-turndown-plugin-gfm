import config from './rollup.config'

export default config({
  output: {
    name: 'main',
    format: 'cjs',
    file: 'lib/turndown-plugin-gfm.browser.cjs.js'
  }
})
