import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  description: string | null;
  status: string;
  floor: number;
}

const TechnovationCentreMap = () => {
  const [floor, setFloor] = useState('1');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '',
    description: '',
    status: 'available',
    floor: '1'
  });
  
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch rooms',
        variant: 'destructive'
      });
    } else {
      setRooms(data || []);
    }
  };

  const handleSaveRoom = async () => {
    if (!formData.name || !formData.type) {
      toast({
        title: 'Error',
        description: 'Name and type are required',
        variant: 'destructive'
      });
      return;
    }

    const roomData = {
      name: formData.name,
      type: formData.type,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      description: formData.description || null,
      status: formData.status,
      floor: parseInt(formData.floor)
    };

    if (editingRoom) {
      const { error } = await supabase
        .from('rooms')
        .update(roomData)
        .eq('id', editingRoom.id);
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update room',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Room updated successfully'
        });
        fetchRooms();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('rooms')
        .insert(roomData);
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create room',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Room created successfully'
        });
        fetchRooms();
        resetForm();
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Room deleted successfully'
      });
      fetchRooms();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      capacity: '',
      description: '',
      status: 'available',
      floor: '1'
    });
    setEditingRoom(null);
    setIsDialogOpen(false);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity?.toString() || '',
      description: room.description || '',
      status: room.status,
      floor: room.floor?.toString() || '1'
    });
    setIsDialogOpen(true);
  };

  const getRoomsByFloor = (floorNumber: string) => {
    return rooms.filter(room => room.floor === parseInt(floorNumber));
  };

  const getRoomColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lab':
      case 'computer lab':
        return 'border-university-blue bg-blue-50';
      case 'office':
      case 'staff office':
        return 'border-green-600 bg-green-50';
      case 'meeting room':
      case 'conference room':
        return 'border-purple-600 bg-purple-50';
      case 'innovation lab':
        return 'border-orange-600 bg-orange-50';
      default:
        return 'border-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-university-blue">
            NUST Technovation Centre Map
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={floor} onValueChange={setFloor}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ground Floor</SelectItem>
                <SelectItem value="2">First Floor</SelectItem>
                <SelectItem value="3">Second Floor</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRoom ? 'Edit Room' : 'Add New Room'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Room Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Innovation Lab 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Room Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Innovation Lab">Innovation Lab</SelectItem>
                          <SelectItem value="Computer Lab">Computer Lab</SelectItem>
                          <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                          <SelectItem value="Office">Office</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                          <SelectItem value="Presentation Room">Presentation Room</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the room..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="maintenance">Under Maintenance</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="floor">Floor</Label>
                      <Select value={formData.floor} onValueChange={(value) => setFormData({ ...formData, floor: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Ground Floor</SelectItem>
                          <SelectItem value="2">First Floor</SelectItem>
                          <SelectItem value="3">Second Floor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveRoom} className="flex-1">
                        {editingRoom ? 'Update' : 'Create'}
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg p-4 min-h-[400px]">
          <div className="w-full h-[400px] relative bg-white p-4 rounded shadow-inner">
            {getRoomsByFloor(floor).map((room, index) => {
              const positions = [
                { top: '4', left: '4', width: '40%', height: '45%' },
                { top: '4', right: '4', width: '40%', height: '45%' },
                { bottom: '4', left: '4', width: '40%', height: '45%' },
                { bottom: '4', right: '4', width: '40%', height: '45%' },
                { top: '52%', left: '4', width: '40%', height: '20%' },
                { top: '52%', right: '4', width: '40%', height: '20%' }
              ];
              
              const position = positions[index] || positions[0];
              const positionClasses = Object.entries(position)
                .map(([key, value]) => `${key}-${value}`)
                .join(' ');

              return (
                <div
                  key={room.id}
                  className={`absolute border-2 ${getRoomColor(room.type)} flex items-center justify-center ${positionClasses}`}
                  style={position}
                >
                  <div className="text-center relative">
                    <div className="font-bold text-sm">{room.name}</div>
                    {room.capacity && (
                      <div className="text-xs text-gray-600">Capacity: {room.capacity}</div>
                    )}
                    <div className="text-xs text-gray-500">{room.type}</div>
                    {isAdmin && (
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-6 h-6 p-0"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-6 h-6 p-0"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Central corridor */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[10%] h-[80%] bg-gray-300 flex items-center justify-center text-sm text-gray-700 font-medium rotate-90">
              Corridor
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-50 border border-university-blue mr-2"></div>
              <span className="text-sm">Computer Labs</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-50 border border-orange-600 mr-2"></div>
              <span className="text-sm">Innovation Labs</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-50 border border-purple-600 mr-2"></div>
              <span className="text-sm">Meeting Rooms</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-50 border border-green-600 mr-2"></div>
              <span className="text-sm">Offices</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 mr-2"></div>
              <span className="text-sm">Common Areas</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnovationCentreMap;