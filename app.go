package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ImageItem 图片项数据结构
type ImageItem struct {
	ID          int    `json:"id"`
	OrigPath    string `json:"origPath"`
	OrigName    string `json:"origName"`
	Prefix      string `json:"prefix"`
	Module      string `json:"module"`
	FeatureName string `json:"featureName"`
	NewName     string `json:"newName"`
}

// NamingResult 命名转换结果
type NamingResult struct {
	CamelCase     string `json:"camelCase"`     // 驼峰命名法
	PascalCase    string `json:"pascalCase"`    // 帕斯卡命名法
	SnakeCase     string `json:"snakeCase"`     // 下划线小写
	ScreamingCase string `json:"screamingCase"` // 下划线大写
	PackageCase   string `json:"packageCase"`   // 包名
	KebabCase     string `json:"kebabCase"`     // 中横线
}

// App 应用结构
type App struct {
	ctx       context.Context
	modules   []string // 模块列表
	types     []string // 类型列表
	outputDir string   // 输出目录，空表示原目录
}

// NewApp 创建应用实例
func NewApp() *App {
	return &App{
		modules:   []string{"通用", "动态", "首页", "用户", "聊天", "语音房", "充值", "活动"},
		types:     []string{"icon", "bg", "img", "btn"},
		outputDir: "",
	}
}

// startup 应用启动时调用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetModules 获取模块列表
func (a *App) GetModules() []string {
	return a.modules
}

// SetModules 设置模块列表
func (a *App) SetModules(modules []string) {
	a.modules = modules
}

// GetTypes 获取类型列表
func (a *App) GetTypes() []string {
	return a.types
}

// SetTypes 设置类型列表
func (a *App) SetTypes(types []string) {
	a.types = types
}

// GetOutputDir 获取输出目录
func (a *App) GetOutputDir() string {
	return a.outputDir
}

// SetOutputDir 设置输出目录
func (a *App) SetOutputDir(dir string) {
	a.outputDir = dir
}

// SelectOutputDir 选择输出目录
func (a *App) SelectOutputDir() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择输出目录",
	})
	if err != nil {
		return "", err
	}
	if dir != "" {
		a.outputDir = dir
	}
	return dir, nil
}

// SelectFiles 选择文件
func (a *App) SelectFiles() ([]ImageItem, error) {
	files, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择图片",
		Filters: []runtime.FileFilter{
			{DisplayName: "图片文件", Pattern: "*.png;*.jpg;*.jpeg;*.webp;*.gif"},
		},
	})
	if err != nil {
		return nil, err
	}

	defaultModule := "通用"
	if len(a.modules) > 0 {
		defaultModule = a.modules[0]
	}
	defaultType := "icon"
	if len(a.types) > 0 {
		defaultType = a.types[0]
	}

	var items []ImageItem
	for i, f := range files {
		ext := filepath.Ext(f)
		item := ImageItem{
			ID:          i,
			OrigPath:    f,
			OrigName:    filepath.Base(f),
			Prefix:      defaultType,
			Module:      defaultModule,
			FeatureName: "",
			NewName:     generateFilename(defaultType, defaultModule, "", ext),
		}
		items = append(items, item)
	}
	return items, nil
}

// SelectFolder 选择文件夹
func (a *App) SelectFolder() ([]ImageItem, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择文件夹",
	})
	if err != nil || dir == "" {
		return nil, err
	}

	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	validExts := map[string]bool{
		".png": true, ".jpg": true, ".jpeg": true,
		".webp": true, ".gif": true,
	}

	defaultModule := "通用"
	if len(a.modules) > 0 {
		defaultModule = a.modules[0]
	}
	defaultType := "icon"
	if len(a.types) > 0 {
		defaultType = a.types[0]
	}

	var items []ImageItem
	id := 0
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(file.Name()))
		if !validExts[ext] {
			continue
		}
		path := filepath.Join(dir, file.Name())
		item := ImageItem{
			ID:          id,
			OrigPath:    path,
			OrigName:    file.Name(),
			Prefix:      defaultType,
			Module:      defaultModule,
			FeatureName: "",
			NewName:     generateFilename(defaultType, defaultModule, "", ext),
		}
		items = append(items, item)
		id++
	}
	return items, nil
}

