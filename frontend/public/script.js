window.subjectsData = {};
window.documentsData = {};

document.getElementById('search-button').addEventListener('click', async () => {
  const query = document.getElementById('search-input').value.trim();
  const searchType = document.getElementById('search-type').value;
  const selectedTag = document.getElementById('tag-filter').value;

  if (!query) {
    alert('Vui lòng nhập từ khóa tìm kiếm.');
    return;
  }

  if (searchType === 'subjects') {
    document.getElementById('document-result-container').style.display = 'none';
    const cardContainer = document.querySelector('.card-container');
    cardContainer.style.display = 'flex';

    try {
      const response = await fetch(`/search?query=${encodeURIComponent(query)}&tag=${encodeURIComponent(selectedTag)}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const subjects = await response.json();

      cardContainer.innerHTML = '';
      window.subjectsData = {};

      if (Array.isArray(subjects) && subjects.length > 0) {
        subjects.forEach(subject => {
          window.subjectsData[subject.$id] = subject;
          const card = document.createElement('div');
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
            card.addEventListener('mouseenter',()=>{
            card.style.transform='translateY(-8px) scale(1.02)';
            card.style.boxShadow='0 16px 48px rgba(0,0,0,0.15)';
            card.style.filter='drop-shadow(0 8px 16px rgba(0,0,0,0.1))';
            });
            card.addEventListener('mouseleave',()=>{
          card.style.transform='';
          card.style.boxShadow='';
          card.style.filter='';
          });

          card.className = 'card';
          card.innerHTML = `
            <h3 style="white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    width: 100%;
    min-width: 0;
    ">${subject.name || 'Môn chưa xác định'}</h3>
            <p><strong>Mã môn:</strong> ${subject.code || 'Chưa cập nhật'}</p>
            <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || '0'}</p>
            <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || '0'}</p>
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
      const response = await fetch(`/documents/search?query=${encodeURIComponent(query)}&tag=${encodeURIComponent(selectedTag)}`);
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





async function fetchTags(event) {
  if (event) event.preventDefault();
  
  const query = document.getElementById('search-input')?.value?.trim() || '';
  const tagSelect = document.getElementById('tag-filter');
  if (!tagSelect) return;

  const selectedTagsBeforeFetch = [...tagSelect.selectedOptions].map(opt => opt.value);

  try {
    const res = await fetch(`/documents/search?query=${encodeURIComponent(query)}&tag=${encodeURIComponent(selectedTagsBeforeFetch.join(','))}`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn('Data is not array:', data);
      return;
    }

    const allTags = data.map(doc => doc.tags || []).flat();
    const uniqueTags = [...new Set(allTags)];

    tagSelect.innerHTML = '<option value="all">All</option>';
    
    uniqueTags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      tagSelect.appendChild(opt);
    });

    // Sau khi load xong, set lại nhiều tag đã chọn
    [...tagSelect.options].forEach(opt => {
      if (selectedTagsBeforeFetch.includes(opt.value)) {
        opt.selected = true;
      }
    });

    // Nếu dùng select2 hoặc thư viện nào đó, nhớ trigger update
    $('#tag-filter').trigger('change');

  } catch (err) {
    console.error('Error fetching tags:', err);
  }
}


window.addEventListener('DOMContentLoaded', fetchTags(Event));

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

const selectedTags = ($('#tag-filter').val() || []).filter(tag => tag !== 'all');

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
      font-family: 'Poppins', sans-serif;
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
      <h3 style="font-weight: 500; font-size: 16px; margin: 0;color: #007bff;">${doc.name || 'N/A'}</h3>
      <p style="font-size: 14px; color: #777; margin: 4px 0 0;">
        <strong> Link:</strong> ${doc.URL ? `<a href="${doc.URL}" target="_blank" style="color: #007bff; text-decoration: underline;">Xem tài liệu</a>` : 'N/A'}
      </p>
      <p style="font-size: 14px; color: #777; margin: 0;">
        <strong> Ngày tải lên:</strong> ${doc['upload-date'] ? doc['upload-date'].split('T')[0] : 'N/A'}
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

