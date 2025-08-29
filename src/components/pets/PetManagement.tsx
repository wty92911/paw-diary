import { useState } from 'react';
import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Settings,
  Search,
  Archive,
  Trash2,
  GripVertical,
  RotateCcw,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn, calculateAge, getDefaultPetPhoto } from '../../lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface PetManagementProps {
  pets: Pet[];
  isOpen: boolean;
  onClose: () => void;
  onReorder: (petIds: number[]) => Promise<void>;
  onArchive: (pet: Pet) => Promise<void>;
  onRestore: (pet: Pet) => Promise<void>;
  onDelete: (pet: Pet) => Promise<void>;
  onView: (pet: Pet) => void;
}

export function PetManagement({
  pets,
  isOpen,
  onClose,
  onReorder,
  onArchive,
  onRestore,
  onDelete,
  onView,
}: PetManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [orderedPets, setOrderedPets] = useState<Pet[]>(pets);
  const [pendingDelete, setPendingDelete] = useState<Pet | null>(null);

  // Filter pets based on search and archive status
  const filteredPets = orderedPets.filter(pet => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArchiveStatus = showArchived ? pet.is_archived : !pet.is_archived;

    return matchesSearch && matchesArchiveStatus;
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredPets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedPets(prev => {
      const newOrder = [...prev];
      // Update display order based on new positions
      items.forEach((pet, index) => {
        const petIndex = newOrder.findIndex(p => p.id === pet.id);
        if (petIndex !== -1) {
          newOrder[petIndex] = { ...pet, display_order: index };
        }
      });
      return newOrder;
    });

    try {
      await onReorder(items.map(pet => pet.id));
    } catch (error) {
      console.error('Failed to reorder pets:', error);
      // Revert on error
      setOrderedPets(pets);
    }
  };

  const handleDeleteConfirm = async () => {
    if (pendingDelete) {
      try {
        await onDelete(pendingDelete);
        setPendingDelete(null);
      } catch (error) {
        console.error('Failed to delete pet:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-orange-900">Pet Management</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b bg-orange-50">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
              <Input
                placeholder="Search pets by name, breed, or species..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Toggle archived */}
            <Button
              variant={showArchived ? 'pet' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2"
            >
              {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showArchived ? 'Hide Archived' : 'Show Archived'}
              {pets.filter(p => p.is_archived).length > 0 && (
                <span className="ml-1 bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">
                  {pets.filter(p => p.is_archived).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Pet list */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {filteredPets.length === 0 ? (
            <div className="text-center py-8 text-orange-600">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pets found</p>
              {searchQuery && (
                <p className="text-sm text-orange-500 mt-1">
                  Try adjusting your search or toggle archived pets
                </p>
              )}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="pets">
                {provided => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {filteredPets.map((pet, index) => (
                      <Draggable key={pet.id} draggableId={pet.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              'transition-all duration-200',
                              snapshot.isDragging && 'shadow-lg rotate-2',
                              pet.is_archived && 'opacity-60 bg-gray-50',
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 text-orange-400 hover:text-orange-600"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Pet info */}
                                <div className="flex-1 flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-orange-100 border border-orange-200 flex-shrink-0">
                                    <img
                                      src={
                                        pet.photo_path
                                          ? `photos://${pet.photo_path}`
                                          : getDefaultPetPhoto()
                                      }
                                      alt={pet.name}
                                      className="w-full h-full object-cover"
                                      onError={e => {
                                        (e.target as HTMLImageElement).src = getDefaultPetPhoto();
                                      }}
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-orange-900 truncate">
                                        {pet.name}
                                      </h3>
                                      {pet.is_archived && (
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                          Archived
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-orange-600">
                                      {pet.species} • {calculateAge(pet.birth_date)}
                                      {pet.breed && ` • ${pet.breed}`}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => onView(pet)}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>

                                  {pet.is_archived ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onRestore(pet)}
                                      className="text-green-600 hover:text-green-700 hover:border-green-300"
                                    >
                                      <RotateCcw className="w-4 h-4 mr-1" />
                                      Restore
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onArchive(pet)}
                                      className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
                                    >
                                      <Archive className="w-4 h-4 mr-1" />
                                      Archive
                                    </Button>
                                  )}

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                        onClick={() => setPendingDelete(pet)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {pet.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete
                                          {pet.name}'s profile and all associated data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setPendingDelete(null)}>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={handleDeleteConfirm}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Forever
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-orange-50">
          <div className="flex items-center justify-between text-sm text-orange-600">
            <p>
              Showing {filteredPets.length} of{' '}
              {pets.filter(p => (showArchived ? true : !p.is_archived)).length} pets
            </p>
            <p className="text-xs">Drag and drop to reorder • Changes are saved automatically</p>
          </div>
        </div>
      </div>
    </div>
  );
}
