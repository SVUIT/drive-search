window.subjectsData = {};
window.documentsData = {};

document.getElementById('search-button').addEventListener('click', async (e) => {
  e.preventDefault();
  await searchDocuments();
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
        <strong> Link:</strong> ${doc.URL ? `<a href="${doc.URL}" target="_blank" style="color: #007bff; text-decoration: underline;"> Xem tài liệu</a>` : 'N/A'}
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
        <strong> Tags:</strong> ${doc.tags || 'Chưa cập nhật'}
      </p>
    `;

    docContainer.appendChild(div);
  });
}

async function fetchTags() {
  try {
    const res = await fetch(`/documents/search?query=`);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    const allTags = data.map(doc => doc.tags || []).flat();
    const uniqueTags = [...new Set(allTags)];

    const tagSelect = document.getElementById('tag-filter');
    if (!tagSelect) return;

    // Xóa hết option cũ, thêm lại option All
    tagSelect.innerHTML = '<option value="all" selected>All</option>';

    uniqueTags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      tagSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error fetching tags:', err);
  }
}

async function searchDocuments() {
  const query = document.getElementById('search-input')?.value?.trim() || '';
  const tagSelect = document.getElementById('tag-filter');
  const checkedTags = Array.from(tagSelect.selectedOptions).map(opt => opt.value).filter(v => v !== 'all');

  const params = new URLSearchParams();
  params.append('query', query);
  checkedTags.forEach(tag => params.append('tag', tag));

  try {
    const res = await fetch(`/documents/search?${params.toString()}`);
    const data = await res.json();
    displayResults(data);
  } catch (err) {
    console.error('Error searching documents:', err);
  }
}

function displayResults(data) {
  const container = document.querySelector('.card-container');
  if (!container) return;
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<p>Không tìm thấy kết quả nào.</p>';
    return;
  }
  container.innerHTML = data.map(doc => `
    <div class="result-item">
      <h3>${doc.name}</h3>
      <p>${doc.description || ''}</p>
      <a href="${doc.url}" target="_blank">Xem chi tiết</a>
    </div>
  `).join('');
}

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

const selectedTags = $('#tag-filter').val(); // Mảng các tag đã chọn
