import './bootstrap';
import Chart from 'chart.js/auto';
import axios from 'axios';

if (typeof window !== 'undefined') {
    window.Chart = Chart;
    window.axios = axios;
    window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    const tokenMeta = document.head.querySelector('meta[name="csrf-token"]');
    if (tokenMeta) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenMeta.getAttribute('content');
    }
}
