import config from './rollup.config'

export default config({
  output: {
    name: 'main',
    format: 'iife',
    file: 'dist/turndown-plugin-gfm.js'
  }
})
