/**
 * Dark Mode Toggle Functionality
 * Provides smooth dark mode switching with localStorage persistence
 */

(function() {
    'use strict';

    const darkModeToggle = {
        storageKey: 'darkMode',
        isDark: false,
        toggleButton: null,

        /**
         * Initialize dark mode
         */
        init: function() {
            // Check for saved preference or default to light mode
            const savedPreference = localStorage.getItem(this.storageKey);
            this.isDark = savedPreference === 'true' || 
                         (savedPreference === null && window.matchMedia('(prefers-color-scheme: dark)').matches);

            // Apply dark mode
            this.applyDarkMode();

            // Create toggle button
            this.createToggleButton();

            // Listen for system preference changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem(this.storageKey)) {
                    this.isDark = e.matches;
                    this.applyDarkMode();
                }
            });
        },

        /**
         * Apply dark mode to the document
         */
        applyDarkMode: function() {
            if (this.isDark) {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
            
            // Update toggle button state
            if (this.toggleButton) {
                this.updateToggleButton();
            }
        },

        /**
         * Toggle dark mode
         */
        toggle: function() {
            this.isDark = !this.isDark;
            localStorage.setItem(this.storageKey, this.isDark.toString());
            this.applyDarkMode();
            
            // Add animation class for smooth transition
            document.body.classList.add('dark-mode-transitioning');
            setTimeout(() => {
                document.body.classList.remove('dark-mode-transitioning');
            }, 300);
        },

        /**
         * Create dark mode toggle button
         */
        createToggleButton: function() {
            // Check if button already exists
            if (document.querySelector('.dark-mode-toggle')) {
                this.toggleButton = document.querySelector('.dark-mode-toggle');
                this.updateToggleButton();
                return;
            }

            // Create button
            const button = document.createElement('button');
            button.className = 'dark-mode-toggle';
            button.setAttribute('aria-label', 'Toggle dark mode');
            button.setAttribute('title', 'Toggle dark mode');
            button.innerHTML = this.getToggleIcon();

            // Add click handler
            button.addEventListener('click', () => {
                this.toggle();
            });

            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggle();
                }
            });

            // Insert button into header
            const header = document.querySelector('.s-header__block');
            if (header) {
                header.appendChild(button);
            } else {
                // Fallback: add to body
                document.body.insertBefore(button, document.body.firstChild);
            }

            this.toggleButton = button;
        },

        /**
         * Update toggle button icon and state
         */
        updateToggleButton: function() {
            if (!this.toggleButton) return;
            
            this.toggleButton.innerHTML = this.getToggleIcon();
            this.toggleButton.setAttribute('aria-pressed', this.isDark.toString());
        },

        /**
         * Get toggle icon based on current mode
         */
        getToggleIcon: function() {
            if (this.isDark) {
                // Sun icon for light mode (when dark mode is active)
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                `;
            } else {
                // Moon icon for dark mode
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                `;
            }
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => darkModeToggle.init());
    } else {
        darkModeToggle.init();
    }

    // Expose toggle function globally for manual control if needed
    window.darkModeToggle = darkModeToggle;

})();