// UpdateItem 更新项目并返回新文件名
func (a *App) UpdateItem(prefix, module, featureName, ext string) string {
	return generateFilename(prefix, module, featureName, ext)
}

// GetImageBase64 获取图片的 base64 编码
func (a *App) GetImageBase64(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}

	// 根据文件扩展名判断 MIME 类型
	ext := strings.ToLower(filepath.Ext(path))
	mimeType := "image/png"
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	case ".gif":
		mimeType = "image/gif"
	case ".webp":
		mimeType = "image/webp"
	}

	// 转换为 base64
	encoded := fmt.Sprintf("data:%s;base64,%s", mimeType, base64EncodeString(data))
	return encoded, nil
}

// base64EncodeString 将字节数组编码为 base64 字符串
func base64EncodeString(data []byte) string {
	var buf strings.Builder
	encoder := base64.NewEncoder(base64.StdEncoding, &buf)
	encoder.Write(data)
	encoder.Close()
	return buf.String()
}

// ConvertNaming 命名转换
func (a *App) ConvertNaming(input string) NamingResult {
	// 智能分词
	words := smartSplit(input)

	// 翻译中文
	var englishWords []string
	for _, word := range words {
		if containsChinese(word) {
			word = translateChinese(word)
		}
		// 清理并保留有效单词
		cleaned := cleanWord(word)
		if cleaned != "" {
			englishWords = append(englishWords, cleaned)
		}
	}

	if len(englishWords) == 0 {
		return NamingResult{}
	}

	// 转换为各种格式
	return NamingResult{
		CamelCase:     toCamelCase(englishWords),
		PascalCase:    toPascalCase(englishWords),
		SnakeCase:     toSnakeCase(englishWords),
		ScreamingCase: toScreamingCase(englishWords),
		PackageCase:   toPackageCase(englishWords),
		KebabCase:     toKebabCase(englishWords),
	}
}

// smartSplit 智能分词（增强版）
func smartSplit(input string) []string {
	if input == "" {
		return []string{}
	}

	var words []string
	var currentWord strings.Builder

	runes := []rune(input)
	length := len(runes)

	for i := 0; i < length; i++ {
		r := runes[i]

		// 1. 分隔符：空格、下划线、中横线、点、斜杠、反斜杠、冒号、分号、逗号、括号等
		if isSeparator(r) {
			if currentWord.Len() > 0 {
				words = append(words, currentWord.String())
				currentWord.Reset()
			}
			continue
		}

		// 2. 中文字符
		if unicode.Is(unicode.Han, r) {
			if currentWord.Len() > 0 {
				words = append(words, currentWord.String())
				currentWord.Reset()
			}
			// 收集连续的中文作为一个词
			chineseWord := string(r)
			for i+1 < length && unicode.Is(unicode.Han, runes[i+1]) {
				i++
				chineseWord += string(runes[i])
			}
			words = append(words, chineseWord)
			continue
		}

		// 3. 数字
		if unicode.IsDigit(r) {
			// 如果当前有非数字内容，先保存
			if currentWord.Len() > 0 {
				prevStr := currentWord.String()
				lastChar := rune(prevStr[len(prevStr)-1])
				if !unicode.IsDigit(lastChar) {
					words = append(words, currentWord.String())
					currentWord.Reset()
				}
			}
			currentWord.WriteRune(r)
			continue
		}

		// 4. 字母
		if unicode.IsLetter(r) {
			if currentWord.Len() > 0 {
				prevStr := currentWord.String()
				lastChar := rune(prevStr[len(prevStr)-1])

				// 4.1 数字后跟字母，需要分割
				if unicode.IsDigit(lastChar) {
					words = append(words, currentWord.String())
					currentWord.Reset()
				} else if unicode.IsLetter(lastChar) {
					// 4.2 驼峰检测
					// 当前大写 + 前面小写 = 分割（homeOrder -> home | Order）
					if unicode.IsUpper(r) && unicode.IsLower(lastChar) {
						words = append(words, currentWord.String())
						currentWord.Reset()
					} else if unicode.IsUpper(r) && unicode.IsUpper(lastChar) {
						// 4.3 连续大写后跟小写的情况（XMLParser -> XML | Parser）
						if i+1 < length && unicode.IsLower(runes[i+1]) {
							if currentWord.Len() > 1 {
								// 保留最后一个大写字母和当前字母组成新词
								temp := currentWord.String()
								words = append(words, temp[:len(temp)-1])
								currentWord.Reset()
								currentWord.WriteRune(lastChar)
							}
						}
					}
				}
			}
			currentWord.WriteRune(r)
			continue
		}

		// 5. 其他字符忽略，但如果有当前词则先保存
		if currentWord.Len() > 0 {
			words = append(words, currentWord.String())
			currentWord.Reset()
		}
	}

	// 处理最后一个词
	if currentWord.Len() > 0 {
		words = append(words, currentWord.String())
	}

	// 过滤空词并进一步清理
	var cleanedWords []string
	for _, word := range words {
		word = strings.TrimSpace(word)
		if word != "" {
			cleanedWords = append(cleanedWords, word)
		}
	}

	return cleanedWords
}

