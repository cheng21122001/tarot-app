import { useState, type FormEvent } from 'react';
import { supabase } from '../data/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(/invalid login/i.test(err.message) ? '邮箱或密码不对' : `登录失败：${err.message}`);
  };

  return (
    <div className="page">
      <h1>小艾</h1>
      <p className="hint">使用「河」和「小熊红黑榜」的账号登录</p>
      <form onSubmit={submit}>
        <label className="field">
          <span>邮箱</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>密码</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? '登录中…' : '登录'}</button>
      </form>
    </div>
  );
}
