let searchInput;
let documentContainer;

window.subjectsData = {};

document.addEventListener('DOMContentLoaded', () => {
  searchInput = document.getElementById('search-input');
  documentContainer = document.getElementById('document-result-container');

  const searchButton = document.getElementById('search-button');
  if (searchButton) searchButton.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') performSearch();
    });
  }
});

function getSelectedTags() {
  const tagsCheckboxes = document.querySelectorAll('#tags-container input[type="checkbox"]');
  return Array.from(tagsCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
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

async function performSearch() {
  const query = searchInput?.value.trim();
  const selectedSubject = document.getElementById('subject-selected')?.dataset.id;
  const selectedTags = getSelectedTags();

  try {
    if (!documentContainer) return;

    documentContainer.style.display = 'block';
    documentContainer.innerHTML = '';

    let url = '/documents/search';
    const params = new URLSearchParams();

    if (query) params.append('query', query);
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
    if (!query && selectedSubject) params.append('documents', selectedSubject);

    if (params.toString()) url += '?' + params.toString();
    const response = await fetch(url);
    const documents = await response.json();

    renderDocumentSearchResults(documents);
  } catch (error) {
    documentContainer.innerHTML = '<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>';
  }
}

function renderDocumentSearchResults(documents) {
  if (documentContainer) {
    documentContainer.innerHTML = createDocumentTable(documents);
    updateTagsDropdownFromDocuments(documents); // <-- Add this line
  }
}

// Add this function to update tags dropdown based on displayed documents
function updateTagsDropdownFromDocuments(documents) {
  const tagsContainer = document.getElementById('tags-container');
  const tagsSelected = document.getElementById('tags-selected');
  if (!tagsContainer) return;

  // Collect unique tags from displayed documents
  const tagSet = new Set();
  documents.forEach(doc => {
    (doc.tags || []).forEach(tag => tagSet.add(tag));
  });
  const tags = Array.from(tagSet);

  tagsContainer.innerHTML = '';
  tags.forEach(tag => {
    const label = document.createElement('label');
    label.className = "flex items-center gap-2 cursor-pointer";
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
    label.querySelector('input').addEventListener("change", () => {
      const selected = Array.from(tagsContainer.querySelectorAll('input:checked')).map(cb => cb.value);
      tagsSelected.textContent = selected.length === 0 ? "Chọn tags" : selected.length === 1 ? selected[0] : `${selected.length} đã chọn`;
    });
    tagsContainer.appendChild(label);
  });
}