// isSeparator 判断是否为分隔符
func isSeparator(r rune) bool {
	separators := []rune{
		' ', '_', '-', '.', '/', '\\', ':', ';', ',',
		'(', ')', '[', ']', '{', '}', '<', '>',
		'|', '&', '!', '?', '@', '#', '$', '%', '^', '*', '+', '=',
		'\'', '"', '`', '~',
	}
	for _, sep := range separators {
		if r == sep {
			return true
		}
	}
	return false
}

// cleanWord 清理单词
func cleanWord(word string) string {
	// 移除特殊字符
	reg := regexp.MustCompile(`[^\w\p{Han}]+`)
	word = reg.ReplaceAllString(word, "")
	return strings.ToLower(strings.TrimSpace(word))
}

// toCamelCase 驼峰命名法
func toCamelCase(words []string) string {
	if len(words) == 0 {
		return ""
	}
	result := words[0]
	for i := 1; i < len(words); i++ {
		if len(words[i]) > 0 {
			result += strings.ToUpper(string(words[i][0])) + words[i][1:]
		}
	}
	return result
}

// toPascalCase 帕斯卡命名法
func toPascalCase(words []string) string {
	var result string
	for _, word := range words {
		if len(word) > 0 {
			result += strings.ToUpper(string(word[0])) + word[1:]
		}
	}
	return result
}

// toSnakeCase 下划线小写
func toSnakeCase(words []string) string {
	return strings.Join(words, "_")
}

// toScreamingCase 下划线大写
func toScreamingCase(words []string) string {
	var upperWords []string
	for _, word := range words {
		upperWords = append(upperWords, strings.ToUpper(word))
	}
	return strings.Join(upperWords, "_")
}

// toPackageCase 包名
func toPackageCase(words []string) string {
	return strings.Join(words, ".")
}

// toKebabCase 中横线
func toKebabCase(words []string) string {
	return strings.Join(words, "-")
}

