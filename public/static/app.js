// ReadMaster Frontend JavaScript
// ============================================

const API_BASE = '/api';
let currentPulseId = null;
let selectedContentId = null;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadPulses();
  await loadSources();
  await loadAnalysts();
  await loadContents();
});

// ============================================
// Pulses Management
// ============================================

async function loadPulses() {
  try {
    const response = await axios.get(`${API_BASE}/pulses`);
    const pulses = response.data.pulses;
    
    const pulsesList = document.getElementById('pulses-list');
    pulsesList.innerHTML = pulses.map(pulse => `
      <div class="pulse-card p-3 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 ${currentPulseId === pulse.id ? 'bg-blue-50 dark:bg-gray-700' : ''}"
           onclick="selectPulse(${pulse.id})">
        <div class="flex items-center space-x-2">
          <span class="text-2xl">${pulse.icon || '📁'}</span>
          <div class="flex-1">
            <div class="font-medium text-gray-800 dark:text-white">${pulse.name}</div>
            <div class="text-xs text-gray-500">${pulse.description || ''}</div>
          </div>
        </div>
      </div>
    `).join('');
    
    if (pulses.length > 0 && !currentPulseId) {
      selectPulse(pulses[0].id);
    }
  } catch (error) {
    console.error('Failed to load pulses:', error);
  }
}

async function selectPulse(pulseId) {
  currentPulseId = pulseId;
  await loadPulses();
  await loadContents(pulseId);
}

async function createPulse() {
  const name = prompt('输入脉络名称：');
  if (!name) return;
  
  const description = prompt('输入描述（可选）：');
  const icon = prompt('输入图标（可选，如 📈）：');
  
  try {
    await axios.post(`${API_BASE}/pulses`, {
      name,
      description,
      icon
    });
    await loadPulses();
  } catch (error) {
    alert('创建失败：' + error.message);
  }
}

// ============================================
// Sources Management
// ============================================

