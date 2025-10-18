import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateCardProps {
  petId: number;
  className?: string;
}

export function EmptyStateCard({ petId, className }: EmptyStateCardProps) {
  const navigate = useNavigate();

  const handleAddWeight = () => {
    // Navigate to activity editor with weight template pre-selected
    navigate('/activity/new', {
      state: {
        petId,
        templateId: 'growth.weight',
        category: 'Growth',
      },
    });
  };

  return (
    <Card className={className}>
      <CardContent className="p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-orange-900 mb-2">
          No weight measurements yet
        </h3>

        {/* Description */}
        <p className="text-sm text-orange-600 mb-6 max-w-sm mx-auto">
          Start tracking your pet's weight to see growth trends and monitor their health over
          time.
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleAddWeight}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Add Weight
        </Button>
      </CardContent>
    </Card>
  );
}
