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
          let html = "<ul>";
          data.documents.forEach((doc) => {
              html += `
                  <li>
                      <strong>Name:</strong> ${doc.name || "N/A"} <br>
                      <strong>Credits:</strong> ${doc.credits || "N/A"} <br>
                      <strong>Subject Type:</strong> ${doc.subjectType || "N/A"} <br>
                      <strong>Google Drive Link:</strong> <a href="${doc.driveLink || "#"}" target="_blank">${doc.driveLink || "Not available"}</a>
                  </li>
                  <hr>
              `;
          });
          html += "</ul>";
          resultsContainer.innerHTML = html;
      } else {
          resultsContainer.innerHTML = "<p>No results found.</p>";
      }
  } catch (error) {
      console.error("Error during fetch:", error);
      resultsContainer.innerHTML = "<p>Error occurred: " + error.message + "</p>";
  }
});
