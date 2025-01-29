import { getItems } from '../store.js';

function getPaymentSchedule(expense, card) {
  if (card.tipo === 'debito') {
    // Return exact expense date for debit cards
    return [new Date(expense.fecha + 'T00:00:00Z')];
  }

  const purchaseDate = new Date(expense.fecha + 'T00:00:00Z');
  const closingDay = parseInt(card.fechaCierre);
  const paymentDay = parseInt(card.fechaPago || card.fechaVencimiento);
  
  if (isNaN(closingDay) || isNaN(paymentDay)) return null;
  
  let closingDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), closingDay);
  
  if (purchaseDate > closingDate) {
    closingDate.setMonth(closingDate.getMonth() + 1);
  }
  
  let firstPayment = new Date(closingDate.getFullYear(), closingDate.getMonth(), paymentDay);
  
  // If first payment would be before purchase, move to next month
  if (firstPayment < purchaseDate) {
    firstPayment.setMonth(firstPayment.getMonth() + 1);
  }
  
  const payments = [];
  const cuotas = expense.cuotas || 1;
  
  for(let i = 0; i < cuotas; i++) {
    const paymentDate = new Date(firstPayment);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    payments.push(paymentDate);
  }
  
  return payments;
}

export function loadHistorial() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="row">
      <div class="col-12 mb-4">
        <h2>Historial de Gastos</h2>
      </div>
      
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-body">
            <h5>Filtros</h5>
            <form id="filterForm" class="row g-3">
              <div class="col-md-3">
                <label>Desde</label>
                <input type="date" class="form-control" id="filterFrom">
              </div>
              
              <div class="col-md-3">
                <label>Hasta</label>
                <input type="date" class="form-control" id="filterTo">
              </div>
              
              <div class="col-md-3">
                <label>Tipo de Gasto</label>
                <select class="form-control" id="filterType">
                  <option value="">Todos</option>
                  <option value="contado">Contado</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label>Tarjeta</label>
                <select class="form-control" id="filterCard">
                  <option value="">Todas</option>
                </select>
              </div>
              
              <div class="col-12">
                <button type="button" class="btn btn-primary" onclick="applyFilters()">
                  Filtrar
                </button>
                <button type="button" class="btn btn-secondary" onclick="resetFilters()">
                  Limpiar
                </button>
                <button type="button" class="btn btn-success" onclick="exportToPDF()">
                  Exportar PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div id="expenses-table"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  initializeHistorial();
}

function initializeHistorial() {
  populateCardFilter();
  setDefaultDates();
  applyFilters();
}

function populateCardFilter() {
  const cards = getItems('CARDS');
  const cardSelect = document.getElementById('filterCard');
  
  cardSelect.innerHTML += cards.map(card => 
    `<option value="${card.id}">${card.emisor} (*${card.numero.slice(-4)})</option>`
  ).join('');
}

function setDefaultDates() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  document.getElementById('filterFrom').value = firstDay.toISOString().split('T')[0];
  document.getElementById('filterTo').value = today.toISOString().split('T')[0];
}

window.applyFilters = function() {
  const filters = {
    from: document.getElementById('filterFrom').value,
    to: document.getElementById('filterTo').value,
    type: document.getElementById('filterType').value,
    cardId: document.getElementById('filterCard').value
  };
  
  loadExpensesTable(filters);
};

window.resetFilters = function() {
  document.getElementById('filterForm').reset();
  setDefaultDates();
  applyFilters();
};

window.exportToPDF = function() {
  const filters = {
    from: document.getElementById('filterFrom').value,
    to: document.getElementById('filterTo').value,
    type: document.getElementById('filterType').value,
    cardId: document.getElementById('filterCard').value
  };
  
  generatePDF(filters);
};

