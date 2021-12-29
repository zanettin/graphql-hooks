import path from 'path'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'

// get the package.json for the current package
const packageDir = path.join(__filename, '..')
const pkg = require(`${packageDir}/package.json`)
const external = [...Object.keys(pkg.peerDependencies || {})]

const compileForBrowsers = Boolean(pkg.unpkg)

// name will be used as the global name exposed in the UMD bundles
const generateRollupConfig = (name, overrides = {}) =>
  [
    // CommonJS
    {
      input: 'src/index.js',
      output: { file: `lib/${pkg.name}.js`, format: 'cjs', indent: false },
      external,
      plugins: [babel(), sizeSnapshot()],
      ...overrides
    },

    // ES
    {
      input: 'src/index.js',
      output: { file: `es/${pkg.name}.js`, format: 'es', indent: false },
      external,
      plugins: [babel(), sizeSnapshot()],
      ...overrides
    },

    // ES for Browsers
    compileForBrowsers && {
      input: 'src/index.js',
      output: { file: `es/${pkg.name}.mjs`, format: 'es', indent: false },
      external,
      plugins: [
        commonjs(),
        nodeResolve({
          jsnext: true
        }),
        replace({
          'process.env.NODE_ENV': JSON.stringify('production')
        }),
        terser({
          compress: {
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            warnings: false
          }
        }),
        sizeSnapshot()
      ],
      ...overrides
    },

    // UMD Development
    compileForBrowsers && {
      input: 'src/index.js',
      output: {
        file: `dist/${pkg.name}.js`,
        format: 'umd',
        name,
        indent: false
      },
      external,
      plugins: [
        commonjs(),
        nodeResolve({
          jsnext: true
        }),
        babel({
          exclude: 'node_modules/**'
        }),
        replace({
          'process.env.NODE_ENV': JSON.stringify('development')
        }),
        sizeSnapshot()
      ],
      ...overrides
    },

    // UMD Production
    compileForBrowsers && {
      input: 'src/index.js',
      output: {
        file: `dist/${pkg.name}.min.js`,
        format: 'umd',
        name,
        indent: false
      },
      external,
      plugins: [
        commonjs(),
        nodeResolve({
          jsnext: true
        }),
        babel({
          exclude: 'node_modules/**'
        }),
        replace({
          'process.env.NODE_ENV': JSON.stringify('production')
        }),
        terser({
          compress: {
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            warnings: false
          }
        }),
        sizeSnapshot()
      ],
      ...overrides
    }
  ].filter(Boolean)

export default generateRollupConfig
