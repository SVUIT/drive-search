document.getElementById("search-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const queryInput = document.getElementById("search-query");
  const query = queryInput.value.trim();
  const resultsContainer = document.getElementById("results");

  if (!query) {
      resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
      return;
  }

  resultsContainer.innerHTML = "<p>Searching...</p>";

  try {
      const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
          resultsContainer.innerHTML = "<p>Error fetching results.</p>";
          return;
      }

      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
          let html = `<div class="search-results">
                        <h3>Đã tìm thấy ${data.documents.length} kết quả:</h3>
                        <ul>`;
          data.documents.forEach((doc) => {
              html += `
                  <li class="result-item">
                      <h4>${doc.name || "Chưa có tên"}</h4>
                      <div class="subject-info">
                          <p><strong>Mã môn:</strong> ${doc.code || "Chưa cập nhật"}</p>
                          <p><strong>Số tín chỉ lý thuyết:</strong> ${doc.theoryCredits || "0"}</p>
                          <p><strong>Số tín chỉ thực hành:</strong> ${doc.practiceCredits || "0"}</p>
                          <p><strong>Tổng số tín chỉ:</strong> ${(doc.theoryCredits || 0) + (doc.practiceCredits || 0)}</p>
                          ${doc.url 
                              ? `<p><strong>Tài liệu:</strong> <a href="${doc.url}" target="_blank" rel="noopener noreferrer">Xem tài liệu</a></p>`
                              : '<p><strong>Tài liệu:</strong> Chưa có tài liệu</p>'
                          }
                      </div>
                  </li>`;
          });
          html += '</ul></div>';
          resultsContainer.innerHTML = html;
      } else {
          resultsContainer.innerHTML = `
              <div class="no-results">
                  <p>Không tìm thấy môn học nào phù hợp với từ khóa của bạn.</p>
                  <p>Vui lòng thử lại với từ khóa khác.</p>
              </div>`;
      }
  } catch (error) {
      console.error("Error during fetch:", error);
      resultsContainer.innerHTML = "<p>Error occurred: " + error.message + "</p>";
  }
});
