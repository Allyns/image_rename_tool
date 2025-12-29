// 图片数据
let images = [];
// 模块列表
let modules = [];
// 类型列表
let types = [];
// 输出目录
let outputDir = '';
// 是否同步模块
let syncModule = true;
// 防抖定时器
let debounceTimers = {};
// 命名转换缓存
let converterCache = new Map();

// DOM 元素
const tableBody = document.getElementById('tableBody');
const emptyTip = document.getElementById('emptyTip');
const moduleModal = document.getElementById('moduleModal');
const typeModal = document.getElementById('typeModal');
const moduleList = document.getElementById('moduleList');
const typeList = document.getElementById('typeList');
const newModuleName = document.getElementById('newModuleName');
const newTypeName = document.getElementById('newTypeName');
const outputPath = document.getElementById('outputPath');
const converterInput = document.getElementById('converterInput');

// 初始化
async function init() {
    await loadModules();
    await loadTypes();
    await loadOutputDir();
    initTabs();
    initConverter();
    initDragDrop();
    initSyncModule();
}

// 初始化同步模块开关
function initSyncModule() {
    const checkbox = document.getElementById('syncModule');
    
    // 从 localStorage 读取设置，默认为 true
    const saved = localStorage.getItem('syncModule');
    if (saved !== null) {
        syncModule = saved === 'true';
    } else {
        syncModule = true; // 默认开启
        localStorage.setItem('syncModule', 'true');
    }
    checkbox.checked = syncModule;
    
    // 监听变化
    checkbox.addEventListener('change', () => {
        syncModule = checkbox.checked;
        localStorage.setItem('syncModule', syncModule);
    });
}

// 初始化 Tab 切换
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const pages = document.querySelectorAll('.page');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // 更新 tab 状态
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 切换页面
            pages.forEach(page => {
                if (page.id === targetTab + 'Page') {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        });
    });
}

// 初始化命名转换器
function initConverter() {
    let converterTimer;
    let lastValue = '';
    
    // 输入框监听（防抖 + 值变化检测）
    converterInput.addEventListener('input', () => {
        const currentValue = converterInput.value;
        
        // 如果值没有变化，不处理
        if (currentValue === lastValue) {
            return;
        }
        
        if (converterTimer) {
            clearTimeout(converterTimer);
        }
        
        // 空值立即清空
        if (!currentValue.trim()) {
            clearResults();
            lastValue = currentValue;
            return;
        }
        
        converterTimer = setTimeout(async () => {
            await convertText(currentValue);
            lastValue = currentValue;
        }, 500); // 增加到 500ms
    });
    
    // 粘贴按钮
    document.getElementById('pasteBtn').addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            converterInput.value = text;
            await convertText(text);
        } catch (e) {
            alert('无法读取剪贴板');
        }
    });
    
    // 清空按钮
    document.getElementById('clearConverter').addEventListener('click', () => {
        converterInput.value = '';
        clearResults();
    });
}

// 转换文本
async function convertText(text) {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
        clearResults();
        return;
    }
    
    // 检查缓存
    if (converterCache.has(trimmedText)) {
        displayResults(converterCache.get(trimmedText));
        return;
    }
    
    try {
        const results = await window.go.main.App.ConvertNaming(trimmedText);
        
        // 存入缓存（限制缓存大小）
        if (converterCache.size > 100) {
            // 删除最早的缓存
            const firstKey = converterCache.keys().next().value;
            converterCache.delete(firstKey);
        }
        converterCache.set(trimmedText, results);
        
        displayResults(results);
    } catch (e) {
        console.error(e);
    }
}

// 显示转换结果
function displayResults(results) {
    document.querySelector('#resultCamel .result-text').textContent = results.camelCase || '';
    document.querySelector('#resultPascal .result-text').textContent = results.pascalCase || '';
    document.querySelector('#resultSnake .result-text').textContent = results.snakeCase || '';
    document.querySelector('#resultScreaming .result-text').textContent = results.screamingCase || '';
    document.querySelector('#resultPackage .result-text').textContent = results.packageCase || '';
    document.querySelector('#resultKebab .result-text').textContent = results.kebabCase || '';
}

