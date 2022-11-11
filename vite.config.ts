import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
var WebpackObfuscator = require('webpack-obfuscator');


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    rollupOptions: {
      output: {
        plugins: [ // <-- use plugins inside output to not merge chunks on one file
          new WebpackObfuscator ({
            rotateStringArray: true
          }, [])
        ]
      }
    }
  }
})
