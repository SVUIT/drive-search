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
          card.style = 'border: 1px solid #ddd; padding: 20px; margin: 10px; border-radius: 8px; background-color: #f9f9f9; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);width:20%;';
          card.innerHTML = `
            <h3>${subject.name || 'Môn chưa xác định'}</h3>
            <p><strong>Mã môn:</strong> ${subject.code || 'Chưa cập nhật'}</p>
            <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || 'Chưa cập nhật'}</p>
            <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || 'Chưa cập nhật'}</p>
            <p><strong>Tổng số tín chỉ:</strong> ${subject['theory-credits'] + subject['practice-credits'] || 'Chưa cập nhật'}</p>
            <p><strong>Loại:</strong> ${subject.type || 'Chưa cập nhật'}</p>
            <p><strong>Khoa:</strong> ${subject.management || 'Chưa cập nhật'}</p>
            <p><strong>Tài liệu:</strong> ${subject.URL ? `<a href="${subject.URL}" target="_blank">Link</a>` : 'Chưa cập nhật'}</p>
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
    display: flex;
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
    div.style = `
      padding: 16px;
      width: 17%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      background-color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
    `;
    
    div.onmouseover = () => {
      div.style.transform = 'scale(1.05)';
      div.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.18)';
    };
    
    div.onmouseleave = () => {
      div.style.transform = 'scale(1)';
      div.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
    };

    div.innerHTML = `
      <h3 style="font-weight: 500; font-size: 16px; margin: 0;">${doc.name || 'N/A'}</h3>
      <p style="font-size: 14px; color: #777; margin: 4px 0 0;">
        📎<strong> Link:</strong> ${doc.URL ? `<a href="${doc.URL}" target="_blank" style="color: #007bff; text-decoration: underline;"> Xem tài liệu</a>` : 'N/A'}
      </p>
      <p style="font-size: 14px; color: #777; margin: 0;">
        <strong>📅 Ngày tải lên:</strong> ${doc['upload-date'] ? doc['upload-date'].split('T')[0] : 'N/A'}
      </p>
      <p style="font-size: 14px; color: #555; margin: 0;">
        <strong>📚 Học kỳ:</strong> ${doc.semester || 'Chưa cập nhật'}
      </p>
      <p style="font-size: 14px; color: #555; margin: 0;">
        <strong>🏫 Năm học:</strong> ${doc['academic-year'] || 'Chưa cập nhật'}
      </p>
      <div style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: none; background-color: transparent; cursor: pointer; transition: background 0.2s;" 
            onmouseover="this.style.backgroundColor='#eee'" 
            onmouseleave="this.style.backgroundColor='transparent'">
            <i class="ri-edit-line"></i>
          </button>
          <button style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: none; background-color: transparent; cursor: pointer; transition: background 0.2s;" 
            onmouseover="this.style.backgroundColor='#eee'" 
            onmouseleave="this.style.backgroundColor='transparent'">
            <i class="ri-download-line"></i>
          </button>
        </div>
      </div>
    `;

    docContainer.appendChild(div);
  });
}
