# Portfolio Images

This directory contains your artwork images organized by category. The application will automatically detect folders and create navigation sections for each one.

## Dynamic Folder Structure

The application automatically creates navigation sections based on the folders in this directory. For example:
- `2d/` - Creates a "2D" section
- `3d/` - Creates a "3D" section  
- `fibers/` - Creates a "Fibers" section
- `sketchbook/` - Creates a "Sketchbook" section
- `curatorial/` - Creates a "Curatorial" section
- `photography/` - Creates a "Photography" section (if you add this folder)

## Adding Your Artwork

1. **Create category folders** - Add new folders for different types of artwork
2. **Add images** - Place your artwork images directly in the appropriate category folder
3. **Use descriptive filenames** - The application will automatically generate titles from filenames
   - `living-room.jpg` becomes "Living Room"
   - `abstract-painting-2023.png` becomes "Abstract Painting 2023"
4. **Supported formats** - JPG, JPEG, PNG, GIF, WebP
5. **Recommended size** - 800x600px or similar aspect ratio

## How It Works

- The application scans this directory for folders
- Each folder becomes a navigation section
- Images in each folder are automatically displayed
- Titles are generated from filenames (spaces and capitalization added)
- No manual configuration needed!

## Image Optimization

For best performance, consider:
- Compressing images for web use
- Using WebP format when possible
- Keeping file sizes under 500KB per image
- Using consistent aspect ratios for a clean grid layout

