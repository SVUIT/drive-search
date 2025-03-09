// Dummy Data
const subjects = [
  { id: 1, name: "Mathematics", description: "Explore numbers, equations and problem solving techniques." },
  { id: 2, name: "Physics", description: "Understand the laws that govern our universe and practical applications." },
  { id: 3, name: "Chemistry", description: "Discover the properties of substances and chemical reactions." }
];

const documents = [
  { id: 1, subjectId: 1, title: "Algebra Basics", summary: "Introduction to algebraic concepts." },
  { id: 2, subjectId: 1, title: "Calculus Overview", summary: "Understanding limits, derivatives, and integrals." },
  { id: 3, subjectId: 2, title: "Newton's Laws", summary: "A detailed look at the laws of motion." },
  { id: 4, subjectId: 3, title: "Periodic Table Insights", summary: "Learn about chemical elements and periodicity." }
];

let currentSubjectId = null;

// Render Functions
function renderSubjects(list) {
  const container = document.querySelector('.card-container');
  container.innerHTML = "";
  list.forEach(subject => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `<h3>${subject.name}</h3><p>${subject.description.substring(0, 50)}...</p>`;
    card.addEventListener("click", () => openModal(subject));
    container.appendChild(card);
  });
}

function renderDocuments(list, container) {
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<p>No documents found.</p>";
    return;
  }
  list.forEach(doc => {
    const docDiv = document.createElement("div");
    docDiv.classList.add("document-card");
    docDiv.innerHTML = `<h4>${doc.title}</h4><p>${doc.summary}</p>`;
    container.appendChild(docDiv);
  });
}

// Modal Functions
function openModal(subject) {
  const modal = document.getElementById("detail-modal");
  const details = document.getElementById("subject-details");
  details.innerHTML = `<h2>${subject.name}</h2><p>${subject.description}</p>`;
  document.getElementById("documents-container").innerHTML = "";
  currentSubjectId = subject.id;
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("detail-modal").style.display = "none";
}

// Search Functionality
function performSearch() {
  const type = document.getElementById("search-type").value;
  const searchTerm = document.getElementById("search-input").value.trim().toLowerCase();

  if (type === "subjects") {
    // Display subjects results
    document.querySelector('.card-container').style.display = "flex";
    document.getElementById("document-result-container").style.display = "none";
    const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchTerm));
    renderSubjects(filteredSubjects);
  } else {
    // Display documents results
    document.querySelector('.card-container').style.display = "none";
    const docContainer = document.getElementById("document-result-container");
    docContainer.style.display = "block";
    const filteredDocuments = documents.filter(d => d.title.toLowerCase().includes(searchTerm));
    renderDocuments(filteredDocuments, docContainer);
  }
}

// Event Listeners
document.getElementById("search-button").addEventListener("click", performSearch);

document.getElementById("search-input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    performSearch();
  }
});

document.querySelector(".close-modal").addEventListener("click", closeModal);

document.getElementById("get-documents-btn").addEventListener("click", function() {
  if (currentSubjectId !== null) {
    const subjectDocs = documents.filter(d => d.subjectId === currentSubjectId);
    renderDocuments(subjectDocs, document.getElementById("documents-container"));
  }
});

// Optionally, load all subjects initially
renderSubjects(subjects);

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
    docContainer.innerHTML = '<p>Không tìm thấy tài liệu.</p>';
    return;
  }

  const box = document.createElement('div');
  box.className = 'document-box';
  docContainer.appendChild(box);

  documents.forEach(doc => {
    const div = document.createElement('div');
    div.className = 'document-card fade-in';
  
    // Thêm inline style
    div.style.border = '1px solid #ccc';
    div.style.padding = '15px';
    div.style.margin = '10px 0';
    div.style.borderRadius = '8px';
    div.style.backgroundColor = '#f9f9f9';
    div.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    div.style.transition = 'opacity 0.3s ease-in-out';
    div.style.opacity = '0';  // Để tạo hiệu ứng fade-in
  
    div.innerHTML = `
      <h3 style="margin-bottom: 5px; font-size: 18px;">${doc.name || 'N/A'}</h3>
      <p style="margin: 5px 0;"><strong>Link:</strong> ${doc.driveLink ? `<a href="${doc.driveLink}" target="_blank">Google Drive</a>` : 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>Ngày tải lên:</strong> ${doc['upload-date'] || 'N/A'}</p>
    `;
  
    box.appendChild(div);
    
    setTimeout(() => div.style.opacity = '1', 50);
  });
  
}