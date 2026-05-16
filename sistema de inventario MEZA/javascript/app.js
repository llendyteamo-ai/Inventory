const productForm = document.getElementById('productForm');
const productNameInput = document.getElementById('productName');
const productCategoryInput = document.getElementById('productCategory');
const productQuantityInput = document.getElementById('productQuantity');
const productPriceInput = document.getElementById('productPrice');
const productTableBody = document.querySelector('#productTable tbody');
const totalProducts = document.getElementById('totalProducts');
const totalStock = document.getElementById('totalStock');
const totalValue = document.getElementById('totalValue');
const emptyMessage = document.getElementById('emptyMessage');
const searchInput = document.getElementById('searchInput');
const saveButton = document.getElementById('saveButton');
const cancelEditButton = document.getElementById('cancelEditButton');

let products = [];
let currentEditId = null;

function loadProducts() {
    const stored = localStorage.getItem('inventoryProducts');
    products = stored ? JSON.parse(stored) : [];
}

function saveProducts() {
    localStorage.setItem('inventoryProducts', JSON.stringify(products));
}

function formatMoney(value) {
    return `$${value.toFixed(2)}`;
}

function updateSummary() {
    if (!totalProducts || !totalStock || !totalValue) return;
    const totalItems = products.reduce((sum, item) => sum + item.quantity, 0);
    const totalVal = products.reduce((sum, item) => sum + item.quantity * item.price, 0);
    totalProducts.textContent = products.length;
    totalStock.textContent = totalItems;
    totalValue.textContent = formatMoney(totalVal);
}

function renderInventory(filter = '') {
    if (!productTableBody) return;
    const normalizedFilter = filter.trim().toLowerCase();
    productTableBody.innerHTML = '';

    const filtered = products.filter((product) => {
        if (!normalizedFilter) return true;
        return (
            product.name.toLowerCase().includes(normalizedFilter) ||
            product.category.toLowerCase().includes(normalizedFilter)
        );
    });

    if (emptyMessage) {
        if (filtered.length === 0) {
            emptyMessage.style.display = 'block';
            emptyMessage.textContent = products.length
                ? 'No se encontraron productos con ese criterio de búsqueda.'
                : 'No hay productos en el inventario. Agrega el primero.';
        } else {
            emptyMessage.style.display = 'none';
        }
    }

    filtered.forEach((product) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>${product.quantity}</td>
            <td>${formatMoney(product.price)}</td>
            <td>${formatMoney(product.quantity * product.price)}</td>
            <td>
                <button class="action-button edit" data-id="${product.id}">Editar</button>
                <button class="action-button delete" data-id="${product.id}">Eliminar</button>
            </td>
        `;
        productTableBody.appendChild(row);
    });
}

function resetForm() {
    currentEditId = null;
    if (!productForm) return;
    productForm.reset();
    if (productQuantityInput) productQuantityInput.value = 0;
    if (productPriceInput) productPriceInput.value = '0.00';
    if (saveButton) saveButton.textContent = 'Guardar producto';
    if (cancelEditButton) cancelEditButton.classList.add('hidden');
}

function getProductIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

function redirectToInventory() {
    window.location.href = './inventario.html';
}

function handleFormSubmit(event) {
    event.preventDefault();
    if (!productNameInput || !productCategoryInput || !productQuantityInput || !productPriceInput) return;

    const name = productNameInput.value.trim();
    const category = productCategoryInput.value.trim();
    const quantity = Number(productQuantityInput.value);
    const price = Number(productPriceInput.value);

    if (!name || quantity < 0 || price < 0) {
        alert('Por favor ingresa un nombre válido, cantidad y precio.');
        return;
    }

    if (currentEditId) {
        const product = products.find((item) => item.id === currentEditId);
        if (product) {
            product.name = name;
            product.category = category;
            product.quantity = quantity;
            product.price = price;
        }
    } else {
        products.push({
            id: `prod-${Date.now()}`,
            name,
            category,
            quantity,
            price,
        });
    }

    saveProducts();
    updateSummary();
    redirectToInventory();
}

function handleTableClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;
    if (!id) return;

    if (button.classList.contains('edit')) {
        window.location.href = `./editar.html?id=${id}`;
        return;
    }

    if (button.classList.contains('delete')) {
        deleteProduct(id);
    }
}

function fillFormForEdit(id) {
    if (!productForm || !productNameInput || !productCategoryInput || !productQuantityInput || !productPriceInput || !saveButton) return;
    const product = products.find((item) => item.id === id);
    if (!product) {
        productForm.innerHTML = '<p>Producto no encontrado. Regresa al inventario y selecciona uno válido.</p>';
        return;
    }

    currentEditId = id;
    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productQuantityInput.value = product.quantity;
    productPriceInput.value = product.price.toFixed(2);
    saveButton.textContent = 'Actualizar producto';
    if (cancelEditButton) cancelEditButton.classList.remove('hidden');
}

function deleteProduct(id) {
    const confirmed = confirm('¿Deseas eliminar este producto del inventario?');
    if (!confirmed) return;

    products = products.filter((item) => item.id !== id);
    saveProducts();
    renderInventory(searchInput ? searchInput.value : '');
    updateSummary();
}

function initPage() {
    loadProducts();
    updateSummary();

    if (productTableBody) {
        renderInventory();
        productTableBody.addEventListener('click', handleTableClick);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => renderInventory(searchInput.value));
    }

    if (productForm) {
        const productId = getProductIdFromUrl();
        if (productId) {
            fillFormForEdit(productId);
        }
        productForm.addEventListener('submit', handleFormSubmit);
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', (event) => {
            event.preventDefault();
            redirectToInventory();
        });
    }
}

initPage();