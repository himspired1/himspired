# Himspired - Fashion E-commerce Website

## Overview

Himspired is a premium fashion e-commerce platform that bridges the gap between thrift and luxury fashion. The brand offers a curated collection of clothing items across four main categories: Thrifts, Luxury, Vintage, and Modern. With a sleek, modern design and smooth user experience, Himspired aims to redefine style by making premium fashion accessible to everyone.

## Features

- **Interactive Product Carousel**: Smooth, animated carousel showcasing different product categories
- **Responsive Design**: Fully responsive layout that adapts to all device sizes
- **Animated UI Elements**: Subtle animations and transitions for an engaging user experience
- **Category Navigation**: Easy navigation between different product categories
- **Loader Animation**: Branded loading animation for a polished first impression
- **Newsletter Subscription**: Email subscription functionality with validation
- **About Us Section**: Brand story and team showcase
- **Contact Form**: User-friendly contact form for inquiries

## Technologies Used

- **Next.js 14**: React framework with App Router for server-side rendering and routing
- **TypeScript**: Type-safe JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: Animation library for smooth transitions and effects
- **Embla Carousel**: Lightweight carousel component
- **Lucide React**: Modern icon set
- **Geist Fonts**: Typography from Vercel's design system
- **Shadcn UI**: Reusable UI components

## Project Structure

\`\`\`
src/
├── app/                  # Next.js App Router
│   ├── _Home/            # Home page components
│   ├── about/            # About page
│   ├── cart/             # Shopping cart
│   ├── contact/          # Contact page
│   ├── shop/             # Shop page
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── common/           # Common UI elements
│   ├── layout/           # Layout components
│   ├── pages/            # Page-specific components
│   ├── product/          # Product-related components
│   └── ui/               # UI components from shadcn
├── constants/            # Constants and configuration
├── data/                 # Data files
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── redux/                # State management
\`\`\`

### Key Components

- **Products.tsx**: Main product carousel with category navigation
- **ProductSection.tsx**: Reusable component for displaying products in a grid
- **Loader.tsx**: Loading animation with brand name reveal
- **Newsletter.tsx**: Newsletter subscription component
- **Navbar.tsx**: Navigation bar with responsive design
- **Footer.tsx**: Site footer with links and social media

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/himspired.git
   cd himspired
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Home Page

The home page features a product carousel showcasing different categories. Users can:
- Navigate between categories using the dots or arrow buttons
- View products in a responsive grid layout
- Hover over products for subtle animations
- Add products to cart

### Shop Page

The shop page allows users to browse all products with filtering options:
- Filter by category (All, Thrift, Luxury, Senators)
- View product details
- Add products to cart

### About Page

Learn about the Himspired brand story, vision, and team members.

### Contact Page

Get in touch with the Himspired team through the contact form.

## Design Features

### Animations

- Smooth transitions between product categories
- Subtle hover effects on product cards
- Loading animation with brand name reveal
- Fade-in animations for section titles

### Responsive Design

- Mobile-first approach with breakpoints for different device sizes
- Adaptive product grid that shows 1-4 items based on screen width
- Collapsible navigation menu on mobile devices

## Future Enhancements

- User authentication and account management
- Product filtering and search functionality
- Wishlist feature
- Product detail pages
- Shopping cart functionality
- Checkout process
- Order tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Design inspiration from modern fashion e-commerce platforms
- Icons from Lucide React
- UI components from shadcn/ui
