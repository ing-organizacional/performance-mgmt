#!/bin/bash

# Docker setup script for Performance Management System
# This script helps set up the Docker environment for single or multi-company deployment

set -e

echo "🐳 Performance Management System - Docker Setup"
echo "=============================================="

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo "✅ Created directory: $1"
    else
        echo "📁 Directory already exists: $1"
    fi
}

# Function to generate random secret
generate_secret() {
    openssl rand -base64 32 2>/dev/null || echo "please-change-this-secret-$(date +%s)"
}

# Parse command line arguments
SETUP_TYPE=${1:-single}

case $SETUP_TYPE in
    "single")
        echo "🏢 Setting up SINGLE COMPANY deployment..."
        
        # Create data directory
        create_dir "./data"
        
        # Generate environment file if it doesn't exist
        if [ ! -f ".env.production" ]; then
            echo "🔑 Generating production environment file..."
            cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=file:./data/production.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(generate_secret)
EOF
            echo "✅ Created .env.production"
            echo "⚠️  Please update NEXTAUTH_URL and NEXTAUTH_SECRET for your domain!"
        fi
        
        echo "🚀 Starting single company deployment..."
        docker-compose up -d performance-mgmt
        ;;
        
    "multi")
        echo "🏢 Setting up MULTI-COMPANY deployment..."
        
        # Create data directories for each company
        create_dir "./data/company1"
        create_dir "./data/company2"
        
        # Generate company-specific environment files
        for i in 1 2; do
            if [ ! -f ".env.company$i" ]; then
                echo "🔑 Generating environment file for company $i..."
                cat > .env.company$i << EOF
NODE_ENV=production
DATABASE_URL=file:./data/company$i.db
NEXTAUTH_URL=http://localhost:300$i
NEXTAUTH_SECRET=$(generate_secret)
COMPANY_ID=company-$i
EOF
                echo "✅ Created .env.company$i"
            fi
        done
        
        echo "🚀 Starting multi-company deployment..."
        docker-compose --profile multi-company up -d
        ;;
        
    "build")
        echo "🔨 Building Docker image..."
        docker-compose build
        echo "✅ Build complete!"
        ;;
        
    "stop")
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ All services stopped"
        ;;
        
    "logs")
        echo "📋 Showing logs..."
        docker-compose logs -f
        ;;
        
    "reset")
        echo "⚠️  RESETTING all data - this will DELETE all databases!"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        if [ "$confirm" = "yes" ]; then
            docker-compose down
            rm -rf ./data
            echo "✅ Reset complete"
        else
            echo "❌ Reset cancelled"
        fi
        ;;
        
    *)
        echo "❌ Unknown setup type: $SETUP_TYPE"
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  single    Setup single company deployment (default)"
        echo "  multi     Setup multi-company deployment"
        echo "  build     Build Docker image"
        echo "  stop      Stop all services"
        echo "  logs      Show service logs"
        echo "  reset     Reset all data (dangerous!)"
        echo ""
        echo "Examples:"
        echo "  $0 single              # Single company on port 3000"
        echo "  $0 multi               # Multiple companies on ports 3001, 3002"
        echo "  $0 build               # Just build the image"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 Access your application:"
if [ "$SETUP_TYPE" = "multi" ]; then
    echo "   Company 1: http://localhost:3001"
    echo "   Company 2: http://localhost:3002"
else
    echo "   Main App: http://localhost:3000"
fi
echo ""
echo "🔐 Demo credentials:"
echo "   HR: hr@demo.com / password123"
echo "   Manager: manager@demo.com / password123"
echo "   Employee: employee1@demo.com / password123"
echo "   Worker: worker1 / 1234"
echo ""
echo "📊 Database management:"
echo "   docker-compose exec performance-mgmt npx prisma studio"
echo ""
echo "🛠️  Useful commands:"
echo "   $0 logs    # View logs"
echo "   $0 stop    # Stop services"
echo "   $0 reset   # Reset all data"