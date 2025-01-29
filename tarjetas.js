import { getItems, addItem, updateItem, deleteItem, getCardTypes } from '../store.js';

export function loadTarjetas() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="row">
      <div class="col-12 mb-4">
        <h2>Gestión de Tarjetas</h2>
        <button class="btn btn-primary" onclick="showAddCardModal()">
          Agregar Tarjeta
        </button>
      </div>
      
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5>Mis Tarjetas</h5>
            <div id="cards-container"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Card Modal -->
    <div class="modal fade" id="cardModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Tarjeta</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="cardForm">
              <div class="form-group">
                <label>Tipo de Tarjeta</label>
                <select class="form-control" id="cardType" required>
                  <option value="credito">Crédito</option>
                  <option value="debito">Débito</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Emisor</label>
                <select class="form-control" id="cardIssuer" required></select>
              </div>
              
              <div class="form-group">
                <label>Número de Tarjeta</label>
                <div class="input-group-credit-card">
                  <input type="text" maxlength="4" class="form-control card-number" required>
                  <input type="text" maxlength="4" class="form-control card-number" required>
                  <input type="text" maxlength="4" class="form-control card-number" required>
                  <input type="text" maxlength="4" class="form-control card-number" required>
                </div>
              </div>
              
              <div class="form-group">
                <label>Vencimiento</label>
                <input type="month" class="form-control" id="cardExpiry" required>
              </div>
              
              <div id="creditCardFields">
                <div class="form-group">
                  <label>Fecha de Cierre</label>
                  <input type="number" class="form-control" id="cardClosingDate" 
                         min="1" max="31" placeholder="Día del mes">
                </div>
                
                <div class="form-group">
                  <label>Fecha de Vencimiento</label>
                  <input type="number" class="form-control" id="cardDueDate" 
                         min="1" max="31" placeholder="Día del mes">
                </div>
                
                <div class="form-group">
                  <label>Límite de Crédito</label>
                  <input type="number" class="form-control" id="cardLimit" 
                         min="0" step="100">
                </div>
              </div>
              
              <input type="hidden" id="cardId">
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onclick="saveCard()">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Expenses Modal -->
    <div class="modal fade" id="cardExpensesModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Gastos de Tarjeta</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="card-expenses-container">
              <!-- Expenses will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  initializeTarjetas();
}

function initializeTarjetas() {
  setupCardTypeListener();
  setupCardNumberInputs();
  loadCards();
}

function setupCardTypeListener() {
  const cardType = document.getElementById('cardType');
  const cardIssuer = document.getElementById('cardIssuer');
  const creditFields = document.getElementById('creditCardFields');
  
  cardType.addEventListener('change', () => {
    const cardTypes = getCardTypes();
    // Update issuers based on card type
    cardIssuer.innerHTML = Object.entries(cardTypes[cardType.value])
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join('');
      
    // Show/hide credit card specific fields
    creditFields.style.display = cardType.value === 'credito' ? 'block' : 'none';
  });
  
  // Trigger initial load
  cardType.dispatchEvent(new Event('change'));
}

