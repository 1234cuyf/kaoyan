"use client";

import { FormEvent, useState } from "react";
import { validateAccessFields } from "@/lib/core";
import type { AccessFormData } from "@/lib/types";

interface AccessGateProps {
  onLogin: (data: AccessFormData) => void;
}

export function AccessGate({ onLogin }: AccessGateProps) {
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const values = Object.fromEntries(new FormData(event.currentTarget)) as unknown as AccessFormData;
    const result = validateAccessFields(values);
    setError(result.message);
    if (!result.ok) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/kaoyan-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => null) as { message?: unknown } | null;
      if (!response.ok) {
        setError(typeof payload?.message === "string" ? payload.message : "登记失败，请稍后重试");
        return;
      }
      onLogin(values);
    } catch {
      setError("登记失败，请检查网络后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="access-gate" id="accessGate" aria-labelledby="accessTitle">
      <div className="gate-story">
        <div className="story-inner">
          <a className="brand" href="#" aria-label="研题库首页">
            <span className="brand-mark">研</span><span>研题库</span>
          </a>
          <div className="story-copy">
            <h1>把每一次练习，变成<span>上岸的底气。</span></h1>
            <p>汇集历年公共课与热门院校专业课真题，让信息更清晰，让复习更有方向。</p>
            <div className="story-points">
              <div className="story-point">按院校、科目、年份快速检索</div>
              <div className="story-point">重点真题随手收藏，进度更连贯</div>
              <div className="story-point">安全登记备考方向，访问密钥不会明文保存</div>
            </div>
          </div>
          <p className="gate-foot">研题库 · 为认真准备的每一天</p>
        </div>
      </div>

      <div className="gate-panel">
        <div className="access-card">
          <a className="brand mobile-brand" href="#" aria-label="研题库首页">
            <span className="brand-mark">研</span><span>研题库</span>
          </a>
          <h2 id="accessTitle">开始你的真题之旅</h2>
          <p>请登记基本备考信息并输入访问密钥。带 <strong>*</strong> 的项目均为必填。</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">姓名 *</label>
                <input id="name" name="name" type="text" autoComplete="name" placeholder="例如：张同学" required />
              </div>
              <div className="field">
                <label htmlFor="examYear">考研年份 *</label>
                <select id="examYear" name="examYear" required defaultValue="">
                  <option value="">请选择年份</option><option value="2027">2027 届</option><option value="2028">2028 届</option><option value="2029">2029 届</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="currentSchool">当前院校 *</label>
                <input id="currentSchool" name="currentSchool" type="text" placeholder="例如：湖南大学" required />
              </div>
              <div className="field">
                <label htmlFor="targetSchool">目标院校 *</label>
                <input id="targetSchool" name="targetSchool" type="text" placeholder="例如：武汉大学" required />
              </div>
              <div className="field field-full">
                <label htmlFor="major">报考专业 *</label>
                <input id="major" name="major" type="text" placeholder="例如：计算机科学与技术" required />
              </div>
              <div className="field field-full">
                <label htmlFor="accessKey">访问密钥 *</label>
                <div className="key-wrap">
                  <input id="accessKey" name="accessKey" type={showKey ? "text" : "password"} autoComplete="off" placeholder="请输入访问密钥" required />
                  <button className="key-toggle" type="button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? "隐藏密钥" : "显示密钥"}>{showKey ? "隐藏" : "显示"}</button>
                </div>
                <div className="key-hint"><span>访问密钥仅用于服务端验证</span><span>不会以明文保存</span></div>
              </div>
              <div className="field field-full">
                <p className="form-error" role="alert" aria-live="polite">{error}</p>
                <button disabled={submitting} className="primary-btn access-submit" type="submit">
                  {submitting ? "正在登记…" : <>验证并进入题库 <span aria-hidden="true">→</span></>}
                </button>
              </div>
            </div>
          </form>
          <p className="privacy-note">提交后，备考登记信息将保存到服务端数据库；访问密钥仅保存不可逆哈希。非密钥资料仍会保存在当前浏览器，用于恢复本地会话。</p>
        </div>
      </div>
    </section>
  );
}
