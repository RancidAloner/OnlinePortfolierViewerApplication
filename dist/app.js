"use strict";
// Portfolio data - will be populated dynamically
let portfolioData = {};
// Application class
class PortfolioApp {
    constructor() {
        this.currentCategory = '';
        this.navLinks = document.querySelectorAll('.nav-link');
        this.pageTitle = document.getElementById('page-title');
        this.artworkGrid = document.getElementById('artwork-grid');
        this.navContainer = document.querySelector('.nav-links');
        this.initializePortfolio();
    }
    async initializePortfolio() {
        try {
            await this.loadPortfolioData();
        }
        catch (error) {
            console.error('Failed to load portfolio data, using defaults:', error);
            this.createDefaultCategories();
        }
        this.generateNavigation();
        this.initializeEventListeners();
        this.initializeRouting();
        // Load the appropriate page based on URL
        this.handleInitialRoute();
    }
    async loadPortfolioData() {
        try {
            // Fetch the portfolio folder structure with cache busting
            const response = await fetch(`/portfolio/?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error('Could not fetch portfolio data');
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            // Extract folder names from the directory listing
            const folders = [];
            console.log(`Processing ${links.length} links for portfolio folders`);
            links.forEach(link => {
                const href = link.getAttribute('href');
                console.log(`Found portfolio link: ${href}`);
                if (href && href !== '../' && href !== '..') {
                    // Remove query parameters and check if it's a folder
                    const cleanHref = href.split('?')[0];
                    if (cleanHref.endsWith('/')) {
                        // Remove ./ prefix and trailing slash
                        const folderName = cleanHref.replace(/^\.\//, '').replace(/\/$/, '');
                        console.log(`Processing folder: ${folderName}`);
                        if (folderName && folderName !== 'README.md' && folderName !== '..') {
                            console.log(`Adding folder: ${folderName}`);
                            folders.push(folderName);
                        }
                        else {
                            console.log(`Skipping folder: ${folderName}`);
                        }
                    }
                    else {
                        console.log(`Skipping non-folder link: ${href}`);
                    }
                }
                else {
                    console.log(`Skipping non-folder link: ${href}`);
                }
            });
            console.log('Found folders:', folders);
            // Create categories for each folder
            folders.forEach(folder => {
                const displayName = this.formatDisplayName(folder);
                portfolioData[folder] = {
                    name: folder,
                    displayName: displayName,
                    artworks: [] // Will be populated when category is loaded
                };
            });
            // Always add About page
            portfolioData['about'] = {
                name: 'about',
                displayName: 'About',
                artworks: []
            };
            console.log('Portfolio data loaded:', portfolioData);
        }
        catch (error) {
            console.error('Error loading portfolio data:', error);
            // Fallback to default categories
            this.createDefaultCategories();
        }
    }
    createDefaultCategories() {
        const defaultCategories = ['2d', '3d', 'fibers', 'sketchbook', 'curatorial'];
        defaultCategories.forEach(category => {
            portfolioData[category] = {
                name: category,
                displayName: this.formatDisplayName(category),
                artworks: []
            };
        });
        portfolioData['about'] = {
            name: 'about',
            displayName: 'About',
            artworks: []
        };
    }
    formatDisplayName(name) {
        // Convert folder names to display names
        const displayNames = {
            '2d': '2D',
            '3d': '3D',
            'fibers': 'Fibers',
            'sketchbook': 'Sketchbook',
            'curatorial': 'Curatorial'
        };
        return displayNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }
    generateNavigation() {
        console.log('Generating navigation for:', portfolioData);
        this.navContainer.innerHTML = '';
        // Add Home link first
        const homeLi = document.createElement('li');
        const homeA = document.createElement('a');
        homeA.href = '#';
        homeA.setAttribute('data-category', 'home');
        homeA.className = 'nav-link';
        homeA.textContent = 'Home';
        homeLi.appendChild(homeA);
        this.navContainer.appendChild(homeLi);
        // Add other categories
        Object.values(portfolioData).forEach(category => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.setAttribute('data-category', category.name);
            a.className = 'nav-link';
            a.textContent = category.displayName;
            li.appendChild(a);
            this.navContainer.appendChild(li);
        });
        this.navLinks = document.querySelectorAll('.nav-link');
        console.log('Navigation generated, found', this.navLinks.length, 'links');
    }
    initializeEventListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.getAttribute('data-category');
                if (category) {
                    this.navigateToPage(category);
                }
            });
        });
    }
    initializeRouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange();
        });
    }
    handleInitialRoute() {
        const path = window.location.pathname;
        const category = this.getCategoryFromPath(path);
        this.navigateToPage(category, false); // Don't push to history for initial load
    }
    handleRouteChange() {
        const path = window.location.pathname;
        const category = this.getCategoryFromPath(path);
        this.navigateToPage(category, false); // Don't push to history for popstate
    }
    getCategoryFromPath(path) {
        // Remove leading slash and get the category
        const cleanPath = path.replace(/^\//, '');
        if (cleanPath === '' || cleanPath === 'home') {
            return 'home';
        }
        return cleanPath;
    }
    navigateToPage(category, pushToHistory = true) {
        if (pushToHistory) {
            const url = category === 'home' ? '/' : `/${category}`;
            window.history.pushState({ category }, '', url);
        }
        if (category === 'home') {
            this.loadHomePage();
        }
        else {
            this.loadCategory(category);
        }
    }
    async loadCategory(categoryName) {
        const category = portfolioData[categoryName];
        if (!category) {
            console.error(`Category ${categoryName} not found`);
            return;
        }
        this.currentCategory = categoryName;
        this.updateNavigation();
        this.updatePageTitle(category.displayName);
        // Show sidebar for all categories except home
        this.showSidebar();
        if (categoryName === 'about') {
            this.loadAboutPage();
        }
        else {
            // Load artworks dynamically for this category
            await this.loadCategoryArtworks(categoryName);
        }
    }
    async loadCategoryArtworks(categoryName) {
        try {
            // Always fetch fresh directory listing to get current files
            const response = await fetch(`/portfolio/${categoryName}/?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`Could not fetch ${categoryName} artworks`);
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            const artworks = [];
            console.log(`Processing ${links.length} links for category: ${categoryName}`);
            links.forEach(link => {
                const href = link.getAttribute('href');
                console.log(`Found link: ${href}`);
                if (href && href !== '../' && href !== '..') {
                    // Remove query parameters
                    const cleanHref = href.split('?')[0];
                    if (!cleanHref.endsWith('/')) {
                        // Remove ./ prefix from filename
                        const fileName = cleanHref.replace(/^\.\//, '');
                        const fileExtension = fileName.split('.').pop()?.toLowerCase();
                        console.log(`Processing file: ${fileName}, extension: ${fileExtension}`);
                        // Only include image files
                        if (fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                            const title = this.generateTitleFromFileName(fileName);
                            console.log(`Adding artwork: ${title} (${fileName})`);
                            artworks.push({
                                id: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
                                title: title,
                                image: `${categoryName}/${fileName}`
                            });
                        }
                        else {
                            console.log(`Skipping non-image file: ${fileName}`);
                        }
                    }
                    else {
                        console.log(`Skipping folder link: ${href}`);
                    }
                }
                else {
                    console.log(`Skipping link: ${href}`);
                }
            });
            console.log(`Total artworks found: ${artworks.length}`);
            // Clear any cached artworks and update with fresh data
            portfolioData[categoryName].artworks = [];
            portfolioData[categoryName].artworks = artworks;
            this.loadArtworkGrid(artworks);
        }
        catch (error) {
            console.error(`Error loading artworks for ${categoryName}:`, error);
            // Clear cached artworks on error
            portfolioData[categoryName].artworks = [];
            this.loadArtworkGrid([]);
        }
    }
    generateTitleFromFileName(fileName) {
        // Remove extension and convert to title case
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        return nameWithoutExt
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    updateNavigation() {
        this.navLinks.forEach(link => {
            const category = link.getAttribute('data-category');
            if (category === this.currentCategory || (category === 'home' && this.currentCategory === '')) {
                link.classList.add('active');
            }
            else {
                link.classList.remove('active');
            }
        });
    }
    updatePageTitle(title) {
        this.pageTitle.textContent = title;
    }
    loadArtworkGrid(artworks) {
        this.artworkGrid.innerHTML = '';
        if (artworks.length === 0) {
            this.artworkGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No artwork available in this category.</p>';
            return;
        }
        artworks.forEach(artwork => {
            const artworkElement = this.createArtworkElement(artwork);
            this.artworkGrid.appendChild(artworkElement);
        });
    }
    createArtworkElement(artwork) {
        const artworkDiv = document.createElement('div');
        artworkDiv.className = 'artwork-item';
        const img = document.createElement('img');
        img.className = 'artwork-image';
        img.src = `portfolio/${artwork.image}`;
        img.alt = artwork.title;
        img.onerror = () => {
            // Fallback for missing images
            img.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'artwork-image';
            placeholder.style.backgroundColor = '#f0f0f0';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.color = '#999';
            placeholder.textContent = 'Image not available';
            artworkDiv.insertBefore(placeholder, img);
        };
        const titleDiv = document.createElement('div');
        titleDiv.className = 'artwork-title';
        titleDiv.textContent = artwork.title;
        const yearDiv = document.createElement('div');
        yearDiv.className = 'artwork-year';
        yearDiv.textContent = artwork.year || '';
        artworkDiv.appendChild(img);
        artworkDiv.appendChild(titleDiv);
        if (artwork.year) {
            artworkDiv.appendChild(yearDiv);
        }
        return artworkDiv;
    }
    loadHomePage() {
        // Hide sidebar and adjust main content
        this.hideSidebar();
        // Update navigation state
        this.currentCategory = '';
        this.updateNavigation();
        this.updatePageTitle('Ferris Halemeh');
        this.artworkGrid.innerHTML = `
            <div class="home-page">
                <div class="home-content">
                    <nav class="home-navigation">
                        ${this.generateHomeNavigation()}
                    </nav>
                </div>
            </div>
        `;
        // Add event listeners for home navigation links
        this.initializeHomeNavigationListeners();
    }
    loadAboutPage() {
        // Show sidebar and adjust main content
        this.showSidebar();
        this.artworkGrid.innerHTML = `
            <div class="about-content">
                <p>Welcome to my art portfolio. I am Ferris Halemeh, an artist working across multiple mediums including 2D works, 3D sculptures, fiber arts, and sketchbook explorations.</p>
                <p>My work explores themes of identity, memory, and the intersection of digital and physical spaces. Through various mediums, I seek to create connections between different forms of expression and experience.</p>
                <p>Please explore the different categories to view my work across these various disciplines.</p>
            </div>
        `;
    }
    initializeHomeNavigationListeners() {
        const homeNavLinks = document.querySelectorAll('.home-nav-link');
        homeNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.getAttribute('data-category');
                if (category) {
                    this.navigateToPage(category);
                }
            });
        });
    }
    generateHomeNavigation() {
        const categoryLinks = Object.values(portfolioData)
            .filter(category => category.name !== 'about')
            .map(category => `
                <a href="#" class="home-nav-link" data-category="${category.name}">
                    ${category.displayName}
                </a>
            `).join('');
        const aboutLink = `
            <a href="#" class="home-nav-link" data-category="about">
                About
            </a>
        `;
        return categoryLinks + aboutLink;
    }
    hideSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar && mainContent) {
            sidebar.style.display = 'none';
            mainContent.style.marginLeft = '0';
            mainContent.style.maxWidth = '100vw';
        }
    }
    showSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar && mainContent) {
            sidebar.style.display = 'block';
            mainContent.style.marginLeft = '250px';
            mainContent.style.maxWidth = 'calc(100vw - 250px)';
        }
    }
}
// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PortfolioApp...');
    new PortfolioApp();
});
//# sourceMappingURL=app.js.map