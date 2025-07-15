let searchInput;
let cardContainer;
let documentContainer;
let currentType = 'subjects';

window.subjectsData = {};
window.documentsData = {};

async function performSearch() {
  const query = searchInput.value.trim();
  const selectedSubject = getSelectedSubject();
  const selectedTags = getSelectedTags();

  try {
    if (currentType === 'subjects') {
      if (documentContainer) documentContainer.style.display = 'none';
      if (cardContainer) {
        cardContainer.style.display = 'flex';
        cardContainer.innerHTML = '';
      }

      const response = await fetch('/subjects');
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

    } else if (currentType === 'documents') {
      if (cardContainer) cardContainer.style.display = 'none';
      if (documentContainer) {
        documentContainer.style.display = 'block';
        documentContainer.innerHTML = '';

        let url = '/documents/search';
        const params = new URLSearchParams();

        const selected = window.subjectsData[selectedSubject];
        if (query) params.append('query', query);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
        if (!query && selected && selected.code) params.append('documents', selected.code);

        if (params.toString()) url += '?' + params.toString();
        const response = await fetch(url);
        const documents = await response.json();

        renderDocumentSearchResults(documents);
      }
    }
  } catch (error) {
    if (cardContainer) cardContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm.</p>";
    if (documentContainer) documentContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>";
  }
}

function getSelectedSubject() {
  const selected = document.querySelector('input[name="subject-radio"]:checked');
  return selected ? selected.value : '';
}

function getSelectedTags() {
  const tagsCheckboxes = document.querySelectorAll('#tags-container input[type="checkbox"]');
  return Array.from(tagsCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
}

async function fetchTagsBySubject(subjectId) {
  const tagsSelected = document.getElementById('tags-selected');
  const tagsContainer = document.getElementById('tags-container');
  if (!tagsSelected || !tagsContainer) return;
  tagsSelected.textContent = 'Chọn tags';
  tagsContainer.innerHTML = '';

  const subject = window.subjectsData[subjectId];
  if (!subject || !subject.code) return;

  try {
    const response = await fetch(`/documents/search?documents=${subject.code}`);
    const documents = await response.json();
    const tagSet = new Set();
    documents.forEach(doc => (doc.tags || []).forEach(tag => tagSet.add(tag)));

    Array.from(tagSet).forEach(tag => {
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

    document.getElementById('tags-section').style.display = 'block';
  } catch (error) {}
}

function updateSelectedTags() {
  const tagsSelected = document.getElementById('tags-selected');
  const selectedTags = getSelectedTags();
  if (!tagsSelected) return;
  tagsSelected.textContent = selectedTags.length === 0 ? 'Chọn tags' :
    selectedTags.length === 1 ? selectedTags[0] : `${selectedTags.length} đã chọn`;
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

document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  searchInput = document.getElementById('search-input');
  cardContainer = document.querySelector('.card-container');
  documentContainer = document.getElementById('document-result-container');

  document.getElementById('btn-subjects').addEventListener('click', () => {
    currentType = 'subjects';
    document.getElementById('subjects-section').style.display = 'none';
    document.getElementById('tags-section').style.display = 'none';
    document.getElementById('document-result-container').style.display = 'none';
    document.querySelector('.card-container').style.display = 'flex';
    performSearch();
  });

  document.getElementById('btn-documents').addEventListener('click', () => {
    currentType = 'documents';
    document.getElementById('subjects-section').style.display = 'block';
    document.querySelector('.card-container').style.display = 'none';
    document.getElementById('document-result-container').style.display = 'block';
    document.getElementById('tags-section').style.display = 'none';
    fetchSubjectOptions();
  });

  if (searchButton) searchButton.addEventListener('click', performSearch);
  if (searchInput) searchInput.addEventListener('keypress', e => e.key === 'Enter' && performSearch());
});

async function fetchSubjectOptions() {
  const container = document.getElementById('subjects-container');
  if (!container) return;
  container.innerHTML = '';
  try {
    const res = await fetch('/subjects');
    const subjects = await res.json();
    window.subjectsData = {};
    subjects.forEach(s => {
      window.subjectsData[s.$id] = s;
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 cursor-pointer';
      label.innerHTML = `
        <div class="relative w-4 h-4 flex items-center justify-center">
          <input type="radio" name="subject-radio" class="peer absolute opacity-0 w-full h-full cursor-pointer z-10" value="${s.$id}">
          <div class="w-4 h-4 border border-gray-300 rounded-full peer-checked:bg-primary peer-checked:border-primary"></div>
          <div class="absolute text-white w-3 h-3 flex items-center justify-center opacity-0 peer-checked:opacity-100">
            <i class="ri-check-line ri-xs"></i>
          </div>
        </div>
        <span class="text-sm">${s.name}</span>
      `;
      const input = label.querySelector('input');
      input.addEventListener('change', () => fetchTagsBySubject(input.value));
      container.appendChild(label);
    });
  } catch (err) {}
}
