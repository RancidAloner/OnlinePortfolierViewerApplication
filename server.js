const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Remove query parameters for routing
    const cleanPath = pathname.split('?')[0];
    
    // Check if it's a portfolio directory request
    if (cleanPath.startsWith('/portfolio/')) {
        // Let the default file serving handle portfolio directories
        const filePath = path.join(__dirname, cleanPath);
        
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(404);
                res.end('Directory not found');
                return;
            }
            
            if (stats.isDirectory()) {
                // Serve directory listing for portfolio folders
                fs.readdir(filePath, (err, files) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error reading directory');
                        return;
                    }
                    
                    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Index of ${cleanPath}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        a { text-decoration: none; color: #0066cc; }
        a:hover { text-decoration: underline; }
        .file-list { list-style: none; padding: 0; }
        .file-list li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Index of ${cleanPath}</h1>
    <ul class="file-list">
        <li><a href="../">../</a></li>`;
                    
                    files.forEach(file => {
                        const fullPath = path.join(__dirname, cleanPath, file);
                        const stats = fs.statSync(fullPath);
                        const href = stats.isDirectory() ? `./${file}/` : `./${file}`;
                        html += `<li><a href="${href}">${file}</a></li>`;
                    });
                    
                    html += `</ul></body></html>`;
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(html);
                });
            } else {
                // Serve the file
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('File not found');
                        return;
                    }
                    
                    const ext = path.extname(filePath).toLowerCase();
                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                });
            }
        });
    } else if (path.extname(cleanPath) !== '') {
        // If it's a file request (has extension), serve the file
        const filePath = path.join(__dirname, cleanPath);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    } else {
        // For all other routes, serve index.html (SPA routing)
        const indexPath = path.join(__dirname, 'index.html');
        
        fs.readFile(indexPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Index file not found');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});
