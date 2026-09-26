document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search-input');
    const searchDropdown = document.getElementById('global-search-dropdown');
    
    if (!searchInput || !searchDropdown) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchDropdown.classList.remove('active');
            return;
        }
        
        debounceTimer = setTimeout(async () => {
            searchDropdown.innerHTML = '<div class="search-empty">Searching...</div>';
            searchDropdown.classList.add('active');
            
            try {
                // Ensure ApiService is available
                const products = await ApiService.get(`/products/search?q=${encodeURIComponent(query)}`);
                
                if (!products || products.length === 0) {
                    searchDropdown.innerHTML = '<div class="search-empty">No products found for "' + query + '"</div>';
                    return;
                }
                
                // Show up to 5 results
                const results = products.slice(0, 5);
                let html = '';
                
                results.forEach(p => {
                    const imgUrl = (p.images && p.images.length > 0) 
                        ? ApiService.getImageUrl(p.images.find(i => i.is_primary)?.url || p.images[0].url)
                        : 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=100&auto=format&fit=crop';
                        
                    html += `
                        <a href="/pages/product.html?slug=${p.slug}" class="search-dropdown-item">
                            <img src="${imgUrl}" alt="${p.name}">
                            <div class="search-dropdown-item-details">
                                <span class="search-dropdown-item-title">${p.name}</span>
                                <span class="search-dropdown-item-price">${ApiService.formatPrice(p.price)}</span>
                            </div>
                        </a>
                    `;
                });
                
                if (products.length > 5) {
                    html += `<a href="/pages/products.html?q=${encodeURIComponent(query)}" class="search-dropdown-item" style="justify-content: center; color: var(--primary-gold); font-weight: 500;">View all ${products.length} results</a>`;
                }
                
                searchDropdown.innerHTML = html;
            } catch (err) {
                searchDropdown.innerHTML = '<div class="search-empty">Error fetching results</div>';
            }
        }, 400);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });
    
    // Re-open on focus if there's text
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2 && searchDropdown.innerHTML.trim() !== '') {
            searchDropdown.classList.add('active');
        }
    });
});
