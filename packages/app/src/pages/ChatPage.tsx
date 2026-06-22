// 找到 ChatPage.tsx 里面那个 (!activePersona) 的渲染分支，替换为这个精美的引导页：
if (!activePersona) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* 顶部中央呼吸态图标 */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative bg-white shadow-xl rounded-2xl p-6 border border-slate-100">
            <span className="text-5xl">💬</span>
          </div>
        </div>

        {/* 欢迎语 */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">开始探索您的 AI 智能体集群</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            请在左侧选择一个现有角色，或者点击“+”定制全新人设。所有角色均支持 Web 端与微信端实时同步。
          </p>
        </div>

        {/* 💡 求职神级创新看板：多端接入状态流可视化 */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🕸️</span>
              <h3 className="font-semibold text-slate-700 text-sm">全栈 Web 对话组件</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              支持 SSE 流式协议，内置 Markdown 解析与代码高亮，长会话采用虚拟列表流控优化。
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-semibold text-slate-700 text-sm">OpenClaw 微信/QQ 路由</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              微信上下文采用 Redis 滑动窗口维护。在左侧调整人设后，IM 端将实现免重启热更新切换。
            </p>
          </div>
        </div>

        {/* 底部快捷操作提示 */}
        <div className="text-xs text-slate-400">
          按 <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">←</kbd> 侧边栏可以快捷管理当前活跃的 0 个智能分身
        </div>

      </div>
    </div>
  );
}
{/* 将底部的输入框容器改为悬浮居中样式 */}
<div className="p-6 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent">
  <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-100 transition-all duration-200 flex items-center p-2.5">
    
    <input 
      type="text" 
      placeholder={`给 ${activePersona.name} 发送消息... (Ctrl + Enter)`}
      className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-slate-800 placeholder-slate-400"
    />
    
    <button className="bg-slate-900 hover:bg-pink-600 text-white rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 shadow-md active:scale-95 flex items-center gap-1.5">
      <span>发送</span>
      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
      </svg>
    </button>
    
  </div>
  <div className="text-center text-[11px] text-slate-400 mt-2.5">
    由 OpenClaw 多端总线架构驱动 · 状态：Web/微信双路就绪
  </div>
</div>