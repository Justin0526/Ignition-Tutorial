export function formatNumber(n: number) {
    return n.toLocaleString()
}

export function formatPercent(rate: number) {
    // supports 0.15 or 15
    const value = rate > 1 ? rate : rate * 100
    return `${Math.round(value)}%`
}
