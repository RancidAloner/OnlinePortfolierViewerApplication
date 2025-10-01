// Import portfolio data
import { portfolioCategories, getDisplayName, scanCategoryArtworks, categoryArtworks } from './portfolio-data.js';
// Portfolio data - will be populated dynamically
let portfolioData = {};
// Image prefetching utility
class ImagePrefetcher {
    constructor() {
        this.prefetchedImages = new Set();
        this.prefetchPromises = new Map();
        this.totalImages = 0;
        this.loadedImages = 0;
        this.calculateTotalImages();
    }
    calculateTotalImages() {
        // Count all images across all categories
        Object.values(categoryArtworks).forEach(artworks => {
            this.totalImages += artworks.length;
        });
    }
    async prefetchAllImages() {
        console.log(`Starting to prefetch ${this.totalImages} images...`);
        const prefetchPromises = [];
        // Prefetch all images from all categories
        Object.values(categoryArtworks).forEach(artworks => {
            artworks.forEach(artwork => {
                const imagePath = `portfolio/${artwork.image}`;
                if (!this.prefetchedImages.has(imagePath)) {
                    prefetchPromises.push(this.prefetchImage(imagePath));
                }
            });
        });
        // Wait for all images to be prefetched
        try {
            await Promise.all(prefetchPromises);
            console.log(`Successfully prefetched ${this.loadedImages} images`);
        }
        catch (error) {
            console.warn('Some images failed to prefetch:', error);
        }
    }
    async prefetchImage(imagePath) {
        if (this.prefetchedImages.has(imagePath) || this.prefetchPromises.has(imagePath)) {
            return;
        }
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.prefetchedImages.add(imagePath);
                this.loadedImages++;
                console.log(`Prefetched image ${this.loadedImages}/${this.totalImages}: ${imagePath}`);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to prefetch image: ${imagePath}`);
                resolve(); // Don't reject, just continue with other images
            };
            img.src = imagePath;
        });
        this.prefetchPromises.set(imagePath, promise);
        return promise;
    }
    isImagePrefetched(imagePath) {
        return this.prefetchedImages.has(imagePath);
    }
    getProgress() {
        return {
            loaded: this.loadedImages,
            total: this.totalImages,
            percentage: this.totalImages > 0 ? Math.round((this.loadedImages / this.totalImages) * 100) : 0
        };
    }
}
// Application class
class PortfolioApp {
    constructor() {
        this.currentCategory = '';
        this.navLinks = document.querySelectorAll('.nav-link');
        this.pageTitle = document.getElementById('page-title');
        this.artworkGrid = document.getElementById('artwork-grid');
        this.navContainer = document.querySelector('.nav-links');
        this.imagePrefetcher = new ImagePrefetcher();
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
        // Start prefetching images in the background
        this.startImagePrefetching();
        // Load the appropriate page based on URL
        this.handleInitialRoute();
    }
    async loadPortfolioData() {
        try {
            console.log('Loading dynamic categories:', portfolioCategories);
            // Create categories for each folder found in portfolio directory
            portfolioCategories.forEach(folder => {
                const displayName = getDisplayName(folder);
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
        // Fallback to hardcoded categories if dynamic loading fails
        const defaultCategories = ['fiber art', 'garments', 'graphics', 'illustration'];
        defaultCategories.forEach(category => {
            portfolioData[category] = {
                name: category,
                displayName: getDisplayName(category),
                artworks: []
            };
        });
        portfolioData['about'] = {
            name: 'about',
            displayName: 'About',
            artworks: []
        };
    }
    startImagePrefetching() {
        // Show a subtle progress indicator
        this.showPrefetchProgress();
        // Start prefetching images in the background without blocking the UI
        this.imagePrefetcher.prefetchAllImages().then(() => {
            console.log('All images have been prefetched successfully');
            this.hidePrefetchProgress();
        }).catch(error => {
            console.warn('Image prefetching encountered errors:', error);
            this.hidePrefetchProgress();
        });
    }
    showPrefetchProgress() {
        // Create a subtle progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.id = 'prefetch-progress';
        progressContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: rgba(0, 0, 0, 0.1);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            width: 0%;
            transition: width 0.3s ease;
        `;
        progressContainer.appendChild(progressBar);
        document.body.appendChild(progressContainer);
        // Fade in the progress bar
        setTimeout(() => {
            progressContainer.style.opacity = '1';
        }, 100);
        // Update progress periodically
        const updateProgress = () => {
            const progress = this.imagePrefetcher.getProgress();
            progressBar.style.width = `${progress.percentage}%`;
            if (progress.percentage < 100) {
                setTimeout(updateProgress, 200);
            }
        };
        setTimeout(updateProgress, 200);
    }
    hidePrefetchProgress() {
        const progressContainer = document.getElementById('prefetch-progress');
        if (progressContainer) {
            progressContainer.style.opacity = '0';
            setTimeout(() => {
                if (progressContainer.parentNode) {
                    progressContainer.parentNode.removeChild(progressContainer);
                }
            }, 300);
        }
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
        // Handle hash changes for GitHub Pages compatibility
        window.addEventListener('hashchange', (event) => {
            this.handleRouteChange();
        });
    }
    handleInitialRoute() {
        // Check if we have a redirect from 404.html
        if (sessionStorage.redirect) {
            const redirectPath = sessionStorage.redirect;
            sessionStorage.removeItem('redirect');
            const category = this.getCategoryFromPath(redirectPath);
            this.navigateToPage(category, false);
            return;
        }
        // Use hash-based routing for GitHub Pages
        const category = this.getCategoryFromPath('');
        this.navigateToPage(category, false); // Don't push to history for initial load
    }
    handleRouteChange() {
        // Use hash-based routing for GitHub Pages
        const category = this.getCategoryFromPath('');
        this.navigateToPage(category, false); // Don't push to history for popstate
    }
    getCategoryFromPath(path) {
        // Handle hash-based routing for GitHub Pages
        const hash = window.location.hash.replace('#', '');
        if (hash === '' || hash === 'home') {
            return 'home';
        }
        return hash || 'home';
    }
    navigateToPage(category, pushToHistory = true) {
        if (pushToHistory) {
            // Use hash-based routing for GitHub Pages compatibility
            const url = category === 'home' ? '#' : `#${category}`;
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
            // Use the dynamic scanning function to get artworks
            const artworks = scanCategoryArtworks(categoryName);
            console.log(`Loaded ${artworks.length} artworks for category: ${categoryName}`);
            // Update portfolio data with artworks
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
        // Check if image is already prefetched
        const imagePath = `portfolio/${artwork.image}`;
        if (this.imagePrefetcher.isImagePrefetched(imagePath)) {
            // Image is already cached, it should load instantly
            img.style.opacity = '1';
        }
        else {
            // Image might not be prefetched yet, add loading effect
            img.style.opacity = '0.7';
            img.style.transition = 'opacity 0.3s ease';
            img.onload = () => {
                img.style.opacity = '1';
            };
        }
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
        this.updatePageTitle('');
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
        const nameItem = `
            <div class="home-name">
                Ferris Halemeh
            </div>
        `;
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
        return nameItem + categoryLinks + aboutLink;
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