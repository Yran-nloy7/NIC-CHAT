import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Simulated AI response snippets — different "thinking modes"
const RESPONSES: Record<string, { think: string; answer: string }> = {
  default: {
    think: '分析用户问题，检索知识库...',
    answer: `好的，这是一个很好的问题！让我来详细解答：

## 关键要点

1. **流式渲染（Streaming）** 是现代 AI 应用的核心技术，它允许服务端在生成内容的同时逐步发送给客户端。

2. **核心原理**：基于 HTTP/2 的多路复用和 SSE（Server-Sent Events）协议，服务端可以持续向客户端推送数据块。

## 代码示例

\`\`\`typescript
// 前端：使用 Fetch + ReadableStream 接收流式数据
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value, { stream: true });
  // 处理每个 chunk
}
\`\`\`

## 性能优化建议

| 优化项 | 方法 | 效果 |
|--------|------|------|
| 渲染频率 | rAF 批量合并 | 降至 60fps 以内 |
| 内存占用 | 虚拟滚动 | 减少 80% DOM 节点 |
| 网络抖动 | 指数退避重连 | 断网自动恢复 |

> 提示：实际项目中建议将这些能力抽离为独立 SDK。`,
  },
  tool: {
    think: '需要查询实时天气数据...',
    answer: `让我帮你查询天气信息。

根据查询结果，今天北京的天气情况如下：

- 🌤️ **天气状况**：晴转多云
- 🌡️ **温度范围**：18°C ~ 28°C
- 💨 **风力**：北风 3-4 级
- 💧 **湿度**：45%

总体来说是适合出行的好天气！`,
  },
  code: {
    think: '分析代码问题，定位 bug...',
    answer: `我发现了你代码中的问题：

## 问题分析

你的 \`useEffect\` 缺少对 \`cleanup\` 函数的正确处理：

\`\`\`typescript
// ❌ 错误写法
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  // 缺少 cleanup！
}, []);

// ✅ 正确写法
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  return () => clearInterval(timer); // 组件卸载时清除
}, []);
\`\`\`

这会导致**内存泄漏**——组件卸载后定时器仍在运行。`,
  },
};

const CHARS_PER_CHUNK = 3; // characters per chunk — low for demo
const CHUNK_INTERVAL_MS = 30; // ms between chunks — fast for stress testing

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  // Pick response type based on message content
  let type: 'default' | 'tool' | 'code' = 'default';
  if (message.includes('天气') || message.includes('查询')) type = 'tool';
  else if (message.includes('代码') || message.includes('bug') || message.includes('错误')) type = 'code';

  const resp = RESPONSES[type];

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let aborted = false;
  req.on('close', () => { aborted = true; });

  const send = (event: string, data: unknown) => {
    if (aborted) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Simulate streaming with FSM transitions
  const run = async () => {
    // Phase 1: thinking
    send('state', { state: 'thinking' });
    const thinkChars = [...resp.think];
    for (let i = 0; i < thinkChars.length; i += CHARS_PER_CHUNK) {
      if (aborted) return;
      send('thinking', { text: thinkChars.slice(i, i + CHARS_PER_CHUNK).join('') });
      await sleep(CHUNK_INTERVAL_MS * 2); // thinking is slower
    }

    // Phase 2: tool_calling (only for tool type)
    if (type === 'tool') {
      send('state', { state: 'tool_calling' });
      send('tool_call', { name: 'weather_search', args: { city: '北京' } });
      await sleep(500);
      send('tool_result', { result: '晴转多云, 18-28°C' });
    }

    // Phase 3: answering
    send('state', { state: 'answering' });
    const answerChars = [...resp.answer];
    for (let i = 0; i < answerChars.length; i += CHARS_PER_CHUNK) {
      if (aborted) return;
      // Simulate variable chunk speed — some fast bursts, some stalls
      const delay = Math.random() < 0.1 ? 200 : CHUNK_INTERVAL_MS; // 10% chance of stall
      send('text', { text: answerChars.slice(i, i + CHARS_PER_CHUNK).join('') });
      await sleep(delay);
    }

    // Phase 4: completed
    send('state', { state: 'completed' });
    res.end();
  };

  run().catch(() => { if (!aborted) res.end(); });
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🤖 Mock AI SSE server running at http://localhost:${PORT}`);
  console.log(`   POST /api/chat  —  streaming endpoint`);
  console.log(`   Chunk interval: ${CHUNK_INTERVAL_MS}ms, chars/chunk: ${CHARS_PER_CHUNK}`);
});
