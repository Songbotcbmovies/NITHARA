document.addEventListener('DOMContentLoaded', () => {
    
    // Navbar functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });

    // Hide global loader for standard pages (if not homepage)
    if (!document.getElementById('categories-container')) {
        setTimeout(() => {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 300);
    }
});

// Rendering functions for Homepage
async function initHomepage() {
    await renderCategories();
    await renderFeaturedProducts();
    await renderNewArrivals();
    
    // Re-trigger observer for dynamically added elements
    setTimeout(() => {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
    }, 100);
    
    // Hide Global Loader with a slight delay for premium feel
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 400); // 400ms delay to ensure smooth transition
}

async function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    const categories = await ApiService.getCategories();
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p>No collections available at the moment.</p>';
        return;
    }
    
    // Only show top level categories on homepage (parent_id is null)
    const topCategories = categories.filter(c => c.parent_id === null).slice(0, 4);
    
    let html = '';
    topCategories.forEach(category => {
        const bgImg = ApiService.getImageUrl(category.image_url);
        html += `
            <a href="/pages/category.html?slug=${category.slug}" class="category-card fade-in">
                <img src="${bgImg}" alt="${category.name}" onerror="this.src='https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop'">
                <div class="overlay">
                    <h3>${category.name}</h3>
                    <span>Explore Collection &rarr;</span>
                </div>
            </a>
        `;
    });
    
    container.innerHTML = html;
}

function createProductCardHTML(product) {
    const mainImg = (product.images && product.images.length > 0) 
        ? ApiService.getImageUrl(product.images.find(i => i.is_primary)?.url || product.images[0].url)
        : 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop';
        
    let badgeHtml = '';
    if (product.featured) badgeHtml = '<div class="badge">Featured</div>';
    
    let priceHtml = `<span>${ApiService.formatPrice(product.price)}</span>`;
    if (product.compare_price && product.compare_price > product.price) {
        priceHtml = `<span class="compare-price">${ApiService.formatPrice(product.compare_price)}</span>` + priceHtml;
    }

    return `
        <a href="/pages/product.html?slug=${product.slug}" class="product-card fade-in">
            <div class="product-img-wrapper">
                ${badgeHtml}
                <img src="${mainImg}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category_name || 'Nithara'}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    ${priceHtml}
                </div>
            </div>
        </a>
    `;
}

async function renderFeaturedProducts() {
    const container = document.getElementById('featured-container');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    const products = await ApiService.getFeaturedProducts();
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p>No featured products available.</p>';
        return;
    }
    
    container.innerHTML = products.slice(0, 4).map(createProductCardHTML).join('');
}

async function renderNewArrivals() {
    const container = document.getElementById('new-arrivals-container');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    const products = await ApiService.getNewArrivals();
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p>No new arrivals available.</p>';
        return;
    }
    
    container.innerHTML = products.slice(0, 4).map(createProductCardHTML).join('');
}

// Run init if on homepage
if (document.getElementById('categories-container')) {
    initHomepage();
}
