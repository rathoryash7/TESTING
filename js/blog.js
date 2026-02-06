/**
 * Blog System JavaScript
 * Handles blog listing, pagination, search, filtering, and individual post rendering
 */

(function() {
    'use strict';

    // Blog configuration
    const blogConfig = {
        postsPerPage: 6,
        currentPage: 1,
        allPosts: [],
        filteredPosts: [],
        currentCategory: 'all',
        currentTag: 'all',
        searchQuery: ''
    };

    /**
     * Load blog posts from JSON file
     */
    async function loadBlogPosts() {
        try {
            const response = await fetch('blog-posts/blog-data.json');
            if (!response.ok) throw new Error('Failed to load blog posts');
            
            blogConfig.allPosts = await response.json();
            blogConfig.filteredPosts = [...blogConfig.allPosts];
            
            // Initialize blog listing
            initializeBlogListing();
        } catch (error) {
            console.error('Error loading blog posts:', error);
            displayError('Failed to load blog posts. Please try again later.');
        }
    }

    /**
     * Initialize blog listing page
     */
    function initializeBlogListing() {
        const blogListing = document.querySelector('.blog-listing');
        if (!blogListing) return;

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        blogConfig.currentPage = parseInt(urlParams.get('page')) || 1;
        blogConfig.currentCategory = urlParams.get('category') || 'all';
        blogConfig.currentTag = urlParams.get('tag') || 'all';
        blogConfig.searchQuery = urlParams.get('search') || '';

        // Apply filters
        applyFilters();

        // Render blog posts
        renderBlogPosts();

        // Render pagination
        renderPagination();

        // Setup event listeners
        setupEventListeners();

        // Extract and display categories/tags
        extractCategoriesAndTags();
    }

    /**
     * Apply filters (category, tag, search)
     */
    function applyFilters() {
        let filtered = [...blogConfig.allPosts];

        // Filter by published status
        filtered = filtered.filter(post => post.published);

        // Filter by category
        if (blogConfig.currentCategory !== 'all') {
            filtered = filtered.filter(post => 
                post.categories && post.categories.includes(blogConfig.currentCategory)
            );
        }

        // Filter by tag
        if (blogConfig.currentTag !== 'all') {
            filtered = filtered.filter(post => 
                post.tags && post.tags.includes(blogConfig.currentTag)
            );
        }

        // Filter by search query
        if (blogConfig.searchQuery) {
            const query = blogConfig.searchQuery.toLowerCase();
            filtered = filtered.filter(post => 
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                (post.content && post.content.toLowerCase().includes(query)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        blogConfig.filteredPosts = filtered;
    }

    /**
     * Render blog posts
     */
    function renderBlogPosts() {
        const container = document.querySelector('.blog-posts-container');
        if (!container) return;

        // Calculate pagination
        const startIndex = (blogConfig.currentPage - 1) * blogConfig.postsPerPage;
        const endIndex = startIndex + blogConfig.postsPerPage;
        const postsToShow = blogConfig.filteredPosts.slice(startIndex, endIndex);

        if (postsToShow.length === 0) {
            container.innerHTML = '<div class="blog-empty-state"><p>No blog posts found. Try adjusting your filters or search query.</p></div>';
            return;
        }

        container.innerHTML = postsToShow.map(post => createBlogPostCard(post)).join('');

        // Update results count
        updateResultsCount();
    }

    /**
     * Create blog post card HTML
     */
    function createBlogPostCard(post) {
        const date = new Date(post.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const categories = post.categories ? post.categories.map(cat => 
            `<a href="?category=${encodeURIComponent(cat)}" class="blog-card__cat-link">${escapeHtml(cat)}</a>`
        ).join('') : '';

        const tags = post.tags ? post.tags.map(tag => 
            `<span class="blog-card__tag">${escapeHtml(tag)}</span>`
        ).join('') : '';

        return `
            <article class="grid-list-items__item blog-card" data-post-id="${post.id}">
                <div class="blog-card__header">
                    ${categories ? `<div class="blog-card__cat-links">${categories}</div>` : ''}
                    <h3 class="blog-card__title">
                        <a href="blog-post.html?slug=${post.slug}">${escapeHtml(post.title)}</a>
                    </h3>
                    <div class="blog-card__meta">
                        <span class="blog-card__date">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${date}
                        </span>
                        <span class="blog-card__reading-time">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${post.readingTime || 5} min read
                        </span>
                    </div>
                </div>
                ${post.coverImage ? `
                    <div class="blog-card__image">
                        <a href="blog-post.html?slug=${post.slug}">
                            <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" loading="lazy">
                        </a>
                    </div>
                ` : ''}
                <div class="blog-card__text">
                    <p>${escapeHtml(post.excerpt)}</p>
                    <a href="blog-post.html?slug=${post.slug}" class="blog-card__read-more">Read More →</a>
                </div>
                ${tags ? `<div class="blog-card__tags">${tags}</div>` : ''}
            </article>
        `;
    }

    /**
     * Render pagination
     */
    function renderPagination() {
        const container = document.querySelector('.blog-pagination');
        if (!container) return;

        const totalPages = Math.ceil(blogConfig.filteredPosts.length / blogConfig.postsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav class="pgn" aria-label="Blog pagination"><ul>';

        // Previous button
        if (blogConfig.currentPage > 1) {
            paginationHTML += `
                <li>
                    <a class="pgn__prev" href="?${buildQueryString({ page: blogConfig.currentPage - 1 })}" aria-label="Previous page">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path d="M12.707 17.293L8.414 13H18v-2H8.414l4.293-4.293-1.414-1.414L4.586 12l6.707 6.707z"/>
                        </svg>
                    </a>
                </li>
            `;
        }

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, blogConfig.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            paginationHTML += `<li><a class="pgn__num" href="?${buildQueryString({ page: 1 })}">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li><span class="pgn__num dots">…</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === blogConfig.currentPage) {
                paginationHTML += `<li><span class="pgn__num current" aria-current="page">${i}</span></li>`;
            } else {
                paginationHTML += `<li><a class="pgn__num" href="?${buildQueryString({ page: i })}">${i}</a></li>`;
            }
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li><span class="pgn__num dots">…</span></li>`;
            }
            paginationHTML += `<li><a class="pgn__num" href="?${buildQueryString({ page: totalPages })}">${totalPages}</a></li>`;
        }

        // Next button
        if (blogConfig.currentPage < totalPages) {
            paginationHTML += `
                <li>
                    <a class="pgn__next" href="?${buildQueryString({ page: blogConfig.currentPage + 1 })}" aria-label="Next page">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path d="M11.293 17.293l1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586z"/>
                        </svg>
                    </a>
                </li>
            `;
        }

        paginationHTML += '</ul></nav>';
        container.innerHTML = paginationHTML;
    }

    /**
     * Build query string from current filters
     */
    function buildQueryString(overrides = {}) {
        const params = new URLSearchParams();
        
        if (overrides.page || blogConfig.currentPage > 1) {
            params.set('page', overrides.page || blogConfig.currentPage);
        }
        if (overrides.category || blogConfig.currentCategory !== 'all') {
            params.set('category', overrides.category || blogConfig.currentCategory);
        }
        if (overrides.tag || blogConfig.currentTag !== 'all') {
            params.set('tag', overrides.tag || blogConfig.currentTag);
        }
        if (overrides.search || blogConfig.searchQuery) {
            params.set('search', overrides.search || blogConfig.searchQuery);
        }
        
        return params.toString();
    }

    /**
     * Extract categories and tags for filter display
     */
    function extractCategoriesAndTags() {
        const categories = new Set();
        const tags = new Set();

        blogConfig.allPosts.forEach(post => {
            if (post.categories) {
                post.categories.forEach(cat => categories.add(cat));
            }
            if (post.tags) {
                post.tags.forEach(tag => tags.add(tag));
            }
        });

        // Render category filter
        const categoryFilter = document.querySelector('.blog-category-filter');
        if (categoryFilter) {
            let html = '<select class="blog-filter-select" aria-label="Filter by category">';
            html += '<option value="all"' + (blogConfig.currentCategory === 'all' ? ' selected' : '') + '>All Categories</option>';
            Array.from(categories).sort().forEach(cat => {
                html += `<option value="${escapeHtml(cat)}"${blogConfig.currentCategory === cat ? ' selected' : ''}>${escapeHtml(cat)}</option>`;
            });
            html += '</select>';
            categoryFilter.innerHTML = html;
        }

        // Render tag filter
        const tagFilter = document.querySelector('.blog-tag-filter');
        if (tagFilter) {
            let html = '<div class="blog-tag-list">';
            html += '<a href="?" class="blog-tag' + (blogConfig.currentTag === 'all' ? ' active' : '') + '">All Tags</a>';
            Array.from(tags).sort().forEach(tag => {
                html += `<a href="?tag=${encodeURIComponent(tag)}" class="blog-tag${blogConfig.currentTag === tag ? ' active' : ''}">${escapeHtml(tag)}</a>`;
            });
            html += '</div>';
            tagFilter.innerHTML = html;
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Category filter change
        const categorySelect = document.querySelector('.blog-filter-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', function(e) {
                window.location.href = `?category=${encodeURIComponent(e.target.value)}`;
            });
        }

        // Search form
        const searchForm = document.querySelector('.blog-search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const searchInput = this.querySelector('input[type="search"]');
                if (searchInput && searchInput.value.trim()) {
                    window.location.href = `?search=${encodeURIComponent(searchInput.value.trim())}`;
                } else {
                    window.location.href = '?';
                }
            });
        }

        // Clear filters button
        const clearFilters = document.querySelector('.blog-clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '?';
            });
        }
    }

    /**
     * Update results count display
     */
    function updateResultsCount() {
        const countElement = document.querySelector('.blog-results-count');
        if (countElement) {
            const total = blogConfig.filteredPosts.length;
            const start = (blogConfig.currentPage - 1) * blogConfig.postsPerPage + 1;
            const end = Math.min(start + blogConfig.postsPerPage - 1, total);
            
            countElement.textContent = `Showing ${start}-${end} of ${total} posts`;
        }
    }

    /**
     * Display error message
     */
    function displayError(message) {
        const container = document.querySelector('.blog-posts-container');
        if (container) {
            container.innerHTML = `<div class="blog-error-state"><p>${escapeHtml(message)}</p></div>`;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    } else {
        loadBlogPosts();
    }

})();
