window.subjectsData = {};
window.documentsData = {};

document.getElementById('search-button').addEventListener('click', async () => {
  const query = document.getElementById('search-input').value.trim();
  const searchType = document.getElementById('search-type').value;
  const selectedTag = document.getElementById('tag-filter').value;

  if (searchType === 'subjects' && !query) {
    const cardContainer = document.querySelector('.card-container');
    cardContainer.style.display = 'flex';
    document.getElementById('document-result-container').style.display = 'none';

    try {
      const res = await fetch('/subjects');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const subjects = await res.json();

      cardContainer.innerHTML = '';
      window.subjectsData = {};

      subjects.forEach(subject => {
        window.subjectsData[subject.$id] = subject;
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `
        font-family:'Poppins',sans-serif;
                padding:32px;
                width:100%;max-width:400px;
                aspect-ratio:4/3;
                display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:8px;
                line-height:0.6;
                background:rgba(255,255,255,0.2);
                backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
                border:1px solid transparent;border-radius:20px;
                border-image:linear-gradient(to right,#6a11cb,#2575fc) 1;
                box-shadow:0 8px 32px rgba(0,0,0,0.1);
                filter:drop-shadow(0 4px 8px rgba(0,0,0,0.05));
                transition:transform 0.4s ease,box-shadow 0.4s ease,filter 0.4s ease;
                will-change:transform,box-shadow;
                cursor:pointer;
                overflow:hidden;
                backface-visibility:hidden;
                `;
        card.innerHTML = `
          <h3>${subject.name || 'Môn chưa xác định'}</h3>
          <p><strong>Mã môn:</strong> ${subject.code || 'Chưa cập nhật'}</p>
          <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || '0'}</p>
          <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || '0'}</p>
          <p><strong>Loại:</strong> ${subject.type || 'Chưa cập nhật'}</p>
          <p><strong>Khoa:</strong> ${subject.management || 'Chưa cập nhật'}</p>
          <p><strong>Tài liệu:</strong> ${subject.URL ? `<a href="${subject.URL}" target="_blank">Link</a>` : 'Chưa cập nhật'}</p>
        `;
        cardContainer.appendChild(card);
      });
    } catch (err) {
      console.error('Error fetching all subjects:', err);
      cardContainer.innerHTML = '<p>Không thể tải danh sách môn.</p>';
    }
    return;
  }

  if (!query && searchType === 'documents') {
    const cardContainer = document.querySelector('.card-container');
    cardContainer.style.display = 'none';
    const documentResultContainer = document.getElementById('document-result-container');
    documentResultContainer.style.display = 'flex';
    const selectedTag = document.getElementById('tag-filter').value;
  
    if (!selectedTag) {
      documentResultContainer.style.display = 'none';
      alert('Vui lòng nhập từ khóa tìm kiếm.');
      return;
    }
  
    try {
      const res = await fetch(`/documents?tag=${encodeURIComponent(selectedTag)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const documents = await res.json();
  
      documentResultContainer.innerHTML = '';
  
      documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `
          font-family: 'Poppins', sans-serif;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          aspect-ratio: 4/3;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          line-height: 0.6;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid transparent;
          border-radius: 20px;
          border-image: linear-gradient(to right, #6a11cb, #2575fc) 1;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.05));
          transition: transform 0.4s ease, box-shadow 0.4s ease, filter 0.4s ease;
          will-change: transform, box-shadow;
          cursor: pointer;
          overflow: hidden;
          backface-visibility: hidden;
        `;
        card.innerHTML = `
          <h3>${doc.name || 'Tài liệu chưa xác định'}</h3>
          <p><strong>Môn học:</strong> ${doc.subject || 'Không rõ'}</p>
          <p><strong>Tags:</strong> ${(doc.tags || []).join(', ') || 'Không có'}</p>
          <p><strong>Link:</strong> ${doc.link ? `<a href="${doc.link}" target="_blank">Xem</a>` : 'Không có'}</p>
        `;
        documentResultContainer.appendChild(card);
      });
  
    } catch (err) {
      console.error('Error fetching documents by tag:', err);
      documentResultContainer.innerHTML = '<p>Không thể tải tài liệu.</p>';
    }
  
    return;
  }

  if (searchType === 'subjects') {
    const cardContainer = document.querySelector('.card-container');
    cardContainer.style.display = 'flex';
    document.getElementById('document-result-container').style.display = 'none';

    try {
      const res = await fetch(`/subjects/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const subjects = await res.json();

      cardContainer.innerHTML = '';
      window.subjectsData = {};

      if (subjects.length === 0) {
        cardContainer.innerHTML = '<p>Không tìm thấy môn nào.</p>';
        return;
      }

      subjects.forEach(subject => {
        window.subjectsData[subject.$id] = subject;
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `
        font-family:'Poppins',sans-serif;
                padding:32px;
                width:100%;max-width:400px;
                aspect-ratio:4/3;
                display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:8px;
                line-height:0.6;
                background:rgba(255,255,255,0.2);
                backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
                border:1px solid transparent;border-radius:20px;
                border-image:linear-gradient(to right,#6a11cb,#2575fc) 1;
                box-shadow:0 8px 32px rgba(0,0,0,0.1);
                filter:drop-shadow(0 4px 8px rgba(0,0,0,0.05));
                transition:transform 0.4s ease,box-shadow 0.4s ease,filter 0.4s ease;
                will-change:transform,box-shadow;
                cursor:pointer;
                overflow:hidden;
                backface-visibility:hidden;
                `;
        card.innerHTML = `
          <h3>${subject.name || 'Môn chưa xác định'}</h3>
          <p><strong>Mã môn:</strong> ${subject.code || 'Chưa cập nhật'}</p>
          <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || '0'}</p>
          <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || '0'}</p>
          <p><strong>Loại:</strong> ${subject.type || 'Chưa cập nhật'}</p>
          <p><strong>Khoa:</strong> ${subject.management || 'Chưa cập nhật'}</p>
          <p><strong>Tài liệu:</strong> ${subject.URL ? `<a href="${subject.URL}" target="_blank">Link</a>` : 'Chưa cập nhật'}</p>
        `;
        cardContainer.appendChild(card);
      });
    } catch (err) {
      console.error('Error searching subjects:', err);
      cardContainer.innerHTML = '<p>Không thể tìm kiếm môn học.</p>';
    }
  } else if (searchType === 'documents') {
    const documentContainer = document.getElementById('document-result-container');
    documentContainer.style.display = 'flex';
    document.querySelector('.card-container').style.display = 'none';

    try {
      const res = await fetch(`/documents/search?query=${encodeURIComponent(query)}&tag=${encodeURIComponent(selectedTag)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const documents = await res.json();

      documentContainer.innerHTML = '';

      if (documents.length === 0) {
        documentContainer.innerHTML = '<p>Không tìm thấy tài liệu nào.</p>';
        return;
      }

      documents.forEach(doc => {
        const docCard = document.createElement('div');
        docCard.className = 'card';
        docCard.style.cssText = `background: white; border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin: 8px; width: 300px;`;
        docCard.innerHTML = `
          <h3>${doc.title || 'Chưa có tiêu đề'}</h3>
          <p><strong>Mô tả:</strong> ${doc.description || 'Không có mô tả'}</p>
          <p><strong>Tag:</strong> ${doc.tag || 'Không có tag'}</p>
          <p><a href="${doc.url}" target="_blank">Xem tài liệu</a></p>
        `;
        documentContainer.appendChild(docCard);
      });
    } catch (err) {
      console.error('Error searching documents:', err);
      documentContainer.innerHTML = '<p>Không thể tìm kiếm tài liệu.</p>';
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





async function fetchTags() {
  const tagSelect = document.getElementById('tag-filter');
  if (!tagSelect) return;

  // remember what was selected before we reload the options
  const previouslySelected = [...tagSelect.selectedOptions].map(o => o.value);

  try {
    // 1) fetch all tags (no query, no filtering)
    const res = await fetch('/documents/tags');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const uniqueTags = await res.json();       // e.g. ["tag1","tag2",...]

    if (!Array.isArray(uniqueTags)) {
      console.warn('Expected array of tags, got:', uniqueTags);
      return;
    }

    // 2) rebuild <select>
    tagSelect.innerHTML = '<option value="all">All</option>';
    uniqueTags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      tagSelect.appendChild(opt);
    });

    // 3) restore any previous selections
    [...tagSelect.options].forEach(opt => {
      if (previouslySelected.includes(opt.value)) {
        opt.selected = true;
      }
    });

    // 4) notify Select2 (or any other plugin) that options changed
    $('#tag-filter').trigger('change');
  }
  catch (err) {
    console.error('Error fetching all tags:', err);
  }
}

// wire it up on page-load
window.addEventListener('DOMContentLoaded', fetchTags);

$(document).ready(function() {
  $('#tag-filter').select2({
    placeholder: "Chọn tag",
    allowClear: true
  });
});

// Khi fetch xong tag:
function updateTagOptions(uniqueTags) {
  const $select = $('#tag-filter');
  $select.empty();
  $select.append('<option value="all">All</option>');
  uniqueTags.forEach(tag => {
    $select.append(`<option value="${tag}">${tag}</option>`);
  });
  $select.trigger('change');
}


async function renderDocumentSearchResults(documents) {
  const docContainer = document.getElementById('document-result-container');
  docContainer.innerHTML = '';
  docContainer.style = `
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  `;

  const tags = $('#tag-filter').select2('data') || [];
  const selectedTags = tags.filter(tag => tag.selected).map(tag => tag.text.toLowerCase());

  let filteredDocuments = documents;

  // Check if "All" tag is selected
  if (selectedTags.includes('all')) {
    filteredDocuments = documents; // No filtering, show all documents
  } else if (selectedTags.length > 0) {
    filteredDocuments = documents.filter(doc => {
      if (!doc.tags) return false;
      const docTags = doc.tags.map(t => t.toLowerCase());
      return selectedTags.some(tag => docTags.includes(tag));
    });
  }

  // If no documents are found, show a message
  if (!Array.isArray(filteredDocuments) || filteredDocuments.length === 0) {
    docContainer.innerHTML = '<p style="text-align: center; font-size: 16px; color: #777; font-weight: 500;">📄 Không tìm thấy tài liệu phù hợp với bộ lọc tag.</p>';
    return;
  }

  // Render filtered documents
  filteredDocuments.forEach(doc => {
    const div = document.createElement('div');
    div.style = `
      font-family:'Poppins',sans-serif;
    padding:32px;
    width:100%; max-width:400px;
    display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:8px;
    line-height:1.2;
    background:rgba(255,255,255,0.2);
    backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
    border:1px solid transparent; border-radius:20px;
    border-image:linear-gradient(to right,#6a11cb,#2575fc) 1;
    box-shadow:0 8px 32px rgba(0,0,0,0.1);
    filter:drop-shadow(0 4px 8px rgba(0,0,0,0.05));
    transition:transform 0.4s ease, box-shadow 0.4s ease, filter 0.4s ease;
    will-change:transform, box-shadow;
    cursor:pointer;
    overflow:visible;
    backface-visibility:hidden;
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
      <h3 style="font-weight: 500; font-size: 16px; margin: 0;color: #007bff;">${doc.name || 'N/A'}</h3>
      <p style="font-size: 14px; color: #777; margin: 4px 0 0;">
        <strong> Link:</strong> ${doc.URL ? `<a href="${doc.URL}" target="_blank" style="color: #007bff; text-decoration: underline;">Xem tài liệu</a>` : 'N/A'}
      </p>
     <p style="font-size: 14px; color: #777; margin: 0;">
  <strong>Ngày tải lên:</strong> 
  ${
    doc['upload-date'] 
    ? (() => { 
        const [y, m, d] = doc['upload-date'].split('T')[0].split('-'); 
        return `${d}-${m}-${y}`; 
      })() 
    : 'N/A'
  }
</p>
      <p style="font-size: 14px; color: #555; margin: 0;">
        <strong> Học kỳ:</strong> ${doc.semester || 'Chưa cập nhật'}
      </p>
      <p style="font-size: 14px; color: #555; margin: 0;">
        <strong> Năm học:</strong> ${doc['academic-year'] || 'Chưa cập nhật'}
      </p>
      <p style="font-size: 14px; color: #555; margin: 0;">
        <strong> Tags:</strong> ${doc.tags ? doc.tags.join(', ') : 'Chưa cập nhật'}
      </p>
    `;
    docContainer.appendChild(div);
  });
}