// 清空结果
function clearResults() {
    document.querySelectorAll('.result-text').forEach(el => el.textContent = '');
}

// 复制结果
function copyResult(boxId) {
    const text = document.querySelector(`#${boxId} .result-text`).textContent;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`#${boxId} .copy-btn`);
        const originalText = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 1500);
    }).catch(e => {
        alert('复制失败');
    });
}

// 加载模块
async function loadModules() {
    try {
        modules = await window.go.main.App.GetModules();
    } catch (e) {
        modules = ['通用', '动态', '首页', '用户', '聊天', '语音房', '充值', '活动'];
    }
}

// 加载类型
async function loadTypes() {
    try {
        types = await window.go.main.App.GetTypes();
    } catch (e) {
        types = ['icon', 'bg', 'img', 'btn'];
    }
}

// 加载输出目录
async function loadOutputDir() {
    try {
        outputDir = await window.go.main.App.GetOutputDir();
        outputPath.value = outputDir || '';
    } catch (e) {
        outputDir = '';
    }
}

// 保存模块
async function saveModules() {
    try {
        await window.go.main.App.SetModules(modules);
    } catch (e) {
        console.error(e);
    }
}

// 保存类型
async function saveTypes() {
    try {
        await window.go.main.App.SetTypes(types);
    } catch (e) {
        console.error(e);
    }
}

// 从文件名提取中文部分
function extractChinese(filename) {
    const name = filename.replace(/\.[^.]+$/, '');
    const matches = name.match(/[\u4e00-\u9fff]+/g);
    return matches ? matches.join('') : '';
}

// 选择图片
document.getElementById('selectFiles').addEventListener('click', async () => {
    try {
        const items = await window.go.main.App.SelectFiles();
        if (items && items.length > 0) {
            const startId = images.length;
            items.forEach((item, i) => {
                item.id = startId + i;
                item.processed = false; // 添加处理状态
                if (!item.featureName) {
                    item.featureName = extractChinese(item.origName);
                }
            });
            images = images.concat(items);
            renderTable();
        }
    } catch (e) {
        console.error(e);
    }
});

// 选择文件夹
document.getElementById('selectFolder').addEventListener('click', async () => {
    try {
        const items = await window.go.main.App.SelectFolder();
        if (items && items.length > 0) {
            const startId = images.length;
            items.forEach((item, i) => {
                item.id = startId + i;
                item.processed = false; // 添加处理状态
                if (!item.featureName) {
                    item.featureName = extractChinese(item.origName);
                }
            });
            images = images.concat(items);
            renderTable();
        }
    } catch (e) {
        console.error(e);
    }
});

// 清空列表
document.getElementById('clearList').addEventListener('click', () => {
    images = [];
    renderTable();
});

// 选择输出目录
document.getElementById('selectOutput').addEventListener('click', async () => {
    try {
        const dir = await window.go.main.App.SelectOutputDir();
        if (dir) {
            outputDir = dir;
            outputPath.value = dir;
        }
    } catch (e) {
        console.error(e);
    }
});

// 清除输出目录
document.getElementById('clearOutput').addEventListener('click', async () => {
    outputDir = '';
    outputPath.value = '';
    try {
        await window.go.main.App.SetOutputDir('');
    } catch (e) {
        console.error(e);
    }
});

