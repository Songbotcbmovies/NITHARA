document.addEventListener('DOMContentLoaded', () => {
    initCategoryPage();
});

async function initCategoryPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        window.location.href = '/pages/products.html';
        return;
    }

    // Fetch Category Details
    const category = await ApiService.get(`/categories/${slug}`);
    
    if (!category || category.message) {
        document.getElementById('category-title').innerText = 'Category Not Found';
        document.getElementById('category-products-container').innerHTML = '<p>The requested category does not exist.</p>';
        return;
    }

    // Update Hero Section
    document.title = `${category.name} | Nithara Fashion Store`;
    document.getElementById('category-title').innerText = category.name;
    
    if (category.description) {
        document.getElementById('category-desc').innerText = category.description;
    }
    
    const heroEl = document.getElementById('category-hero');
    if (category.image_url) {
        heroEl.style.backgroundImage = `url('${ApiService.getImageUrl(category.image_url)}')`;
    } else {
        // Fallback fashion image
        heroEl.style.backgroundImage = `url('https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000&auto=format&fit=crop')`;
    }

    // Fetch Products in this category
    const products = await ApiService.get(`/products?category=${slug}`);
    
    const container = document.getElementById('category-products-container');
    if (!products || products.length === 0) {
        container.innerHTML = '<p>No products found in this category.</p>';
        return;
    }

    container.innerHTML = products.map(createDetailedProductCardHTML).join('');
    
    // Animate
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }, 50);

    // Hide Global Loader
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    }, 400);
}

// Re-using the same card generator logic from products.js to maintain consistency
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