function setupCardNumberInputs() {
  const inputs = document.querySelectorAll('.card-number');
  
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 4 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

function loadCards() {
  const cards = getItems('CARDS');
  const container = document.getElementById('cards-container');
  
  if (cards.length === 0) {
    container.innerHTML = '<p>No hay tarjetas registradas</p>';
    return;
  }
  
  const cardTypes = getCardTypes();
  container.innerHTML = cards.map(card => {
    const cardBrand = getCardBrand(card.emisor);
    const gradientColor = getCardGradient(card.tipo, cardBrand);
    
    return `
      <div class="credit-card mb-4" style="cursor: pointer;" onclick="showCardExpenses(${card.id})">
        <div class="card-inner" style="background: ${gradientColor}">
          <div class="card-front">
            <div class="d-flex justify-content-between">
              <div class="chip-container">
                <div class="chip"></div>
              </div>
              ${getCardLogo(cardBrand)}
            </div>
            
            <div class="card-number mt-4">
              **** **** **** ${card.numero.slice(-4)}
            </div>
            
            <div class="card-info mt-3">
              <div class="card-holder">
                <div class="label">Titular</div>
                <div class="value">${cardTypes[card.tipo][card.emisor]}</div>
              </div>
              <div class="card-expires">
                <div class="label">Vence</div>
                <div class="value">${formatExpiryDate(card.vencimiento)}</div>
              </div>
            </div>
            
            ${card.tipo === 'credito' ? `
              <div class="card-details mt-3">
                <div class="detail-item">
                  <small>Cierre: ${card.fechaCierre}</small>
                </div>
                <div class="detail-item">
                  <small>Vencimiento: ${card.fechaVencimiento}</small>
                </div>
                <div class="detail-item">
                  <small>Límite: ${formatCurrency(card.limite)}</small>
                </div>
                <div class="detail-item">
                  <small>Disponible: ${formatCurrency(getAvailableCredit(card))}</small>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="card-actions mt-2">
          <button class="btn btn-sm btn-primary" onclick="editCard(${card.id}); event.stopPropagation();">
            Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteCard(${card.id}); event.stopPropagation();">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Add CSS for card styling
  addCardStyles();
}

function getCardBrand(emisor) {
  const lowerEmissor = emisor.toLowerCase();
  if (lowerEmissor.includes('visa')) return 'visa';
  if (lowerEmissor.includes('master')) return 'mastercard';
  if (lowerEmissor.includes('amex')) return 'amex';
  
  // Additional checks based on issuer name
  if (['bbva_visa', 'brou_visa', 'itau_visa', 'santander_visa', 'oca_visa'].includes(emisor)) {
    return 'visa';
  }
  if (['bbva_master', 'brou_master', 'itau_master', 'santander_master', 'oca_master'].includes(emisor)) {
    return 'mastercard';
  }
  
  return 'generic';
}

function getCardGradient(tipo, brand) {
  const gradients = {
    credito: {
      visa: 'linear-gradient(135deg, #1a1f71 0%, #2b3595 100%)',
      mastercard: 'linear-gradient(135deg, #1a1f71 0%, #c41230 100%)',
      amex: 'linear-gradient(135deg, #006fcf 0%, #10509e 100%)',
      generic: 'linear-gradient(135deg, #000046 0%, #1CB5E0 100%)'
    },
    debito: {
      visa: 'linear-gradient(135deg, #436773 0%, #4b7b8b 100%)',
      mastercard: 'linear-gradient(135deg, #436773 0%, #89253e 100%)',
      amex: 'linear-gradient(135deg, #436773 0%, #3a6073 100%)',
      generic: 'linear-gradient(135deg, #3a6073 0%, #3a7bd5 100%)'
    }
  };
  
  return gradients[tipo][brand];
}

function getCardLogo(brand) {
  const logos = {
    visa: `<img src="visa-inc-png-18.png" alt="Visa" class="card-logo">`,
    mastercard: `<img src="mastercard-logo-mastercard-logo-png-vector-download-19.png" alt="Mastercard" class="card-logo">`,
    amex: `
      <svg class="card-logo" viewBox="0 0 104 64">
        <path fill="#fff" d="M104,64H0V0h104V64z M52,32L42.5,12.5h-9L44,42h16L70.5,12.5h-9L52,32z"/>
      </svg>
    `,
    generic: `
      <div class="card-logo-text">CARD</div>
    `
  };
  
  return logos[brand];
}

function formatExpiryDate(date) {
  const [year, month] = date.split('-');
  return `${month}/${year.slice(2)}`;
}

function addCardStyles() {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .credit-card {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      perspective: 1000px;
    }

    .card-inner {
      position: relative;
      width: 100%;
      padding-top: 63.0137%;  /* Maintain credit card aspect ratio 85.60 × 53.98 mm */
      border-radius: 15px;
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
      color: white;
      transition: all 0.3s ease;
    }

    .card-inner:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.2);
    }

    .card-front {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 20px;
    }

    .chip {
      width: 50px;
      height: 40px;
      background: linear-gradient(135deg, #ffeaa7 0%, #ffb142 100%);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .chip::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #ffb142 0%, #ffeaa7 100%);
      border-radius: 4px;
    }

    .card-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
      margin-left: auto;
      filter: brightness(0) invert(1); /* Make logos white */
      opacity: 0.9;
      transition: opacity 0.3s ease;
    }

    .card-logo:hover {
      opacity: 1;
    }

    .card-logo-text {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      color: white;
    }

    .card-number {
      font-size: 1.4em;
      letter-spacing: 3px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .card-info {
      display: flex;
      justify-content: space-between;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .label {
      font-size: 0.7em;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
    }

    .value {
      font-size: 0.9em;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    .card-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 0.8em;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .credit-card {
        max-width: 300px;
      }

      .card-number {
        font-size: 1.2em;
      }

      .chip {
        width: 40px;
        height: 30px;
      }

      .card-logo {
        height: 30px;
      }
    }
  `;
  
  document.head.appendChild(styleSheet);
}

function getAvailableCredit(card) {
  if (card.tipo !== 'credito') return 0;
  
  const expenses = getItems('EXPENSES')
    .filter(expense => 
      expense.tarjetaId === card.id && 
      !expense.pagado
    )
    .reduce((sum, expense) => sum + expense.importe, 0);
    
  return card.limite - expenses;
}

function getPaymentSchedule(expense, card) {
  if (!expense || !card) return null;
  
  if (card.tipo === 'debito') {
    return [new Date(expense.fecha)];
  }

  const purchaseDate = new Date(expense.fecha);
  const closingDay = parseInt(card.fechaCierre);
  const paymentDay = parseInt(card.fechaVencimiento || card.fechaPago);
  
  if (isNaN(closingDay) || isNaN(paymentDay)) return null;
  
  let closingDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), closingDay);
  
  if (purchaseDate > closingDate) {
    closingDate.setMonth(closingDate.getMonth() + 1);
  }
  
  let firstPayment = new Date(closingDate.getFullYear(), closingDate.getMonth(), paymentDay);
  
  const payments = [];
  const numCuotas = expense.cuotas || 1;
  
  for(let i = 0; i < numCuotas; i++) {
    const paymentDate = new Date(firstPayment);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    payments.push(paymentDate);
  }
  
  return payments;
}

function filterExpenses(expenses, filters) {
  if (!expenses || !filters) return [];
  
  return expenses.filter(expense => {
    if (filters.tarjetaId && expense.tarjetaId !== filters.tarjetaId) {
      return false;
    }
    return true;
  });
}

function loadExpensesTable(filters) {
  const expenses = filterExpenses(getItems('EXPENSES'), filters);
  const container = document.getElementById('card-expenses-container');
  
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
            <th>Cuotas</th>
            <th>Importe Cuota</th>
            <th>Total</th>
            <th>Vencimientos</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(expense => {
            const card = cards.find(c => c.id === expense.tarjetaId);
            if (!card) return ''; // Skip if card not found
            
            const expenseDate = new Date(expense.fecha);
            expenseDate.setMinutes(expenseDate.getMinutes() + expenseDate.getTimezoneOffset());
            
            let cuotaInfo, vencimientos;
            if (card.tipo === 'debito') {
              cuotaInfo = 'N/A';
              vencimientos = formatDate(expenseDate);
            } else {
              const payments = getPaymentSchedule(expense, card);
              if (!payments || !payments.length) return ''; // Skip if no payments
              
              const cuotaAmount = (expense.importe * (1 + (expense.interes || 0)/100)) / (expense.cuotas || 1);
              
              cuotaInfo = `${expense.cuotas || 1} ${expense.cuotas > 1 ? `(${formatCurrency(cuotaAmount)} c/u)` : ''}`;
              vencimientos = payments.map((date, idx) => 
                `<div>Cuota ${idx + 1}/${expense.cuotas || 1}: ${formatDate(date)}</div>`
              ).join('');
            }
            
            return `
              <tr>
                <td>${formatDate(expenseDate)}</td>
                <td>${expense.descripcion}</td>
                <td>${cuotaInfo}</td>
                <td>${card.tipo === 'debito' ? 'N/A' : 
                  formatCurrency((expense.importe * (1 + (expense.interes || 0)/100)) / (expense.cuotas || 1))}</td>
                <td>${formatCurrency(expense.importe)}</td>
                <td>${vencimientos}</td>
              </tr>
            `;
          }).filter(row => row).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Modal functions
window.showAddCardModal = function() {
  document.getElementById('cardForm').reset();
  document.getElementById('cardId').value = '';
  new bootstrap.Modal(document.getElementById('cardModal')).show();
};

window.editCard = function(id) {
  const card = getItems('CARDS').find(c => c.id === id);
  if (!card) return;
  
  document.getElementById('cardType').value = card.tipo;
  document.getElementById('cardType').dispatchEvent(new Event('change'));
  document.getElementById('cardIssuer').value = card.emisor;
  
  const numbers = card.numero.match(/.{1,4}/g);
  document.querySelectorAll('.card-number').forEach((input, i) => {
    input.value = numbers[i];
  });
  
  document.getElementById('cardExpiry').value = card.vencimiento;
  
  if (card.tipo === 'credito') {
    document.getElementById('cardClosingDate').value = card.fechaCierre;
    document.getElementById('cardDueDate').value = card.fechaVencimiento;
    document.getElementById('cardLimit').value = card.limite;
  }
  
  document.getElementById('cardId').value = card.id;
  new bootstrap.Modal(document.getElementById('cardModal')).show();
};

window.deleteCard = function(id) {
  if (confirm('¿Está seguro de eliminar esta tarjeta?')) {
    deleteItem('CARDS', id);
    loadCards();
  }
};

window.saveCard = function() {
  const form = document.getElementById('cardForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const cardNumber = Array.from(document.querySelectorAll('.card-number'))
    .map(input => input.value)
    .join('');
    
  const cardData = {
    tipo: document.getElementById('cardType').value,
    emisor: document.getElementById('cardIssuer').value,
    numero: cardNumber,
    vencimiento: document.getElementById('cardExpiry').value
  };
  
  if (cardData.tipo === 'credito') {
    Object.assign(cardData, {
      fechaCierre: document.getElementById('cardClosingDate').value,
      fechaVencimiento: document.getElementById('cardDueDate').value,
      limite: Number(document.getElementById('cardLimit').value)
    });
  }
  
  const cardId = document.getElementById('cardId').value;
  if (cardId) {
    updateItem('CARDS', Number(cardId), cardData);
  } else {
    addItem('CARDS', cardData);
  }
  
  bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
  loadCards();
};

window.showCardExpenses = function(cardId) {
  const card = getItems('CARDS').find(c => c.id === cardId);
  if (!card) return;

  const expenses = getItems('EXPENSES')
    .filter(expense => expense.tarjetaId === cardId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const container = document.getElementById('card-expenses-container');
  
  if (expenses.length === 0) {
    container.innerHTML = '<p>No hay gastos registrados para esta tarjeta</p>';
  } else {
    loadExpensesTable({tarjetaId: cardId});
  }

  new bootstrap.Modal(document.getElementById('cardExpensesModal')).show();
};

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