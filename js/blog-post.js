/**
 * Individual Blog Post JavaScript
 * Handles rendering of individual blog posts with markdown support
 */

(function() {
    'use strict';

    /**
     * Load and render blog post
     */
    async function loadBlogPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        
        if (!slug) {
            displayError('Blog post not found.');
            return;
        }

        try {
            // Load all posts
            const response = await fetch('blog-posts/blog-data.json');
            if (!response.ok) throw new Error('Failed to load blog post');
            
            const posts = await response.json();
            const post = posts.find(p => p.slug === slug && p.published);
            
            if (!post) {
                displayError('Blog post not found.');
                return;
            }

            // Render the post
            renderBlogPost(post);
            
            // Load comments
            loadComments(post.id);
            
            // Update page metadata
            updatePageMetadata(post);
            
        } catch (error) {
            console.error('Error loading blog post:', error);
            displayError('Failed to load blog post. Please try again later.');
        }
    }

    /**
     * Render blog post content
     */
    function renderBlogPost(post) {
        const container = document.querySelector('.blog-post-content');
        if (!container) return;

        const date = new Date(post.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Update page title
        document.querySelector('.blog-post-title').textContent = post.title;
        
        // Update meta information
        const metaContainer = document.querySelector('.blog-post-meta');
        if (metaContainer) {
            metaContainer.innerHTML = `
                <div class="blog-post-meta__item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>${escapeHtml(post.author)}</span>
                </div>
                <div class="blog-post-meta__item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${date}</span>
                </div>
                <div class="blog-post-meta__item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${post.readingTime || 5} min read</span>
                </div>
            `;
        }

        // Render cover image
        if (post.coverImage) {
            const imageContainer = document.querySelector('.blog-post-image');
            if (imageContainer) {
                imageContainer.innerHTML = `
                    <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" loading="eager">
                `;
            }
        }

        // Render categories and tags
        const categoriesTags = document.querySelector('.blog-post-categories-tags');
        if (categoriesTags) {
            let html = '';
            if (post.categories && post.categories.length > 0) {
                html += '<div class="blog-post-categories">';
                html += '<span class="blog-post-label">Categories:</span>';
                post.categories.forEach(cat => {
                    html += `<a href="blog.html?category=${encodeURIComponent(cat)}" class="blog-post-category">${escapeHtml(cat)}</a>`;
                });
                html += '</div>';
            }
            if (post.tags && post.tags.length > 0) {
                html += '<div class="blog-post-tags">';
                html += '<span class="blog-post-label">Tags:</span>';
                post.tags.forEach(tag => {
                    html += `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="blog-post-tag">${escapeHtml(tag)}</a>`;
                });
                html += '</div>';
            }
            categoriesTags.innerHTML = html;
        }

        // Render content (with markdown-like formatting)
        const contentContainer = document.querySelector('.blog-post-body');
        if (contentContainer) {
            contentContainer.innerHTML = formatContent(post.content);
        }

        // Initialize syntax highlighting if code blocks exist
        if (contentContainer && contentContainer.querySelector('pre code')) {
            initializeSyntaxHighlighting();
        }
    }

    /**
     * Format content with markdown-like support
     */
    function formatContent(content) {
        if (!content) return '';

        let formatted = escapeHtml(content);

        // Headers
        formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Code blocks
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
            return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
        });

        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Links
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Lists
        formatted = formatted.replace(/^\- (.*$)/gim, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Paragraphs
        formatted = formatted.split('\n\n').map(para => {
            if (para.trim() && !para.match(/^<[h|u|o|p|d]/)) {
                return '<p>' + para.trim() + '</p>';
            }
            return para;
        }).join('');

        return formatted;
    }

    /**
     * Initialize syntax highlighting
     */
    function initializeSyntaxHighlighting() {
        // Load Prism.js for syntax highlighting if available
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        } else {
            // Fallback: Load Prism.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
            script.onload = function() {
                if (typeof Prism !== 'undefined') {
                    Prism.highlightAll();
                }
            };
            document.head.appendChild(script);

            // Load Prism CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
            document.head.appendChild(link);
        }
    }

    /**
     * Load comments for the post
     */
    function loadComments(postId) {
        // Load comments from localStorage (in a real app, this would be from a server)
        const comments = getCommentsFromStorage(postId);
        renderComments(comments, postId);
    }

    /**
     * Get comments from localStorage
     */
    function getCommentsFromStorage(postId) {
        try {
            const stored = localStorage.getItem(`blog_comments_${postId}`);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save comments to localStorage
     */
    function saveCommentsToStorage(postId, comments) {
        try {
            localStorage.setItem(`blog_comments_${postId}`, JSON.stringify(comments));
        } catch (e) {
            console.error('Failed to save comments:', e);
        }
    }

    /**
     * Render comments
     */
    function renderComments(comments, postId) {
        const container = document.querySelector('.blog-comments-list');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = '<p class="blog-comments-empty">No comments yet. Be the first to comment!</p>';
            return;
        }

        // Filter approved comments only
        const approvedComments = comments.filter(c => c.approved);

        if (approvedComments.length === 0) {
            container.innerHTML = '<p class="blog-comments-empty">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = approvedComments.map(comment => `
            <div class="blog-comment" id="comment-${comment.id}">
                <div class="blog-comment__header">
                    <strong class="blog-comment__author">${escapeHtml(comment.name)}</strong>
                    <time class="blog-comment__date" datetime="${comment.date}">${formatDate(comment.date)}</time>
                </div>
                <div class="blog-comment__body">
                    ${escapeHtml(comment.content).replace(/\n/g, '<br>')}
                </div>
            </div>
        `).join('');

        // Setup comment form
        setupCommentForm(postId);
    }

    /**
     * Setup comment form
     */
    function setupCommentForm(postId) {
        const form = document.querySelector('.blog-comment-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = this.querySelector('[name="name"]').value.trim();
            const email = this.querySelector('[name="email"]').value.trim();
            const content = this.querySelector('[name="content"]').value.trim();
            const website = this.querySelector('[name="website"]')?.value.trim() || '';

            // Basic validation
            if (!name || !content) {
                showCommentError('Please fill in all required fields.');
                return;
            }

            if (email && !isValidEmail(email)) {
                showCommentError('Please enter a valid email address.');
                return;
            }

            // Simple spam protection: check for common spam words
            if (containsSpam(content)) {
                showCommentError('Your comment contains inappropriate content.');
                return;
            }

            // Create comment object
            const comment = {
                id: Date.now(),
                postId: postId,
                name: name,
                email: email,
                website: website,
                content: content,
                date: new Date().toISOString(),
                approved: false // Requires moderation
            };

            // Save comment
            const comments = getCommentsFromStorage(postId);
            comments.push(comment);
            saveCommentsToStorage(postId, comments);

            // Show success message
            showCommentSuccess('Thank you for your comment! It will be reviewed before being published.');

            // Reset form
            this.reset();
        });
    }

    /**
     * Show comment error
     */
    function showCommentError(message) {
        const errorDiv = document.querySelector('.blog-comment-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Show comment success
     */
    function showCommentSuccess(message) {
        const successDiv = document.querySelector('.blog-comment-success');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Validate email
     */
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Basic spam detection
     */
    function containsSpam(text) {
        const spamWords = ['viagra', 'casino', 'poker', 'loan', 'debt', 'free money'];
        const lowerText = text.toLowerCase();
        return spamWords.some(word => lowerText.includes(word));
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Update page metadata for SEO
     */
    function updatePageMetadata(post) {
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', post.excerpt);
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', post.title);

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute('content', post.excerpt);

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && post.coverImage) ogImage.setAttribute('content', window.location.origin + '/' + post.coverImage);
    }

    /**
     * Display error message
     */
    function displayError(message) {
        const container = document.querySelector('.blog-post-content');
        if (container) {
            container.innerHTML = `<div class="blog-error-state"><p>${escapeHtml(message)}</p></div>`;
        }
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBlogPost);
    } else {
        loadBlogPost();
    }

})();