// SaveDroppedFile 保存拖拽的文件到临时目录并返回路径
func (a *App) SaveDroppedFile(filename string, base64Data string) (string, error) {
	log.Printf("[SaveDroppedFile] 开始保存拖拽文件: %s", filename)
	
	// 解析 base64 数据（去掉 data:image/xxx;base64, 前缀）
	parts := strings.SplitN(base64Data, ",", 2)
	if len(parts) != 2 {
		log.Printf("[SaveDroppedFile] 错误: base64 数据格式无效")
		return "", fmt.Errorf("invalid base64 data")
	}

	// 解码 base64
	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		log.Printf("[SaveDroppedFile] 错误: base64 解码失败: %v", err)
		return "", err
	}
	log.Printf("[SaveDroppedFile] base64 解码成功，文件大小: %d bytes", len(data))

	// 创建临时目录
	tmpDir := filepath.Join(os.TempDir(), "image_rename_tool")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		log.Printf("[SaveDroppedFile] 错误: 创建临时目录失败: %v", err)
		return "", err
	}
	log.Printf("[SaveDroppedFile] 临时目录: %s", tmpDir)

	// 保存文件，处理重名（使用时间戳确保唯一性）
	ext := filepath.Ext(filename)
	nameWithoutExt := strings.TrimSuffix(filename, ext)
	tmpPath := filepath.Join(tmpDir, fmt.Sprintf("%s_%d%s", nameWithoutExt, os.Getpid(), ext))
	
	// 如果仍然存在，添加计数器
	counter := 1
	for {
		if _, err := os.Stat(tmpPath); os.IsNotExist(err) {
			break
		}
		tmpPath = filepath.Join(tmpDir, fmt.Sprintf("%s_%d_%d%s", nameWithoutExt, os.Getpid(), counter, ext))
		counter++
	}

	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		log.Printf("[SaveDroppedFile] 错误: 写入文件失败: %v", err)
		return "", err
	}

	log.Printf("[SaveDroppedFile] 成功保存文件: %s", tmpPath)
	return tmpPath, nil
}

// ExecuteRename 执行重命名
func (a *App) ExecuteRename(items []ImageItem) (string, error) {
	log.Printf("[ExecuteRename] 开始执行重命名，总数: %d", len(items))
	
	if len(items) == 0 {
		return "", fmt.Errorf("没有图片")
	}

	successCount := 0
	var errors []string
	
	// 检查是否有拖拽导入的文件（临时目录文件）
	tmpDir := filepath.Join(os.TempDir(), "image_rename_tool")
	log.Printf("[ExecuteRename] 临时目录: %s", tmpDir)
	
	hasDroppedFiles := false
	for _, item := range items {
		if strings.HasPrefix(item.OrigPath, tmpDir) {
			hasDroppedFiles = true
			log.Printf("[ExecuteRename] 检测到拖拽文件: %s", item.OrigPath)
			break
		}
	}
	
	log.Printf("[ExecuteRename] 输出目录: %s, 有拖拽文件: %v", a.outputDir, hasDroppedFiles)
	
	// 如果有拖拽文件且没有设置输出目录，必须提示
	if hasDroppedFiles && a.outputDir == "" {
		log.Printf("[ExecuteRename] 错误: 拖拽文件未设置输出目录")
		return "", fmt.Errorf("拖拽导入的文件必须设置输出目录")
	}

	for _, item := range items {
		log.Printf("[ExecuteRename] 处理文件: %s -> %s", item.OrigName, item.NewName)
		log.Printf("[ExecuteRename]   原路径: %s", item.OrigPath)
		
		// 确定输出目录
		var outputDir string
		isDroppedFile := strings.HasPrefix(item.OrigPath, tmpDir)
		log.Printf("[ExecuteRename]   是否拖拽文件: %v", isDroppedFile)
		
		if a.outputDir != "" {
			outputDir = a.outputDir
			log.Printf("[ExecuteRename]   使用设置的输出目录: %s", outputDir)
			if err := os.MkdirAll(outputDir, 0755); err != nil {
				log.Printf("[ExecuteRename]   错误: 创建目录失败: %v", err)
				errors = append(errors, fmt.Sprintf("%s: 创建目录失败", item.OrigName))
				continue
			}
		} else {
			// 普通文件使用原目录
			outputDir = filepath.Dir(item.OrigPath)
			log.Printf("[ExecuteRename]   使用原文件目录: %s", outputDir)
		}

		destPath := filepath.Join(outputDir, item.NewName)
		log.Printf("[ExecuteRename]   目标路径: %s", destPath)

		// 跳过无需处理的文件
		if !isDroppedFile && a.outputDir == "" && item.OrigPath == destPath {
			log.Printf("[ExecuteRename]   跳过: 原路径和目标路径相同")
			successCount++
			continue
		}

		// 处理文件名冲突
		if _, err := os.Stat(destPath); err == nil && destPath != item.OrigPath {
			log.Printf("[ExecuteRename]   检测到文件名冲突，添加序号")
			base := strings.TrimSuffix(item.NewName, filepath.Ext(item.NewName))
			ext := filepath.Ext(item.NewName)
			counter := 1
			for {
				destPath = filepath.Join(outputDir, fmt.Sprintf("%s_%d%s", base, counter, ext))
				if _, err := os.Stat(destPath); os.IsNotExist(err) {
					break
				}
				counter++
			}
			log.Printf("[ExecuteRename]   新目标路径: %s", destPath)
		}

		// 拖拽文件总是复制，普通文件根据是否设置输出目录决定
		if isDroppedFile || a.outputDir != "" {
			// 复制文件
			log.Printf("[ExecuteRename]   操作: 复制文件")
			if err := copyFile(item.OrigPath, destPath); err != nil {
				log.Printf("[ExecuteRename]   错误: 复制失败: %v", err)
				errors = append(errors, fmt.Sprintf("%s: %v", item.OrigName, err))
			} else {
				log.Printf("[ExecuteRename]   成功: 复制完成")
				successCount++
			}
		} else {
			// 重命名文件（原目录覆盖）
			log.Printf("[ExecuteRename]   操作: 重命名文件")
			if err := os.Rename(item.OrigPath, destPath); err != nil {
				log.Printf("[ExecuteRename]   错误: 重命名失败: %v", err)
				errors = append(errors, fmt.Sprintf("%s: %v", item.OrigName, err))
			} else {
				log.Printf("[ExecuteRename]   成功: 重命名完成")
				successCount++
			}
		}
	}

	msg := fmt.Sprintf("成功: %d, 失败: %d", successCount, len(errors))
	if len(errors) > 0 {
		msg += "\n\n错误:\n" + strings.Join(errors[:min(len(errors), 5)], "\n")
	}
	
	log.Printf("[ExecuteRename] 执行完成 - 成功: %d, 失败: %d", successCount, len(errors))
	if len(errors) > 0 {
		log.Printf("[ExecuteRename] 错误列表: %v", errors)
	}
	
	return msg, nil
}

