"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "./session-gate";

export function SiteHeader() {
  const { user, favorites, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closePopover(event: PointerEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserOpen(false);
    }
    document.addEventListener("pointerdown", closePopover);
    return () => document.removeEventListener("pointerdown", closePopover);
  }, []);

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <a className="brand" href="#home" aria-label="研题库首页"><span className="brand-mark">研</span><span>研题库</span></a>
        <nav className={`main-nav${menuOpen ? " open" : ""}`} id="mainNav" aria-label="主导航">
          <a className="active" href="#home" onClick={() => setMenuOpen(false)}>首页</a>
          <a href="#papers" onClick={() => setMenuOpen(false)}>真题库</a>
          <a href="#schools" onClick={() => setMenuOpen(false)}>院校库</a>
          <a href="#news" onClick={() => setMenuOpen(false)}>备考资讯</a>
        </nav>
        <div className="nav-actions">
          <span className="favorite-pill"><span className="heart">♥</span> 收藏 <span data-testid="favorite-count">{favorites.length}</span></span>
          <div className="user-menu" ref={userMenuRef}>
            <button className="user-button" type="button" onClick={() => setUserOpen((value) => !value)} aria-expanded={userOpen} aria-controls="userPopover">
              <span className="avatar">{user.name.trim().slice(0, 1) || "研"}</span>
              <span className="user-label"><strong>{user.name}</strong><small>{user.targetSchool}</small></span><span aria-hidden="true">⌄</span>
            </button>
            {!userOpen ? null : (
              <div className="user-popover" id="userPopover">
                <p>{user.examYear} 届 · {user.targetSchool} · {user.major}</p>
                <button className="logout-btn" type="button" onClick={logout}>退出并清除信息</button>
              </div>
            )}
          </div>
          <button className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="mainNav" aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}>☰</button>
        </div>
      </div>
    </header>
  );
}
