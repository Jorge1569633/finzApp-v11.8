import { getItems } from '../store.js';

export function loadVencimientos() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="row">
      <div class="col-12 mb-4">
        <h2>Vencimientos y Alertas</h2>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5>Próximos Vencimientos de Tarjetas</h5>
            <div id="card-due-container"></div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5>Gastos Programados</h5>
            <div id="future-expenses-container"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vencimiento Modal -->
    <div class="modal fade" id="vencimientoModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-danger">¡Atención! Vencimiento Hoy</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="vencimiento-modal-content">
          </div>
        </div>
      </div>
    </div>
  `;
  
  loadVencimientosTarjetas();
  loadGastosProgramados();
  checkTodayVencimientos();
}

function loadVencimientosTarjetas() {
  const cards = getItems('CARDS').filter(card => card.tipo === 'credito');
  const container = document.getElementById('card-due-container');
  
  if (cards.length === 0) {
    container.innerHTML = '<p>No hay tarjetas de crédito registradas</p>';
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const vencimientos = cards.map(card => {
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
    if (nextPaymentDate < today) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    const upcomingPayments = getUpcomingPayments(card, nextPaymentDate);
    const totalDue = calculateTotalDue(upcomingPayments);
    const isClose = isDateClose(nextPaymentDate);

    return {
      card,
      payments: upcomingPayments,
      totalDue,
      nextPaymentDate,
      isClose
    };
  }).filter(v => v.payments.length > 0);

  if (vencimientos.length === 0) {
    container.innerHTML = '<p>No hay vencimientos próximos</p>';
    return;
  }
  
  container.innerHTML = vencimientos
    .map(v => `
      <div class="card mb-3 ${v.isClose ? 'border-danger' : ''}">
        <div class="card-body">
          <h6>${v.card.emisor} (*${v.card.numero.slice(-4)})</h6>
          <p>Próximo vencimiento: ${formatDate(v.nextPaymentDate)}</p>
          ${v.payments.map(p => `
            <div class="mb-2">
              <p class="mb-1">${p.descripcion}</p>
              <small>
                Cuota ${p.cuotaActual}/${p.totalCuotas} - 
                Importe: ${formatCurrency(p.importeCuota)}
              </small>
            </div>
          `).join('')}
          <p class="mt-2"><strong>Total a pagar: ${formatCurrency(v.totalDue)}</strong></p>
          ${v.isClose ? '<p class="text-danger">¡Próximo a vencer!</p>' : ''}
        </div>
      </div>
    `).join('');
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

function checkTodayVencimientos() {
  const cards = getItems('CARDS').filter(card => card.tipo === 'credito');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  cards.forEach(card => {
    const dueDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
    
    if (isSameDay(today, dueDate)) {
      const payments = getUpcomingPayments(card, dueDate);
      if (payments.length > 0) {
        const totalDue = calculateTotalDue(payments);
        showVencimientoModal(card, payments, totalDue);
        sendWhatsAppAlert(card, payments, totalDue);
      }
    }
  });
}

function showVencimientoModal(card, payments, totalDue) {
  const modalContent = document.getElementById('vencimiento-modal-content');
  modalContent.innerHTML = `
    <h6>Tarjeta: ${card.emisor} (*${card.numero.slice(-4)})</h6>
    <div class="mt-3">
      ${payments.map(p => `
        <p>${p.descripcion} - Cuota ${p.cuotaActual}/${p.totalCuotas}: ${formatCurrency(p.importeCuota)}</p>
      `).join('')}
      <p class="h5 mt-3">Total a pagar: ${formatCurrency(totalDue)}</p>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('vencimientoModal')).show();
}

async function sendWhatsAppAlert(card, payments, totalDue) {
  const message = `FinzApp - Vencimiento HOY
Tarjeta: ${card.emisor} (*${card.numero.slice(-4)})
${payments.map(p => `${p.descripcion} - Cuota ${p.cuotaActual}/${p.totalCuotas}: ${formatCurrency(p.importeCuota)}`).join('\n')}
Total a pagar: ${formatCurrency(totalDue)}`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=598099330719&text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function loadGastosProgramados() {
  const expenses = getItems('EXPENSES');
  const container = document.getElementById('future-expenses-container');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureExpenses = expenses.filter(expense => {
    const expDate = new Date(expense.fecha + 'T00:00:00Z');
    expDate.setMinutes(expDate.getMinutes() + expDate.getTimezoneOffset());
    return expDate > today;
  });
  
  if (futureExpenses.length === 0) {
    container.innerHTML = '<p>No hay gastos programados</p>';
    return;
  }
  
  container.innerHTML = futureExpenses
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .map(expense => {
      const expenseDate = new Date(expense.fecha + 'T00:00:00Z');
      expenseDate.setMinutes(expenseDate.getMinutes() + expenseDate.getTimezoneOffset());
      
      return `
        <div class="card mb-3">
          <div class="card-body">
            <h6>${expense.descripcion}</h6>
            <p>Fecha: ${formatDate(expenseDate)}</p>
            <p>Importe: ${formatCurrency(expense.importe)}</p>
            <p>Tipo: ${expense.tipoPago}</p>
            ${expense.tarjetaId && expense.tipoPago !== 'debito' ? `
              <p>Tarjeta: ${getCardName(expense.tarjetaId)}</p>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
}

function getPaymentSchedule(expense, card) {
  if (card.tipo === 'debito') {
    return null; // Don't process debit cards
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

function calculateTotalDue(payments) {
  return payments.reduce((total, payment) => total + payment.importeCuota, 0);
}

function isDateClose(date) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 2 && diffDays >= 0;
}

function isSameDay(d1, d2) {
  return d1.getUTCDate() === d2.getUTCDate() &&
         d1.getUTCMonth() === d2.getUTCMonth() &&
         d1.getUTCFullYear() === d2.getUTCFullYear();
}

function getCardName(cardId) {
  const card = getItems('CARDS').find(c => c.id === cardId);
  return card ? `${card.emisor} (*${card.numero.slice(-4)})` : 'N/A';
}

function formatDate(date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toLocaleDateString('es-UY', {
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