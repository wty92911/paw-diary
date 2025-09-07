import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Settings,
  BarChart3,
  Activity,
} from 'lucide-react';
import { usePets } from '../hooks/usePets';
import ActivityTimeline from '../components/activities/ActivityTimeline';
import QuickLogSheet from '../components/activities/QuickLogSheet';
import { PetProfilePhoto } from '../components/pets/PetProfilePhoto';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';

/**
 * ActivitiesPage - Comprehensive activity management interface
 *
 * Features:
 * - View all activities across pets or filter by specific pet
 * - Activity timeline with full management capabilities
 * - Quick log functionality
 * - Search and filtering
 * - Statistics overview
 *
 * This is the main activity management hub for the application.
 */
export function ActivitiesPage() {
  const navigate = useNavigate();
  const { pets, isLoading: petsLoading } = usePets();
  const [selectedPetId, setSelectedPetId] = useState<number | 'all'>('all');
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // TODO: Implement search functionality

  // Get selected pet
  const selectedPet = selectedPetId !== 'all' ? pets.find(p => p.id === selectedPetId) : null;

  if (petsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">Loading activities...</p>
        </div>
      </div>
    );
  }

  // If no pets exist, show empty state
  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-orange-700 hover:bg-orange-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-orange-900">Activities</h1>
                  <p className="text-xs text-orange-600 -mt-1">Pet Activity Management</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Empty state */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-orange-400" />
              <h2 className="text-2xl font-bold text-orange-900 mb-2">No Pets Yet</h2>
              <p className="text-orange-700 mb-6">
                Add your first pet to start tracking activities
              </p>
              <Button
                onClick={() => navigate('/pets/new')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-orange-700 hover:bg-orange-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">Activities</h1>
                <p className="text-xs text-orange-600 -mt-1">
                  {selectedPet ? `${selectedPet.name}'s Activities` : 'All Pets'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowQuickLog(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Pet Selection and Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                  {/* Pet Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-orange-600" />
                    <Select
                      value={selectedPetId.toString()}
                      onValueChange={value =>
                        setSelectedPetId(value === 'all' ? 'all' : parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue>
                          {selectedPet ? (
                            <div className="flex items-center gap-2">
                              <PetProfilePhoto pet={selectedPet} size="medium" />
                              <span>{selectedPet.name}</span>
                            </div>
                          ) : (
                            'All Pets'
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pets</SelectItem>
                        {pets.map(pet => (
                          <SelectItem key={pet.id} value={pet.id.toString()}>
                            <div className="flex items-center gap-2">
                              <PetProfilePhoto pet={pet} size="medium" />
                              <span>{pet.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities Content */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Timeline */}
            <div className="xl:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[600px]">
                    <ActivityTimeline
                      activities={[]} // TODO: Implement activities loading with search
                      petId={selectedPetId === 'all' ? undefined : selectedPetId}
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Statistics & Quick Actions */}
            <div className="xl:col-span-1">
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">--</div>
                      <div className="text-sm text-gray-600">Today's Activities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">--</div>
                      <div className="text-sm text-gray-600">This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">--</div>
                      <div className="text-sm text-gray-600">Total Activities</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Pets (if viewing all) */}
                {selectedPetId === 'all' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Pets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pets.slice(0, 4).map(pet => (
                        <button
                          key={pet.id}
                          onClick={() => setSelectedPetId(pet.id)}
                          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <PetProfilePhoto pet={pet} size="medium" />
                          <div className="text-left flex-1">
                            <div className="font-medium text-sm">{pet.name}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {pet.species.toLowerCase()}
                            </div>
                          </div>
                        </button>
                      ))}
                      {pets.length > 4 && (
                        <div className="text-xs text-gray-500 text-center pt-2">
                          +{pets.length - 4} more pets
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Log Sheet */}
      {showQuickLog && (
        <QuickLogSheet
          isOpen={showQuickLog}
          petId={selectedPetId !== 'all' ? selectedPetId : pets[0]?.id}
          onClose={() => setShowQuickLog(false)}
          onSave={async activity => {
            // TODO: Implement activity saving
            console.log('Saving activity:', activity);
            setShowQuickLog(false);
          }}
        />
      )}
    </div>
  );
}

export default ActivitiesPage;
