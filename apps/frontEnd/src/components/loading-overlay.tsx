'use client';

/** 全站共用加载遮罩（登录检查 / 路由跳转） */
export function LoadingOverlay() {
  return (
    <div
      className="auth-gate"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="加载中"
    >
      <div className="auth-gate-panel">
        <span className="auth-gate-mark" aria-hidden>
          <span className="auth-gate-ring" />
          <span className="auth-gate-seal">墨</span>
        </span>
        <p className="auth-gate-title">
          加载中
          <span className="auth-gate-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        </p>
      </div>
    </div>
  );
}
