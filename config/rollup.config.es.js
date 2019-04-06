import config from './rollup.config'

export default config({
  output: {
    name: 'main',
    format: 'es',
    file: 'lib/turndown-plugin-gfm.es.js'
  }
})
