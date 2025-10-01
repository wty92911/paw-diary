/**
 * Header Component Test Contracts
 * 
 * Test specifications and contracts for the Universal Header Component
 * These tests must fail initially (no implementation exists) and pass after implementation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';

import {
  UniversalHeader,
  AppHeader,
  PetContextHeader,
  FormHeader,
  HeaderProvider,
  useHeaderConfig,
  useHeaderTheme,
  useHeaderNavigation,
} from '../components/header'; // Components to be implemented

import {
  HeaderVariant,
  BackActionType,
  PetPhotoSize,
  HeaderConfiguration,
  Pet,
  BreadcrumbItem,
} from './header-component';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockPet: Pet = {
  id: 1,
  name: 'Fluffy',
  species: 'Cat',
  photo_path: '/mock/fluffy.jpg'
};

const mockBreadcrumbs: BreadcrumbItem[] = [
  { label: 'Profile', href: '/pets/1', active: false },
  { label: 'Activities', href: '/pets/1/activities', active: false },
  { label: 'Edit Activity', active: true }
];

const mockAppHeaderConfig: HeaderConfiguration = {
  variant: HeaderVariant.APP,
  title: 'Paw Diary',
  showBackButton: false,
  sticky: true
};

const mockPetContextConfig: HeaderConfiguration = {
  variant: HeaderVariant.PET_CONTEXT,
  showBackButton: true,
  sticky: true,
  petContext: {
    pet: mockPet,
    breadcrumbs: mockBreadcrumbs,
    showPetPhoto: true,
    photoSize: PetPhotoSize.MEDIUM,
    showSpecies: true
  },
  backAction: {
    type: BackActionType.ROUTER_BACK,
    label: 'Back'
  }
};

const mockFormHeaderConfig: HeaderConfiguration = {
  variant: HeaderVariant.FORM,
  title: 'Add New Pet',
  showBackButton: true,
  sticky: false,
  backAction: {
    type: BackActionType.NAVIGATE_TO_URL,
    url: '/',
    label: 'Cancel'
  }
};

// ============================================================================
// Test Helper Functions
// ============================================================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <HeaderProvider>
        {component}
      </HeaderProvider>
    </BrowserRouter>
  );
};

const renderWithProvider = (component: React.ReactElement, config?: HeaderConfiguration) => {
  return render(
    <BrowserRouter>
      <HeaderProvider initialConfig={config}>
        {component}
      </HeaderProvider>
    </BrowserRouter>
  );
};

// ============================================================================
// UniversalHeader Component Tests
// ============================================================================

describe('UniversalHeader Component', () => {
  test('should render app header variant correctly', () => {
    renderWithRouter(<UniversalHeader configuration={mockAppHeaderConfig} />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Paw Diary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  test('should render pet context header variant correctly', () => {
    renderWithRouter(<UniversalHeader configuration={mockPetContextConfig} />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Fluffy')).toBeInTheDocument();
    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('should render form header variant correctly', () => {
    renderWithRouter(<UniversalHeader configuration={mockFormHeaderConfig} />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Add New Pet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('should handle configuration changes', () => {
    const onConfigChange = jest.fn();
    const { rerender } = renderWithRouter(
      <UniversalHeader 
        configuration={mockAppHeaderConfig} 
        onConfigurationChange={onConfigChange}
      />
    );

    // Change configuration
    rerender(
      <BrowserRouter>
        <HeaderProvider>
          <UniversalHeader 
            configuration={mockPetContextConfig}
            onConfigurationChange={onConfigChange}
          />
        </HeaderProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Fluffy')).toBeInTheDocument();
  });

  test('should be accessible', async () => {
    const { container } = renderWithRouter(<UniversalHeader configuration={mockAppHeaderConfig} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ============================================================================
// AppHeader Component Tests
// ============================================================================

describe('AppHeader Component', () => {
  test('should render with title and branding', () => {
    renderWithRouter(<AppHeader title="Paw Diary" />);
    
    expect(screen.getByText('Paw Diary')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass(/bg-white/);
  });

  test('should render with sticky positioning by default', () => {
    renderWithRouter(<AppHeader title="Paw Diary" />);
    
    expect(screen.getByRole('banner')).toHaveClass(/sticky/);
  });

  test('should handle custom actions', () => {
    const mockAction = jest.fn();
    const actions = [{
      id: 'add-pet',
      label: 'Add Pet',
      handler: mockAction,
      variant: 'primary' as const,
      position: 'trailing' as const
    }];

    renderWithRouter(<AppHeader title="Paw Diary" actions={actions} />);
    
    const addButton = screen.getByRole('button', { name: /add pet/i });
    expect(addButton).toBeInTheDocument();
    
    fireEvent.click(addButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// PetContextHeader Component Tests  
// ============================================================================

describe('PetContextHeader Component', () => {
  test('should render pet information', () => {
    renderWithRouter(<PetContextHeader pet={mockPet} />);
    
    expect(screen.getByText('Fluffy')).toBeInTheDocument();
    expect(screen.getByText('Cat')).toBeInTheDocument();
  });

  test('should render pet photo when enabled', () => {
    renderWithRouter(
      <PetContextHeader 
        pet={mockPet} 
        showPetPhoto={true}
        photoSize={PetPhotoSize.MEDIUM}
      />
    );
    
    const petPhoto = screen.getByRole('img', { name: /fluffy/i });
    expect(petPhoto).toBeInTheDocument();
    expect(petPhoto).toHaveAttribute('src', '/mock/fluffy.jpg');
  });

  test('should render breadcrumbs navigation', () => {
    renderWithRouter(
      <PetContextHeader 
        pet={mockPet} 
        breadcrumbs={mockBreadcrumbs}
      />
    );
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Edit Activity')).toBeInTheDocument();
  });

  test('should handle back navigation', () => {
    const mockBackHandler = jest.fn();
    const backAction = {
      type: BackActionType.CUSTOM_HANDLER,
      handler: mockBackHandler,
      label: 'Back to Profile'
    };

    renderWithRouter(
      <PetContextHeader 
        pet={mockPet}
        showBackButton={true}
        backAction={backAction}
      />
    );
    
    const backButton = screen.getByRole('button', { name: /back to profile/i });
    fireEvent.click(backButton);
    expect(mockBackHandler).toHaveBeenCalledTimes(1);
  });

  test('should handle long pet names gracefully', () => {
    const petWithLongName = { ...mockPet, name: 'This is a very long pet name that should be truncated' };
    
    renderWithRouter(<PetContextHeader pet={petWithLongName} />);
    
    const petNameElement = screen.getByText(petWithLongName.name);
    expect(petNameElement).toHaveClass(/truncate/);
  });
});

// ============================================================================
// FormHeader Component Tests
// ============================================================================

describe('FormHeader Component', () => {
  test('should render form title', () => {
    renderWithRouter(<FormHeader title="Add New Pet" />);
    
    expect(screen.getByText('Add New Pet')).toBeInTheDocument();
  });

  test('should render with subtitle when provided', () => {
    renderWithRouter(
      <FormHeader 
        title="Add New Pet" 
        subtitle="Create your pet's profile"
      />
    );
    
    expect(screen.getByText('Add New Pet')).toBeInTheDocument();
    expect(screen.getByText("Create your pet's profile")).toBeInTheDocument();
  });

  test('should handle back navigation with custom action', () => {
    const mockHandler = jest.fn();
    const backAction = {
      type: BackActionType.CUSTOM_HANDLER,
      handler: mockHandler,
      label: 'Cancel'
    };

    renderWithRouter(
      <FormHeader 
        title="Add New Pet"
        showBackButton={true}
        backAction={backAction}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  test('should not be sticky by default', () => {
    renderWithRouter(<FormHeader title="Add New Pet" />);
    
    expect(screen.getByRole('banner')).not.toHaveClass(/sticky/);
  });
});

// ============================================================================
// Hooks Tests
// ============================================================================

describe('useHeaderConfig Hook', () => {
  test('should provide configuration management', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useHeaderConfig();
      return null;
    }

    renderWithProvider(<TestComponent />, mockAppHeaderConfig);
    
    expect(hookResult.configuration).toEqual(mockAppHeaderConfig);
    expect(typeof hookResult.updateConfiguration).toBe('function');
    expect(typeof hookResult.resetConfiguration).toBe('function');
  });

  test('should update configuration', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useHeaderConfig();
      return null;
    }

    renderWithProvider(<TestComponent />, mockAppHeaderConfig);
    
    const newConfig = { ...mockAppHeaderConfig, title: 'Updated Title' };
    hookResult.updateConfiguration(newConfig);
    
    expect(hookResult.configuration.title).toBe('Updated Title');
  });
});

describe('useHeaderTheme Hook', () => {
  test('should provide theme management', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useHeaderTheme();
      return null;
    }

    renderWithProvider(<TestComponent />);
    
    expect(hookResult.theme).toBeDefined();
    expect(typeof hookResult.updateTheme).toBe('function');
    expect(typeof hookResult.resetTheme).toBe('function');
  });
});

describe('useHeaderNavigation Hook', () => {
  test('should provide navigation utilities', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useHeaderNavigation();
      return null;
    }

    renderWithProvider(<TestComponent />);
    
    expect(typeof hookResult.goBack).toBe('function');
    expect(typeof hookResult.navigateTo).toBe('function');
    expect(typeof hookResult.canGoBack).toBe('boolean');
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Header Accessibility', () => {
  test('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(
      <PetContextHeader 
        pet={mockPet}
        showBackButton={true}
        breadcrumbs={mockBreadcrumbs}
      />
    );
    
    // Tab to back button
    await user.tab();
    expect(screen.getByRole('button', { name: /back/i })).toHaveFocus();
    
    // Tab to breadcrumb links
    await user.tab();
    expect(screen.getByRole('button', { name: /profile/i })).toHaveFocus();
  });

  test('should provide proper ARIA labels', () => {
    renderWithRouter(
      <PetContextHeader 
        pet={mockPet}
        breadcrumbs={mockBreadcrumbs}
      />
    );
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText(/breadcrumb/i)).toBeInTheDocument();
  });

  test('should support high contrast mode', () => {
    renderWithRouter(<UniversalHeader configuration={mockAppHeaderConfig} />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass(/border-b/); // Ensures visible border in high contrast
  });
});

// ============================================================================
// Responsive Design Tests
// ============================================================================

describe('Header Responsive Design', () => {
  test('should adapt to mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithRouter(<PetContextHeader pet={mockPet} />);
    
    const petName = screen.getByText('Fluffy');
    expect(petName).toHaveClass(/text-lg/); // Smaller text on mobile
  });

  test('should handle text truncation on small screens', () => {
    const petWithLongName = { ...mockPet, name: 'Extremely Long Pet Name That Should Truncate' };
    
    renderWithRouter(<PetContextHeader pet={petWithLongName} />);
    
    const petNameElement = screen.getByText(petWithLongName.name);
    expect(petNameElement).toHaveClass(/truncate/);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Header Performance', () => {
  test('should not re-render unnecessarily', () => {
    const renderCount = jest.fn();
    
    function TestComponent() {
      renderCount();
      return <UniversalHeader configuration={mockAppHeaderConfig} />;
    }

    const { rerender } = renderWithRouter(<TestComponent />);
    expect(renderCount).toHaveBeenCalledTimes(1);
    
    // Re-render with same props
    rerender(
      <BrowserRouter>
        <HeaderProvider>
          <TestComponent />
        </HeaderProvider>
      </BrowserRouter>
    );
    
    expect(renderCount).toHaveBeenCalledTimes(1); // Should not re-render
  });

  test('should lazy load pet photos', async () => {
    renderWithRouter(
      <PetContextHeader 
        pet={mockPet}
        showPetPhoto={true}
      />
    );
    
    const petPhoto = screen.getByRole('img', { name: /fluffy/i });
    expect(petPhoto).toHaveAttribute('loading', 'lazy');
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Header Error Handling', () => {
  test('should handle missing pet data gracefully', () => {
    const incompletePet = { id: 1, name: 'Test', species: 'Unknown' };
    
    renderWithRouter(<PetContextHeader pet={incompletePet} showPetPhoto={true} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    // Should show placeholder when photo_path is missing
    expect(screen.getByTestId('pet-photo-placeholder')).toBeInTheDocument();
  });

  test('should handle failed back navigation', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const faultyBackAction = {
      type: BackActionType.CUSTOM_HANDLER,
      handler: () => { throw new Error('Navigation failed'); },
      label: 'Back'
    };

    renderWithRouter(
      <PetContextHeader 
        pet={mockPet}
        showBackButton={true}
        backAction={faultyBackAction}
      />
    );
    
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});