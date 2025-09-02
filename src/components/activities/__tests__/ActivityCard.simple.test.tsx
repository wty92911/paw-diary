import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockActivity, createMockHealthActivity } from '../../../test/activity-test-utils';
import { ActivityCard } from '../ActivityCard';
import { ActivityCategory } from '../../../lib/types';

describe('ActivityCard (Core Functionality)', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders activity card with basic information', () => {
      const mockActivity = createMockActivity({
        title: 'Test Activity',
        description: 'Test description',
        activity_date: '2024-01-15',
        category: ActivityCategory.Health,
        subcategory: 'Vaccination',
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('• Vaccination')).toBeInTheDocument();
    });

    it('shows cost when provided', () => {
      const mockActivity = createMockActivity({
        cost: 150.50,
        currency: 'USD',
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('$150.50')).toBeInTheDocument();
    });

    it('shows location when provided', () => {
      const mockActivity = createMockActivity({
        location: 'Pet Care Clinic',
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('Pet Care Clinic')).toBeInTheDocument();
    });

    it('shows mood rating when provided', () => {
      const mockActivity = createMockActivity({
        mood_rating: 4,
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      // Should show 4 mood emojis
      expect(screen.getByText('😊😊😊😊')).toBeInTheDocument();
    });
  });

  describe('Category-Specific Rendering', () => {
    it('renders health activity with specific data', () => {
      const mockHealthActivity = createMockHealthActivity({
        title: 'Vet Visit',
        activity_data: {
          veterinarian_name: 'Dr. Smith',
          clinic_name: 'Pet Care Clinic',
          symptoms: ['Limping'],
          diagnosis: 'Sprained paw',
          is_critical: true,
        },
      });

      render(
        <ActivityCard
          activity={mockHealthActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('Vet Visit')).toBeInTheDocument();
      expect(screen.getByText(/Dr\. Smith/)).toBeInTheDocument();
      expect(screen.getByText(/🚨 Critical/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const mockOnEdit = vi.fn();
      const mockActivity = createMockActivity();

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={mockOnEdit}
          onDelete={() => {}}
        />
      );

      // Find edit button by looking for the Edit icon
      const buttons = screen.getAllByRole('button');
      const editButton = buttons.find(button => 
        button.querySelector('svg.lucide-square-pen')
      );
      expect(editButton).toBeDefined();
      
      await user.click(editButton!);

      expect(mockOnEdit).toHaveBeenCalledWith(mockActivity);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const mockOnDelete = vi.fn();
      const mockActivity = createMockActivity();

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={mockOnDelete}
        />
      );

      // Find delete button by looking for the Trash2 icon
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(button => 
        button.querySelector('svg.lucide-trash2')
      );
      expect(deleteButton).toBeDefined();
      
      await user.click(deleteButton!);

      // Should show confirmation first
      expect(screen.getByText(/Delete this activity/)).toBeInTheDocument();
      
      // Click delete confirmation
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockActivity.id);
    });
  });

  describe('Visual States', () => {
    it('shows description when provided', () => {
      const mockActivity = createMockActivity({
        description: 'This is a detailed description of the activity',
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText(/This is a detailed description/)).toBeInTheDocument();
    });

    it('handles missing activity data gracefully', () => {
      const mockActivity = createMockActivity({
        activity_data: undefined,
        description: undefined,
        location: undefined,
        cost: undefined,
        mood_rating: undefined,
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      // Should still render basic information
      expect(screen.getByText(mockActivity.title)).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument(); // Category is displayed as label, not enum value
    });
  });

  describe('Attachment Handling', () => {
    it('shows attachment count when attachments present', () => {
      const mockActivity = createMockActivity({
        attachments: [
          {
            id: 1,
            activity_id: 1,
            file_path: '/path/to/file.jpg',
            file_type: 'photo' as const,
            file_size: 1024,
            created_at: '2024-01-15T10:00:00Z',
          }
        ],
      });

      render(
        <ActivityCard
          activity={mockActivity}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // Attachment count
    });
  });
});