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
          card.style = 'border: 1px solid #ddd; padding: 10px; margin: 10px; border-radius: 8px; background-color: #f9f9f9; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);';
          card.innerHTML = `
            <h3>${subject.name || 'Môn chưa xác định'}</h3>
            <p><strong>Mã môn:</strong> ${subject.code || 'N/A'}</p>
            <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || 'N/A'}</p>
            <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || 'N/A'}</p>
            <p><strong>Tổng số tín chỉ:</strong> ${subject['theory-credits'] + subject['practice-credits'] || 'N/A'}</p>
            <p><strong>Loại:</strong> ${subject.type || 'N/A'}</p>
            <p><strong>Khoa:</strong> ${subject.management || 'N/A'}</p>
            <p><strong>Tài liệu:</strong> ${subject.URL ? `<a href="${subject.URL}" target="_blank">Link</a>` : 'N/A'}</p>
            <button class="detail-button" data-id="${subject.$id}" style="background-color: #007bff; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer;">Xem chi tiết</button>
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

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('detail-button')) {
    const subjectId = event.target.dataset.id;
    const subject = window.subjectsData[subjectId];
    if (subject) {
      openDetailModal(subject);
    }
  }
});

function renderDocumentSearchResults(documents) {
  const docContainer = document.getElementById('document-result-container');
  docContainer.innerHTML = '';
  docContainer.style = `
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  `;

  if (!Array.isArray(documents) || documents.length === 0) {
    docContainer.innerHTML = '<p style="text-align: center; font-size: 16px; color: #777; font-weight: 500;">📄 Không tìm thấy tài liệu.</p>';
    return;
  }

  documents.forEach(doc => {
    const div = document.createElement('div');
    div.className = 'document-card';
    div.style = 'display: flex; flex-direction: column; justify-content: space-between; gap: 5px; align-items: center; border: 1px solid rgba(0, 0, 0, 0.1); padding: 10px; margin: 12px 0; border-radius: 12px; background-color: #fff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; width: 17%;';
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