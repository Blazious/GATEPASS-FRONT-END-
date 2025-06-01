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
  const createGatepassBtn = document.getElementById('createGatepassBtn');
  const createGatepassPopup = document.getElementById('createGatepassPopup');
  const overlay = document.getElementById('overlay');
  const cancelCreateBtn = document.getElementById('cancelCreate');
  const gatepassForm = document.getElementById('gatepassForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const itemsFieldset = document.getElementById('itemsFieldset');

  let selectedGatepassId = null;
  let gatepassesData = [];
  let currentPage = 1;
  const pageSize = 5;

  // Add pagination buttons container
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) {
    const container = document.createElement('div');
    container.id = 'pagination';
    document.body.appendChild(container);
  }

  async function fetchGatepasses() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/gatepass/requests/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch gatepass requests');
      
      gatepassesData = await res.json();
      renderGatepasses(currentPage);
      renderPagination();
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
        <td>${gp.reason}</td>
        <td>${new Date(gp.date_requested).toLocaleString()}</td>
        <td>${new Date(gp.exit_time).toLocaleString()}</td>
        <td>${new Date(gp.return_time).toLocaleString()}</td>
        <td><span class="status-badge status-${gp.status.split('_')[0]}">${formatStatus(gp.status)}</span></td>
        <td>
          <button class="action-btn view-btn" onclick="selectGatepass(${gp.id})"><i class="fas fa-eye"></i> View Items</button>
          ${gp.status === 'approved_security' ? `<button class="action-btn download-btn" onclick="downloadGatepass(${gp.id})"><i class="fas fa-download"></i> Download</button>` : ''}
        </td>
      `;
      gatepassTableBody.appendChild(tr);
    });
  }

  function renderPagination() {
    const totalPages = Math.ceil(gatepassesData.length / pageSize);
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === currentPage ? 'active' : '';
      btn.onclick = () => {
        currentPage = i;
        renderGatepasses(currentPage);
        renderPagination();
      };
      container.appendChild(btn);
    }
  }

  window.selectGatepass = function(id) {
    selectedGatepassId = id;
    const gatepass = gatepassesData.find(gp => gp.id === id);

    if (gatepass && gatepass.items) {
      renderItems(gatepass.items);
    } else {
      itemsTableBody.innerHTML = '<tr><td colspan="4">No items found</td></tr>';
    }
  };

  function renderItems(items) {
    itemsTableBody.innerHTML = '';
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

  function formatStatus(status) {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  createGatepassBtn.onclick = () => {
    createGatepassPopup.style.display = 'block';
    overlay.style.display = 'block';
  };

  cancelCreateBtn.onclick = () => {
    createGatepassPopup.style.display = 'none';
    overlay.style.display = 'none';
    gatepassForm.reset();
  };

  gatepassForm.onsubmit = async (e) => {
    e.preventDefault();
    const reason = document.getElementById('reason').value.trim();
    const exitTime = document.getElementById('exitTime').value;
    const returnTime = document.getElementById('returnTime').value;
    const comments = document.getElementById('comments').value.trim();

    if (!reason || !exitTime || !returnTime) {
      alert('Please fill all required fields.');
      return;
    }

    const itemRows = document.querySelectorAll('.itemRow');
    const items = Array.from(itemRows).map(row => ({
      item_name: row.querySelector('.item_name').value.trim(),
      quantity: parseInt(row.querySelector('.quantity').value),
      serial_number: row.querySelector('.serial_number').value.trim(),
      description: row.querySelector('.description').value.trim(),
      is_custom: false
    }));

    try {
      const res = await fetch('http://127.0.0.1:8000/api/gatepass/requests/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          exit_time: exitTime,
          return_time: returnTime,
          comments,
          items
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create gatepass');
      }

      alert('Gatepass created successfully!');
      createGatepassPopup.style.display = 'none';
      overlay.style.display = 'none';
      gatepassForm.reset();
      fetchGatepasses();
    } catch (error) {
      console.error('Error creating gatepass:', error);
      alert(error.message);
    }
  };

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
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = 'index.html';
    }
  };

  window.downloadGatepass = async function(id) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/gatepass/${id}/download/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error('Failed to download gatepass');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gatepass_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(error.message);
    }
  };

  addItemBtn.addEventListener('click', () => {
    const itemRow = document.createElement('div');
    itemRow.className = 'itemRow';
    itemRow.innerHTML = `
      <input type="text" class="item_name" placeholder="Item Name" required />
      <input type="number" class="quantity" placeholder="Quantity" min="1" value="1" required />
      <input type="text" class="serial_number" placeholder="Serial Number" />
      <input type="text" class="description" placeholder="Description" />
      <button type="button" class="removeItemBtn">Remove</button>
    `;
    itemsFieldset.insertBefore(itemRow, addItemBtn);

    itemRow.querySelector('.removeItemBtn').addEventListener('click', () => {
      itemRow.remove();
    });
  });

  fetchGatepasses();
});