// 执行重命名
document.getElementById('rename').addEventListener('click', async () => {
    console.log('[rename] 点击运行按钮');
    
    if (images.length === 0) {
        alert('请先添加图片');
        return;
    }
    
    console.log('[rename] 总图片数:', images.length);
    
    // 过滤掉已处理的
    const unprocessedImages = images.filter(img => !img.processed);
    console.log('[rename] 未处理图片数:', unprocessedImages.length);
    
    if (unprocessedImages.length === 0) {
        alert('所有图片已处理完成');
        return;
    }
    
    // 更新所有项的新文件名
    console.log('[rename] 开始更新文件名');
    for (let i = 0; i < unprocessedImages.length; i++) {
        const item = unprocessedImages[i];
        const ext = item.origName.substring(item.origName.lastIndexOf('.'));
        item.newName = await window.go.main.App.UpdateItem(item.prefix, item.module, item.featureName, ext);
        console.log('[rename]', item.origName, '->', item.newName);
    }
    
    console.log('[rename] 开始执行重命名');
    console.log('[rename] 待处理列表:', unprocessedImages);
    
    try {
        const result = await window.go.main.App.ExecuteRename(unprocessedImages);
        console.log('[rename] 执行结果:', result);
        
        // 标记为已处理
        unprocessedImages.forEach(item => {
            item.processed = true;
        });
        
        renderTable();
        alert(result);
    } catch (e) {
        console.error('[rename] 执行失败:', e);
        alert('错误: ' + e);
    }
});

// ========== 类型管理 ==========
document.getElementById('manageTypes').addEventListener('click', () => {
    renderTypeList();
    typeModal.classList.add('show');
});

document.getElementById('closeTypeModal').addEventListener('click', () => {
    typeModal.classList.remove('show');
    renderTable();
});

document.getElementById('addType').addEventListener('click', async () => {
    const name = newTypeName.value.trim();
    if (!name) {
        alert('请输入类型名称');
        return;
    }
    if (types.includes(name)) {
        alert('类型已存在');
        return;
    }
    types.push(name);
    await saveTypes();
    newTypeName.value = '';
    renderTypeList();
});

function renderTypeList() {
    typeList.innerHTML = types.map((t, index) => `
        <div class="module-item">
            <input type="text" value="${escapeHtml(t)}" onchange="updateType(${index}, this.value)">
            <button class="delete-btn" onclick="deleteType(${index})">删除</button>
        </div>
    `).join('');
}

async function updateType(index, value) {
    const name = value.trim();
    if (!name) {
        alert('类型名称不能为空');
        renderTypeList();
        return;
    }
    types[index] = name;
    await saveTypes();
}

async function deleteType(index) {
    if (types.length <= 1) {
        alert('至少保留一个类型');
        return;
    }
    types.splice(index, 1);
    await saveTypes();
    renderTypeList();
}

typeModal.addEventListener('click', (e) => {
    if (e.target === typeModal) {
        typeModal.classList.remove('show');
        renderTable();
    }
});

// ========== 模块管理 ==========
document.getElementById('manageModules').addEventListener('click', () => {
    renderModuleList();
    moduleModal.classList.add('show');
});

document.getElementById('closeModuleModal').addEventListener('click', () => {
    moduleModal.classList.remove('show');
    renderTable();
});

document.getElementById('addModule').addEventListener('click', async () => {
    const name = newModuleName.value.trim();
    if (!name) {
        alert('请输入模块名称');
        return;
    }
    if (modules.includes(name)) {
        alert('模块已存在');
        return;
    }
    modules.push(name);
    await saveModules();
    newModuleName.value = '';
    renderModuleList();
});

function renderModuleList() {
    moduleList.innerHTML = modules.map((mod, index) => `
        <div class="module-item">
            <input type="text" value="${escapeHtml(mod)}" onchange="updateModule(${index}, this.value)">
            <button class="delete-btn" onclick="deleteModule(${index})">删除</button>
        </div>
    `).join('');
}

async function updateModule(index, value) {
    const name = value.trim();
    if (!name) {
        alert('模块名称不能为空');
        renderModuleList();
        return;
    }
    modules[index] = name;
    await saveModules();
}

async function deleteModule(index) {
    if (modules.length <= 1) {
        alert('至少保留一个模块');
        return;
    }
    modules.splice(index, 1);
    await saveModules();
    renderModuleList();
}

moduleModal.addEventListener('click', (e) => {
    if (e.target === moduleModal) {
        moduleModal.classList.remove('show');
        renderTable();
    }
});

