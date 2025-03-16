window.subjectsData = {};
window.documentsData = {};

document.getElementById('search-button').addEventListener('click', async () => {
  const query = document.getElementById('search-input').value.trim();
  const searchType = document.getElementById('search-type').value;

  if (!query) {
    alert('Vui lòng nhập từ khóa tìm kiếm.');
    return;
  }

  if (searchType === 'subjects') {
    document.getElementById('document-result-container').style.display = 'none';
    const cardContainer = document.querySelector('.card-container');
    cardContainer.style.display = 'flex';

    try {
      const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const subjects = await response.json();

      cardContainer.innerHTML = '';
      window.subjectsData = {};

      if (Array.isArray(subjects) && subjects.length > 0) {
        subjects.forEach(subject => {
          window.subjectsData[subject.$id] = subject;
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h3>${subject.name || 'Môn chưa xác định'}</h3>
            <p><strong>Mã môn:</strong> ${subject.code || 'N/A'}</p>
            <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || 'N/A'}</p>
            <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || 'N/A'}</p>
            <p><strong>Tổng số tín chỉ:</strong> ${subject['theory-credits'] + subject['practice-credits'] || 'N/A'}</p>
            <p><strong>Loại:</strong> ${subject.type || 'N/A'}</p>
            <p><strong>Khoa:</strong> ${subject.management || 'N/A'}</p>
            <p><strong>Tài liệu:</strong> ${subject.URL ? `<a href="${subject.URL}" target="_blank">Link</a>` : 'N/A'}</p>
            <button class="detail-button" data-id="${subject.$id}">Xem chi tiết</button>
          `;
          cardContainer.appendChild(card);
        });
      } else {
        cardContainer.innerHTML = "<p>Không tìm thấy kết quả.</p>";
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    }
  } else if (searchType === 'documents') {
    document.querySelector('.card-container').style.display = 'none';
    const docContainer = document.getElementById('document-result-container');
    docContainer.style.display = 'block';

    try {
      const response = await fetch(`/documents/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const documents = await response.json();
      renderDocumentSearchResults(documents);
    } catch (error) {
      console.error('Lỗi khi tìm tài liệu:', error);
      docContainer.innerHTML = '<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>';
    }
  }
});

document.getElementById('search-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('search-button').click();
  }
});

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('detail-button')) {
    const subjectId = event.target.dataset.id;
    const subject = window.subjectsData[subjectId];
    if (subject) {
      openDetailModal(subject);
    }
  }
});

function openDetailModal(subject) {
  const modal = document.getElementById('detail-modal');
  const detailsContainer = document.getElementById('subject-details');
  detailsContainer.innerHTML = '';

  for (const key in subject) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${key}:</strong> ${subject[key]}`;
    detailsContainer.appendChild(p);
  }

  document.getElementById('documents-container').innerHTML = '';
  const getDocsBtn = document.getElementById('get-documents-btn');
  getDocsBtn.onclick = async () => {
    try {
      const response = await fetch(`/documents?subjectId=${subject.$id}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const documents = await response.json();
      renderDocumentsTable(documents);
    } catch (error) {
      console.error('Lỗi khi tìm tài liệu:', error);
    }
  };

  modal.classList.add('active');
}

function renderDocumentsTable(documents) {
  const container = document.getElementById('documents-container');
  container.innerHTML = '';

  if (!Array.isArray(documents) || documents.length === 0) {
    container.innerHTML = '<p>Không tìm thấy tài liệu.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'documents-table';
  table.innerHTML = '<thead><tr><th>Tên tài liệu</th><th>Link</th><th>Ngày tải lên</th></tr></thead>';

  const tbody = document.createElement('tbody');
  documents.forEach(doc => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${doc.name || 'N/A'}</td>
      <td>${doc.driveLink ? `<a href="${doc.driveLink}" target="_blank">Google Drive</a>` : 'N/A'}</td>
      <td>${doc['upload-date'] || 'N/A'}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

document.getElementById('detail-modal').querySelector('.close-modal')
  .addEventListener('click', () => {
    document.getElementById('detail-modal').classList.remove('active');
  });

document.getElementById('detail-modal').addEventListener('click', (event) => {
  if (event.target === document.getElementById('detail-modal')) {
    document.getElementById('detail-modal').classList.remove('active');
  }
});

function renderDocumentSearchResults(documents) {
  const docContainer = document.getElementById('document-result-container');
  docContainer.innerHTML = '';

  if (!Array.isArray(documents) || documents.length === 0) {
    docContainer.innerHTML = '<p style="text-align: center; font-size: 16px; color: #777; font-weight: 500;">📄 Không tìm thấy tài liệu.</p>';
    return;
  }

  documents.forEach(doc => {
    const div = document.createElement('div');
    div.className = 'document-card';
    div.style = `
      display: flex; 
      flex-direction: column; 
      justify-content: space-between;
      gap: 3px;
      align-items: center;
      border: 1px solid rgba(0, 0, 0, 0.1); 
      padding: 3px; 
      margin: 12px 0;
      border-radius: 12px; 
      background-color: #fff; 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
      width: 100%;
    `;

    div.onmouseover = () => {
      div.style.transform = 'scale(1.01)';
      div.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.18)';
    };
    
    div.onmouseleave = () => {
      div.style.transform = 'scale(1)';
      div.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
    };

    div.innerHTML = `
      <h3>${doc.name || 'N/A'}</h3>
      <p><strong>📎 Link:</strong> ${doc.URL ? `<a href="${doc.URL}" target="_blank">🔗 Xem tài liệu</a>` : 'N/A'}</p>
      <p><strong>📅 Ngày tải lên:</strong> ${doc['upload-date'] || 'N/A'}</p>
    `;

    docContainer.appendChild(div);
  });
}
