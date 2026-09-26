document.addEventListener('DOMContentLoaded', () => {
    initProductsPage();
});

let allProducts = [];
let currentCategoryFilter = 'all';
let currentSort = 'default';
let currentSearchQuery = '';

async function initProductsPage() {
    const container = document.getElementById('all-products-container');
    const countElement = document.getElementById('results-count');
    
    if (!container) return;
    
    // 1. Populate Category Dropdown
    await loadCategoryDropdown();

    // 2. Check for search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery) {
        document.getElementById('search-input').value = searchQuery;
        currentSearchQuery = searchQuery;
        allProducts = await ApiService.get(`/products/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
        // Fetch all products normally
        allProducts = await ApiService.get('/products');
    }
    
    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<p>No products found matching your criteria.</p>';
        countElement.innerText = '0 products found';
    } else {
        applyFiltersAndSort();
    }

    // Setup Event Listeners
    setupEventListeners();

    // Hide Global Loader
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    }, 400);
}

async function loadCategoryDropdown() {
    const categories = await ApiService.getCategories();
    const select = document.getElementById('category-filter');
    if (!categories || !select) return;
    
    categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.slug;
        option.innerText = c.name;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Search Button
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    
    // Search Enter Key
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Category Filter
    document.getElementById('category-filter').addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        applyFiltersAndSort();
    });

    // Sorting
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
    });
}

async function handleSearch() {
    const input = document.getElementById('search-input').value.trim();
    if (input) {
        // Update URL without reloading page
        window.history.pushState({}, '', `?q=${encodeURIComponent(input)}`);
        
        currentSearchQuery = input;
        allProducts = await ApiService.get(`/products/search?q=${encodeURIComponent(input)}`);
        
        // Reset category filter on new search to avoid confusion
        currentCategoryFilter = 'all';
        document.getElementById('category-filter').value = 'all';
        
        applyFiltersAndSort();
    } else if (currentSearchQuery !== '') {
        // Cleared search
        window.history.pushState({}, '', window.location.pathname);
        currentSearchQuery = '';
        allProducts = await ApiService.get('/products');
        applyFiltersAndSort();
    }
}

function applyFiltersAndSort() {
    let filtered = [...(allProducts || [])];
    
    // 1. Apply Category Filter (if we fetched all, or if search results span categories)
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(p => p.slug === currentCategoryFilter || (p.category_name && p.category_name.toLowerCase() === document.getElementById('category-filter').options[document.getElementById('category-filter').selectedIndex].text.toLowerCase()));
        
        // Better filter strategy: since our API payload doesn't reliably include category slug in product obj,
        // we might just filter by checking category_name match against the select box text.
        const catText = document.getElementById('category-filter').options[document.getElementById('category-filter').selectedIndex].text;
        filtered = [...(allProducts || [])].filter(p => p.category_name === catText);
    }
    
    // 2. Apply Sorting
    switch(currentSort) {
        case 'price_asc':
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price_desc':
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'newest':
            filtered.sort((a, b) => b.id - a.id);
            break;
    }
    
    renderProductsGrid(filtered);
}

function renderProductsGrid(productsToRender) {
    const container = document.getElementById('all-products-container');
    const countElement = document.getElementById('results-count');
    
    countElement.innerText = `Showing ${productsToRender.length} products`;
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<p>No products match your current filters.</p>';
        return;
    }
    
    container.innerHTML = productsToRender.map(createDetailedProductCardHTML).join('');
    
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }, 50);
}

function createDetailedProductCardHTML(product) {
    const mainImg = (product.images && product.images.length > 0) 
        ? ApiService.getImageUrl(product.images.find(i => i.is_primary)?.url || product.images[0].url)
        : 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop';
        
    let badgeHtml = '';
    if (product.featured) badgeHtml = '<div class="badge">Featured</div>';
    
    let discountHtml = '';
    let priceHtml = `<span>${ApiService.formatPrice(product.price)}</span>`;
    
    if (product.compare_price && product.compare_price > product.price) {
        priceHtml = `<span class="compare-price">${ApiService.formatPrice(product.compare_price)}</span> ` + priceHtml;
        const discountPercent = Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
        discountHtml = `<div class="discount-badge">-${discountPercent}%</div>`;
    }
    
    let stockStatusHtml = '<div class="stock-status in-stock">Available</div>';
    
    return `
        <div class="product-card fade-in">
            <a href="/pages/product.html?slug=${product.slug}">
                <div class="product-img-wrapper">
                    ${badgeHtml}
                    ${discountHtml}
                    <img src="${mainImg}" alt="${product.name}" loading="lazy">
                </div>
            </a>
            <div class="product-info">
                <div class="product-category">${product.category_name || 'Nithara'}</div>
                <a href="/pages/product.html?slug=${product.slug}">
                    <h3 class="product-name">${product.name}</h3>
                </a>
                <div class="product-price">
                    ${priceHtml}
                </div>
                ${stockStatusHtml}
                <a href="/pages/product.html?slug=${product.slug}" class="btn-view-product">View Product</a>
            </div>
        </div>
    `;
}
