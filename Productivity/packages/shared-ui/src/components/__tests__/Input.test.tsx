import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-10');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />);
      const input = screen.getByPlaceholderText('Enter text...');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('should render with different input types', () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });
  });

  describe('helper text', () => {
    it('should display helper text', () => {
      render(<Input helperText="This is helpful information" />);
      expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    });

    it('should display helper text with normal styling', () => {
      render(<Input helperText="Normal helper text" />);
      const helperText = screen.getByText('Normal helper text');
      expect(helperText).toHaveClass('text-muted-foreground');
      expect(helperText).not.toHaveClass('text-destructive');
    });

    it('should display helper text with error styling when error is true', () => {
      render(<Input error helperText="Error message" />);
      const helperText = screen.getByText('Error message');
      expect(helperText).toHaveClass('text-destructive');
      expect(helperText).not.toHaveClass('text-muted-foreground');
    });

    it('should not render helper text element when helperText is not provided', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      const helperElement = input.parentElement?.querySelector('p');
      expect(helperElement).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should apply error styling to input when error is true', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
      expect(input).toHaveClass('focus-visible:ring-destructive');
    });

    it('should not apply error styling when error is false', () => {
      render(<Input error={false} />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveClass('border-destructive');
      expect(input).not.toHaveClass('focus-visible:ring-destructive');
    });

    it('should combine error state with helper text', () => {
      render(<Input error helperText="Something went wrong" />);
      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('Something went wrong');
      
      expect(input).toHaveClass('border-destructive');
      expect(helperText).toHaveClass('text-destructive');
    });
  });

  describe('adornments', () => {
    it('should render start adornment', () => {
      render(<Input startAdornment={<span data-testid="start-icon">🔍</span>} />);
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('should render end adornment', () => {
      render(<Input endAdornment={<span data-testid="end-icon">✕</span>} />);
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('should render both start and end adornments', () => {
      render(
        <Input
          startAdornment={<span data-testid="start">🔍</span>}
          endAdornment={<span data-testid="end">✕</span>}
        />
      );
      expect(screen.getByTestId('start')).toBeInTheDocument();
      expect(screen.getByTestId('end')).toBeInTheDocument();
    });

    it('should adjust input padding when start adornment is present', () => {
      render(<Input startAdornment={<span>🔍</span>} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('should adjust input padding when end adornment is present', () => {
      render(<Input endAdornment={<span>✕</span>} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-10');
    });

    it('should adjust input padding when both adornments are present', () => {
      render(
        <Input
          startAdornment={<span>🔍</span>}
          endAdornment={<span>✕</span>}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
      expect(input).toHaveClass('pr-10');
    });

    it('should position adornments correctly', () => {
      render(
        <Input
          startAdornment={<span data-testid="start">🔍</span>}
          endAdornment={<span data-testid="end">✕</span>}
        />
      );
      
      const startAdornment = screen.getByTestId('start').parentElement;
      const endAdornment = screen.getByTestId('end').parentElement;
      
      expect(startAdornment).toHaveClass('left-3');
      expect(startAdornment).toHaveClass('absolute');
      expect(endAdornment).toHaveClass('right-3');
      expect(endAdornment).toHaveClass('absolute');
    });
  });

  describe('interactions', () => {
    it('should handle value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello World');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello World');
    });

    it('should handle focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should not trigger events when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const handleFocus = jest.fn();
      
      render(<Input disabled onChange={handleChange} onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      expect(input).toBeDisabled();
      
      await user.click(input);
      expect(handleFocus).not.toHaveBeenCalled();
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Input aria-label="Search input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search input');
    });

    it('should support aria-describedby for helper text', () => {
      render(<Input aria-describedby="helper-text" helperText="Helper information" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.keyboard('test input');
      expect(input).toHaveValue('test input');
    });

    it('should have proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('controlled vs uncontrolled', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('initial');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="controlled-input"
          />
        );
      };
      
      render(<TestComponent />);
      const input = screen.getByTestId('controlled-input') as HTMLInputElement;
      
      expect(input.value).toBe('initial');
      
      await user.clear(input);
      await user.type(input, 'new value');
      
      expect(input.value).toBe('new value');
    });

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="default" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      expect(input.value).toBe('default');
      
      await user.clear(input);
      await user.type(input, 'updated');
      
      expect(input.value).toBe('updated');
    });
  });

  describe('HTML attributes', () => {
    it('should pass through standard HTML input attributes', () => {
      render(
        <Input
          name="test-input"
          id="test-id"
          required
          autoComplete="off"
          maxLength={100}
          minLength={5}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'test-input');
      expect(input).toHaveAttribute('id', 'test-id');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('autoComplete', 'off');
      expect(input).toHaveAttribute('maxLength', '100');
      expect(input).toHaveAttribute('minLength', '5');
    });

    it('should handle data attributes', () => {
      render(<Input data-testid="custom-input" data-custom="value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('ref forwarding', () => {
    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should maintain ref functionality with adornments', () => {
      const ref = React.createRef<HTMLInputElement>();
      
      render(<Input ref={ref} startAdornment={<span>🔍</span>} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toHaveClass('pl-10');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string helper text', () => {
      render(<Input helperText="" />);
      const input = screen.getByRole('textbox');
      const wrapper = input.parentElement?.parentElement;
      const helperElement = wrapper?.querySelector('p');
      expect(helperElement).toBeInTheDocument();
      expect(helperElement?.textContent).toBe('');
    });

    it('should handle complex adornment content', () => {
      render(
        <Input
          startAdornment={
            <button type="button" aria-label="Search">
              🔍
            </button>
          }
          endAdornment={
            <div>
              <span>Unit</span>
            </div>
          }
        />
      );
      
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      expect(screen.getByText('Unit')).toBeInTheDocument();
    });

    it('should maintain proper layout with long helper text', () => {
      const longHelperText = 'This is a very long helper text that might wrap to multiple lines and should still be displayed correctly with proper styling and positioning.';
      
      render(<Input helperText={longHelperText} />);
      
      const helperElement = screen.getByText(longHelperText);
      expect(helperElement).toHaveClass('mt-1');
      expect(helperElement).toHaveClass('text-sm');
    });
  });
});