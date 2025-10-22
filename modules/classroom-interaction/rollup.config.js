import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'js/main.js',
  output: {
    file: 'dist/main.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: {
        toplevel: true
      }
    })
  ],
  external: [
    'chart.js',
    'xlsx'
  ]
};

