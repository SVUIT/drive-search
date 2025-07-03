let searchInput;
let cardContainer;
let documentContainer;

window.subjectsData = {};
window.documentsData = {};

async function performSearch() {
  const query = searchInput.value.trim();
  const type = getSelectedType();
  const selectedTags = getSelectedTags();

  try {
    if (type === 'subjects') {
      if (!query) {
        if (documentContainer) documentContainer.style.display = 'none';
        if (cardContainer) {
          cardContainer.style.display = 'flex';
          cardContainer.innerHTML = '';
        }
        const response = await fetch('/subjects');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const subjects = await response.json();
        if (cardContainer) {
          if (Array.isArray(subjects) && subjects.length > 0) {
            subjects.forEach(subject => {
              const card = document.createElement('div');
              card.className = 'card';
              card.style.cssText = `
                font-family:'Poppins',sans-serif;
                padding:32px;
                width:100%;max-width:400px;
                aspect-ratio:4/3;
                display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:8px;
                line-height:1;
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
          } else {
            cardContainer.innerHTML = "<p>Không tìm thấy kết quả.</p>";
          }
        }
        return;
      }

      if (documentContainer) documentContainer.style.display = 'none';
      if (cardContainer) {
        cardContainer.style.display = 'flex';
        cardContainer.innerHTML = '';
      }

      const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
const subjects = await response.json();

if (cardContainer) {
  cardContainer.style.display = 'flex';
  cardContainer.innerHTML = '';
  const seen = new Set();
  const uniqueSubjects = [];

  subjects.forEach(subject => {
    const key = (subject.code || subject.name || '').toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSubjects.push(subject);
    }
  });

  if (uniqueSubjects.length > 0) {
    uniqueSubjects.forEach(subject => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = `
        font-family:'Poppins',sans-serif;
        padding:32px;
        width:100%;max-width:400px;
        aspect-ratio:4/3;
        display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:8px;
        line-height:1;
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
  } else {
    cardContainer.innerHTML = "<p>Không tìm thấy kết quả.</p>";
  }
}
    } else if (type === 'documents') {
      if (cardContainer) cardContainer.style.display = 'none';
      if (documentContainer) {
        documentContainer.style.display = 'block';
        documentContainer.innerHTML = '';

        let url = '/documents/search';
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const documents = await response.json();
        renderDocumentSearchResults(documents);
      }
    }
  } catch (error) {
    console.error('Lỗi khi tìm kiếm:', error);
    if (cardContainer) cardContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm.</p>";
    if (documentContainer) documentContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>";
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const searchButton = document.getElementById('search-button');
  searchInput = document.getElementById('search-input');
  cardContainer = document.querySelector('.card-container');
  documentContainer = document.getElementById('document-result-container');

  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  fetchTags('documents');
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

$(document).ready(function() {
  $('#search-type').select2({ minimumResultsForSearch: Infinity, width: '200px' });
  $('#tag-filter').select2({ placeholder: 'Chọn tags', allowClear: true, width: '200px' });

  $('#search-type').on('change', function() {
    const selectedType = $(this).val();
    fetchTags(selectedType);
  });

  $('#search-button').on('click', function() {
    performSearch();
  });

  $('#search-input').on('keypress', function(e) {
    if (e.which === 13) {
      performSearch();
    }
  });
});

function getSelectedType() {
  const selectedType = document.querySelector('input[name="type"]:checked');
  return selectedType ? selectedType.value : 'subjects';
}

function getSelectedTags() {
  const tagsCheckboxes = document.querySelectorAll('#tags-container input[type="checkbox"]');
  return Array.from(tagsCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
}

async function fetchTags(type) {
  try {
    const response = await fetch('/documents/tags');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const tags = await response.json();

    const tagsContainer = document.getElementById('tags-container');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      tags.forEach(tag => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer';
        label.innerHTML = `
          <div class="relative w-4 h-4 flex items-center justify-center">
            <input type="checkbox" class="peer absolute opacity-0 w-full h-full cursor-pointer z-10" value="${tag}">
            <div class="w-4 h-4 border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary"></div>
            <div class="absolute text-white w-3 h-3 flex items-center justify-center opacity-0 peer-checked:opacity-100">
              <i class="ri-check-line ri-xs"></i>
            </div>
          </div>
          <span class="text-sm">${tag}</span>
        `;
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', updateSelectedTags);
        tagsContainer.appendChild(label);
      });
    }
  } catch (error) {
    console.error('Lỗi khi lấy tags:', error);
  }
}

function updateSelectedTags() {
  const tagsSelected = document.getElementById('tags-selected');
  const selectedTags = Array.from(document.querySelectorAll('#tags-container input[type="checkbox"]:checked')).map(cb => cb.value);

  if (tagsSelected) {
    if (selectedTags.length === 0) {
      tagsSelected.textContent = 'Chọn tags';
    } else if (selectedTags.length === 1) {
      tagsSelected.textContent = selectedTags[0];
    } else {
      tagsSelected.textContent = `${selectedTags.length} đã chọn`;
    }
  }
}

function getTypeBadgeClass(type) {
  const classes = {
    'pdf': 'bg-red-100 text-red-800',
    'doc': 'bg-blue-100 text-blue-800',
    'ppt': 'bg-orange-100 text-orange-800',
    'default': 'bg-gray-100 text-gray-800'
  };
  return classes[type] || classes.default;
}

function createDocumentTable(documents) {
  return `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên tài liệu</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${documents.map(doc => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${doc.name}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${getTypeBadgeClass(doc.type)}">${doc.type}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  ${doc.tags.map(tag => `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">${tag}</span>`).join('')}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${doc.URL ? `<a href="${doc.URL}" target="_blank" class="text-blue-600 hover:text-blue-900">Xem</a>` : 'Chưa có link'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function renderDocumentSearchResults(documents) {
  const docContainer = document.getElementById('document-result-container');
  if (docContainer) {
    docContainer.innerHTML = createDocumentTable(documents);
  }
}

async function viewSubjectDetails(subjectId) {
  try {
    const response = await fetch(`/documents?subjectId=${subjectId}`);
    const documents = await response.json();
    const container = $('#document-result-container');
    container.show();
    container.html(createDocumentTable(documents));
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error);
  }
}
