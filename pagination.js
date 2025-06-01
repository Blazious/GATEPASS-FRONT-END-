// pagination.js

const entriesPerPage = 3;

function renderPaginatedTable({ 
  data, 
  tableBodyId, 
  pageInfoId, 
  currentPage, 
  renderRow 
}) {
  const tbody = document.getElementById(tableBodyId);
  const pageInfo = document.getElementById(pageInfoId);
  tbody.innerHTML = "";

  const start = (currentPage - 1) * entriesPerPage;
  const end = start + entriesPerPage;
  const paginatedData = data.slice(start, end);

  paginatedData.forEach(item => {
    const row = tbody.insertRow();
    row.innerHTML = renderRow(item);
  });

  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(data.length / entriesPerPage)}`;
}

function setupPagination({ 
  table, 
  dataRef, 
  currentPageRef, 
  tableBodyId, 
  pageInfoId, 
  renderRow 
}) {
  const nextBtn = document.querySelector(`#${table}Pagination button.next`);
  const prevBtn = document.querySelector(`#${table}Pagination button.prev`);

  nextBtn.onclick = () => {
    if (currentPageRef.value < Math.ceil(dataRef.value.length / entriesPerPage)) {
      currentPageRef.value++;
      renderPaginatedTable({
        data: dataRef.value,
        tableBodyId,
        pageInfoId,
        currentPage: currentPageRef.value,
        renderRow
      });
    }
  };

  prevBtn.onclick = () => {
    if (currentPageRef.value > 1) {
      currentPageRef.value--;
      renderPaginatedTable({
        data: dataRef.value,
        tableBodyId,
        pageInfoId,
        currentPage: currentPageRef.value,
        renderRow
      });
    }
  };
}

export { renderPaginatedTable, setupPagination };
