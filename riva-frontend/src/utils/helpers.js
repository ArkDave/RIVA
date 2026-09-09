// Avatar initials + deterministic colour
const COLOURS = ['#1D9E75','#378ADD','#D85A30','#BA7517','#7F77DD','#639922','#D4537E']
export function avatarColor(name = '') {
  return COLOURS[name.charCodeAt(0) % COLOURS.length]
}

// Format date string
export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

// Format currency
export function fmtCurrency(n) {
  if (n == null) return '₹0'
  return '₹' + Number(n).toLocaleString('en-IN')
}

// Format elapsed seconds as MM:SS
export function fmtTimer(secs) {
  if (!secs) return '00:00'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// Token status label + badge class
export function tokenStatusBadge(status) {
  const map = {
    RAISED:          { label: 'Raised',        cls: 'bg-gold' },
    IN_DEAL:         { label: 'In Deal',        cls: 'bg-green' },
    AWAITING_BILL:   { label: 'Awaiting Bill',  cls: 'bg-blue' },
    CLOSED_SALE:     { label: 'Sold',           cls: 'bg-green' },
    CLOSED_NON_SALE: { label: 'Non-Sale',       cls: 'bg-red' }
  }
  return map[status] || { label: status, cls: 'bg-gray' }
}

// Order status badge
export function orderStatusBadge(status) {
  const map = {
    RECEIVED:   { label: 'Received',   cls: 'bg-blue' },
    IN_PROCESS: { label: 'In Process', cls: 'bg-gold' },
    READY:      { label: 'Ready',      cls: 'bg-green' },
    DELIVERED:  { label: 'Delivered',  cls: 'bg-gray' }
  }
  return map[status] || { label: status, cls: 'bg-gray' }
}

// Role label
export function roleLabel(role) {
  const map = {
    ADMIN:'Admin', FLOOR_INCHARGE:'Floor Incharge',
    SALES_EXECUTIVE:'Sales Executive', CASHIER:'Cashier',
    ORDER_DEPARTMENT:'Order Dept.', TELECALLER:'Telecaller'
  }
  return map[role] || role
}

// Current month/year
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const currentMonth = () => new Date().getMonth() + 1
export const currentYear  = () => new Date().getFullYear()

// Export table data to Excel
export async function exportToExcel(rows, headers, filename) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
