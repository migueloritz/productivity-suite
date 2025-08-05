import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  withRouter?: boolean;
}

function CustomProvider({ 
  children, 
  withRouter = true,
  initialEntries = ['/']
}: {
  children: React.ReactNode;
  withRouter?: boolean;
  initialEntries?: string[];
}) {
  if (withRouter) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }
  
  return <>{children}</>;
}

const customRender = (
  ui: ReactElement,
  {
    withRouter = true,
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const user = userEvent.setup();
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <CustomProvider withRouter={withRouter} initialEntries={initialEntries}>
      {children}
    </CustomProvider>
  );

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };