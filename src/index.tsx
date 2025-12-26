import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'

// Import routes
import pulses from './routes/pulses'
import sources from './routes/sources'
import analysts from './routes/analysts'
import admin from './routes/admin'

const app = new Hono<{ Bindings: Env }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/pulses', pulses)
app.route('/api/sources', sources)
app.route('/api/analysts', analysts)
app.route('/api/admin', admin)

// API health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ReadMaster - 智能信息聚合与分析平台</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
          .pulse-card:hover { transform: translateY(-2px); transition: all 0.2s; }
          .content-card { border-left: 3px solid transparent; }
          .content-card:hover { border-left-color: #3B82F6; }
          .analyst-badge { transition: all 0.2s; }
          .analyst-badge:hover { transform: scale(1.05); }
        </style>
    </head>
    <body class="bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div class="px-6 py-4 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
                        <i class="fas fa-brain text-blue-500 mr-2"></i>
                        ReadMaster
                    </h1>
                    <span class="text-sm text-gray-500">智能信息聚合与分析平台</span>
                </div>
                <div class="flex items-center space-x-4">
                    <input type="text" placeholder="搜索内容..." 
                           class="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        <i class="fas fa-user mr-2"></i>Demo User
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Layout -->
        <div class="flex h-screen pt-[73px]">
            <!-- Left Sidebar - Sources & Pulses -->
            <aside class="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div class="p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-white">
                            <i class="fas fa-layer-group mr-2 text-blue-500"></i>
                            我的脉络
                        </h2>
                        <button class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" onclick="createPulse()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div id="pulses-list" class="space-y-2">
                        <!-- Pulses will be loaded here -->
                    </div>
                </div>

                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-white">
                            <i class="fas fa-rss mr-2 text-green-500"></i>
                            信息源
                        </h2>
                        <button class="p-2 text-green-500 hover:bg-green-50 rounded-lg" onclick="addSource()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div id="sources-list" class="space-y-2">
                        <!-- Sources will be loaded here -->
                    </div>
                </div>
            </aside>

            <!-- Center - Content Hub -->
            <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div class="p-6">
                    <div class="mb-6 flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                内容中心
                            </h2>
                            <div class="flex space-x-2">
                                <button class="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">时间流</button>
                                <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">脉络视图</button>
                                <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">未读</button>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                                <i class="fas fa-filter mr-2"></i>筛选
                            </button>
                            <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="syncAllSources()">
                                <i class="fas fa-sync mr-2"></i>同步
                            </button>
                        </div>
                    </div>

                    <div id="contents-list" class="space-y-4">
                        <!-- Content cards will be loaded here -->
                    </div>
                </div>
            </main>

            <!-- Right Sidebar - Analysts Panel -->
            <aside class="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div class="p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-white">
                            <i class="fas fa-robot mr-2 text-purple-500"></i>
                            AI 分析师
                        </h2>
                        <button class="p-2 text-purple-500 hover:bg-purple-50 rounded-lg" onclick="createAnalyst()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>

                    <div id="analysts-list" class="space-y-3 mb-6">
                        <!-- Analysts will be loaded here -->
                    </div>

                    <div id="analysis-result" class="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hidden">
                        <h3 class="font-semibold mb-2 text-gray-800 dark:text-white">分析结果</h3>
                        <div id="analysis-content" class="text-sm text-gray-600 dark:text-gray-300">
                            <!-- Analysis result will appear here -->
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