// ========== 表格渲染 ==========
function renderTable() {
    if (images.length === 0) {
        tableBody.innerHTML = '';
        emptyTip.style.display = 'block';
        return;
    }
    
    emptyTip.style.display = 'none';
    
    tableBody.innerHTML = images.map((item, index) => `
        <tr ${item.processed ? 'class="processed"' : ''}>
            <td>
                <img id="img_${index}" 
                    class="img-preview" 
                    onclick="showImagePreview(${index})"
                    src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3E...%3C/text%3E%3C/svg%3E">
            </td>
            <td class="orig-filename">${escapeHtml(item.origName)}</td>
            <td>
                <select onchange="updatePrefix(${index}, this.value)">
                    ${types.map(t => `<option value="${escapeHtml(t)}" ${item.prefix === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                </select>
            </td>
            <td>
                <select onchange="updateModule2(${index}, this.value)">
                    ${modules.map(m => `<option value="${escapeHtml(m)}" ${item.module === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
                </select>
            </td>
            <td>
                <input type="text" 
                    value="${escapeHtml(item.featureName || '')}" 
                    placeholder="输入功能名称"
                    data-original="${escapeHtml(item.featureName || '')}"
                    onchange="updateFeatureNameChange(${index}, this)"
                    oninput="updateFeatureNameInput(${index}, this)">
            </td>
            <td class="new-name" id="newName_${index}">${escapeHtml(item.newName)}${item.processed ? ' ✓' : ''}</td>
            <td>
                <button class="delete-item-btn" onclick="deleteItem(${index})">删除</button>
            </td>
        </tr>
    `).join('');
    
    // 加载图片
    loadImages();
    updateAllPreviews();
}

// 加载图片
async function loadImages() {
    for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const imgEl = document.getElementById(`img_${i}`);
        if (!imgEl) continue;
        
        try {
            let base64;
            
            // 如果有 File 对象（拖拽导入），直接读取
            if (item.file) {
                base64 = await readFileAsBase64(item.file);
            } else {
                // 否则通过后端读取
                base64 = await window.go.main.App.GetImageBase64(item.origPath);
            }
            
            imgEl.src = base64;
            // 缓存 base64 数据用于预览
            item.base64 = base64;
        } catch (e) {
            console.error('Failed to load image:', e);
            imgEl.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23ffebee%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23f44336%22 font-size=%2210%22%3E失败%3C/text%3E%3C/svg%3E';
        }
    }
}

// 读取 File 对象为 base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 显示图片预览
function showImagePreview(index) {
    const item = images[index];
    if (!item.base64) return;
    
    const modal = document.createElement('div');
    modal.className = 'image-modal show';
    modal.innerHTML = `<img src="${item.base64}">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

// 删除单个项
function deleteItem(index) {
    if (confirm(`确定删除 ${images[index].origName} 吗？`)) {
        images.splice(index, 1);
        renderTable();
    }
}

// 初始化拖拽功能
function initDragDrop() {
    const container = document.querySelector('#renamePage .table-container');
    
    // 阻止默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // 高亮效果
    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, () => {
            container.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, () => {
            container.classList.remove('drag-over');
        }, false);
    });
    
    // 处理拖拽文件
    container.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

async function handleDrop(e) {
    console.log('[handleDrop] 开始处理拖拽文件');
    const dt = e.dataTransfer;
    const files = [...dt.files];
    console.log('[handleDrop] 拖拽文件数:', files.length);
    
    // 筛选图片文件
    const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const imageFiles = files.filter(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return validExts.includes(ext);
    });
    
    console.log('[handleDrop] 有效图片数:', imageFiles.length);
    
    if (imageFiles.length === 0) {
        alert('未检测到图片文件');
        return;
    }
    
    // 添加图片
    const startId = images.length;
    const defaultModule = modules.length > 0 ? modules[0] : '通用';
    const defaultType = types.length > 0 ? types[0] : 'icon';
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = '.' + file.name.split('.').pop();
        
        console.log('[handleDrop] 处理文件:', file.name);
        
        // 尝试获取文件路径
        let filePath = file.path || '';
        console.log('[handleDrop] file.path:', filePath || '(空)');
        
        // 如果没有 path 属性（浏览器环境），读取文件并保存到临时目录
        if (!filePath) {
            try {
                console.log('[handleDrop] 读取文件内容并保存到临时目录');
                // 读取文件为 base64
                const base64 = await readFileAsBase64(file);
                console.log('[handleDrop] base64 长度:', base64.length);
                // 保存到临时目录
                filePath = await window.go.main.App.SaveDroppedFile(file.name, base64);
                console.log('[handleDrop] 保存后的路径:', filePath);
            } catch (e) {
                console.error('[handleDrop] 保存文件失败:', file.name, e);
                alert(`保存文件失败: ${file.name}`);
                continue;
            }
        }
        
        const item = {
            id: startId + i,
            origPath: filePath,
            origName: file.name,
            prefix: defaultType,
            module: defaultModule,
            featureName: extractChinese(file.name),
            newName: '',
            processed: false,
            file: file // 保存 File 对象用于读取
        };
        
        console.log('[handleDrop] 添加项:', item);
        images.push(item);
    }
    
    console.log('[handleDrop] 拖拽处理完成，总图片数:', images.length);
    renderTable();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function updatePrefix(index, value) {
    images[index].prefix = value;
    await updatePreview(index);
}

async function updateModule2(index, value) {
    // 如果开启同步模块，更新所有项
    if (syncModule) {
        for (let i = 0; i < images.length; i++) {
            images[i].module = value;
        }
        // 重新渲染表格
        renderTable();
    } else {
        // 只更新当前项
        images[index].module = value;
        await updatePreview(index);
    }
}

// 输入时防抖更新（不立即调用API）
function updateFeatureNameInput(index, input) {
    const value = input.value;
    
    // 清除之前的定时器
    if (debounceTimers[index]) {
        clearTimeout(debounceTimers[index]);
    }
    
    // 设置新的定时器，500ms后执行
    debounceTimers[index] = setTimeout(async () => {
        const originalValue = input.dataset.original;
        
        // 只有值真正改变时才更新
        if (value !== originalValue) {
            images[index].featureName = value;
            input.dataset.original = value; // 更新原始值
            await updatePreview(index);
        }
    }, 500);
}

// 失去焦点或回车时立即更新
async function updateFeatureNameChange(index, input) {
    const value = input.value;
    const originalValue = input.dataset.original;
    
    // 清除防抖定时器
    if (debounceTimers[index]) {
        clearTimeout(debounceTimers[index]);
        delete debounceTimers[index];
    }
    
    // 只有值真正改变时才更新
    if (value !== originalValue) {
        images[index].featureName = value;
        input.dataset.original = value; // 更新原始值
        await updatePreview(index);
    }
}

// 预览缓存
let previewCache = new Map();

async function updatePreview(index) {
    const item = images[index];
    const ext = item.origName.substring(item.origName.lastIndexOf('.'));
    
    // 生成缓存 key
    const cacheKey = `${item.prefix}_${item.module}_${item.featureName}_${ext}`;
    
    // 检查缓存
    if (previewCache.has(cacheKey)) {
        item.newName = previewCache.get(cacheKey);
        const cell = document.getElementById(`newName_${index}`);
        if (cell) {
            cell.textContent = item.newName;
        }
        return;
    }
    
    try {
        const newName = await window.go.main.App.UpdateItem(item.prefix, item.module, item.featureName, ext);
        item.newName = newName;
        
        // 存入缓存（限制大小）
        if (previewCache.size > 200) {
            const firstKey = previewCache.keys().next().value;
            previewCache.delete(firstKey);
        }
        previewCache.set(cacheKey, newName);
        
        const cell = document.getElementById(`newName_${index}`);
        if (cell) {
            cell.textContent = newName;
        }
    } catch (e) {
        console.error(e);
    }
}

async function updateAllPreviews() {
    for (let i = 0; i < images.length; i++) {
        await updatePreview(i);
    }
}

// 初始化
init();
