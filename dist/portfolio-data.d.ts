export interface Artwork {
    id: string;
    title: string;
    year?: string;
    image: string;
    description?: string;
}
export interface Category {
    name: string;
    displayName: string;
    artworks: Artwork[];
}
export declare const portfolioCategories: string[];
export declare const displayNameMap: Record<string, string>;
export declare const categoryArtworks: Record<string, Artwork[]>;
export declare function getDisplayName(categoryName: string): string;
export declare function generateTitleFromFileName(fileName: string): string;
export declare function scanCategoryArtworks(categoryName: string): Artwork[];
//# sourceMappingURL=portfolio-data.d.ts.map