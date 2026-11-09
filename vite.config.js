import {defineConfig} from 'vite';

// Pages project sites live under /<repository>/; local previews live at /.
export default defineConfig({base: (process.env.PAGES_BASE_PATH || '') + '/'});
