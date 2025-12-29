# 图片重命名工具 (Image Rename Tool)

一个基于 Wails 框架开发的跨平台桌面应用，提供图片批量重命名和命名格式转换功能。

## 功能截图

### 图片重命名界面
![图片重命名界面](https://github.com/Allyns/image_rename_tool/blob/main/images/img_v3_02te_1ad25494-be54-43a5-b099-d7c61a90261g.jpg)

### 命名转换器界面
![命名转换器界面](https://github.com/Allyns/image_rename_tool/blob/main/images/img_v3_02te_7a0b18f5-5b1e-4bbe-be0e-f9549dfab07g.jpg)

## 功能特性

### 1. 图片批量重命名
- 支持选择多张图片或整个文件夹
- 支持图片格式：PNG、JPG、JPEG、WEBP、GIF
- 自动中文翻译为英文（基于 Google Translate API）
- 自定义类型和模块分类
- 支持原目录覆盖或导出到新目录
- 实时预览新文件名
- 文件名冲突自动处理（添加序号）

### 2. 命名格式转换器
- 智能识别多种命名格式（驼峰、下划线、中横线、中文等）
- 一键转换为 6 种标准格式：
  - 驼峰命名法 (camelCase)
  - 帕斯卡命名法 (PascalCase)
  - 下划线小写 (snake_case)
  - 下划线大写 (SCREAMING_CASE)
  - 包名 (package.case)
  - 中横线 (kebab-case)
- 支持中英文混合输入
- 一键复制转换结果

## 技术栈

### 后端
- **语言**: Go 1.21+
- **框架**: Wails v2.11.0
- **标准库**: 
  - `encoding/json` - JSON 处理
  - `net/http` - HTTP 请求
  - `os` / `path/filepath` - 文件操作
  - `regexp` - 正则表达式
  - `unicode` - Unicode 字符处理

### 前端
- **语言**: HTML5 + CSS3 + JavaScript (原生)
- **UI**: 自定义样式
- **通信**: Wails Runtime API

### 第三方服务
- **翻译**: Google Translate API (免费接口)

## 环境要求

### 开发环境
- Go 1.21 或更高版本
- Node.js 16+ (Wails 框架依赖)
- Wails CLI v2
- 操作系统：macOS / Linux / Windows

### 运行环境
- 无需任何依赖，直接运行编译后的可执行文件

## 安装

### 1. 安装 Go
```bash
# macOS (使用 Homebrew)
brew install go

# Linux (Ubuntu/Debian)
sudo apt install golang-go

# 或访问官网下载
# https://golang.org/dl/
```

### 2. 安装 Node.js
```bash
# macOS (使用 Homebrew)
brew install node

# Linux (Ubuntu/Debian)
sudo apt install nodejs npm

# 或访问官网下载
# https://nodejs.org/
```

### 3. 安装 Wails CLI
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 4. 克隆项目
```bash
git clone <你的仓库地址>
cd image_rename_tool
```

### 5. 安装依赖
```bash
go mod download
```

## 运行

### 开发模式（推荐）
```bash
# 方式 1：使用脚本
./run.sh

# 方式 2：使用 Wails 命令
wails dev

# 方式 3：macOS 双击启动
# 双击 启动.command 文件
```

### 生产模式
```bash
# 构建应用
./build.sh

# 或使用 Wails 命令
wails build

# 构建产物位置
# macOS: build/bin/image_rename_tool.app
# Windows: build/bin/ImageRenameTool.exe
# Linux: build/bin/ImageRenameTool
```

## 快速开始

### 场景一：批量重命名项目图片资源

假设你有一批首页相关的图标需要规范化命名：

```
原文件：
- 设置.png
- 消息图标.webp
- user_avatar.jpg
```

**操作步骤：**

1. 启动应用（双击 `启动.command` 或运行 `wails dev`）

2. 点击「选择图片」，选中这 3 个文件

3. 在表格中编辑每一行：
   - 第 1 行：类型选 `icon`，模块选 `首页`，功能名称输入 `设置`
   - 第 2 行：类型选 `icon`，模块选 `首页`，功能名称输入 `消息`
   - 第 3 行：类型选 `icon`，模块选 `用户`，功能名称输入 `头像`

4. 实时预览新文件名：
   ```
   icon_home_settings.png
   icon_home_message.webp
   icon_user_avatar.jpg
   ```

5. （可选）如需保留原文件，点击「选择」设置输出目录

6. 点击「运行」按钮

7. 完成！查看结果提示

**结果：**
- 中文自动翻译为英文
- 文件名格式统一
- 便于代码中引用

---

### 场景二：整个文件夹批量处理

假设 `icons` 文件夹下有 50 个图标文件：

**操作步骤：**

1. 点击「选择文件夹」，选择 `icons` 目录

2. 自动加载所有图片文件（50 个）

3. 设置输出目录（避免覆盖原文件）：
   - 点击底部「选择」按钮
   - 选择 `icons_renamed` 目录

4. 批量设置（可选）：
   - 开启「同步模块」开关
   - 在第 1 行选择模块 `首页`
   - 其他行自动同步为 `首页`

5. 逐行填写功能名称（或保持默认）

6. 点击「运行」，显示进度条

7. 完成后在 `icons_renamed` 目录查看结果

**特点：**
- 原文件保持不变
- 批量处理速度快
- 进度实时显示

---

### 场景三：命名格式快速转换

假设你在代码中需要将数据库字段名转换为 JavaScript 变量名：

**数据库字段：**
```
user_home_order_count
```

**操作步骤：**

1. 切换到「命名转换器」标签页

2. 在输入框输入：`user_home_order_count`

3. 自动生成 6 种格式：
   ```
   驼峰命名法:    userHomeOrderCount
   帕斯卡命名法:  UserHomeOrderCount
   下划线+小写:   user_home_order_count
   下划线+大写:   USER_HOME_ORDER_COUNT
   包名:         user.home.order.count
   中横线+小写:   user-home-order-count
   ```

4. 点击「驼峰命名法」右侧的「复制」按钮

5. 在代码中粘贴使用：
   ```javascript
   const userHomeOrderCount = data.user_home_order_count;
   ```

---

### 场景四：中英文混合命名转换

假设产品文档中的功能名称需要转换为代码变量：

**输入：**
```
首页订单统计black2024版本
```

**操作步骤：**

1. 在「命名转换器」输入框粘贴文本

2. 工具自动识别：
   - 中文：`首页`、`订单`、`统计`、`版本`
   - 英文：`black`
   - 数字：`2024`

3. 自动翻译中文为英文（调用 Google Translate）

4. 生成结果：
   ```
   驼峰命名法:    homeOrderStatisticsBlack2024Version
   帕斯卡命名法:  HomeOrderStatisticsBlack2024Version
   下划线+小写:   home_order_statistics_black_2024_version
   ...
   ```

5. 一键复制所需格式

**特点：**
- 智能分词
- 中文自动翻译
- 支持驼峰识别

---

### 场景五：自定义类型和模块

假设你的项目有特殊的分类需求：

**操作步骤：**

1. 点击「管理类型」按钮

2. 查看默认类型：`icon`、`bg`、`img`、`btn`

3. 添加自定义类型：
   - 在输入框输入 `logo`
   - 点击「添加」
   - 在输入框输入 `banner`
   - 点击「添加」

4. 删除不需要的类型：
   - 点击类型右侧的「×」删除

5. 点击「关闭」保存

6. 点击「管理模块」按钮

7. 添加项目模块：
   - 输入 `商城`、`支付`、`订单` 等
   - 逐个添加

8. 在图片重命名时使用新的类型和模块

**注意：**
- 类型建议用英文（直接用于文件名）
- 模块可以用中文（会自动翻译）
- 自定义配置在应用关闭后会重置

---

## 使用说明

### 图片重命名

#### 1. 添加图片
- **选择图片**: 点击「选择图片」按钮，多选图片文件
- **选择文件夹**: 点击「选择文件夹」按钮，自动加载文件夹内所有图片

#### 2. 配置命名规则
- **类型**: 选择图片类型（icon、bg、img、btn 等）
  - 可通过「管理类型」按钮自定义类型
- **模块**: 选择功能模块（通用、动态、首页等）
  - 可通过「管理模块」按钮自定义模块
- **功能名称**: 输入图片用途描述
  - 支持中文，会自动翻译为英文
  - 支持英文，不会翻译

#### 3. 设置输出目录（可选）
- **默认**: 空白表示原目录覆盖
- **自定义**: 点击「选择」按钮，选择导出目录

#### 4. 执行重命名
- 点击「运行」按钮
- 显示进度条
- 完成后弹出结果提示

#### 命名格式
```
{类型}_{模块}_{功能名}.{扩展名}
```

示例：
- `icon_home_settings.webp`
- `bg_user_avatar.png`
- `btn_chat_send.jpg`

### 命名转换器

#### 1. 输入原文
- 在输入框中输入任意格式文本
- 或点击「粘贴」按钮从剪贴板粘贴

#### 2. 查看转换结果
- 自动生成 6 种命名格式
- 点击「复制」按钮复制对应格式

#### 支持的输入格式
| 输入示例 | 说明 |
|---------|------|
| `首页设置` | 中文 |
| `homeSettings` | 驼峰命名 |
| `home_settings` | 下划线命名 |
| `home-settings` | 中横线命名 |
| `首页home设置` | 中英混合 |
| `homeSettingsBlack2024` | 驼峰+数字 |

#### 输出格式
| 格式 | 示例 | 用途 |
|-----|------|-----|
| 驼峰命名法 | `homeSettings` | JavaScript 变量 |
| 帕斯卡命名法 | `HomeSettings` | 类名、组件名 |
| 下划线小写 | `home_settings` | 数据库字段、Python |
| 下划线大写 | `HOME_SETTINGS` | 常量 |
| 包名 | `home.settings` | Java 包名 |
| 中横线小写 | `home-settings` | CSS 类名、URL |

## 项目结构

```
image_rename_tool/
├── main.go                 # 应用入口
├── app.go                  # 核心业务逻辑
├── go.mod                  # Go 依赖管理
├── go.sum                  # Go 依赖锁定
├── wails.json              # Wails 配置文件
├── build.sh                # 构建脚本
├── run.sh                  # 开发运行脚本
├── 启动.command            # macOS 启动脚本
├── frontend/               # 前端资源
│   ├── index.html          # 主页面
│   ├── style.css           # 样式文件
│   ├── main.js             # 前端逻辑
│   └── wailsjs/            # Wails 自动生成的绑定代码
│       ├── go/             # Go 方法绑定
│       └── runtime/        # Wails 运行时
├── build/                  # 构建相关
│   ├── appicon.png         # 应用图标 (1024x1024)
│   ├── bin/                # 构建产物
│   └── darwin/             # macOS 配置
│       ├── Info.plist
│       └── Info.dev.plist
├── TECHNICAL.md            # 技术文档
├── USER_GUIDE.md           # 用户指南
└── README.md               # 本文件
```

## 核心功能实现

### 智能分词算法
- 识别驼峰命名 (`homeOrderBlack` → `home`, `order`, `black`)
- 识别下划线/中横线分隔符
- 识别中文字符块
- 识别数字块
- 识别连续大写缩写 (`XMLParser` → `XML`, `Parser`)

### 中文翻译
- 使用 Google Translate 免费 API
- 自动检测中文字符
- 翻译结果转小写并规范化
- 网络异常时保持原文

### 文件操作
- 原目录模式：使用 `os.Rename` 直接重命名
- 新目录模式：使用 `os.ReadFile` + `os.WriteFile` 复制文件
- 文件名冲突：自动添加序号后缀

## 开发指南

### 修改应用图标
1. 替换 `build/appicon.png` 文件（1024x1024 PNG）
2. 重新构建应用

### 修改默认类型/模块
编辑 `app.go` 中的 `NewApp()` 函数：

```go
func NewApp() *App {
    return &App{
        modules: []string{"通用", "动态", "首页", "用户"},
        types:   []string{"icon", "bg", "img", "btn"},
        outputDir: "",
    }
}
```

### 添加新的命名格式
1. 在 `app.go` 中的 `NamingResult` 结构体添加字段
2. 实现对应的转换函数
3. 在 `ConvertNaming()` 方法中调用
4. 在 `frontend/index.html` 中添加显示区域
5. 在 `frontend/main.js` 中添加显示逻辑

### 前后端通信
Wails 自动生成绑定代码，前端调用方式：

```javascript
// 调用后端方法
const items = await window.go.main.App.SelectFiles();
const result = await window.go.main.App.ConvertNaming('首页设置');

// 监听后端事件
window.runtime.EventsOn('rename:progress', (data) => {
    console.log(`进度: ${data.current} / ${data.total}`);
});
```

## 构建选项

### 跨平台构建
```bash
# macOS
wails build -platform darwin/amd64
wails build -platform darwin/arm64

# Windows
wails build -platform windows/amd64

# Linux
wails build -platform linux/amd64
```

### 构建参数
```bash
# 生产构建
wails build

# 带调试信息
wails build -debug

# 指定输出目录
wails build -o custom_output_dir

# 跳过前端构建
wails build -skipbindings
```

## 常见问题

### Q: 翻译不准确怎么办？
A: 在「功能名称」中直接输入英文，不会触发翻译。

### Q: 支持哪些图片格式？
A: PNG、JPG、JPEG、WEBP、GIF。

### Q: 会覆盖原文件吗？
A: 默认会覆盖。如需保留原文件，请设置输出目录。

### Q: 文件名冲突如何处理？
A: 自动添加数字后缀，如 `icon_home_1.png`。

### Q: 命名转换器需要网络吗？
A: 仅在输入包含中文时需要网络（调用翻译 API）。

### Q: macOS 提示"无法打开"怎么办？
A: 右键点击应用 → 打开，或在系统设置中允许运行。

### Q: 如何自定义默认类型和模块？
A: 修改 `app.go` 中的 `NewApp()` 函数，或在应用中通过「管理类型」和「管理模块」按钮自定义。

## 性能优化建议

- 翻译结果可添加本地缓存（当前未实现）
- 大批量文件处理已有进度条显示
- 前端输入已实现防抖处理

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请提交 GitHub Issue。

---

**Enjoy! 🎉**
