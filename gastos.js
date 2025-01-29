import { getItems, addItem, updateItem, deleteItem } from '../store.js';

const CATEGORIES = {
  income: {
    sueldo: ["mensual", "extra"],
    jubilacion: ["mensual", "adelanto"],
    ventas: [],
    aguinaldo: [],
    comisiones: [],
    banco: [],
    billetera: []
  },
  expense: {
    hogar: ["alquiler", "mantenimiento"],
    alimentacion: ["supermercado", "frutas y verduras", "restaurantes"],
    transporte: ["combustible", "peajes", "reparaciones"],
    entretenimiento: ["cine", "conciertos"],
    salud: ["medicinas", "consultas"],
    otros: ["donaciones", "imprevistos"],
    debito_automatico: ["luz", "agua", "telefono", "internet"],
    pago_tarjetas: ["visa", "mastercard", "amex"]
  }
};

export function loadGastos() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="row">
      <div class="col-12 mb-4">
        <h2>Registro de Gastos</h2>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" onclick="showAddExpenseModal()">
            Nuevo Gasto
          </button>
          <button class="btn btn-secondary" onclick="showManageSubcategoriesModal()">
            Gestionar Subcategorías
          </button>
        </div>
      </div>
      
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5>Últimos Gastos</h5>
            <div id="expenses-container"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Expense Modal -->
    <div class="modal fade" id="expenseModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Registro de Gasto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="expenseForm">
              <div class="form-group">
                <label>Descripción</label>
                <input type="text" class="form-control" id="expDescription" required>
              </div>

              <div class="form-group">
                <label>Importe</label>
                <input type="number" class="form-control" id="expAmount" 
                       min="0" step="0.01" required>
              </div>

              <div class="form-group">
                <label>Fecha</label>
                <input type="date" class="form-control" id="expDate" required>
              </div>

              <div class="form-group">
                <label>Tipo de Pago</label>
                <select class="form-control" id="expPaymentType" required>
                  <option value="contado">Contado</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div id="cardSelection" style="display: none;">
                <div class="form-group">
                  <label>Tarjeta</label>
                  <select class="form-control" id="expCard"></select>
                </div>
              </div>

              <div id="creditOptions" style="display: none;">
                <div class="form-group">
                  <label>Número de Cuotas</label>
                  <input type="number" class="form-control" id="expInstallments" 
                         min="1" value="1">
                </div>

                <div class="form-group">
                  <label>Interés (%)</label>
                  <input type="number" class="form-control" id="expInterest" 
                         min="0" step="0.01" value="0">
                </div>
              </div>

              <div class="form-group">
                <label>Categoría</label>
                <select class="form-control" id="expCategory" required></select>
              </div>

              <div class="form-group">
                <label>Subcategoría</label>
                <select class="form-control" id="expSubcategory" required></select>
              </div>

              <input type="hidden" id="expenseId">
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onclick="saveExpense()">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Subcategories Modal -->
    <div class="modal fade" id="subcategoriesModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Gestionar Subcategorías</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="subcategoryForm">
              <div class="form-group mb-3">
                <label>Categoría</label>
                <select class="form-control" id="manageCategory" required>
                  <option value="">Seleccione una categoría</option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label>Nueva Subcategoría</label>
                <input type="text" class="form-control" id="newSubcategory" required>
              </div>

              <button type="submit" class="btn btn-primary">Agregar</button>
            </form>

            <div class="mt-4">
              <h6>Subcategorías Actuales</h6>
              <div id="currentSubcategories"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initializeGastos();
}

function initializeGastos() {
  setupFormListeners();
  setupSubcategoryManagement();
  loadExpenses();
  populateCategories();
}

function setupFormListeners() {
  // Payment type change handler
  const paymentType = document.getElementById('expPaymentType');
  paymentType.addEventListener('change', () => {
    const cardSelection = document.getElementById('cardSelection');
    const creditOptions = document.getElementById('creditOptions');
    
    cardSelection.style.display = 
      ['debito', 'credito'].includes(paymentType.value) ? 'block' : 'none';
    creditOptions.style.display = 
      paymentType.value === 'credito' ? 'block' : 'none';
      
    updateCardOptions(paymentType.value);
  });

  // Category change handler
  const category = document.getElementById('expCategory');
  category.addEventListener('change', () => {
    updateSubcategories(category.value);
  });
}

