import { getItems } from '../store.js';

export function loadDashboard() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <!-- Add Contact Button -->
    <div class="mb-4">
      <button class="contact-btn internal-contact" onclick="showContactModal()">
        📨 Contactar Soporte
      </button>
    </div>

    <div class="row">
      <!-- Alert Banner for Today's Due Payments -->
      <div class="col-12 mb-4" id="due-alert-container">
      </div>
      
      <div class="col-12 mb-4">
        <h2>Dashboard</h2>
      </div>
      
      <!-- Summary Cards -->
      <div class="col-md-3">
        <div class="card dashboard-card" style="cursor: pointer;" onclick="window.showMonthlyExpensesModal()">
          <div class="card-body">
            <h5>Total Gastos Mes</h5>
            <h3 id="total-gastos">$0</h3>
          </div>
        </div>
      </div>
      
      <div class="col-md-3">
        <div class="card dashboard-card">
          <div class="card-body">
            <h5>Saldo Disponible</h5>
            <h3 id="saldo-disponible">$0</h3>
          </div>
        </div>
      </div>
      
      <div class="col-md-3">
        <div class="card dashboard-card" style="cursor: pointer;" onclick="window.showUpcomingDueModal()">
          <div class="card-body">
            <h5>Próximos Vencimientos Tarjetas</h5>
            <h3 id="proximos-vencimientos">$0</h3>
          </div>
        </div>
      </div>
      
      <div class="col-md-3">
        <div class="card dashboard-card" style="cursor: pointer;" onclick="window.showScheduledExpensesModal()">
          <div class="card-body">
            <h5>Gastos Programados</h5>
            <h3 id="gastos-programados">$0</h3>
          </div>
        </div>
      </div>

      <!-- Expenses by Category Chart -->
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <h5>Gastos por Categoría</h5>
            <div class="chart-container">
              <canvas id="categoryChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages Section -->
      <div class="col-12 mt-4">
        <div class="card">
          <div class="card-body">
            <h5>Mis Mensajes</h5>
            <div id="user-messages-container"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Expenses Modal -->
    <div class="modal fade" id="monthlyExpensesModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Gastos del Mes</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="monthly-expenses-detail"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Due Modal -->
    <div class="modal fade" id="upcomingDueModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Próximos Vencimientos de Tarjetas</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="upcoming-due-detail"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scheduled Expenses Modal -->
    <div class="modal fade" id="scheduledExpensesModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Gastos Programados</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="scheduled-expenses-detail"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Internal Contact Modal -->
    <div class="modal fade" id="internalContactModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Contactar Soporte</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="internalContactForm">
              <div class="form-group mb-3">
                <label>Mensaje</label>
                <textarea class="form-control" id="contactMessage" rows="4" required
                          placeholder="Escriba su consulta aquí..."></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                  Enviar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add form submission handler
  document.getElementById('internalContactForm')?.addEventListener('submit', handleContactSubmit);
  
  initializeDashboard();
  checkTodayDuePayments();
}

async function initializeDashboard() {
  updateSummaryCards();
  createCategoryChart();
  loadUserMessages();
}

