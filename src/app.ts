// Artwork data structure
interface Artwork {
    id: string;
    title: string;
    year?: string;
    image: string;
    description?: string;
}

// Category data structure
interface Category {
    name: string;
    displayName: string;
    artworks: Artwork[];
}

// Portfolio data - will be populated dynamically
let portfolioData: Record<string, Category> = {};

// Application class
class PortfolioApp {
    private currentCategory: string = '';
    private pageTitle: HTMLElement;
    private artworkGrid: HTMLElement;
    private navLinks: NodeListOf<HTMLElement> = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
    private navContainer: HTMLElement;

    constructor() {
        this.pageTitle = document.getElementById('page-title') as HTMLElement;
        this.artworkGrid = document.getElementById('artwork-grid') as HTMLElement;
        this.navContainer = document.querySelector('.nav-links') as HTMLElement;
        
        this.initializePortfolio();
    }

    private async initializePortfolio(): Promise<void> {
        try {
            await this.loadPortfolioData();
        } catch (error) {
            console.error('Failed to load portfolio data, using defaults:', error);
            this.createDefaultCategories();
        }
        
        this.generateNavigation();
        this.initializeEventListeners();
        this.initializeRouting();
        
        // Load the appropriate page based on URL
        this.handleInitialRoute();
    }

    private async loadPortfolioData(): Promise<void> {
        try {
            // For GitHub Pages, we'll use a predefined list of categories
            // since we can't dynamically read directory listings
            const predefinedCategories = ['2d', '3d', 'fibers', 'sketchbook', 'curatorial'];
            
            console.log('Loading predefined categories for GitHub Pages:', predefinedCategories);

            // Create categories for each predefined folder
            predefinedCategories.forEach(folder => {
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

        } catch (error) {
            console.error('Error loading portfolio data:', error);
            // Fallback to default categories
            this.createDefaultCategories();
        }
    }

    private createDefaultCategories(): void {
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

    private formatDisplayName(name: string): string {
        // Convert folder names to display names
        const displayNames: Record<string, string> = {
            '2d': '2D',
            '3d': '3D',
            'fibers': 'Fibers',
            'sketchbook': 'Sketchbook',
            'curatorial': 'Curatorial'
        };
        
        return displayNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }

    private generateNavigation(): void {
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
        
        this.navLinks = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
        console.log('Navigation generated, found', this.navLinks.length, 'links');
    }

    private initializeEventListeners(): void {
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

    private initializeRouting(): void {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange();
        });
    }

    private handleInitialRoute(): void {
        // Check if we have a redirect from 404.html
        if (sessionStorage.redirect) {
            const redirectPath = sessionStorage.redirect;
            sessionStorage.removeItem('redirect');
            const category = this.getCategoryFromPath(redirectPath);
            this.navigateToPage(category, false);
            return;
        }
        
        const path = window.location.pathname;
        const category = this.getCategoryFromPath(path);
        this.navigateToPage(category, false); // Don't push to history for initial load
    }

    private handleRouteChange(): void {
        const path = window.location.pathname;
        const category = this.getCategoryFromPath(path);
        this.navigateToPage(category, false); // Don't push to history for popstate
    }

    private getCategoryFromPath(path: string): string {
        // Remove leading slash and get the category
        const cleanPath = path.replace(/^\//, '');
        
        // Handle GitHub Pages base path if needed
        const basePath = window.location.pathname.includes('/OnlinePortfolierViewerApplication/') 
            ? '/OnlinePortfolierViewerApplication/' 
            : '/';
        
        if (cleanPath === '' || cleanPath === 'home' || cleanPath === 'index.html') {
            return 'home';
        }
        
        // Remove base path if present
        const category = cleanPath.replace(basePath.replace(/^\//, ''), '');
        return category || 'home';
    }

    private navigateToPage(category: string, pushToHistory: boolean = true): void {
        if (pushToHistory) {
            const url = category === 'home' ? '/' : `/${category}`;
            window.history.pushState({ category }, '', url);
        }

        if (category === 'home') {
            this.loadHomePage();
        } else {
            this.loadCategory(category);
        }
    }

    private async loadCategory(categoryName: string): Promise<void> {
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
        } else {
            // Load artworks dynamically for this category
            await this.loadCategoryArtworks(categoryName);
        }
    }

    private async loadCategoryArtworks(categoryName: string): Promise<void> {
        try {
            // For GitHub Pages, we'll use predefined artwork lists
            // since we can't dynamically read directory listings
            const predefinedArtworks: Record<string, Artwork[]> = {
                '2d': [
                    { id: 'gun', title: 'Gun', image: '2d/GUN.png' }
                ],
                '3d': [
                    { id: 'sculpture', title: '3D Sculpture', image: '3d/IMG_8302.png' }
                ],
                'curatorial': [
                    { id: 'curatorial-work', title: 'Curatorial Work', image: 'curatorial/IMG_8305.png' }
                ],
                'test': [
                    { id: 'kingdom', title: 'Kingdom', image: 'test/KINGDOM.png' }
                ],
                'fibers': [],
                'sketchbook': []
            };
            
            const artworks = predefinedArtworks[categoryName] || [];
            console.log(`Loaded ${artworks.length} predefined artworks for category: ${categoryName}`);

            // Update portfolio data with artworks
            portfolioData[categoryName].artworks = artworks;
            this.loadArtworkGrid(artworks);

        } catch (error) {
            console.error(`Error loading artworks for ${categoryName}:`, error);
            // Clear cached artworks on error
            portfolioData[categoryName].artworks = [];
            this.loadArtworkGrid([]);
        }
    }

    private generateTitleFromFileName(fileName: string): string {
        // Remove extension and convert to title case
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        return nameWithoutExt
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    private updateNavigation(): void {
        this.navLinks.forEach(link => {
            const category = link.getAttribute('data-category');
            if (category === this.currentCategory || (category === 'home' && this.currentCategory === '')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    private updatePageTitle(title: string): void {
        this.pageTitle.textContent = title;
    }

    private loadArtworkGrid(artworks: Artwork[]): void {
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

    private createArtworkElement(artwork: Artwork): HTMLElement {
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

    private loadHomePage(): void {
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

    private loadAboutPage(): void {
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

    private initializeHomeNavigationListeners(): void {
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

    private generateHomeNavigation(): string {
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

    private hideSidebar(): void {
        const sidebar = document.querySelector('.sidebar') as HTMLElement;
        const mainContent = document.querySelector('.main-content') as HTMLElement;
        
        if (sidebar && mainContent) {
            sidebar.style.display = 'none';
            mainContent.style.marginLeft = '0';
            mainContent.style.maxWidth = '100vw';
        }
    }

    private showSidebar(): void {
        const sidebar = document.querySelector('.sidebar') as HTMLElement;
        const mainContent = document.querySelector('.main-content') as HTMLElement;
        
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