function updateCardOptions(type) {
  const cards = getItems('CARDS').filter(card => card.tipo === type);
  const cardSelect = document.getElementById('expCard');
  
  cardSelect.innerHTML = cards.map(card => 
    `<option value="${card.id}">${card.emisor} (*${card.numero.slice(-4)})</option>`
  ).join('');
}

function populateCategories() {
  const categorySelect = document.getElementById('expCategory');
  categorySelect.innerHTML = Object.entries(CATEGORIES.expense)
    .map(([value, subcategories]) => 
      `<option value="${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</option>`
    ).join('');
    
  // Trigger initial subcategories load
  updateSubcategories(categorySelect.value);
}

function setupSubcategoryManagement() {
  const form = document.getElementById('subcategoryForm');
  const categorySelect = document.getElementById('manageCategory');
  
  // Populate categories dropdown
  const categories = CATEGORIES.expense;
  categorySelect.innerHTML = `<option value="">Seleccione una categoría</option>` +
    Object.keys(categories).map(cat => 
      `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
    ).join('');
    
  // Handle category change
  categorySelect.addEventListener('change', () => {
    if (categorySelect.value) {
      displayCurrentSubcategories(categorySelect.value);
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const category = categorySelect.value;
    const subcategory = document.getElementById('newSubcategory').value.trim();
    
    if (category && subcategory) {
      if (addSubcategory('expense', category, subcategory)) {
        document.getElementById('newSubcategory').value = '';
        displayCurrentSubcategories(category);
        
        // Update subcategories in expense form
        if (document.getElementById('expCategory').value === category) {
          updateSubcategories(category);
        }
      } else {
        alert('Esta subcategoría ya existe');
      }
    }
  });
}

function updateSubcategories(category) {
  const subcategorySelect = document.getElementById('expSubcategory');
  const categories = getCategories();
  const subcategories = categories.expense[category] || [];
  
  subcategorySelect.innerHTML = subcategories
    .map(sub => `<option value="${sub}">${sub}</option>`)
    .join('');
}

window.showAddExpenseModal = function() {
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseId').value = '';
  document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('expPaymentType').dispatchEvent(new Event('change'));
  new bootstrap.Modal(document.getElementById('expenseModal')).show();
};

window.editExpense = function(id) {
  const expense = getItems('EXPENSES').find(e => e.id === id);
  if (!expense) return;
  
  document.getElementById('expDescription').value = expense.descripcion;
  document.getElementById('expAmount').value = expense.importe;
  document.getElementById('expDate').value = expense.fecha;
  document.getElementById('expPaymentType').value = expense.tipoPago;
  document.getElementById('expPaymentType').dispatchEvent(new Event('change'));
  
  if (expense.tarjetaId) {
    document.getElementById('expCard').value = expense.tarjetaId;
  }
  
  if (expense.tipoPago === 'credito') {
    document.getElementById('expInstallments').value = expense.cuotas;
    document.getElementById('expInterest').value = expense.interes;
  }
  
  document.getElementById('expCategory').value = expense.categoria;
  document.getElementById('expCategory').dispatchEvent(new Event('change'));
  document.getElementById('expSubcategory').value = expense.subcategoria;
  
  document.getElementById('expenseId').value = expense.id;
  new bootstrap.Modal(document.getElementById('expenseModal')).show();
};

window.deleteExpense = function(id) {
  if (confirm('¿Está seguro de eliminar este gasto?')) {
    deleteItem('EXPENSES', id);
    loadExpenses();
  }
};

window.saveExpense = function() {
  const form = document.getElementById('expenseForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const expenseData = {
    descripcion: document.getElementById('expDescription').value,
    importe: Number(document.getElementById('expAmount').value),
    fecha: document.getElementById('expDate').value,
    tipoPago: document.getElementById('expPaymentType').value,
    categoria: document.getElementById('expCategory').value,
    subcategoria: document.getElementById('expSubcategory').value
  };
  
  if (['debito', 'credito'].includes(expenseData.tipoPago)) {
    expenseData.tarjetaId = Number(document.getElementById('expCard').value);
  }
  
  if (expenseData.tipoPago === 'credito') {
    expenseData.cuotas = Number(document.getElementById('expInstallments').value);
    expenseData.interes = Number(document.getElementById('expInterest').value);
  }
  
  const expenseId = document.getElementById('expenseId').value;
  if (expenseId) {
    updateItem('EXPENSES', Number(expenseId), expenseData);
  } else {
    addItem('EXPENSES', expenseData);
  }
  
  bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
  loadExpenses();
};

function loadExpenses() {
  const expenses = getItems('EXPENSES');
  const container = document.getElementById('expenses-container');
  
  if (expenses.length === 0) {
    container.innerHTML = '<p>No hay gastos registrados</p>';
    return;
  }
  
  // Sort expenses by date (newest first) - comparing as UTC dates
  expenses.sort((a, b) => new Date(b.fecha + 'T00:00:00Z') - new Date(a.fecha + 'T00:00:00Z'));
  
  container.innerHTML = expenses.map(expense => {
    // Create date object in UTC
    const expenseDate = new Date(expense.fecha + 'T00:00:00Z');
    
    return `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5>${expense.descripcion}</h5>
          <div>
            <button class="btn btn-sm btn-primary" onclick="editExpense(${expense.id})">
              Editar
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
              Eliminar
            </button>
          </div>
        </div>
        <p>Importe: ${formatCurrency(expense.importe)}</p>
        <p>Fecha: ${formatDate(expenseDate)}</p>
        <p>Tipo: ${expense.tipoPago}</p>
        ${expense.tarjetaId ? `
          <p>Tarjeta: ${getCardName(expense.tarjetaId)}</p>
        ` : ''}
        ${expense.tipoPago === 'credito' ? `
          <p>Cuotas: ${expense.cuotas}</p>
          <p>Interés: ${expense.interes}%</p>
        ` : ''}
        <p>Categoría: ${expense.categoria} > ${expense.subcategoria}</p>
      </div>
    </div>
  `}).join('');
}

function formatDate(date) {
  return date.toLocaleDateString('es-UY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC'
  });
}

function displayCurrentSubcategories(category) {
  const container = document.getElementById('currentSubcategories');
  const subcategories = getCategories().expense[category] || [];
  
  if (subcategories.length === 0) {
    container.innerHTML = '<p>No hay subcategorías definidas</p>';
    return;
  }
  
  container.innerHTML = `
    <ul class="list-group">
      ${subcategories.map(sub => `
        <li class="list-group-item">
          ${sub}
        </li>
      `).join('')}
    </ul>
  `;
}

function getCardName(cardId) {
  const card = getItems('CARDS').find(c => c.id === cardId);
  return card ? `${card.emisor} (*${card.numero.slice(-4)})` : 'N/A';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU'
  }).format(amount);
}

function addSubcategory(type, category, subcategory) {
  const categories = getCategories();
  if (categories[type][category].includes(subcategory)) {
    return false;
  }
  categories[type][category].push(subcategory);
  return true;
}

function getCategories() {
  return CATEGORIES;
}

function getNextDueDate(expense, card) {
  if (card.tipo === 'debito') {
    // For debit cards, use the expense date directly
    return new Date(expense.fecha + 'T00:00:00Z'); 
  } else {
    // For credit cards, use the existing logic with card payment date
    const today = new Date();
    let dueDate = new Date(today.getFullYear(), today.getMonth(), card.fechaVencimiento);
    
    if (today > dueDate) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, card.fechaVencimiento);
    }
    
    return dueDate;
  }
}

window.showManageSubcategoriesModal = function() {
  new bootstrap.Modal(document.getElementById('subcategoriesModal')).show();
}