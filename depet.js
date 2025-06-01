document.addEventListener('DOMContentLoaded', () => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    alert('You are not logged in!');
    window.location.href = 'login.html';
    return;
  }

  const gatepassTableBody = document.querySelector('#gatepassTable tbody');
  const itemsTableBody = document.querySelector('#itemsTable tbody');
  const logoutBtn = document.getElementById('logoutBtn');
  const decisionPopup = document.getElementById('decisionPopup');
  const overlay = document.getElementById('overlay');
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const cancelDecisionBtn = document.getElementById('cancelDecisionBtn');
  const gatepassDetails = document.getElementById('gatepassDetails');

  let selectedGatepassId = null;
  let gatepassesData = [];
  let itemsData = [];
  let currentGatepassPage = 1;
  let currentItemsPage = 1;
  const pageSize = 5;

  // Pagination elements
  const gatepassPagination = document.getElementById('gatepassPagination');
  const itemsPagination = document.getElementById('itemsPagination');
  const gatepassPageInfo = document.getElementById('gatepassPageInfo');
  const itemsPageInfo = document.getElementById('itemsPageInfo');

  async function fetchGatepasses() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/gatepass/requests/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch gatepass requests');
      
      gatepassesData = await res.json();
      renderGatepasses(currentGatepassPage);
      renderGatepassPagination();
    } catch (error) {
      console.error('Error fetching gatepasses:', error);
      alert(error.message);
    }
  }

  function renderGatepasses(page) {
    gatepassTableBody.innerHTML = '';
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const gatepasses = gatepassesData.slice(start, end);

    gatepasses.forEach(gp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${gp.id}</td>
        <td>${gp.employee_name || 'N/A'}</td>
        <td>${gp.reason}</td>
        <td>${new Date(gp.date_requested).toLocaleString()}</td>
        <td>${new Date(gp.exit_time).toLocaleString()}</td>
        <td>${new Date(gp.return_time).toLocaleString()}</td>
        <td><span class="status-badge status-${gp.status.split('_')[0]}">${formatStatus(gp.status)}</span></td>
        <td>
          <button class="action-btn view-btn" onclick="selectGatepass(${gp.id})">
            <i class="fas fa-eye"></i> View Items
          </button>
          ${gp.status === 'pending_department' ? 
            `<button class="action-btn decision-btn" onclick="showDecisionPopup(${gp.id})">
              <i class="fas fa-check-circle"></i> Approve/Reject
            </button>` : ''}
        </td>
      `;
      gatepassTableBody.appendChild(tr);
    });
  }

  function renderGatepassPagination() {
    const totalPages = Math.ceil(gatepassesData.length / pageSize);
    
    // Update page info
    gatepassPageInfo.textContent = `Page ${currentGatepassPage} of ${totalPages}`;
    
    // Update prev/next buttons
    const prevBtn = gatepassPagination.querySelector('.prev');
    const nextBtn = gatepassPagination.querySelector('.next');
    
    prevBtn.disabled = currentGatepassPage === 1;
    nextBtn.disabled = currentGatepassPage === totalPages;
    
    prevBtn.onclick = () => {
      if (currentGatepassPage > 1) {
        currentGatepassPage--;
        renderGatepasses(currentGatepassPage);
        renderGatepassPagination();
      }
    };
    
    nextBtn.onclick = () => {
      if (currentGatepassPage < totalPages) {
        currentGatepassPage++;
        renderGatepasses(currentGatepassPage);
        renderGatepassPagination();
      }
    };
  }

  window.selectGatepass = function(id) {
    selectedGatepassId = id;
    const gatepass = gatepassesData.find(gp => gp.id === id);

    if (gatepass && gatepass.items) {
      itemsData = gatepass.items;
      currentItemsPage = 1;
      renderItems(currentItemsPage);
      renderItemsPagination();
    } else {
      itemsData = [];
      itemsTableBody.innerHTML = '<tr><td colspan="4">No items found</td></tr>';
      renderItemsPagination();
    }
  };

  function renderItems(page) {
    itemsTableBody.innerHTML = '';
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = itemsData.slice(start, end);

    if (items && items.length > 0) {
      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.item_name}</td>
          <td>${item.quantity}</td>
          <td>${item.serial_number || 'N/A'}</td>
          <td>${item.description || 'N/A'}</td>
        `;
        itemsTableBody.appendChild(tr);
      });
    } else {
      itemsTableBody.innerHTML = '<tr><td colspan="4">No items found</td></tr>';
    }
  }

  function renderItemsPagination() {
    const totalPages = Math.ceil(itemsData.length / pageSize);
    
    // Update page info
    itemsPageInfo.textContent = itemsData.length > 0 ? `Page ${currentItemsPage} of ${totalPages}` : '';
    
    // Update prev/next buttons
    const prevBtn = itemsPagination.querySelector('.prev');
    const nextBtn = itemsPagination.querySelector('.next');
    
    prevBtn.disabled = currentItemsPage === 1 || itemsData.length === 0;
    nextBtn.disabled = currentItemsPage === totalPages || itemsData.length === 0;
    
    prevBtn.onclick = () => {
      if (currentItemsPage > 1) {
        currentItemsPage--;
        renderItems(currentItemsPage);
        renderItemsPagination();
      }
    };
    
    nextBtn.onclick = () => {
      if (currentItemsPage < totalPages) {
        currentItemsPage++;
        renderItems(currentItemsPage);
        renderItemsPagination();
      }
    };
  }

  window.showDecisionPopup = function(id) {
    selectedGatepassId = id;
    const gatepass = gatepassesData.find(gp => gp.id === id);
    
    if (gatepass) {
      gatepassDetails.innerHTML = `
        <div class="gatepass-summary">
          <p><strong>Employee:</strong> ${gatepass.employee_name || 'N/A'}</p>
          <p><strong>Reason:</strong> ${gatepass.reason}</p>
          <p><strong>Exit Time:</strong> ${new Date(gatepass.exit_time).toLocaleString()}</p>
          <p><strong>Return Time:</strong> ${new Date(gatepass.return_time).toLocaleString()}</p>
          <p><strong>Comments:</strong> ${gatepass.comments || 'None'}</p>
          <p><strong>Items Count:</strong> ${gatepass.items ? gatepass.items.length : 0}</p>
        </div>
      `;
      
      decisionPopup.style.display = 'block';
      overlay.style.display = 'block';
    }
  };

  function hideDecisionPopup() {
    decisionPopup.style.display = 'none';
    overlay.style.display = 'none';
    selectedGatepassId = null;
  }

  async function makeDecision(decision) {
    if (!selectedGatepassId) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/gatepass/approve/${selectedGatepassId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${decision} gatepass`);
      }

      alert(`Gatepass ${decision}d successfully!`);
      hideDecisionPopup();
      fetchGatepasses(); // Refresh the list
    } catch (error) {
      console.error(`Error ${decision}ing gatepass:`, error);
      alert(error.message);
    }
  }

  function formatStatus(status) {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Event listeners
  approveBtn.onclick = () => makeDecision('approve');
  rejectBtn.onclick = () => makeDecision('reject');
  cancelDecisionBtn.onclick = hideDecisionPopup;
  overlay.onclick = hideDecisionPopup;

  logoutBtn.onclick = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch('http://127.0.0.1:8000/api/token/blacklist/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ refresh: refreshToken })
        });
      }
      localStorage.clear();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = 'login.html';
    }
  };

  // Initialize
  fetchGatepasses();
});