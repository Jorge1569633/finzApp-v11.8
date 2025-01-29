import { getItems, addItem, updateItem, deleteItem, getCategories } from '../store.js';

export function loadIngresos() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="row">
      <div class="col-12 mb-4">
        <h2>Registro de Ingresos</h2>
        <button class="btn btn-primary" onclick="showAddIncomeModal()">
          Nuevo Ingreso
        </button>
      </div>
      
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5>Últimos Ingresos</h5>
            <div id="income-container"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Income Modal -->
    <div class="modal fade" id="incomeModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Registro de Ingreso</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="incomeForm">
              <div class="form-group">
                <label>Descripción</label>
                <input type="text" class="form-control" id="incDescription" required>
              </div>

              <div class="form-group">
                <label>Importe</label>
                <input type="number" class="form-control" id="incAmount" 
                       min="0" step="0.01" required>
              </div>

              <div class="form-group">
                <label>Fecha</label>
                <input type="date" class="form-control" id="incDate" required>
              </div>

              <div class="form-group">
                <label>Categoría</label>
                <select class="form-control" id="incCategory" required>
                  <option value="">Seleccione una categoría</option>
                </select>
              </div>

              <div class="form-group">
                <label>Subcategoría</label>
                <select class="form-control" id="incSubcategory" required>
                  <option value="">Seleccione una subcategoría</option>
                </select>
              </div>

              <input type="hidden" id="incomeId">
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onclick="saveIncome()">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  initializeIngresos();
}

function initializeIngresos() {
  setupCategoryListeners();
  loadIncomeCategories();
  loadIncomes();
}

function setupCategoryListeners() {
  const category = document.getElementById('incCategory');
  category.addEventListener('change', () => {
    updateSubcategories(category.value);
  });
}

function loadIncomeCategories() {
  const categories = getCategories().income;
  const categorySelect = document.getElementById('incCategory');
  
  categorySelect.innerHTML = `<option value="">Seleccione una categoría</option>` +
    Object.entries(categories)
      .map(([value, subcategories]) => 
        `<option value="${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</option>`
      ).join('');
}

function updateSubcategories(category) {
  const subcategories = getCategories().income[category] || [];
  const subcategorySelect = document.getElementById('incSubcategory');
  
  subcategorySelect.innerHTML = `<option value="">Seleccione una subcategoría</option>` +
    subcategories
      .map(sub => `<option value="${sub}">${sub}</option>`)
      .join('');
}

function loadIncomes() {
  const incomes = getItems('INCOME');
  const container = document.getElementById('income-container');
  
  if (incomes.length === 0) {
    container.innerHTML = '<p>No hay ingresos registrados</p>';
    return;
  }
  
  // Sort incomes by date (newest first)
  incomes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  container.innerHTML = incomes.map(income => {
    // Fix date by handling timezone
    const incomeDate = new Date(income.fecha);
    incomeDate.setMinutes(incomeDate.getMinutes() + incomeDate.getTimezoneOffset());
    
    return `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5>${income.descripcion}</h5>
          <div>
            <button class="btn btn-sm btn-primary" onclick="editIncome(${income.id})">
              Editar
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteIncome(${income.id})">
              Eliminar
            </button>
          </div>
        </div>
        <p>Importe: ${formatCurrency(income.importe)}</p>
        <p>Fecha: ${formatDate(incomeDate)}</p>
        <p>Categoría: ${income.categoria} ${income.subcategoria ? `> ${income.subcategoria}` : ''}</p>
      </div>
    </div>
  `}).join('');
}

// Modal functions
window.showAddIncomeModal = function() {
  document.getElementById('incomeForm').reset();
  document.getElementById('incomeId').value = '';
  document.getElementById('incDate').value = new Date().toISOString().split('T')[0];
  new bootstrap.Modal(document.getElementById('incomeModal')).show();
};

window.editIncome = function(id) {
  const income = getItems('INCOME').find(i => i.id === id);
  if (!income) return;
  
  document.getElementById('incDescription').value = income.descripcion;
  document.getElementById('incAmount').value = income.importe;
  document.getElementById('incDate').value = income.fecha;
  document.getElementById('incCategory').value = income.categoria;
  document.getElementById('incCategory').dispatchEvent(new Event('change'));
  
  if (income.subcategoria) {
    setTimeout(() => {
      document.getElementById('incSubcategory').value = income.subcategoria;
    }, 100);
  }
  
  document.getElementById('incomeId').value = income.id;
  new bootstrap.Modal(document.getElementById('incomeModal')).show();
};

window.deleteIncome = function(id) {
  if (confirm('¿Está seguro de eliminar este ingreso?')) {
    deleteItem('INCOME', id);
    loadIncomes();
  }
};

window.saveIncome = function() {
  const form = document.getElementById('incomeForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const incomeData = {
    descripcion: document.getElementById('incDescription').value,
    importe: Number(document.getElementById('incAmount').value),
    fecha: document.getElementById('incDate').value,
    categoria: document.getElementById('incCategory').value,
    subcategoria: document.getElementById('incSubcategory').value
  };
  
  const incomeId = document.getElementById('incomeId').value;
  if (incomeId) {
    updateItem('INCOME', Number(incomeId), incomeData);
  } else {
    addItem('INCOME', incomeData);
  }
  
  bootstrap.Modal.getInstance(document.getElementById('incomeModal')).hide();
  loadIncomes();
};

function formatDate(date) {
  // Use toLocaleDateString with explicit options to avoid timezone issues
  return date.toLocaleDateString('es-UY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC'
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU'
  }).format(amount);
}