// generateFilename 生成新文件名
func generateFilename(prefix, module, featureName, ext string) string {
	moduleEn := chineseToEnglish(module)
	if featureName == "" {
		return fmt.Sprintf("%s_%s%s", prefix, moduleEn, ext)
	}
	englishName := chineseToEnglish(featureName)
	return fmt.Sprintf("%s_%s_%s%s", prefix, moduleEn, englishName, ext)
}

// containsChinese 检查是否包含中文
func containsChinese(text string) bool {
	for _, r := range text {
		if r >= 0x4e00 && r <= 0x9fff {
			return true
		}
	}
	return false
}

// translateChinese 翻译中文为英文
func translateChinese(text string) string {
	apiURL := fmt.Sprintf(
		"https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=%s",
		url.QueryEscape(text),
	)

	resp, err := http.Get(apiURL)
	if err != nil {
		return text
	}
	defer resp.Body.Close()

	var result []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return text
	}

	if len(result) > 0 {
		if translations, ok := result[0].([]interface{}); ok {
			var translated strings.Builder
			for _, t := range translations {
				if trans, ok := t.([]interface{}); ok && len(trans) > 0 {
					if str, ok := trans[0].(string); ok {
						translated.WriteString(str)
					}
				}
			}
			if translated.Len() > 0 {
				return translated.String()
			}
		}
	}
	return text
}

// chineseToEnglish 转换为英文文件名格式
func chineseToEnglish(text string) string {
	if containsChinese(text) {
		text = translateChinese(text)
	}

	text = strings.ToLower(text)
	reg := regexp.MustCompile(`[^\w]+`)
	text = reg.ReplaceAllString(text, "_")
	reg2 := regexp.MustCompile(`_+`)
	text = reg2.ReplaceAllString(text, "_")
	text = strings.Trim(text, "_")

	return text
}

// copyFile 复制文件
func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
