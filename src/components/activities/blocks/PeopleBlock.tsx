import React from 'react';
import { type Control, type FieldError } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Users, UserPlus, X, Star, Phone, Mail } from 'lucide-react';
import { type ActivityFormData, type ActivityBlockDef, type PeopleData, type PersonData, type PeopleConfig } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

// Role configurations
const PERSON_ROLES: Record<string, { label: string; icon: string; color: string }> = {
  owner: { label: 'Owner', icon: '👤', color: 'text-blue-600' },
  vet: { label: 'Veterinarian', icon: '🏥', color: 'text-red-600' },
  groomer: { label: 'Groomer', icon: '✂️', color: 'text-pink-600' },
  trainer: { label: 'Trainer', icon: '🎓', color: 'text-green-600' },
  walker: { label: 'Dog Walker', icon: '🚶', color: 'text-orange-600' },
  sitter: { label: 'Pet Sitter', icon: '🏠', color: 'text-purple-600' },
  friend: { label: 'Friend', icon: '👥', color: 'text-indigo-600' },
  family: { label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'text-yellow-600' },
  other: { label: 'Other', icon: '👤', color: 'text-gray-600' },
} as const;

// Mock recent contacts - would come from contacts hook
const getMockRecentContacts = (_petId?: number): Array<PersonData & { lastSeen: Date }> => [
  {
    id: 'person-1',
    name: 'Dr. Sarah Johnson',
    type: 'vet',
    contact: { phone: '(555) 123-4567', email: 'sarah@happypetsvet.com' },
    notes: 'Primary Veterinarian',
    rating: 5,
    lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'person-2',
    name: 'Mike Wilson',
    type: 'walker',
    contact: { phone: '(555) 987-6543' },
    notes: 'Regular Dog Walker',
    rating: 5,
    lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'person-3',
    name: 'Emma Thompson',
    type: 'groomer',
    contact: { phone: '(555) 456-7890' },
    notes: 'Professional Groomer',
    lastSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'person-4',
    name: 'Alex Chen',
    type: 'friend',
    notes: 'Dog Park Friend',
    lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

// People block specific props
interface PeopleBlockProps {
  block: ActivityBlockDef & { type: 'people' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// PeopleBlock component for tracking people involved in activities
const PeopleBlock: React.FC<PeopleBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue, petId } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: PeopleData | undefined = watch(fieldName) as unknown as PeopleData | undefined;

  // State management
  const [showAddPerson, setShowAddPerson] = React.useState(false);
  const [showRecentContacts, setShowRecentContacts] = React.useState(false);
  const [newPerson, setNewPerson] = React.useState<Partial<PersonData>>({
    name: '',
    type: 'other',
  });

  // Mock recent contacts
  const recentContacts = React.useMemo(() => getMockRecentContacts(petId || 0), [petId]);

  // Initialize default value
  React.useEffect(() => {
    if (!currentValue) {
      setValue(fieldName, {
        people: [],
      });
    }
  }, [currentValue, fieldName, setValue]);

  // Handle adding person from recent contacts
  const handleAddFromContacts = React.useCallback((contact: PersonData) => {
    if (!currentValue) return;

    // Check if person already added
    const alreadyAdded = currentValue.people.some(p => p.id === contact.id);
    if (alreadyAdded) return;

    const updatedValue: PeopleData = {
      ...currentValue,
      people: [...currentValue.people, contact],
    };
    setValue(fieldName, updatedValue);
    setShowRecentContacts(false);
  }, [currentValue, fieldName, setValue]);

  // Handle adding new person
  const handleAddNewPerson = React.useCallback(() => {
    if (!newPerson.name?.trim() || !currentValue) return;

    const person: PersonData = {
      id: `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newPerson.name.trim(),
      type: newPerson.type || 'other',
      contact: newPerson.contact,
      notes: newPerson.notes,
      rating: newPerson.rating,
    };

    const updatedValue: PeopleData = {
      ...currentValue,
      people: [...currentValue.people, person],
    };

    setValue(fieldName, updatedValue);
    setNewPerson({ name: '', type: 'other' });
    setShowAddPerson(false);
  }, [newPerson, currentValue, fieldName, setValue]);

  // Handle removing person
  const handleRemovePerson = React.useCallback((personId: string) => {
    if (!currentValue) return;

    const updatedValue: PeopleData = {
      ...currentValue,
      people: currentValue.people.filter(p => p.id !== personId),
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Handle rating change
  const handleRatingChange = React.useCallback((personId: string, rating: number) => {
    if (!currentValue) return;

    const updatedValue: PeopleData = {
      ...currentValue,
      people: currentValue.people.map(person =>
        person.id === personId
          ? { ...person, rating }
          : person
      ),
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Handle notes change
  const handleNotesChange = React.useCallback((notes: string) => {
    if (!currentValue) return;

    const updatedValue: PeopleData = {
      ...currentValue,
      notes: notes || undefined,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Get role info
  const getRoleInfo = (type?: string) => {
    return type && PERSON_ROLES[type] ? PERSON_ROLES[type] : PERSON_ROLES.other;
  };

  if (!currentValue) return null;

  return (
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={(block.config as PeopleConfig | undefined)?.hint || 'Add people who were involved in this activity'}
      blockType="people"
      id={`people-${block.id}`}
    >
      <div className="space-y-4">
        {/* Add people buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddPerson(!showAddPerson)}
            className="flex items-center gap-1 text-xs"
          >
            <UserPlus className="w-3 h-3" />
            Add New Person
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowRecentContacts(!showRecentContacts)}
            className="flex items-center gap-1 text-xs"
          >
            <Users className="w-3 h-3" />
            Recent Contacts
          </Button>
        </div>

        {/* Add new person form */}
        {showAddPerson && (
          <div className="space-y-3 border rounded-md p-3 bg-muted/30">
            <div className="text-sm font-medium">Add New Person</div>
            
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Person's name"
                value={newPerson.name || ''}
                onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
              />

              <select
                value={newPerson.type || 'other'}
                onChange={(e) => setNewPerson(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                {Object.entries(PERSON_ROLES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={newPerson.contact?.phone || ''}
                  onChange={(e) => setNewPerson(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                />
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={newPerson.contact?.email || ''}
                  onChange={(e) => setNewPerson(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                />
              </div>

              <Input
                type="text"
                placeholder="Notes (optional)"
                value={newPerson.notes || ''}
                onChange={(e) => setNewPerson(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddNewPerson}
                disabled={!newPerson.name?.trim()}
                size="sm"
                className="flex-1"
              >
                Add Person
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddPerson(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Recent contacts */}
        {showRecentContacts && (
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="text-sm font-medium">Recent Contacts</div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentContacts.slice(0, 5).map((contact) => {
                const roleInfo = getRoleInfo(contact.type);
                const alreadyAdded = currentValue.people.some(p => p.id === contact.id);
                
                return (
                  <Button
                    key={contact.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddFromContacts(contact)}
                    disabled={alreadyAdded}
                    className="w-full justify-start text-left p-2 h-auto"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span role="img" aria-label={roleInfo.label}>
                        {roleInfo.icon}
                      </span>
                      {contact.rating && contact.rating === 5 && (
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      )}

                      <div className="flex-1">
                        <div className="font-medium text-sm">{contact.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {contact.notes || roleInfo.label}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {Math.floor((Date.now() - contact.lastSeen.getTime()) / (24 * 60 * 60 * 1000))}d ago
                      </div>

                      {alreadyAdded && (
                        <Badge variant="secondary" className="text-xs">
                          Added
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRecentContacts(false)}
              className="w-full text-xs"
            >
              Close
            </Button>
          </div>
        )}

        {/* Current participants */}
        {currentValue.people.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              People Involved ({currentValue.people.length})
            </div>

            <div className="space-y-2">
              {currentValue.people.map((person) => {
                const roleInfo = getRoleInfo(person.type);
                
                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-3 border rounded-md bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <span role="img" aria-label={roleInfo.label} className={roleInfo.color}>
                        {roleInfo.icon}
                      </span>
                      {person.rating && person.rating === 5 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRatingChange(person.id, person.rating === 5 ? 0 : 5)}
                          className="h-4 w-4 p-0 text-yellow-500"
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </Button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{person.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {roleInfo.label}
                        </Badge>
                      </div>

                      {(person.contact?.phone || person.contact?.email) && (
                        <div className="flex gap-2 mt-1">
                          {person.contact.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {person.contact.phone}
                            </div>
                          )}
                          {person.contact.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {person.contact.email}
                            </div>
                          )}
                        </div>
                      )}

                      {person.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {person.notes}
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePerson(person.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* General notes */}
        <div>
          <label className="text-sm font-medium">Activity Notes (Optional)</label>
          <Input
            type="text"
            placeholder="Any notes about people's involvement..."
            value={currentValue.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Empty state */}
        {currentValue.people.length === 0 && (
          <div className="text-center text-muted-foreground py-4 border-2 border-dashed border-muted rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No people added yet</div>
            <div className="text-xs">Add people who were involved in this activity</div>
          </div>
        )}
      </div>
    </Field>
  );
};

export default PeopleBlock;