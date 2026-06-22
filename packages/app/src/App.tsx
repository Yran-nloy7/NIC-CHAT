// 替换原有的 header 结构
<header className="sticky top-0 z-50 h-14 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between shadow-sm">
  <div className="flex items-center gap-8">
    {/* LOGO 赋予呼吸感和渐变 */}
    <div className="text-xl font-black tracking-wider bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
      <span>NIC-CHAT</span>
      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-pink-50 text-pink-500 border border-pink-100">v2.0</span>
    </div>
    
    {/* 导航标签卡片化 */}
    <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        );
      })}
    </nav>
  </div>

  {/* 右侧加入 OpenClaw 状态联动指示灯（求职核心加分点！） */}
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100 shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>OpenClaw 微信群听中</span>
    </div>
  </div>
</header>