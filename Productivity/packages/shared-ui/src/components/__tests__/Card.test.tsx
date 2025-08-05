import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default props', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
    });

    it('should render with custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('rounded-lg'); // Should merge with default classes
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card 
          data-testid="card" 
          id="test-card" 
          role="region"
          aria-label="Test card"
        >
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-card');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    it('should render children correctly', () => {
      render(
        <Card data-testid="card">
          <div>Child element</div>
          <span>Another child</span>
        </Card>
      );
      expect(screen.getByText('Child element')).toBeInTheDocument();
      expect(screen.getByText('Another child')).toBeInTheDocument();
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card with ref</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Card with ref');
    });
  });

  describe('CardHeader', () => {
    it('should render with default styling', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });

    it('should merge custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex');
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header with ref</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render as h3 element with default styling', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
    });

    it('should merge custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('text-2xl');
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(<CardTitle ref={ref}>Title with ref</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
      expect(ref.current?.tagName).toBe('H3');
    });

    it('should pass through HTML attributes', () => {
      render(<CardTitle id="card-title" data-level="main">Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveAttribute('id', 'card-title');
      expect(title).toHaveAttribute('data-level', 'main');
    });
  });

  describe('CardDescription', () => {
    it('should render as paragraph with default styling', () => {
      render(<CardDescription>This is a description</CardDescription>);
      const description = screen.getByText('This is a description');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
      expect(description).toHaveClass('text-sm');
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Description with ref</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('should render with default styling', () => {
      render(<CardContent data-testid="content">Content area</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('should merge custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('p-6');
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content with ref</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('should render with default styling', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('should merge custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('flex');
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer with ref</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Composed Card', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      // Check that all components are rendered
      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('should maintain proper hierarchy and spacing', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      const title = screen.getByRole('heading');
      const description = screen.getByText('Description');
      const content = screen.getByText('Content');
      const footer = screen.getByText('Footer');

      // Check that header has proper spacing
      const header = title.parentElement;
      expect(header).toHaveClass('space-y-1.5');
      
      // Check that content and footer have proper padding
      expect(content.parentElement).toHaveClass('pt-0');
      expect(footer.parentElement).toHaveClass('pt-0');
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes on all components', () => {
      render(
        <Card aria-label="Product card" role="article">
          <CardHeader aria-describedby="header-desc">
            <CardTitle id="product-title">Product Name</CardTitle>
            <CardDescription id="header-desc">Product description</CardDescription>
          </CardHeader>
          <CardContent aria-labelledby="product-title">
            Product details
          </CardContent>
          <CardFooter role="group" aria-label="Product actions">
            <button>Buy Now</button>
          </CardFooter>
        </Card>
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Product card');

      const title = screen.getByRole('heading');
      expect(title).toHaveAttribute('id', 'product-title');

      const footer = screen.getByRole('group');
      expect(footer).toHaveAttribute('aria-label', 'Product actions');
    });

    it('should maintain semantic heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty components gracefully', () => {
      render(
        <Card>
          <CardHeader></CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
      );

      // Should render without errors
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('should handle nested content correctly', () => {
      render(
        <Card>
          <CardContent>
            <div>
              <Card>
                <CardTitle>Nested Card</CardTitle>
              </Card>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Nested Card' })).toBeInTheDocument();
    });

    it('should handle multiple titles in header', () => {
      render(
        <CardHeader>
          <CardTitle>Main Title</CardTitle>
          <CardTitle>Secondary Title</CardTitle>
        </CardHeader>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
    });

    it('should handle complex content in footer', () => {
      render(
        <CardFooter>
          <div>
            <button>Cancel</button>
            <button>Save</button>
          </div>
          <span>Status: Draft</span>
        </CardFooter>
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByText('Status: Draft')).toBeInTheDocument();
    });
  });
});