function loadExpensesTable(filters) {
  const expenses = filterExpenses(getItems('EXPENSES'), filters);
  const container = document.getElementById('expenses-table');
  
  if (expenses.length === 0) {
    container.innerHTML = '<p>No se encontraron gastos con los filtros aplicados</p>';
    return;
  }
  
  const cards = getItems('CARDS');
  
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Importe</th>
            <th>Tipo</th>
            <th>Tarjeta</th>
            <th>Cuotas</th>
            <th>Vencimientos</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(expense => {
            const card = cards.find(c => c.id === expense.tarjetaId);
            const payments = card ? getPaymentSchedule(expense, card) : null;
            
            const expenseDate = new Date(expense.fecha + 'T00:00:00Z');
            
            return `
              <tr>
                <td>${formatDate(expenseDate)}</td>
                <td>${expense.descripcion}</td>
                <td>${formatCurrency(expense.importe)}</td>
                <td>${expense.tipoPago}</td>
                <td>${expense.tarjetaId ? getCardName(expense.tarjetaId) : '-'}</td>
                <td>${expense.tipoPago === 'credito' ? 
                  `${expense.cuotas} (${formatCurrency((expense.importe * (1 + (expense.interes||0)/100)) / expense.cuotas)} c/u)` : 
                  '-'}</td>
                <td>${payments ? 
                  payments.map((date, idx) => 
                    `<div>Cuota ${idx + 1}/${expense.cuotas || 1}: ${formatDate(date)}</div>`
                  ).join('') : 
                  '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterExpenses(expenses, filters) {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.fecha + 'T00:00:00Z');
    const fromDate = new Date(filters.from + 'T00:00:00Z');
    const toDate = new Date(filters.to + 'T23:59:59Z');
    
    const dateInRange = expenseDate >= fromDate && expenseDate <= toDate;
    const typeMatch = !filters.type || expense.tipoPago === filters.type;
    const cardMatch = !filters.cardId || expense.tarjetaId === Number(filters.cardId);
    
    return dateInRange && typeMatch && cardMatch;
  }).sort((a, b) => new Date(b.fecha + 'T00:00:00Z') - new Date(a.fecha + 'T00:00:00Z'));
}

function generatePDF(filters) {
  const expenses = filterExpenses(getItems('EXPENSES'), filters);
  
  // Use window.jspdf since it's loaded globally via script tag
  const doc = new window.jspdf.jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Historial de Gastos', 20, 20);
  
  // Add filters info
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(new Date(filters.from + 'T00:00:00Z'))} - ${formatDate(new Date(filters.to + 'T23:59:59Z'))}`, 20, 30);
  doc.text(`Tipo: ${filters.type || 'Todos'}`, 20, 35);
  doc.text(`Tarjeta: ${filters.cardId ? getCardName(Number(filters.cardId)) : 'Todas'}`, 20, 40);
  
  // Add expenses table
  const tableData = expenses.map(expense => {
    const expenseDate = new Date(expense.fecha + 'T00:00:00Z');
    
    return [
      formatDate(expenseDate),
      expense.descripcion,
      formatCurrency(expense.importe),
      expense.tipoPago,
      expense.tarjetaId ? getCardName(expense.tarjetaId) : '-',
      `${expense.categoria} > ${expense.subcategoria}`
    ];
  });
  
  doc.autoTable({
    head: [['Fecha', 'Descripción', 'Importe', 'Tipo', 'Tarjeta', 'Categoría']],
    body: tableData,
    startY: 50
  });
  
  // Add total
  const total = expenses.reduce((sum, exp) => sum + exp.importe, 0);
  doc.text(`Total: ${formatCurrency(total)}`, 20, doc.lastAutoTable.finalY + 10);
  
  // Save PDF
  doc.save('historial-gastos.pdf');
}

function getCardName(cardId) {
  const card = getItems('CARDS').find(c => c.id === cardId);
  return card ? `${card.emisor} (*${card.numero.slice(-4)})` : 'N/A';
}

function formatDate(date) {
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