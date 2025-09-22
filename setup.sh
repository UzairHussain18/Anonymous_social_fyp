#!/bin/bash

echo "🚀 Setting up WhisperEcho App..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please update the values as needed."
else
    echo "✅ .env file already exists."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Create uploads directory
mkdir -p uploads
echo "📁 Created uploads directory."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# For iOS setup (uncomment if on macOS)
# echo "🍎 Setting up iOS dependencies..."
# cd ios && pod install && cd ..

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with your MongoDB connection string"
echo "2. Start backend: npm run dev"
echo "3. Start frontend: cd frontend && npm start"
echo "4. Run app: npm run android (or npm run ios)"