async function loadSources() {
  try {
    const response = await axios.get(`${API_BASE}/sources`);
    const sources = response.data.sources;
    
    const sourcesList = document.getElementById('sources-list');
    sourcesList.innerHTML = sources.map(source => `
      <div class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between">
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-800 dark:text-white">${source.name}</div>
          <div class="text-xs text-gray-500">${source.type}</div>
        </div>
        <button class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                onclick="syncSource(${source.id})">
          <i class="fas fa-sync"></i>
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load sources:', error);
  }
}

async function addSource() {
  const name = prompt('输入信息源名称：');
  if (!name) return;
  
  const type = prompt('输入类型（rss/youtube）：', 'rss');
  const url = prompt('输入 URL：');
  
  if (!url) return;
  
  try {
    await axios.post(`${API_BASE}/sources`, {
      name,
      type,
      config: { url }
    });
    await loadSources();
  } catch (error) {
    alert('添加失败：' + error.message);
  }
}

async function syncSource(sourceId) {
  try {
    const response = await axios.post(`${API_BASE}/sources/${sourceId}/sync`);
    alert(`同步成功：获取 ${response.data.fetched} 条，保存 ${response.data.saved} 条`);
    await loadContents();
  } catch (error) {
    alert('同步失败：' + error.message);
  }
}

async function syncAllSources() {
  try {
    const response = await axios.get(`${API_BASE}/sources`);
    const sources = response.data.sources;
    
    for (const source of sources) {
      await syncSource(source.id);
    }
  } catch (error) {
    alert('同步失败：' + error.message);
  }
}

// ============================================
// Contents Management
// ============================================

async function loadContents(pulseId = null) {
  try {
    let url = `${API_BASE}/pulses/${currentPulseId || 1}`;
    const response = await axios.get(url);
    const contents = response.data.contents;
    
    const contentsList = document.getElementById('contents-list');
    if (contents.length === 0) {
      contentsList.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-4"></i>
          <p>暂无内容</p>
          <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onclick="syncAllSources()">
            立即同步信息源
          </button>
        </div>
      `;
      return;
    }
    
    contentsList.innerHTML = contents.map(content => `
      <div class="content-card bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              ${content.title}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
              ${content.summary || content.processed_content || ''}
            </p>
          </div>
        </div>
        
        <div class="flex items-center justify-between text-xs text-gray-500 mt-3">
          <div class="flex items-center space-x-3">
            <span><i class="fas fa-user mr-1"></i>${content.author || '未知'}</span>
            <span><i class="fas fa-clock mr-1"></i>${formatDate(content.published_at)}</span>
            ${content.url ? `<a href="${content.url}" target="_blank" class="text-blue-500 hover:underline"><i class="fas fa-external-link-alt mr-1"></i>原文</a>` : ''}
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                    onclick="analyzeContent(${content.id})">
              <i class="fas fa-brain mr-1"></i>分析
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load contents:', error);
  }
}

// ============================================
// Analysts Management
// ============================================

async function loadAnalysts() {
  try {
    const response = await axios.get(`${API_BASE}/analysts`);
    const analysts = response.data.analysts;
    
    const analystsList = document.getElementById('analysts-list');
    analystsList.innerHTML = analysts.map(analyst => `
      <div class="analyst-badge p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 cursor-pointer"
           onclick="selectAnalyst(${analyst.id})">
        <div class="flex items-center space-x-2">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-purple-500"></i>
          </div>
          <div class="flex-1">
            <div class="font-medium text-gray-800 dark:text-white">${analyst.name}</div>
            <div class="text-xs text-gray-500">${analyst.category}</div>
          </div>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">${analyst.description || ''}</p>
        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span><i class="fas fa-star text-yellow-500 mr-1"></i>${analyst.rating.toFixed(1)}</span>
          <span>${analyst.usage_count} 次使用</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load analysts:', error);
  }
}

let selectedAnalystId = null;

function selectAnalyst(analystId) {
  selectedAnalystId = analystId;
}

async function createAnalyst() {
  const name = prompt('输入分析师名称：');
  if (!name) return;
  
  const description = prompt('输入描述：');
  const category = prompt('输入类别（framework/domain_expert/data_insight/content_processor）：', 'content_processor');
  const systemPrompt = prompt('输入系统提示词：');
  
  if (!systemPrompt) return;
  
  try {
    await axios.post(`${API_BASE}/analysts`, {
      name,
      description,
      category,
      system_prompt: systemPrompt
    });
    await loadAnalysts();
  } catch (error) {
    alert('创建失败：' + error.message);
  }
}

// ============================================
// Analysis
// ============================================

async function analyzeContent(contentId) {
  if (!selectedAnalystId) {
    alert('请先选择一个分析师');
    return;
  }
  
  try {
    const analysisResult = document.getElementById('analysis-result');
    const analysisContent = document.getElementById('analysis-content');
    
    analysisResult.classList.remove('hidden');
    analysisContent.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析中...';
    
    const response = await axios.post(`${API_BASE}/analysts/analyze`, {
      content_id: contentId,
      analyst_id: selectedAnalystId
    });
    
    const analysis = response.data.analysis;
    analysisContent.innerHTML = `
      <div class="prose prose-sm dark:prose-invert max-w-none">
        ${formatAnalysisResult(analysis.result)}
      </div>
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <i class="fas fa-clock mr-1"></i>${formatDate(analysis.created_at)}
        <span class="ml-3"><i class="fas fa-coins mr-1"></i>${analysis.tokens_used || 0} tokens</span>
      </div>
    `;
  } catch (error) {
    alert('分析失败：' + error.response?.data?.message || error.message);
    document.getElementById('analysis-result').classList.add('hidden');
  }
}

// ============================================
// Utility Functions
// ============================================

function formatDate(dateString) {
  if (!dateString) return '未知时间';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

function formatAnalysisResult(text) {
  // Simple markdown-like formatting
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(\d+\.|•)\s/gm, '<li>$1 ')
    .replace(/(<li>.*?<br>)/g, '<ul>$1</ul>');
}
