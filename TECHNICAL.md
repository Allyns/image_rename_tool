# 图片重命名工具 - 技术文档

## 技术栈

- **后端**: Go 1.21+
- **前端**: HTML + CSS + JavaScript (原生)
- **框架**: Wails v2 (Go + WebView 混合桌面应用框架)
- **翻译**: Google Translate API (免费)

## 架构

```
├── main.go              # 应用入口，Wails 配置
├── app.go               # 核心业务逻辑
├── frontend/
│   ├── index.html       # 页面结构（Tab 切换）
│   ├── style.css        # 样式
│   └── main.js          # 前端交互逻辑
├── build/
│   └── appicon.png      # 应用图标 (1024x1024)
├── wails.json           # Wails 项目配置
├── 启动.command         # macOS 双击启动脚本
├── TECHNICAL.md         # 技术文档
└── USER_GUIDE.md        # 用户使用文档
```

## 核心功能

### 1. 图片重命名

#### 图片选择
- `SelectFiles()` - 调用系统文件对话框，多选图片文件
- `SelectFolder()` - 选择文件夹，自动筛选图片文件

#### 类型/模块管理
- `GetTypes()` / `SetTypes()` - 获取/设置类型列表
- `GetModules()` / `SetModules()` - 获取/设置模块列表
- 数据存储在内存中，应用关闭后重置为默认值

#### 输出目录
- `GetOutputDir()` / `SetOutputDir()` - 获取/设置输出目录
- `SelectOutputDir()` - 调用系统目录选择对话框
- 空值表示原目录覆盖

#### 重命名执行
- `ExecuteRename()` - 批量重命名
- 原目录模式：使用 `os.Rename` 直接重命名
- 指定目录模式：复制文件到新目录

### 2. 命名转换器

#### 智能分词算法 `smartSplit()`

实现逻辑：
1. 识别分隔符（空格、下划线、中横线、点）
2. 识别中文字符块
3. 识别数字块
4. 识别驼峰命名（大写字母前分割）

示例：
```
输入：homeOrderBlack2024
输出：["home", "order", "black", "2024"]

输入：首页设置按钮
输出：["首页", "设置", "按钮"]

输入：home_order_black
输出：["home", "order", "black"]
```

#### 命名格式转换

- `toCamelCase()` - 驼峰命名法：homeOrderBlack
- `toPascalCase()` - 帕斯卡命名法：HomeOrderBlack
- `toSnakeCase()` - 下划线小写：home_order_black
- `toScreamingCase()` - 下划线大写：HOME_ORDER_BLACK
- `toPackageCase()` - 包名：home.order.black
- `toKebabCase()` - 中横线：home-order-black

#### 中文翻译

使用 Google Translate 免费 API：

```
https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q={text}
```

## 文件命名规则

```
{类型}_{模块}_{功能名}.{扩展名}
```

示例：
- `icon_home_settings.webp`
- `bg_user_avatar.png`
- `btn_chat_send.webp`

## 翻译处理流程

1. 检测中文字符
2. 调用 Google Translate API
3. 解析 JSON 结果
4. 转小写，特殊字符替换为下划线
5. 去除连续下划线，去除首尾下划线

## 前后端通信

Wails 自动生成 JS 绑定：

```javascript
// 调用后端方法
const items = await window.go.main.App.SelectFiles();
const types = await window.go.main.App.GetTypes();
await window.go.main.App.SetModules(['通用', '首页']);

// 命名转换
const result = await window.go.main.App.ConvertNaming('首页设置');
// result: { camelCase: "homeSettings", pascalCase: "HomeSettings", ... }
```

## 运行与编译

```bash
# 开发模式（推荐）
./启动.command
# 或
wails dev

# 生产构建
wails build
```

## 自定义图标

替换 `build/appicon.png` 文件（1024x1024 PNG），重新构建即可。

## 性能优化

- 实时预览采用 debounce 防抖
- 翻译结果可考虑缓存（当前未实现）
- 大批量文件处理可添加进度条
