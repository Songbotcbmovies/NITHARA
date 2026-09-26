document.addEventListener('DOMContentLoaded', () => {
    initProductDetails();
});

let currentProduct = null;

async function initProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        window.location.href = '/pages/products.html';
        return;
    }

    currentProduct = await ApiService.get(`/products/${slug}`);
    
    document.getElementById('loading-state').style.display = 'none';
    
    if (!currentProduct || currentProduct.message) {
        document.getElementById('error-state').style.display = 'block';
        return;
    }

    renderProductInfo();
    renderGallery();
    renderVariants();
    renderAttributes();
    
    document.getElementById('pd-content').style.display = 'grid';
    setTimeout(() => {
        document.getElementById('pd-content').classList.add('visible');
    }, 50);

    // Hide Global Loader
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    }, 400);
}

function renderProductInfo() {
    document.title = `${currentProduct.name} | Nithara Fashion Store`;
    
    document.getElementById('pd-category').innerText = currentProduct.category_name || '';
    document.getElementById('pd-title').innerText = currentProduct.name;
    document.getElementById('pd-brand').innerText = currentProduct.brand ? `By ${currentProduct.brand}` : '';
    
    document.getElementById('pd-price').innerText = ApiService.formatPrice(currentProduct.price);
    if (currentProduct.compare_price && currentProduct.compare_price > currentProduct.price) {
        document.getElementById('pd-compare-price').innerText = ApiService.formatPrice(currentProduct.compare_price);
    }
    
    document.getElementById('pd-sku').innerText = `SKU: ${currentProduct.sku}`;
    document.getElementById('pd-desc').innerText = currentProduct.description || 'No description available.';
    
    const stockStatus = (currentProduct.active) ? 'Available' : 'Currently Unavailable';
    const availabilityEl = document.getElementById('pd-availability');
    availabilityEl.innerText = stockStatus;
    if (!currentProduct.active) {
        availabilityEl.style.backgroundColor = '#FFF5F5';
        availabilityEl.style.color = '#E53E3E';
    }
}

function renderGallery() {
    const mainImgEl = document.getElementById('pd-main-img');
    const thumbnailsContainer = document.getElementById('pd-thumbnails');
    
    let images = currentProduct.images || [];
    
    if (images.length === 0) {
        mainImgEl.src = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop';
        return;
    }
    
    // Sort and set primary
    const primaryImg = images.find(img => img.is_primary) || images[0];
    mainImgEl.src = ApiService.getImageUrl(primaryImg.url);
    mainImgEl.alt = primaryImg.alt_text || currentProduct.name;
    
    if (images.length > 1) {
        thumbnailsContainer.innerHTML = images.map((img, index) => {
            const url = ApiService.getImageUrl(img.url);
            const activeClass = (img.id === primaryImg.id) ? 'active' : '';
            return `<img src="${url}" class="pd-thumb ${activeClass}" onclick="setMainImage(this, '${url}')" alt="Thumbnail">`;
        }).join('');
    }
}

function setMainImage(thumbElement, url) {
    document.getElementById('pd-main-img').src = url;
    document.querySelectorAll('.pd-thumb').forEach(el => el.classList.remove('active'));
    thumbElement.classList.add('active');
}

function renderVariants() {
    const variants = currentProduct.variants || [];
    if (variants.length === 0) return;
    
    // Extract unique sizes and colors
    const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];
    const colors = [...new Set(variants.filter(v => v.color).map(v => v.color))];
    
    if (sizes.length > 0) {
        document.getElementById('pd-sizes-container').style.display = 'block';
        document.getElementById('pd-sizes').innerHTML = sizes.map(size => 
            `<button class="variant-btn">${size}</button>`
        ).join('');
    }
    
    if (colors.length > 0) {
        document.getElementById('pd-colors-container').style.display = 'block';
        document.getElementById('pd-colors').innerHTML = colors.map(color => 
            `<button class="variant-btn">${color}</button>`
        ).join('');
    }
    
    // Setup interactive variant buttons
    document.querySelectorAll('.variant-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from siblings
            Array.from(this.parentElement.children).forEach(sibling => sibling.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function renderAttributes() {
    const attributes = currentProduct.attributes || {};
    const keys = Object.keys(attributes);
    
    const attrContainer = document.getElementById('pd-attributes');
    const attrList = document.getElementById('pd-attr-list');
    
    if (keys.length === 0) {
        attrContainer.style.display = 'none';
        return;
    }
    
    attrList.innerHTML = keys.map(key => `
        <div class="pd-attr-row">
            <div class="pd-attr-name">${key}</div>
            <div class="pd-attr-val">${attributes[key]}</div>
        </div>
    `).join('');
}
