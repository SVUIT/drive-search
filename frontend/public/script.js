window.subjectsData = {};
window.documentsData = {};

document.addEventListener('DOMContentLoaded', function() {
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const typeRadios = document.querySelectorAll('input[name="type"]');
  const tagsCheckboxes = document.querySelectorAll('#tags-container input[type="checkbox"]');

  function getSelectedType() {
    const selectedType = document.querySelector('input[name="type"]:checked');
    return selectedType ? selectedType.value : 'subjects';
  }

  function getSelectedTags() {
    return Array.from(tagsCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
  }

  async function performSearch() {
    const query = searchInput.value.trim();
    const type = getSelectedType();
    const tags = getSelectedTags();

    if (type === 'subjects') {
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
      } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        cardContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm.</p>";
      }
    } else if (type === 'documents') {
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
  }

  // Thêm sự kiện click cho nút tìm kiếm
  searchButton.addEventListener('click', performSearch);

  // Thêm sự kiện Enter cho ô input
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
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

// Khởi tạo Select2 cho các dropdown
$(document).ready(function() {
  // Khởi tạo select2 cho search-type
  $('#search-type').select2({
    minimumResultsForSearch: Infinity,
    width: '200px'
  });

  // Khởi tạo select2 cho tag-filter
  $('#tag-filter').select2({
    placeholder: 'Chọn tags',
    allowClear: true,
    width: '200px'
  });

  // Xử lý sự kiện khi thay đổi loại tìm kiếm
  $('#search-type').on('change', function() {
    const selectedType = $(this).val();
    fetchTags(selectedType);
  });

  // Xử lý sự kiện tìm kiếm
  $('#search-button').on('click', function() {
    performSearch();
  });

  // Xử lý sự kiện khi nhấn Enter trong ô tìm kiếm
  $('#search-input').on('keypress', function(e) {
    if (e.which === 13) {
      performSearch();
    }
  });
});

// Hàm fetch tags từ server
async function fetchTags(type) {
  try {
    const response = await fetch('/documents/tags');
    const tags = await response.json();
    
    // Xóa tags cũ
    $('#tag-filter').empty();
    
    // Thêm tags mới
    tags.forEach(tag => {
      const option = new Option(tag, tag);
      $('#tag-filter').append(option);
    });
    
    // Cập nhật Select2
    $('#tag-filter').trigger('change');
  } catch (error) {
    console.error('Lỗi khi lấy tags:', error);
  }
}

// Hàm thực hiện tìm kiếm
async function performSearch() {
  const searchType = $('#search-type').val();
  const searchQuery = $('#search-input').val();
  const selectedTags = $('#tag-filter').val();

  try {
    let response;
    if (searchType === 'subjects') {
      response = await fetch(`/search?query=${encodeURIComponent(searchQuery)}`);
    } else {
      response = await fetch(`/documents/search?query=${encodeURIComponent(searchQuery)}`);
    }

    const results = await response.json();
    displayResults(results, searchType);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm:', error);
  }
}

// Hàm hiển thị kết quả
function displayResults(results, type) {
  const container = type === 'subjects' ? $('.card-container') : $('#document-result-container');
  
  // Xóa kết quả cũ
  container.empty();
  
  if (type === 'subjects') {
    // Hiển thị kết quả môn học
    results.forEach(subject => {
      const card = createSubjectCard(subject);
      container.append(card);
    });
  } else {
    // Hiển thị kết quả tài liệu
    const table = createDocumentTable(results);
    container.append(table);
  }
}

// Hàm tạo card môn học
function createSubjectCard(subject) {
  return `
    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <i class="fas fa-book text-blue-600"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-800">${subject.name}</h3>
      </div>
      <p class="text-gray-600 mb-4">${subject.description}</p>
      <div class="flex flex-wrap gap-2">
        ${subject.tags.map(tag => `
          <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            ${tag}
          </span>
        `).join('')}
      </div>
      <button onclick="viewSubjectDetails('${subject.id}')" 
              class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Xem chi tiết
      </button>
    </div>
  `;
}

// Hàm tạo bảng tài liệu
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
                <span class="px-2 py-1 text-xs rounded-full ${getTypeBadgeClass(doc.type)}">
                  ${doc.type}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  ${doc.tags.map(tag => `
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      ${tag}
                    </span>
                  `).join('')}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="viewDocument('${doc.id}')" 
                        class="text-blue-600 hover:text-blue-900">
                  Xem
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Hàm lấy class cho badge loại tài liệu
function getTypeBadgeClass(type) {
  const classes = {
    'pdf': 'bg-red-100 text-red-800',
    'doc': 'bg-blue-100 text-blue-800',
    'ppt': 'bg-orange-100 text-orange-800',
    'default': 'bg-gray-100 text-gray-800'
  };
  return classes[type] || classes.default;
}

// Hàm xem chi tiết môn học
async function viewSubjectDetails(subjectId) {
  try {
    const response = await fetch(`/documents?subjectId=${subjectId}`);
    const documents = await response.json();
    
    // Hiển thị danh sách tài liệu của môn học
    const container = $('#document-result-container');
    container.show();
    container.html(createDocumentTable(documents));
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error);
  }
}

// Hàm xem tài liệu
function viewDocument(documentId) {
  // Implement logic to view document
  console.log('Viewing document:', documentId);
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
    line-height:1.3;
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