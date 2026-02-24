import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Heart, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background ecg-pattern flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">
            <span className="text-primary">Vital</span>Wave
          </span>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold text-primary/20 mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button className="rounded-full" data-testid="go-home">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-full" data-testid="go-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
