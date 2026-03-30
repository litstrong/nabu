source "$HOME/.cargo/env"  # 新 terminal 需要先加载 Rust 环境
npm run tauri dev           # 开发模式热更新
npm run tauri build         # 重新打包 DMG

---

## Ollama 本地 LLM

应用底部内置了一个对话框，可直接调用本机运行的 Ollama 服务。

**前提条件**

1. 安装并启动 Ollama：https://ollama.com
2. 拉取一个模型，例如：
   ```bash
   ollama pull llama3.2
   ```
3. 确认服务已运行（默认监听 `http://localhost:11434`）：
   ```bash
   ollama serve
   ```

**使用方式**

- 左侧输入框：填写模型名称（默认 `llama3.2`，可改为任何已拉取的模型）
- 右侧输入框：输入问题，按 Enter 或点击 Ask
- 回复展示在输入框下方

**支持的模型示例**

| 模型 | 特点 |
|------|------|
| `llama3.2` | Meta 通用模型，均衡 |
| `mistral` | 速度快，适合简单问答 |
| `qwen2.5` | 中文支持好 |
| `phi4-mini` | 极小，低内存设备适用 |

**实现说明**

前端通过 Tauri 命令 `ask_ollama(model, prompt)` 调用 Rust，Rust 向 `http://localhost:11434/api/generate` 发送 POST 请求（`stream: false`），返回完整回复文本。
