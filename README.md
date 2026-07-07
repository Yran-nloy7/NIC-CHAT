# NIC-CHAT

NIC-CHAT is a multi-persona AI Agent chat workspace inspired by PawzoChat. It focuses on role-based conversation, model provider configuration, long-term memory, worldbook-style context, scenario presets, and a unified streaming gateway.

## Features

- Persona Agent management: name, avatar tag, model, temperature, max tokens, system prompt, memory and proactive-message settings.
- Provider management: OpenAI-compatible endpoint, API key, and model list.
- API gateway model center: switch between OpenAI-compatible gateways, PawAPI, DeepSeek, Ollama, or custom endpoints; maintain model capability, context window, output limit, billing mode, quota notes, and pricing notes.
- Streaming chat: unified SSE events for thinking, text, state, and error messages.
- Scenario presets: interview, writing, teaching, debate, companion chat, and roleplay.
- Memory timeline: manually add long-term memories and inject them into prompts.
- Worldbook workspace: bind personas to a world, maintain lore, add moments, and manage MCP-style tools.
- Monorepo structure: React app, Node gateway server, and SDK package.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Zustand, Tailwind CSS.
- Server: Node.js, Express, SSE, OpenAI-compatible Chat Completions API.
- Engineering: pnpm workspace, typed state model, separated app/server/sdk packages.

## Getting Started

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to the gateway at `http://localhost:3001`.

You can either configure a provider in the UI or use environment variables:

```bash
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_api_key
```

Do not commit real API keys. Use `.env` files locally and keep example configuration sanitized.

## API Gateway Design

NIC-CHAT treats an API gateway as a configurable provider instead of hard-coding one model.

Provider fields:

- `preset`: OpenAI-compatible, PawAPI, DeepSeek, Ollama, or custom.
- `endpoint`: gateway base URL, for example `https://api.example.com/v1`.
- `authMode`: `bearer` for API key gateways, `none` for local gateways such as Ollama.
- `apiKey`: saved locally for demos; production should use server-side environment variables.
- `billingNote` and `rateLimitNote`: human-readable notes about quota, pay-per-token, pay-per-request, or package usage.

Model catalog fields:

- model id and display name.
- billing type: token, request, quota, free, or unknown.
- input price, output price, request price, quota note.
- context window and max output.
- capabilities such as `vision`, `tool_use`, `local`, or `reasoning`.

The frontend can call `/api/models` to read an OpenAI-compatible `/v1/models` list from the gateway. Most gateways only return model ids, so NIC-CHAT lets users manually enrich each model with pricing and capability metadata.

Chat requests go through `/api/chat`, which converts model streams into one unified SSE protocol:

- `state`: thinking, answering, completed.
- `thinking`: reasoning text if the provider supports it.
- `text`: visible assistant output.
- `tool_call`: function/tool-call metadata.
- `error`: gateway or provider error message.

## OpenClaw Notes

OpenClaw cannot be used directly from a static frontend page. It needs a server-side WeChat gateway or bot process that can receive WeChat messages, verify callbacks, map WeChat users to `sessionId`, and forward messages to `POST /api/openclaw/chat`.

NIC-CHAT provides a bridge-compatible webhook:

```http
POST /api/openclaw/chat
Content-Type: application/json

{
  "message": "你好",
  "sessionId": "wechat:friend:user",
  "personaId": "default"
}
```

Response:

```json
{
  "reply": "你好，我在。",
  "sessionId": "wechat:friend:user",
  "personaId": "default",
  "model": "gpt-4o"
}
```

You can clear bridge memory with:

```http
POST /api/openclaw/clear
```

For a wxauto-style desktop WeChat bridge, see `scripts/wechat_bridge.py`.

```bash
pip install wxauto requests
set WECHAT_LISTEN_NAME=文件传输助手
set NIC_CHAT_URL=http://localhost:3001/api/openclaw/chat
set NIC_CHAT_PERSONA_ID=default
python scripts/wechat_bridge.py
```

This is an experimental bridge like Astrbot-wechat-bot. It uses desktop WeChat automation, not an official WeChat bot API. A production-grade WeChat integration still needs:

- a persistent backend service.
- WeChat/OpenClaw callback configuration.
- message signature or token verification.
- session-to-persona mapping.
- storage for chat history and proactive-message state.

## Project Structure

```text
packages/app      React frontend
packages/server   SSE gateway server
packages/sdk      Tracking and reporting SDK prototype
api/chat.js       Vercel edge proxy
docs              GitHub Pages build output
```

## Resume Version

NIC-CHAT 多角色 AI Agent 对话工作台

基于 React + TypeScript 构建的多角色 AI Agent 对话平台，支持用户创建不同 Persona，配置模型 Provider，选择场景预设，并通过 SSE 实现大模型流式回复。项目采用 monorepo 结构拆分 app、server、sdk，前端负责角色配置、对话交互和状态管理，服务端统一封装模型接口和流式转发。

Highlights:

- 使用 Zustand 管理角色、模型配置、对话消息、长期记忆和本地持久化数据。
- 封装 Provider 配置模块，支持 OpenAI 兼容接口和多模型列表维护。
- 基于 SSE 实现 AI 回复流式渲染，区分 thinking、answering、completed、error 等消息状态。
- 设计 Persona、Worldbook、Scenario Preset 和 Memory Timeline，让普通聊天项目升级为 Agent 工作台。
- 通过服务端网关统一转发模型请求，避免前端直接耦合不同模型接口。
