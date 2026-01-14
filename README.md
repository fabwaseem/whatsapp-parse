# WhatsApp Chat Parser

A beautiful, privacy-focused web application to view and analyze your exported WhatsApp chats. All processing happens locally in your browser - your data never leaves your device.

🌐 **[Live Demo](https://whatsapp-parse.vercel.app)** | 📚 [Documentation](#features) | 🐛 [Report Bug](https://github.com/fabwaseem/whatsapp-parse/issues) | 💡 [Request Feature](https://github.com/fabwaseem/whatsapp-parse/issues)

## ✨ Features

### 🔒 Privacy First
- **100% client-side processing** - All data stays in your browser
- **No server uploads** - Your chats are never sent to any server
- **No tracking** - No analytics, no cookies, no data collection

### 📱 Chat Viewing
- **Beautiful UI** - Modern, clean interface with dark mode support
- **Text Messages** - View all your text conversations with proper formatting
- **Media Support** - View images, videos, and documents
- **Voice Notes** - Play voice messages with a custom audio player
- **Message Types** - Handles text, images, videos, audio, documents, system messages, and deleted messages

### 🔍 Search & Navigation
- **Search Messages** - Find messages by keywords with highlighted results
- **Find & Replace** - Search and replace text in messages
- **Navigation Controls** - Navigate through search results with next/previous buttons
- **Sticky Date Headers** - See the date of messages currently visible

### 🎛️ Filtering
- Filter by message type (text, media, voice notes, deleted, system messages)
- Hide media omitted messages
- Combine multiple filters for precise results

### 📤 Export Options
- **Multiple Formats** - Export to TXT, JSON, HTML, or PDF
- **Export with Media** - Include all media files (images, videos, voice notes, documents) in a ZIP file
- **Filtered Export** - Export only the messages visible after applying filters

### 🎨 User Experience
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Virtual Scrolling** - Efficiently handles large chat histories
- **Message Actions** - Copy, share, edit, and delete messages
- **Audio Playback** - Single audio playback with auto-play next feature

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm (or yarn/pnpm)
- A WhatsApp chat export (ZIP file)

### Installation

```bash
# Clone the repository
git clone https://github.com/fabwaseem/whatsapp-parse.git

# Navigate to the project directory
cd whatsapp-parse

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## 📖 How to Use

1. **Export Your WhatsApp Chat**
   - Open WhatsApp on your phone
   - Go to the chat you want to export
   - Tap the menu (⋮) → More → Export chat
   - Choose "Include Media" for the full experience
   - Save the ZIP file

2. **Upload the ZIP File**
   - Visit [whatsapp-parse.vercel.app](https://whatsapp-parse.vercel.app)
   - Drag and drop your ZIP file or click to browse
   - Wait for processing (all done in your browser!)

3. **Explore Your Chat**
   - Search for specific messages
   - Filter by message type
   - View media and play voice notes
   - Export in your preferred format

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Virtualization**: @tanstack/react-virtual
- **ZIP Processing**: JSZip
- **Icons**: Lucide React
- **Theme**: next-themes

## 📁 Project Structure

```
whatsapp-parse/
├── src/
│   ├── components/        # React components
│   │   ├── chat/         # Chat viewing components
│   │   ├── layout/       # Layout components
│   │   ├── upload/       # Upload components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   ├── export/       # Export functionality
│   │   └── parser/       # WhatsApp parser logic
│   ├── pages/            # Page components
│   ├── types/            # TypeScript type definitions
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── index.html            # HTML template
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Waseem Anjum**

- Website: [waseemanjum.com](https://waseemanjum.com)
- GitHub: [@fabwaseem](https://github.com/fabwaseem)
- Project: [whatsapp-parse.vercel.app](https://whatsapp-parse.vercel.app)

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons by [Lucide](https://lucide.dev/)
- Powered by [Vite](https://vitejs.dev/)

## 📊 Project Status

This project is actively maintained and open to contributions. If you find any bugs or have feature requests, please open an issue on GitHub.

---

Made with ❤️ by [Waseem Anjum](https://waseemanjum.com)
