// MatDiscoverAI – shared frontend utilities

async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
}

function formatNumber(n, decimals = 2) {
    if (n === null || n === undefined) return '—';
    if (typeof n !== 'number') return n;
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function showToast(message, type = 'success') {
    const wrapper = document.createElement('div');
    wrapper.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    wrapper.style.cssText = 'top:80px;right:20px;z-index:9999;min-width:300px;';
    wrapper.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 4000);
}

// Plotly default layout
const PLOTLY_LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', size: 12, color: '#374151' },
    margin: { t: 30, r: 20, b: 40, l: 50 },
};
const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };

console.log('MatDiscoverAI ready');
