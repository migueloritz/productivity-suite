import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from '../Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render children correctly', () => {
      render(
        <Button>
          <span>Icon</span>
          Text
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should apply default variant classes', () => {
      render(<Button variant="default">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('should apply destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });

    it('should apply outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-background');
    });

    it('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should apply link variant classes', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('sizes', () => {
    it('should apply default size classes', () => {
      render(<Button size="default">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
    });

    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
    });

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-8');
    });

    it('should apply icon size classes', () => {
      render(<Button size="icon">🔥</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('should have proper focus styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('asChild prop', () => {
    it('should render as custom component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('inline-flex'); // Button classes should be applied
    });

    it('should forward refs correctly with asChild', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      
      render(
        <Button asChild>
          <a ref={ref} href="/test">Link</a>
        </Button>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Keyboard test</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should be keyboard focusable by default', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });

    it('should not be keyboard focusable when disabled', () => {
      render(<Button disabled>Not focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button
          type="submit"
          form="test-form"
          name="submit-button"
          value="submit-value"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('name', 'submit-button');
      expect(button).toHaveAttribute('value', 'submit-value');
    });

    it('should handle data attributes', () => {
      render(<Button data-testid="custom-button" data-custom="value">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('ref forwarding', () => {
    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      
      render(<Button ref={ref}>Button with ref</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Button with ref');
    });

    it('should maintain ref functionality with custom className', () => {
      const ref = React.createRef<HTMLButtonElement>();
      
      render(<Button ref={ref} className="custom">Custom Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveClass('custom');
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('should handle null children', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple variant and size combinations', () => {
      render(<Button variant="outline" size="lg">Large Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border'); // outline variant
      expect(button).toHaveClass('h-11'); // large size
    });
  });
});

describe('buttonVariants', () => {
  it('should generate correct classes for default variant', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('h-10');
  });

  it('should generate correct classes for specific variant and size', () => {
    const classes = buttonVariants({ variant: 'destructive', size: 'sm' });
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('h-9');
  });

  it('should merge custom className', () => {
    const classes = buttonVariants({ className: 'custom-class' });
    expect(classes).toContain('custom-class');
    expect(classes).toContain('bg-primary'); // default variant
  });

  it('should handle undefined values', () => {
    const classes = buttonVariants({ variant: undefined, size: undefined });
    expect(classes).toContain('bg-primary'); // default variant
    expect(classes).toContain('h-10'); // default size
  });
});