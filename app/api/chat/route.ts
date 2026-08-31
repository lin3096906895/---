// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

type ChatHistoryItem = {
  role: 'user' | 'model';
  content: string;
};

function normalizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is { role?: unknown; content?: unknown } => {
      return Boolean(item && typeof item === 'object');
    })
    .map((item) => ({
      role: item.role === 'model' ? 'model' as const : 'user' as const,
      content: typeof item.content === 'string' ? item.content.trim().slice(0, 800) : '',
    }))
    .filter((item) => item.content.length > 0)
    .slice(-8);
}

function normalizeContext(value: unknown) {
  if (!value || typeof value !== 'object') return '当前页面信息不可用。';

  const context = value as { pathname?: unknown; pageName?: unknown; title?: unknown; excerpt?: unknown };
  const pathname = typeof context.pathname === 'string' ? context.pathname.slice(0, 120) : '/';
  const pageName = typeof context.pageName === 'string' ? context.pageName.slice(0, 80) : '个人博客首页';
  const title = typeof context.title === 'string' ? context.title.trim().slice(0, 120) : '';
  const excerpt = typeof context.excerpt === 'string'
    ? context.excerpt.replace(/\s+/g, ' ').trim().slice(0, 1600)
    : '';

  return [
    `访客当前正在浏览：${pageName}${title ? `，页面标题是“${title}”` : ''}（路径：${pathname}）。`,
    excerpt ? `页面可见内容摘要：${excerpt}` : '',
  ].filter(Boolean).join('\n');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1200) : '';

    if (!message) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), { status: 400 });
    }

    const apiKey = (
      process.env.POKE_API_KEY
      || process.env.DEEPSEEK_API_KEY
      || process.env.GEMINI_API_KEY
      || ''
    ).trim();

    if (!apiKey) {
      console.error('[chat] missing Poke API key');
      return new Response(JSON.stringify({ error: 'AI 服务尚未配置，请先设置 POKE_API_KEY' }), { status: 500 });
    }

    const modelId = siteConfig.deepseekConfig.modelId;
    const url = `${siteConfig.deepseekConfig.baseUrl}/v1/chat/completions`;
    const history = normalizeHistory(body?.history);
    const pageContext = normalizeContext(body?.context);
    const contents = [
      ...history.map((item) => ({
        role: item.role === 'model' ? 'assistant' as const : 'user' as const,
        content: item.content,
      })),
      {
        role: 'user',
        content: `${pageContext}\n\n访客的问题：${message}`,
      },
    ];

    console.log(`[chat] requesting model: ${modelId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: siteConfig.deepseekConfig.systemPrompt },
          ...contents,
        ],
        max_tokens: siteConfig.deepseekConfig.maxTokens,
        temperature: siteConfig.deepseekConfig.temperature,
        stream: false,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[chat] Poke API request failed:', response.status, data.error?.message || 'unknown error');
      return new Response(JSON.stringify({
        error: `模型请求失败: ${response.status}`,
        details: data.error?.message || '未知错误',
      }), { status: response.status });
    }

    const reply = data.choices?.[0]?.message?.content || '知识树暂时没有传来清晰的回声，请稍后再试。';

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('[chat] route failed:', message);
    const networkError = message.toLowerCase().includes('fetch failed')
      || message.toLowerCase().includes('timeout')
      || message.toLowerCase().includes('network');

    return new Response(JSON.stringify({
      error: networkError
        ? '当前运行环境无法连接 Poke API，请检查网络出口或配置 HTTPS_PROXY。'
        : message,
    }), { status: networkError ? 503 : 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    status: 'Ready',
    provider: 'Poke API',
    model: siteConfig.deepseekConfig.modelId,
    endpoint: `${siteConfig.deepseekConfig.baseUrl}/v1/chat/completions`,
  }), { status: 200 });
}
