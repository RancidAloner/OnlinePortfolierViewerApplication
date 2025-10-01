interface Artwork {
    id: string;
    title: string;
    year?: string;
    image: string;
    description?: string;
}
interface Category {
    name: string;
    displayName: string;
    artworks: Artwork[];
}
declare let portfolioData: Record<string, Category>;
declare class PortfolioApp {
    private currentCategory;
    private pageTitle;
    private artworkGrid;
    private navLinks;
    private navContainer;
    constructor();
    private initializePortfolio;
    private loadPortfolioData;
    private createDefaultCategories;
    private formatDisplayName;
    private generateNavigation;
    private initializeEventListeners;
    private initializeRouting;
    private handleInitialRoute;
    private handleRouteChange;
    private getCategoryFromPath;
    private navigateToPage;
    private loadCategory;
    private loadCategoryArtworks;
    private generateTitleFromFileName;
    private updateNavigation;
    private updatePageTitle;
    private loadArtworkGrid;
    private createArtworkElement;
    private loadHomePage;
    private loadAboutPage;
    private initializeHomeNavigationListeners;
    private generateHomeNavigation;
    private hideSidebar;
    private showSidebar;
}
//# sourceMappingURL=app.d.ts.map