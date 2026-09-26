document.addEventListener('DOMContentLoaded', () => {
    // Basic Auth Check
    if (!AdminApiService.getToken()) {
        AdminApiService.logout();
        return;
    }
    
    initAdmin();
});

let currentTab = 'products';

function initAdmin() {
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        AdminApiService.logout();
    });
    
    // Load categories for filter dropdown
    AdminApiService.get('/admin/categories').then(cats => {
        if(cats && cats.length) {
            const select = document.getElementById('admin-filter-category');
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        }
    });
    
    document.getElementById('nav-products').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('products');
    });
    
    document.getElementById('nav-categories').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('categories');
    });

    document.getElementById('nav-attributes').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('attributes');
    });

    document.getElementById('nav-featured').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('featured');
    });

    document.getElementById('btn-create').addEventListener('click', async () => {
        if (currentTab === 'categories') {
            document.getElementById('category-modal-title').innerText = 'Create Category';
            document.getElementById('btn-delete-cat').style.display = 'none';
            document.getElementById('cat-id').value = '';
            document.getElementById('category-form').reset();
            document.getElementById('category-modal').style.display = 'flex';
        } else if (currentTab === 'products') {
            document.getElementById('product-modal-title').innerText = 'Create Product';
            document.getElementById('btn-delete-prod').style.display = 'none';
            document.getElementById('prod-id').value = '';
            document.getElementById('product-form').reset();
            await loadAttributeDropdowns();
            document.getElementById('variants-list').innerHTML = '';
            addVariantRow(); // Add first default row
            document.getElementById('product-modal').style.display = 'flex';
        }
    });

    document.getElementById('btn-cancel-cat').addEventListener('click', () => {
        document.getElementById('category-modal').style.display = 'none';
        document.getElementById('category-form').reset();
    });

    document.getElementById('btn-cancel-prod').addEventListener('click', () => {
        document.getElementById('product-modal').style.display = 'none';
        document.getElementById('product-form').reset();
    });

    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('cat-id').value;
        const name = document.getElementById('cat-name').value;
        const description = document.getElementById('cat-desc').value;
        
        const data = { name, description, active: true };
        let response = id ? 
            await AdminApiService.put(`/admin/categories/${id}`, data) : 
            await AdminApiService.post('/admin/categories', data);
        
        if (response.status === 201 || response.status === 200) {
            const targetId = id || response.data.id;
            const fileInput = document.getElementById('cat-image');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);
                try {
                    const token = AdminApiService.getToken();
                    await fetch(`${API_URL}/admin/categories/${targetId}/image`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                } catch (err) {}
            }
            document.getElementById('category-modal').style.display = 'none';
            document.getElementById('category-form').reset();
            document.getElementById('cat-id').value = '';
            document.getElementById('category-modal-title').innerText = 'Create Category';
            loadData();
        } else {
            alert(response.data?.message || 'Error saving category');
        }
    });

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const basePrice = parseFloat(document.getElementById('prod-price').value);
        const baseSku = document.getElementById('prod-sku').value;
        
        const productData = {
            name: document.getElementById('prod-name').value,
            category_id: parseInt(document.getElementById('prod-cat').value),
            price: basePrice,
            sku: baseSku,
            description: document.getElementById('prod-desc').value,
            active: true
        };
        
        let response;
        let productId = id;
        if (id) {
            response = await AdminApiService.put(`/admin/products/${id}`, productData);
        } else {
            response = await AdminApiService.post('/admin/products', productData);
            if (response.status === 201) {
                productId = response.data.id;
                const isVariable = document.querySelector('input[name="prod_type"]:checked').value === 'variable';
                if (isVariable) {
                    const rows = document.querySelectorAll('.variant-row');
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const varSize = row.querySelector('.var-size-input').value;
                        const varColor = row.querySelector('.var-color-input').value;
                        const varPriceInput = row.querySelector('.var-price-input').value;
                        const varPrice = varPriceInput ? parseFloat(varPriceInput) : basePrice;
                        const varStock = parseInt(row.querySelector('.var-stock-input').value) || 0;
                        let variantSku = baseSku;
                        if (varSize) variantSku += `-${varSize}`;
                        if (varColor) variantSku += `-${varColor}`;
                        variantSku += `-${i + 1}`;
                        const variantData = { sku: variantSku, price: varPrice, size: varSize || null, color: varColor || null, stock_quantity: varStock, active: true };
                        await AdminApiService.post(`/admin/products/${productId}/variants`, variantData);
                    }
                } else {
                    const simpleStock = parseInt(document.getElementById('simple-stock').value) || 0;
                    const variantData = { sku: baseSku, price: basePrice, size: null, color: null, stock_quantity: simpleStock, active: true };
                    await AdminApiService.post(`/admin/products/${productId}/variants`, variantData);
                }
            }
        }
        
        if (response.status === 201 || response.status === 200) {
            const fileInput = document.getElementById('prod-image');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);
                formData.append('is_primary', 'true');
                try {
                    const token = AdminApiService.getToken();
                    await fetch(`${API_URL}/admin/products/${productId}/images`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                } catch(err) {}
            }
            
            document.getElementById('product-modal').style.display = 'none';
            document.getElementById('product-form').reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('product-modal-title').innerText = 'Create Product';
            toggleProductType();
            loadData();
        } else {
            alert(response.data?.message || 'Error saving product');
        }
    });
    
    // Load initial data
    loadData();
}

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(`nav-${tabName}`).classList.add('active');
    
    document.getElementById('dashboard-title').innerText = 
        tabName === 'products' ? 'Products Management' : 
        tabName === 'categories' ? 'Categories Management' : 
        tabName === 'attributes' ? 'Global Attributes' : 'Featured Products';
        
    document.getElementById('btn-create').style.display = (tabName === 'attributes' || tabName === 'featured') ? 'none' : 'block';
    document.getElementById('attributes-manager').style.display = tabName === 'attributes' ? 'block' : 'none';
    
    document.getElementById('admin-filter-category').style.display = (tabName === 'products' || tabName === 'featured') ? 'block' : 'none';
    document.getElementById('admin-filter-availability').value = 'all';
    document.getElementById('admin-filter-category').value = 'all';
    
    loadData();
}

