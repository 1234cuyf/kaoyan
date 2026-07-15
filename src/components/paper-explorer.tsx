"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { papers } from "@/data/papers";
import { filterPapers } from "@/lib/core";
import type { PaperFilters, Subject } from "@/lib/types";
import { useSession } from "./session-gate";

const initialFilters: PaperFilters = { query: "", subject: "全部", school: "全部", year: "全部" };

const categories: { subject: Subject; icon: string; title: string; note: string }[] = [
  { subject: "政治", icon: "政", title: "思想政治", note: "近 18 年统考真题" },
  { subject: "英语", icon: "EN", title: "考研英语", note: "英语一、英语二" },
  { subject: "数学", icon: "∑", title: "考研数学", note: "数学一、二、三" },
  { subject: "专业课", icon: "专", title: "专业课程", note: "热门院校自命题" },
];

const schools = [
  ["北京大学", "北", "326"], ["武汉大学", "武", "284"], ["浙江大学", "浙", "263"],
  ["南京大学", "南", "241"], ["华中科技大学", "华", "219"], ["全国统考", "统", "480"],
];

export function PaperExplorer() {
  const { favorites, toggleFavorite } = useSession();
  const [filters, setFilters] = useState<PaperFilters>(initialFilters);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtered = useMemo(() => filterPapers(papers, filters), [filters]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  function applyFilters(next: Partial<PaperFilters>, scroll = true) {
    setFilters((current) => ({ ...current, ...next }));
    if (scroll) document.querySelector("#papers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector("#papers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="hero" id="home">
        <div className="container hero-inner">
          <span className="hero-badge">2027 考研资料持续整理中</span>
          <h1>让真题成为你最清晰的<br /><em>备考地图</em></h1>
          <p className="hero-lead">覆盖公共课与热门院校专业课，从年份到院校，一次检索，快速找到真正需要的资料。</p>
          <form className="hero-search" role="search" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="searchInput">搜索真题</label>
            <input className="search-input" id="searchInput" type="search" value={filters.query} onChange={(event) => applyFilters({ query: event.target.value }, false)} placeholder="输入院校、专业或科目，例如：武汉大学 计算机" autoComplete="off" />
            <button className="search-btn" type="submit">搜索真题</button>
          </form>
          <div className="hot-search"><span>热门搜索：</span>{["英语一", "数学一", "计算机", "武汉大学"].map((query) => <button type="button" key={query} onClick={() => applyFilters({ query })}>{query === "计算机" ? "计算机 408" : query}</button>)}</div>
          <div className="hero-stats" aria-label="平台资料统计">
            <div className="hero-stat"><strong>12,680+</strong><span>收录真题</span></div><div className="hero-stat"><strong>286</strong><span>覆盖院校</span></div><div className="hero-stat"><strong>18 年</strong><span>资料跨度</span></div>
          </div>
        </div>
      </section>

      <section className="quick-categories" aria-label="快速科目分类">
        <div className="container category-grid">
          {categories.map((category) => (
            <button className="category-card" type="button" key={category.subject} onClick={() => applyFilters({ subject: category.subject })}>
              <span className="category-icon">{category.icon}</span><span><strong>{category.title}</strong><small>{category.note}</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="paper-section" id="papers">
        <div className="container">
          <div className="section-heading">
            <div><h2>精选历年真题</h2><p>用真题校准复习方向，在有限时间里抓住真正高频的知识点。</p></div>
            <button className="text-link" type="button" onClick={() => applyFilters(initialFilters, false)}>查看全部真题 →</button>
          </div>
          <div className="library-layout">
            <aside className="filter-panel" aria-label="真题筛选">
              <h3>筛选资料</h3>
              <div className="filter-group"><label htmlFor="subjectFilter">科目分类</label><select className="filter-select" id="subjectFilter" value={filters.subject} onChange={(event) => applyFilters({ subject: event.target.value as PaperFilters["subject"] }, false)}><option>全部</option><option>政治</option><option>英语</option><option>数学</option><option>专业课</option></select></div>
              <div className="filter-group"><label htmlFor="schoolFilter">院校</label><select className="filter-select" id="schoolFilter" value={filters.school} onChange={(event) => applyFilters({ school: event.target.value }, false)}><option>全部</option><option>全国统考</option><option>武汉大学</option><option>北京大学</option><option>浙江大学</option><option>南京大学</option><option>华中科技大学</option></select></div>
              <div className="filter-group"><label htmlFor="yearFilter">年份</label><select className="filter-select" id="yearFilter" value={filters.year} onChange={(event) => applyFilters({ year: event.target.value }, false)}><option>全部</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option></select></div>
              <button className="reset-btn" type="button" onClick={() => setFilters(initialFilters)}>重置筛选</button>
            </aside>
            <div>
              <div className="results-bar"><strong>真题列表</strong><span className="results-count">共 {filtered.length} 份资料</span></div>
              <div className="paper-grid" aria-live="polite">
                {filtered.length === 0 ? <div className="empty-state"><strong>暂未找到匹配的真题</strong><p>试试减少关键词，或者重置筛选条件。</p></div> : filtered.map((paper) => {
                  const saved = favorites.includes(paper.id);
                  return (
                    <article className="paper-card" key={paper.id}>
                      <div className="paper-year">{paper.year}</div>
                      <div className="paper-main">
                        <div className="paper-tags"><span className="paper-tag">{paper.subject}</span><span className="paper-tag gold">{paper.type}</span></div>
                        <h3 title={paper.title}>{paper.title}</h3>
                        <div className="paper-meta"><span>{paper.school}</span><span>{paper.pages} 页</span><span>{paper.views} 次浏览</span></div>
                      </div>
                      <div className="paper-actions">
                        <button className={`icon-btn${saved ? " saved" : ""}`} type="button" onClick={() => { toggleFavorite(paper.id); showToast(saved ? "已取消收藏" : "已加入收藏"); }} aria-label={`${saved ? "取消收藏" : "收藏"} ${paper.title}`} aria-pressed={saved}>{saved ? "♥" : "♡"}</button>
                        <button className="download-btn" type="button" onClick={() => showToast("这是静态演示页面，真实资料下载功能尚未接入")}>查看资料</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="schools-section" id="schools">
        <div className="container">
          <div className="section-heading"><div><h2>热门目标院校</h2><p>从目标出发，集中查看院校自命题与复试相关资料。</p></div><button className="text-link" type="button" onClick={() => showToast("更多院校正在持续整理中")}>全部院校 →</button></div>
          <div className="school-grid">{schools.map(([school, mark, count]) => <button className="school-card" type="button" key={school} onClick={() => applyFilters({ school })}><span className="school-mark">{mark}</span><strong>{school}</strong><small>{count} 份资料</small></button>)}</div>
        </div>
      </section>

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
