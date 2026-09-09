import { avatarColor } from '../../utils/helpers'

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ name = '', size = 34 }) {
  const bg = avatarColor(name)
  return (
    <div className="av" style={{
      width: size, height: size, background: bg + '20',
      border: `1.5px solid ${bg}40`, color: bg,
      fontSize: size * 0.35
    }}>
      {name.slice(0,2).toUpperCase()}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ label, cls = 'bg-gray' }) {
  return <span className={`badge ${cls}`}>{label}</span>
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="mh">
          <h3>{title}</h3>
          <button className="mc" onClick={onClose}>×</button>
        </div>
        <div className="mb">{children}</div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner() {
  return <div className="loader"><span className="spin">⟳</span></div>
}

// ── Empty State ───────────────────────────────────────────────
export function Empty({ icon = '📭', title = 'No data', subtitle }) {
  return (
    <div className="empty">
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12 }}>{subtitle}</div>}
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────
export function Field({ label, required, children }) {
  return (
    <div className="fg">
      <label>{label}{required && <span className="req"> *</span>}</label>
      {children}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <select className="fc" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <input
      className="fc" type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
    />
  )
}

// ── Confirm Dialog ────────────────────────────────────────────
export function Confirm({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm Action" onClose={onCancel}>
      <p style={{ marginBottom: 18, color: 'var(--tx2)' }}>{message}</p>
      <div className="flex gap-2">
        <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </Modal>
  )
}