function checkTodayDuePayments() {
  const container = document.getElementById('due-alert-container');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check card payments
  const cards = getItems('CARDS').filter(card => card.tipo === 'credito');
  let hasDuePayments = false;
  let alertContent = [];
  
  cards.forEach(card => {
    const dueDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
    if (isSameDay(today, dueDate)) {
      const payments = getUpcomingPayments(card, dueDate);
      if (payments.length > 0) {
        hasDuePayments = true;
        alertContent.push({
          type: 'card',
          card,
          payments,
          total: calculateTotalDue(payments)
        });
      }
    }
  });
  
  // Check scheduled expenses
  const expenses = getItems('EXPENSES');
  const todayExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.fecha);
    expenseDate.setHours(0, 0, 0, 0);
    return isSameDay(expenseDate, today);
  });
  
  if (todayExpenses.length > 0) {
    hasDuePayments = true;
    alertContent.push({
      type: 'expenses',
      expenses: todayExpenses
    });
  }
  
  if (hasDuePayments) {
    container.innerHTML = `
      <div class="alert alert-due" role="alert" onclick="window.showDueAlertModal(${JSON.stringify(alertContent).replace(/"/g, '&quot;')})">
        <div class="alert-content">
          <i class="bi bi-exclamation-triangle-fill"></i>
          ¡ALERTA DE VENCIMIENTO HOY!
          <small>Click para ver detalles</small>
        </div>
      </div>
    `;
  }
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .alert-due {
    background: linear-gradient(45deg, #00f7ff, #0066ff);
    color: white;
    padding: 15px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: pulse 2s infinite;
    text-align: center;
    box-shadow: 
      0 4px 15px rgba(0, 247, 255, 0.3),
      inset 0 -2px 5px rgba(0, 0, 0, 0.2);
  }

  .alert-due:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(0, 247, 255, 0.4),
      inset 0 -2px 5px rgba(0, 0, 0, 0.2);
  }

  .alert-content {
    font-size: 1.2em;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .alert-content small {
    font-size: 0.7em;
    opacity: 0.8;
    margin-left: 10px;
  }

  @keyframes pulse {
    0% {
      box-shadow: 
        0 4px 15px rgba(0, 247, 255, 0.3),
        inset 0 -2px 5px rgba(0, 0, 0, 0.2);
    }
    50% {
      box-shadow: 
        0 4px 25px rgba(0, 247, 255, 0.5),
        inset 0 -2px 5px rgba(0, 0, 0, 0.2);
    }
    100% {
      box-shadow: 
        0 4px 15px rgba(0, 247, 255, 0.3),
        inset 0 -2px 5px rgba(0, 0, 0, 0.2);
    }
  }
`;
document.head.appendChild(styleSheet);

function updateSummaryCards() {
  const expenses = getItems('EXPENSES');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get monthly expenses (only up to today)
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.fecha);
      expenseDate.setHours(0, 0, 0, 0);
      const isCurrentMonth = expenseDate.getMonth() === today.getMonth();
      
      if (!isCurrentMonth) return false;
      if (expenseDate > today) return false;
      
      if (expense.tipoPago === 'contado' || expense.tipoPago === 'debito') {
        return true;
      }
      
      // For credit cards and scheduled expenses, only count if vencimiento date is today or earlier
      if (expense.tipoPago === 'credito') {
        const card = getItems('CARDS').find(c => c.id === expense.tarjetaId);
        if (!card) return false;
        
        const vencimiento = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
        return vencimiento <= today;
      }
      
      return false;
    })
    .reduce((sum, expense) => sum + expense.importe, 0);

  // Calculate saldo disponible
  const saldoDisponible = calculateSaldoDisponible();
  
  // Calculate upcoming card payments
  const upcomingCardPayments = calculateUpcomingCardPayments();
  
  // Calculate scheduled expenses
  const scheduledExpenses = calculateScheduledExpenses();

  // Update DOM
  document.getElementById('total-gastos').textContent = formatCurrency(monthlyExpenses);
  document.getElementById('saldo-disponible').textContent = formatCurrency(saldoDisponible);
  document.getElementById('proximos-vencimientos').textContent = formatCurrency(upcomingCardPayments);
  document.getElementById('gastos-programados').textContent = formatCurrency(scheduledExpenses);
}

function createCategoryChart() {
  const expenses = getItems('EXPENSES');
  const ctx = document.getElementById('categoryChart');
  
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.importe;
    return acc;
  }, {});
  
  new Chart(ctx, {
    type: 'bar', 
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: getChartColors(Object.keys(categoryTotals).length),
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false 
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('es-UY', {
                style: 'currency',
                currency: 'UYU',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
            }
          }
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

function getCardUsage(cardId) {
  const expenses = getItems('EXPENSES');
  return expenses
    .filter(expense => expense.tarjetaId === cardId)
    .reduce((sum, expense) => sum + expense.importe, 0);
}

function calculateUpcomingCardPayments() {
  const cards = getItems('CARDS').filter(card => card.tipo === 'credito');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let totalPayments = 0;
  
  cards.forEach(card => {
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
    if (nextPaymentDate < today) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    
    const payments = getUpcomingPayments(card, nextPaymentDate);
    totalPayments += calculateTotalDue(payments);
  });
  
  return totalPayments;
}

function calculateScheduledExpenses() {
  const expenses = getItems('EXPENSES');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return expenses
    .filter(expense => {
      const expenseDate = new Date(expense.fecha);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate > today;
    })
    .reduce((sum, expense) => sum + expense.importe, 0);
}

function calculateSaldoDisponible() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all income
  const ingresos = getItems('INCOME')
    .filter(ingreso => {
      const ingresoDate = new Date(ingreso.fecha);
      ingresoDate.setHours(0, 0, 0, 0);
      return ingresoDate <= today;
    })
    .reduce((sum, ingreso) => sum + ingreso.importe, 0);
  
  // Get all expenses that should be counted
  const gastos = getItems('EXPENSES')
    .filter(expense => {
      const expenseDate = new Date(expense.fecha);
      expenseDate.setHours(0, 0, 0, 0);
      
      // For cash and debit, count if date is today or earlier
      if (expense.tipoPago === 'contado' || expense.tipoPago === 'debito') {
        return expenseDate <= today;
      }
      
      // For credit cards, only count if vencimiento date is today or earlier
      if (expense.tipoPago === 'credito') {
        const card = getItems('CARDS').find(c => c.id === expense.tarjetaId);
        if (!card) return false;
        
        const vencimiento = new Date(
          expenseDate.getFullYear(), 
          expenseDate.getMonth(), 
          parseInt(card.fechaVencimiento)
        );
        
        if (vencimiento > today) {
          return false;
        }
        
        // Calculate the actual amount to be paid for this credit card payment
        return true;
      }
      
      return false;
    })
    .reduce((sum, expense) => {
      if (expense.tipoPago === 'credito') {
        const monthlyAmount = (expense.importe * (1 + (expense.interes || 0)/100)) / (expense.cuotas || 1);
        return sum + monthlyAmount;
      }
      return sum + expense.importe;
    }, 0);
  
  return ingresos - gastos;
}

function getPaymentSchedule(expense, card) {
  if (card.tipo === 'debito') {
    return [new Date(expense.fecha)];
  }

  const purchaseDate = new Date(expense.fecha);
  const closingDay = parseInt(card.fechaCierre);
  const paymentDay = parseInt(card.fechaVencimiento);
  
  if (isNaN(closingDay) || isNaN(paymentDay)) return null;
  
  let closingDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), closingDay);
  
  if (purchaseDate > closingDate) {
    closingDate.setMonth(closingDate.getMonth() + 1);
  }
  
  let firstPayment = new Date(closingDate.getFullYear(), closingDate.getMonth(), paymentDay);
  
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

function getUpcomingPayments(card, nextPaymentDate) {
  const expenses = getItems('EXPENSES')
    .filter(expense => expense.tarjetaId === card.id && !expense.pagado);

  const upcomingPayments = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  expenses.forEach(expense => {
    const payments = getPaymentSchedule(expense, card);
    if (!payments) return;

    // Find the next upcoming payment
    const nextPayment = payments.find(paymentDate => {
      return isSameDay(paymentDate, nextPaymentDate);
    });

    if (nextPayment) {
      const cuotaIndex = payments.indexOf(nextPayment);
      const importeCuota = expense.tipoPago === 'credito' ? 
        (expense.importe * (1 + (expense.interes||0)/100)) / expense.cuotas :
        expense.importe;

      upcomingPayments.push({
        descripcion: expense.descripcion,
        cuotaActual: cuotaIndex + 1,
        totalCuotas: expense.cuotas || 1,
        importeCuota
      });
    }
  });

  return upcomingPayments;
}

function calculateTotalDue(payments) {
  return payments.reduce((sum, payment) => sum + payment.importeCuota, 0);
}

function getMonthlyTotals(expenses) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const monthlyData = new Array(12).fill(0);
  
  expenses.forEach(expense => {
    const month = new Date(expense.fecha).getMonth();
    monthlyData[month] += expense.importe;
  });
  
  return {
    labels: months,
    data: monthlyData
  };
}

function getChartColors(count) {
  const baseColors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
    '#6610f2', '#fd7e14', '#20c997', '#e83e8c', '#6f42c1'
  ];
  
  return Array(count).fill().map((_, i) => baseColors[i % baseColors.length]);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU'
  }).format(amount);
}

function loadMonthlyExpensesModal(filters) {
  const expenses = getItems('EXPENSES');
  const container = document.getElementById('monthly-expenses-detail');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter current month's expenses that are either:
  // - Cash payments up to today
  // - Debit card payments up to today
  // - Credit card payments due this month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.fecha);
    expenseDate.setHours(0, 0, 0, 0);
    const isCurrentMonth = expenseDate.getMonth() === today.getMonth();
    
    if (!isCurrentMonth) return false;
    
    // Only include expenses up to today
    if (expenseDate > today) return false;
    
    // Include cash expenses immediately
    if (expense.tipoPago === 'contado') return true;
    
    // Include debit card expenses immediately
    if (expense.tipoPago === 'debito') return true;
    
    // For credit cards, include only if payment is due
    if (expense.tipoPago === 'credito') {
      const card = getItems('CARDS').find(c => c.id === expense.tarjetaId);
      if (!card) return false;
      
      const payments = getPaymentSchedule(expense, card);
      if (!payments) return false;
      
      // Check if any payment is due this month
      return payments.some(paymentDate => {
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate <= today && paymentDate.getMonth() === today.getMonth();
      });
    }
    
    return false;
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  if (monthlyExpenses.length === 0) {
    container.innerHTML = '<p>No hay gastos contabilizados este mes</p>';
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Tipo de Pago</th>
            <th>Importe</th>
            <th>Categoría</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyExpenses.map(expense => {
            const expenseDate = new Date(expense.fecha);
            const card = expense.tarjetaId ? getItems('CARDS').find(c => c.id === expense.tarjetaId) : null;
            let estado = 'Pagado';
            
            if (expense.tipoPago === 'credito' && card) {
              const payments = getPaymentSchedule(expense, card);
              const nextPayment = payments?.find(date => date > today);
              if (nextPayment) {
                estado = `Próximo vencimiento: ${formatDate(nextPayment)}`;
              }
            }
            
            return `
              <tr>
                <td>${formatDate(expenseDate)}</td>
                <td>${expense.descripcion}</td>
                <td>${expense.tipoPago}</td>
                <td>${formatCurrency(expense.importe)}</td>
                <td>${expense.categoria} > ${expense.subcategoria}</td>
                <td>${estado}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"><strong>Total</strong></td>
            <td colspan="4"><strong>${formatCurrency(
              monthlyExpenses.reduce((sum, expense) => sum + expense.importe, 0)
            )}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('monthlyExpensesModal')).show();
};

