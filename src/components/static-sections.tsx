export function NewsSection() {
  const news = [
    { number: "01", type: "真题方法", visual: "三轮真题法：从熟悉题型到限时复盘", date: "2026.07.12 · 8 分钟阅读", title: "真题不是做完就算，关键在于每一轮解决不同问题", text: "拆解精做、归因与模拟三阶段，让错题真正转化为分数。" },
    { number: "02", type: "择校参考", visual: "如何从真题反推院校专业课风格", date: "2026.07.08 · 6 分钟阅读", title: "题型、重复率与知识边界，是判断适配度的三个线索", text: "用连续五年的试卷建立院校命题画像，减少信息差。" },
    { number: "03", type: "暑期规划", visual: "七月至九月，把基础复习拉回正轨", date: "2026.07.03 · 10 分钟阅读", title: "一份兼顾公共课与专业课的暑期周计划模板", text: "从可执行时长出发，为强化阶段留出稳定的复盘节奏。" },
  ];

  return (
    <section className="news-section" id="news">
      <div className="container">
        <div className="section-heading"><div><h2>备考方法与资讯</h2><p>不堆砌焦虑，只整理对当下复习真正有帮助的内容。</p></div><a className="text-link" href="#news">更多内容 →</a></div>
        <div className="news-grid">
          {news.map((item) => <article className="news-card" key={item.number}><div className="news-visual" data-number={item.number}><span className="news-type">{item.type}</span><strong>{item.visual}</strong></div><div className="news-body"><span className="news-date">{item.date}</span><h3>{item.title}</h3><p>{item.text}</p></div></article>)}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return <section className="cta"><div className="container cta-inner"><div className="cta-copy"><h2>从一套真题开始，找到复习的抓手</h2><p>先筛选目标院校与科目，再为重要资料加上收藏。</p></div><a className="primary-btn" href="#papers">立即浏览真题 <span aria-hidden="true">→</span></a></div></section>;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-about"><a className="brand" href="#home"><span className="brand-mark">研</span><span>研题库</span></a><p>专注于考研历年真题整理与检索，让每一位认真备考的同学更高效地找到所需资料。</p></div>
        <div className="footer-col"><strong>资料导航</strong><a href="#papers">公共课真题</a><a href="#schools">院校专业课</a><a href="#news">备考资讯</a></div>
        <div className="footer-col"><strong>使用帮助</strong><a href="#papers">筛选说明</a><a href="#papers">收藏资料</a><a href="mailto:demo@example.invalid">问题反馈</a></div>
        <div className="footer-col"><strong>演示说明</strong><span>演示密钥：KY2027</span><span>信息仅保存于当前浏览器</span></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 研题库 · 静态界面演示</span><span>前端密钥不构成真实安全验证 · 请勿填写敏感个人信息</span></div>
    </footer>
  );
}
