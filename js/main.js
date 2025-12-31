/*
  Main JavaScript used across all pages

  - Implements a dark mode toggle by toggling the `dark` class on the `body`.
    The user's preference is saved in `localStorage` so that subsequent visits
    honour the chosen theme. The default value aligns with the browser's
    preference as recommended by Google for better user experience.
  - Exposes helper functions used by individual pages to load JSON data and
    render content dynamically. These functions are namespaced under
    `PortfolioLoader` to avoid polluting the global scope.
*/

(() => {
  /**
   * Initialise the theme toggle button.
   */
  function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    // Determine initial theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.body.classList.add('dark');
    }
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', currentTheme);
    });
  }

  /**
   * Fetch JSON data from the given path.
   * @param {string} path
   * @returns {Promise<any>}
   */
  function fetchJson(path) {
    return fetch(path).then((resp) => {
      if (!resp.ok) throw new Error('Failed to load ' + path);
      return resp.json();
    });
  }

  /**
   * Format a date string as `YYYY-MM-DD`.
   * @param {string} iso
   */
  function formatDate(iso) {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Render projects into the specified container.
   * The projects array must contain objects with at least `title`,
   * `description`, `date` and `link`. Optionally an image can be provided.
   * Projects are sorted in descending order by date and grouped by year.
   * @param {HTMLElement} container
   * @param {Array<Object>} projects
   */
  function renderProjects(container, projects) {
    // Sort by descending date
    projects.sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentYear = null;
    projects.forEach((proj) => {
      const year = new Date(proj.date).getFullYear();
      if (year !== currentYear) {
        currentYear = year;
        const yearHeading = document.createElement('h2');
        yearHeading.textContent = year;
        container.appendChild(yearHeading);
      }
      const item = document.createElement('div');
      item.className = 'project-item';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'project-date';
      dateSpan.textContent = formatDate(proj.date);
      const titleLink = document.createElement('a');
      titleLink.className = 'project-title';
      titleLink.href = proj.link || '#';
      titleLink.target = proj.link ? '_blank' : '_self';
      titleLink.rel = proj.link ? 'noopener noreferrer' : '';
      titleLink.textContent = proj.title;
      const desc = document.createElement('p');
      desc.textContent = proj.description;
      item.appendChild(dateSpan);
      item.appendChild(titleLink);
      item.appendChild(desc);
      container.appendChild(item);
    });
  }

  /**
   * Render skills into the specified container. Skills should be an array of
   * objects with `name`, `category` and optionally `level`. Skills are grouped
   * by category.
   * @param {HTMLElement} container
   * @param {Array<Object>} skills
   */
  function renderSkills(container, skills) {
    // Group by category
    const categories = {};
    skills.forEach((skill) => {
      if (!categories[skill.category]) categories[skill.category] = [];
      categories[skill.category].push(skill);
    });
    Object.keys(categories).forEach((cat) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'skill-category';
      const heading = document.createElement('h3');
      heading.textContent = cat;
      wrapper.appendChild(heading);
      const ul = document.createElement('ul');
      ul.className = 'skill-list';
      categories[cat].forEach((skill) => {
        const li = document.createElement('li');
        li.textContent = skill.name + (skill.level ? ` (${skill.level})` : '');
        ul.appendChild(li);
      });
      wrapper.appendChild(ul);
      container.appendChild(wrapper);
    });
  }

  /**
   * Render a gallery of photographs into the specified container. The photos
   * array must contain objects with `title`, `description`, `date` and
   * `image`. If no images exist the container will display a helpful
   * placeholder.
   * @param {HTMLElement} container
   * @param {Array<Object>} photos
   */
  function renderPhotos(container, photos) {
    if (!photos || photos.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No photographs uploaded yet.';
      container.appendChild(empty);
      return;
    }
    const gallery = document.createElement('div');
    gallery.className = 'gallery';
    photos.forEach((photo) => {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      img.src = photo.image;
      img.alt = photo.title;
      const caption = document.createElement('figcaption');
      caption.textContent = photo.title;
      figure.appendChild(img);
      figure.appendChild(caption);
      gallery.appendChild(figure);
    });
    container.appendChild(gallery);
  }

  /**
   * Render a list of books and movies into the specified container. Each
   * entry should have a `type` (Book or Movie), `title`, and optional
   * properties such as author/director, year and description. A heading is
   * inserted at the start for each category (Books and Movies).
   * @param {HTMLElement} container
   * @param {Array<Object>} items
   */
  function renderMedia(container, items) {
    if (!items || items.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No books or movies logged yet.';
      container.appendChild(empty);
      return;
    }
    const groups = { Book: [], Movie: [] };
    items.forEach((it) => {
      if (groups[it.type]) groups[it.type].push(it);
    });
    Object.keys(groups).forEach((type) => {
      if (groups[type].length === 0) return;
      const heading = document.createElement('h2');
      heading.textContent = type + 's';
      container.appendChild(heading);
      groups[type].forEach((media) => {
        const item = document.createElement('div');
        item.className = 'media-item';
        const title = document.createElement('h3');
        title.innerHTML = `<span class="type">${type}</span>${media.title}`;
        item.appendChild(title);
        const meta = document.createElement('p');
        const details = [];
        if (media.author) details.push('Author: ' + media.author);
        if (media.director) details.push('Director: ' + media.director);
        if (media.year) details.push('Year: ' + media.year);
        meta.textContent = details.join(' • ');
        item.appendChild(meta);
        if (media.description) {
          const desc = document.createElement('p');
          desc.textContent = media.description;
          item.appendChild(desc);
        }
        container.appendChild(item);
      });
    });
  }

  // Public API
  window.PortfolioLoader = {
    initTheme,
    fetchJson,
    renderProjects,
    renderSkills,
    renderPhotos,
    renderMedia,
    formatDate
  };

  // Initialise theme on every page load
  document.addEventListener('DOMContentLoaded', initTheme);
})();