window.showMonthlyExpensesModal = function() {
  loadMonthlyExpensesModal();
};

window.showUpcomingDueModal = function() {
  const cards = getItems('CARDS').filter(card => card.tipo === 'credito');
  const container = document.getElementById('upcoming-due-detail');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDue = cards.map(card => {
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
    if (nextPaymentDate < today) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    const payments = getUpcomingPayments(card, nextPaymentDate);
    const totalDue = calculateTotalDue(payments);

    return {
      card,
      payments,
      totalDue,
      nextPaymentDate,
      isClose: isDateClose(nextPaymentDate)
    };
  }).filter(v => v.payments.length > 0);

  if (upcomingDue.length === 0) {
    container.innerHTML = '<p>No hay vencimientos próximos de tarjetas</p>';
    return;
  }

  container.innerHTML = upcomingDue.map(due => `
    <div class="card mb-3 ${due.isClose ? 'border-danger' : ''}">
      <div class="card-body">
        <h6>${due.card.emisor} (*${due.card.numero.slice(-4)})</h6>
        <p>Vencimiento: ${formatDate(due.nextPaymentDate)}</p>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cuota</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              ${due.payments.map(payment => `
                <tr>
                  <td>${payment.descripcion}</td>
                  <td>${payment.cuotaActual}/${payment.totalCuotas}</td>
                  <td>${formatCurrency(payment.importeCuota)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total a pagar</strong></td>
                <td><strong>${formatCurrency(due.totalDue)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `).join('');

  new bootstrap.Modal(document.getElementById('upcomingDueModal')).show();
};

window.showScheduledExpensesModal = function() {
  const expenses = getItems('EXPENSES');
  const container = document.getElementById('scheduled-expenses-detail');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduledExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.fecha);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate > today;
    })
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  if (scheduledExpenses.length === 0) {
    container.innerHTML = '<p>No hay gastos programados</p>';
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          ${scheduledExpenses.map(expense => `
            <tr>
              <td>${formatDate(new Date(expense.fecha))}</td>
              <td>${expense.descripcion}</td>
              <td>${expense.tipoPago}</td>
              <td>${formatCurrency(expense.importe)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>${formatCurrency(
              scheduledExpenses.reduce((sum, expense) => sum + expense.importe, 0)
            )}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('scheduledExpensesModal')).show();
};

window.showDueAlertModal = function(alertContent) {
  const modal = `
    <div class="modal fade" id="dueAlertModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">¡Vencimientos para Hoy!</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${alertContent.map(content => {
              if (content.type === 'card') {
                return `
                  <div class="card mb-3">
                    <div class="card-body">
                      <h6 class="card-title">Tarjeta ${content.card.emisor} (*${content.card.numero.slice(-4)})</h6>
                      <div class="table-responsive">
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>Descripción</th>
                              <th>Cuota</th>
                              <th>Importe</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${content.payments.map(payment => `
                              <tr>
                                <td>${payment.descripcion}</td>
                                <td>${payment.cuotaActual}/${payment.totalCuotas}</td>
                                <td>${formatCurrency(payment.importeCuota)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colspan="2"><strong>Total a pagar</strong></td>
                              <td><strong>${formatCurrency(content.total)}</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="card mb-3">
                    <div class="card-body">
                      <h6 class="card-title">Gastos Programados</h6>
                      <div class="table-responsive">
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>Descripción</th>
                              <th>Importe</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${content.expenses.map(expense => `
                              <tr>
                                <td>${expense.descripcion}</td>
                                <td>${formatCurrency(expense.importe)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td><strong>Total</strong></td>
                              <td><strong>${formatCurrency(
                                content.expenses.reduce((sum, exp) => sum + exp.importe, 0)
                              )}</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                `;
              }
            }).join('')}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('dueAlertModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add new modal to document
  document.body.insertAdjacentHTML('beforeend', modal);

  // Show modal
  new bootstrap.Modal(document.getElementById('dueAlertModal')).show();
};

function loadUserMessages() {
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  const messages = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]')
    .filter(m => m.userEmail === auth.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const container = document.getElementById('user-messages-container');

  if (!messages.length) {
    container.innerHTML = '<p>No hay mensajes</p>';
    return;
  }

  container.innerHTML = messages.map(message => `
    <div class="card message-card mb-3 ${!message.replied ? 'border-warning' : 'border-success'}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="message-date">
              ${new Date(message.date).toLocaleString()}
            </h6>
            <p class="message-content">
              <strong>De:</strong> ${message.userEmail}
              <br>
              ${message.message}
            </p>
          </div>
          <div class="d-flex flex-column align-items-end">
            <span class="badge ${message.replied ? 'bg-success' : 'bg-warning'} mb-2">
              ${message.replied ? 'Respondido' : 'Pendiente'}
            </span>
            <button class="btn btn-sm btn-danger" onclick="deleteMessage(${message.id}); event.stopPropagation();">
              Eliminar
            </button>
          </div>
        </div>
        ${message.replied ? `
          <div class="admin-response mt-3">
            <h6 class="text-primary">
              <strong>Respuesta del Administrador:</strong>
              <small class="text-muted">(${message.adminEmail || 'Admin'})</small>
            </h6>
            <p>${message.response}</p>
            <small class="text-muted">
              ${new Date(message.replyDate).toLocaleString()}
            </small>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

window.deleteMessage = function(messageId) {
  if (confirm('¿Está seguro de eliminar este mensaje?')) {
    const messages = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]');
    const updatedMessages = messages.filter(m => m.id !== messageId);
    localStorage.setItem('finzapp_contacts', JSON.stringify(updatedMessages));
    
    // Refresh messages display
    loadUserMessages();
  }
};

async function handleContactSubmit(e) {
  e.preventDefault();
  
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  const message = document.getElementById('contactMessage').value;
  
  const contact = {
    id: Date.now(),
    userEmail: auth.email,
    userName: auth.name || auth.email.split('@')[0],
    message,
    date: new Date().toISOString(),
    replied: false
  };

  // Save contact in localStorage
  const contacts = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]');
  contacts.push(contact);
  localStorage.setItem('finzapp_contacts', JSON.stringify(contacts));

  // Close modal and show success message
  bootstrap.Modal.getInstance(document.getElementById('internalContactModal')).hide();
  document.getElementById('contactMessage').value = '';
  
  alert('Su consulta ha sido enviada. Recibirá una respuesta pronto.');
}

// Add to global scope for button click
window.showContactModal = function() {
  new bootstrap.Modal(document.getElementById('internalContactModal')).show();
};

function isDateClose(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(date - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function formatDate(date) {
  return new Date(date.getTime())
    .toLocaleDateString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    });
}