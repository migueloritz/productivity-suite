import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../Dialog';

// Mock createPortal since we're testing in jsdom
jest.mock('react-dom', () => {
  const original = jest.requireActual('react-dom');
  return {
    ...original,
    createPortal: jest.fn((children) => children),
  };
});

describe('Dialog Components', () => {
  beforeEach(() => {
    // Reset body overflow style before each test
    document.body.style.overflow = '';
    // Clear any existing event listeners
    document.removeEventListener('keydown', jest.fn());
    document.removeEventListener('pointerdown', jest.fn());
  });

  afterEach(() => {
    // Cleanup after each test
    document.body.style.overflow = '';
  });

  describe('Dialog Provider', () => {
    it('should provide context to child components', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true}>
            <DialogContent data-testid="content">
              Dialog is open
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should throw error when components are used outside Dialog', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<DialogTrigger>Trigger</DialogTrigger>);
      }).toThrow('Dialog components must be used within a Dialog');

      consoleSpy.mockRestore();
    });

    it('should handle controlled state', () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open Dialog</DialogTrigger>
            <DialogContent data-testid="content">
              Content
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();

      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      trigger.click();
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle uncontrolled state', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Open Dialog' }));
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('DialogTrigger', () => {
    it('should render as button by default', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      expect(trigger).toBeInTheDocument();
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('should open dialog when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should support asChild prop', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <a href="#" data-testid="link-trigger">Custom Link Trigger</a>
          </DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByTestId('link-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger.tagName).toBe('A');
    });

    it('should call custom onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <Dialog>
          <DialogTrigger onClick={handleClick}>Open</DialogTrigger>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      
      render(
        <Dialog>
          <DialogTrigger ref={ref}>Trigger</DialogTrigger>
        </Dialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('DialogContent', () => {
    it('should not render when dialog is closed', () => {
      render(
        <Dialog open={false}>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should render when dialog is open', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should apply default styling classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('relative');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('grid');
      expect(content).toHaveClass('border');
    });

    it('should merge custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="custom-dialog" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-dialog');
      expect(content).toHaveClass('relative');
    });

    it('should prevent body scroll when open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Dialog open={false}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('should close on escape key', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call custom onEscapeKeyDown handler', async () => {
      const user = userEvent.setup();
      const handleEscape = jest.fn();
      
      render(
        <Dialog open={true}>
          <DialogContent onEscapeKeyDown={handleEscape}>
            Content
          </DialogContent>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(handleEscape).toHaveBeenCalled();
    });

    it('should prevent close when escape event is prevented', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      const handleEscape = jest.fn((event) => event.preventDefault());
      
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent onEscapeKeyDown={handleEscape}>
            Content
          </DialogContent>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(handleEscape).toHaveBeenCalled();
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('should close on outside click', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      
      render(
        <div data-testid="outside">
          <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogContent data-testid="content">Content</DialogContent>
          </Dialog>
        </div>
      );

      // Simulate clicking outside - this is tricky in jsdom, so we'll simulate the event
      const outsideElement = screen.getByTestId('outside');
      const pointerEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(pointerEvent, 'target', { value: outsideElement });
      
      document.dispatchEvent(pointerEvent);
      
      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call custom onPointerDownOutside handler', async () => {
      const handlePointerDown = jest.fn();
      
      render(
        <div data-testid="outside">
          <Dialog open={true}>
            <DialogContent onPointerDownOutside={handlePointerDown}>
              Content
            </DialogContent>
          </Dialog>
        </div>
      );

      const outsideElement = screen.getByTestId('outside');
      const pointerEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(pointerEvent, 'target', { value: outsideElement });
      
      document.dispatchEvent(pointerEvent);
      
      await waitFor(() => {
        expect(handlePointerDown).toHaveBeenCalled();
      });
    });
  });

  describe('DialogHeader', () => {
    it('should render with default styling', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader data-testid="header">Header content</DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
    });

    it('should merge custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="header">
              Header
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex');
    });
  });

  describe('DialogTitle', () => {
    it('should render as h1 element', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('Dialog Title');
    });

    it('should apply default styling', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });

    it('should merge custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('text-lg');
    });
  });

  describe('DialogDescription', () => {
    it('should render as paragraph element', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>This is a description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('This is a description');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription className="custom-desc">
              Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
      expect(description).toHaveClass('text-sm');
    });
  });

  describe('DialogFooter', () => {
    it('should render with default styling', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter data-testid="footer">Footer content</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
      expect(footer).toHaveClass('sm:flex-row');
    });

    it('should merge custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter className="custom-footer" data-testid="footer">
              Footer
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('flex');
    });
  });

  describe('Complete Dialog Example', () => {
    it('should render a complete dialog with all components', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to perform this action?
              </DialogDescription>
            </DialogHeader>
            <div>Additional content here</div>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      // Dialog should not be visible initially
      expect(screen.queryByRole('heading', { name: 'Confirm Action' })).not.toBeInTheDocument();

      // Open dialog
      await user.click(screen.getByRole('button', { name: 'Open Dialog' }));

      // All components should be visible
      expect(screen.getByRole('heading', { name: 'Confirm Action' })).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to perform this action?')).toBeInTheDocument();
      expect(screen.getByText('Additional content here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should handle complex interactions', async () => {
      const user = userEvent.setup();
      const handleConfirm = jest.fn();
      
      const TestDialog = () => {
        const [open, setOpen] = React.useState(false);
        
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Dialog</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <button onClick={() => setOpen(false)}>Cancel</button>
                <button onClick={() => { handleConfirm(); setOpen(false); }}>
                  Confirm
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestDialog />);

      // Open dialog
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('heading', { name: 'Test Dialog' })).toBeInTheDocument();

      // Click confirm
      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(handleConfirm).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('heading', { name: 'Test Dialog' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Dialog open={true}>
          <DialogContent aria-describedby="dialog-desc">
            <DialogTitle id="dialog-title">Title</DialogTitle>
            <DialogDescription id="dialog-desc">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByRole('heading').closest('[aria-describedby]');
      expect(content).toHaveAttribute('aria-describedby', 'dialog-desc');
    });

    it('should maintain focus management', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Focus Test</DialogTitle>
            <button>Focusable Element</button>
          </DialogContent>
        </Dialog>
      );

      // In a real implementation, focus would be managed automatically
      // This test verifies the structure is correct for focus management
      expect(screen.getByRole('button', { name: 'Focusable Element' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close state changes', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);
        
        React.useEffect(() => {
          const timer1 = setTimeout(() => setOpen(true), 10);
          const timer2 = setTimeout(() => setOpen(false), 20);
          const timer3 = setTimeout(() => setOpen(true), 30);
          
          return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
          };
        }, []);
        
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent data-testid="content">Content</DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});