let currentData = [];

async function loadData() {
    const tbody = document.getElementById('table-body');
    const thead = document.getElementById('table-head');
    
    tbody.innerHTML = '<tr><td colspan="10"><div class="spinner-container"><div class="spinner"></div></div></td></tr>';
    
    document.getElementById('admin-search-input').value = '';
    
    try {
        if (currentTab === 'products') {
            thead.innerHTML = `
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
            `;
            currentData = await AdminApiService.get('/admin/products');
        } else if (currentTab === 'categories') {
            thead.innerHTML = `
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Actions</th>
            `;
            currentData = await AdminApiService.get('/admin/categories');
        } else if (currentTab === 'attributes') {
            thead.innerHTML = `
                <th>ID</th>
                <th>Type</th>
                <th>Value</th>
                <th>Actions</th>
            `;
            currentData = await AdminApiService.get('/admin/presets');
        } else if (currentTab === 'featured') {
            thead.innerHTML = `
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Featured</th>
                <th>Actions</th>
            `;
            currentData = await AdminApiService.get('/admin/products');
        }
    } catch(err) {
        currentData = [];
    }
    
    renderTableData();
}

function renderTableData() {
    const tbody = document.getElementById('table-body');
    const searchStr = (document.getElementById('admin-search-input').value || '').toLowerCase();
    const sortVal = document.getElementById('admin-sort-select').value;
    const catVal = document.getElementById('admin-filter-category').value;
    const availVal = document.getElementById('admin-filter-availability').value;
    
    if (!currentData || currentData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10">No records found.</td></tr>`;
        return;
    }
    
    // Filter
    let filtered = currentData.filter(item => {
        // Availability Filter
        if (availVal !== 'all' && item.active !== undefined) {
            if (availVal === 'active' && !item.active) return false;
            if (availVal === 'inactive' && item.active) return false;
        }
        
        // Category Filter (only applicable if item has category_id)
        if (catVal !== 'all' && item.category_id !== undefined) {
            if (String(item.category_id) !== catVal) return false;
        }

        if (!searchStr) return true;
        const nameMatch = (item.name || '').toLowerCase().includes(searchStr);
        const valMatch = (item.value || '').toLowerCase().includes(searchStr); // for attributes
        const typeMatch = (item.attr_type || '').toLowerCase().includes(searchStr);
        const slugMatch = (item.slug || '').toLowerCase().includes(searchStr);
        const idMatch = String(item.id) === searchStr;
        return nameMatch || valMatch || typeMatch || slugMatch || idMatch;
    });
    
    // Sort
    filtered.sort((a, b) => {
        if (sortVal === 'newest') return b.id - a.id;
        if (sortVal === 'oldest') return a.id - b.id;
        
        const nameA = (a.name || a.value || '').toLowerCase();
        const nameB = (b.name || b.value || '').toLowerCase();
        if (sortVal === 'name_asc') return nameA.localeCompare(nameB);
        if (sortVal === 'name_desc') return nameB.localeCompare(nameA);
        return 0;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10">No matches for "${searchStr}"</td></tr>`;
        return;
    }
    
    if (currentTab === 'products') {
        tbody.innerHTML = filtered.map(p => {
            const imgUrl = p.image_url ? ApiService.getImageUrl(p.image_url) : 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=100&auto=format&fit=crop';
            return `
            <tr>
                <td>${p.id}</td>
                <td><img src="${imgUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td>${p.name}</td>
                <td>${p.price || '-'}</td>
                <td><span style="color: ${p.active ? 'green' : 'red'};">${p.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button onclick="editProduct(${p.id})" style="color: var(--primary-gold); background: none; border: none; cursor: pointer; text-decoration: underline;">Edit</button>
                </td>
            </tr>
            `;
        }).join('');
    } else if (currentTab === 'categories') {
        tbody.innerHTML = filtered.map(c => {
            const imgUrl = c.image_url ? ApiService.getImageUrl(c.image_url) : 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=100&auto=format&fit=crop';
            return `
            <tr>
                <td>${c.id}</td>
                <td><img src="${imgUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td>${c.name}</td>
                <td>${c.slug}</td>
                <td><span style="color: ${c.active ? 'green' : 'red'};">${c.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button onclick="editCategory(${c.id})" style="color: var(--primary-gold); background: none; border: none; cursor: pointer; text-decoration: underline;">Edit</button>
                </td>
            </tr>
            `;
        }).join('');
    } else if (currentTab === 'attributes') {
        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td>${p.id}</td>
                <td style="text-transform: capitalize;">${p.attr_type}</td>
                <td>${p.value}</td>
                <td>
                    <a href="#" style="color: red;" onclick="deletePreset(${p.id})">Delete</a>
                </td>
            </tr>
        `).join('');
    } else if (currentTab === 'featured') {
        // If sorting isn't active, sort featured products to top by default
        if (sortVal === 'newest') {
            filtered.sort((a, b) => (b.featured === a.featured) ? (b.id - a.id) : (b.featured ? 1 : -1));
        }
        
        tbody.innerHTML = filtered.map(p => {
            const imgUrl = p.image_url ? ApiService.getImageUrl(p.image_url) : 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=100&auto=format&fit=crop';
            return `
            <tr>
                <td>${p.id}</td>
                <td><img src="${imgUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td>${p.name}</td>
                <td>${p.price || '-'}</td>
                <td>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" ${p.featured ? 'checked' : ''} onchange="toggleFeatured(${p.id}, this.checked)" style="margin-right: 8px; width: 18px; height: 18px; accent-color: var(--primary-gold);">
                        <span style="color: ${p.featured ? 'var(--primary-gold)' : 'var(--muted)'}; font-weight: ${p.featured ? '600' : 'normal'};">
                            ${p.featured ? 'Featured' : 'Not Featured'}
                        </span>
                    </label>
                </td>
                <td>
                    <button onclick="editProduct(${p.id})" style="color: var(--primary-gold); background: none; border: none; cursor: pointer; text-decoration: underline;">Edit</button>
                </td>
            </tr>
            `;
        }).join('');
    }
}

window.toggleFeatured = async function(id, isFeatured) {
    try {
        const res = await AdminApiService.put('/admin/products/' + id, { featured: isFeatured });
        if (res && res.message) {
            // Find in current data and update
            const p = currentData.find(prod => prod.id === id);
            if (p) p.featured = isFeatured;
            // No need to re-render the whole table, the checkbox is already updated
        }
    } catch (err) {
        alert('Failed to update featured status');
        // Re-render to revert the checkbox state on error
        renderTableData();
    }
}

document.getElementById('admin-search-input').addEventListener('input', renderTableData);
document.getElementById('admin-sort-select').addEventListener('change', renderTableData);
document.getElementById('admin-filter-category').addEventListener('change', renderTableData);
document.getElementById('admin-filter-availability').addEventListener('change', renderTableData);

window.editCategory = async function(id) {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.remove('hidden');
    
    const categories = await AdminApiService.get('/admin/categories');
    const cat = categories.find(c => c.id === id);
    if (cat) {
        document.getElementById('cat-id').value = cat.id;
        document.getElementById('cat-name').value = cat.name;
        document.getElementById('cat-desc').value = cat.description || '';
        document.getElementById('category-modal-title').innerText = 'Edit Category';
        document.getElementById('btn-delete-cat').style.display = 'block';
        document.getElementById('category-modal').style.display = 'flex';
    }
    if (loader) loader.classList.add('hidden');
}
window.deleteCategory = async function(id) {
    if(!confirm('Delete this category?')) return;
    const res = await AdminApiService.delete('/admin/categories/' + id);
    if(res.status === 200) {
        document.getElementById('category-modal').style.display = 'none';
        loadData();
    }
    else alert('Error deleting category');
}

window.editProduct = async function(id) {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.remove('hidden');

    const res = await AdminApiService.get('/admin/products/' + id);
    if (res) {
        document.getElementById('prod-id').value = res.id;
        document.getElementById('prod-name').value = res.name;
        document.getElementById('prod-cat').value = res.category_id;
        document.getElementById('prod-price').value = res.price;
        document.getElementById('prod-sku').value = res.sku || '';
        document.getElementById('prod-desc').value = res.description || '';
        document.getElementById('product-modal-title').innerText = 'Edit Product';
        
        await loadAttributeDropdowns();
        document.getElementById('variants-list').innerHTML = '';
        document.querySelector('input[name="prod_type"][value="simple"]').checked = true;
        toggleProductType();
        
        document.getElementById('btn-delete-prod').style.display = 'block';
        document.getElementById('product-modal').style.display = 'flex';
    }
    
    if (loader) loader.classList.add('hidden');
}
window.deleteProduct = async function(id) {
    if(!confirm('Delete this product?')) return;
    const res = await AdminApiService.delete('/admin/products/' + id);
    if(res.status === 200) {
        document.getElementById('product-modal').style.display = 'none';
        loadData();
    }
    else alert('Error deleting product');
}

document.getElementById('btn-delete-cat').addEventListener('click', () => {
    const id = document.getElementById('cat-id').value;
    if(id) deleteCategory(id);
});
document.getElementById('btn-delete-prod').addEventListener('click', () => {
    const id = document.getElementById('prod-id').value;
    if(id) deleteProduct(id);
});

// --- Attribute Presets Logic ---
document.getElementById('attr-preset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        attr_type: document.getElementById('attr-preset-type').value,
        value: document.getElementById('attr-preset-value').value
    };
    
    const response = await AdminApiService.post('/admin/presets', data);
    if (response.status === 201) {
        document.getElementById('attr-preset-form').reset();
        loadData();
    } else {
        alert(response.data.message || 'Error creating preset');
    }
});

window.deletePreset = async function(id) {
    if(!confirm('Are you sure you want to delete this preset?')) return;
    const response = await AdminApiService.delete(`/admin/presets/${id}`);
    if (response.status === 200) {
        loadData();
    } else {
        alert(response.data?.message || 'Error deleting preset');
    }
};

window.sizeOptionsHtml = '<option value="">No Size</option>';
window.colorOptionsHtml = '<option value="">No Color</option>';

async function loadAttributeDropdowns() {
    const presets = await AdminApiService.get('/admin/presets');
    if (!presets) return;
    
    const sizes = presets.filter(p => p.attr_type === 'size');
    const colors = presets.filter(p => p.attr_type === 'color');
    
    window.sizeOptionsHtml = '<option value="">No Size</option>' + sizes.map(s => `<option value="${s.value}">${s.value}</option>`).join('');
    window.colorOptionsHtml = '<option value="">No Color</option>' + colors.map(c => `<option value="${c.value}">${c.value}</option>`).join('');
}

window.addVariantRow = function() {
    const row = document.createElement('div');
    row.className = 'variant-row';
    row.style = 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;';
    
    row.innerHTML = `
        <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:3px;">Size</label>
            <select class="var-size-input" style="width:100%; padding:6px; border:1px solid #ccc;">${window.sizeOptionsHtml}</select>
        </div>
        <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:3px;">Color</label>
            <select class="var-color-input" style="width:100%; padding:6px; border:1px solid #ccc;">${window.colorOptionsHtml}</select>
        </div>
        <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:3px;">Price Override</label>
            <input type="number" class="var-price-input" step="0.01" placeholder="Base price" style="width:100%; padding:6px; border:1px solid #ccc;">
        </div>
        <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:3px;">Stock</label>
            <input type="number" class="var-stock-input" value="10" required style="width:100%; padding:6px; border:1px solid #ccc;">
        </div>
        <button type="button" onclick="this.parentElement.remove()" style="color:red; background:none; border:none; cursor:pointer; padding:6px;">X</button>
    `;
    document.getElementById('variants-list').appendChild(row);
}
