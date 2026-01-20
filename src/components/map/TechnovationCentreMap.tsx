import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Edit, Trash2, Move, Save, RotateCcw, Grid3X3 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  description: string | null;
  status: string;
  floor: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  corridor_side: string;
}

const GRID_COLS = 12;
const GRID_ROWS = 8;
const CELL_SIZE = 60;

const TechnovationCentreMap = () => {
  const [floor, setFloor] = useState('1');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedRoom, setDraggedRoom] = useState<Room | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [unsavedChanges, setUnsavedChanges] = useState<Map<string, Partial<Room>>>(new Map());
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '',
    description: '',
    status: 'available',
    floor: '1',
    width: '2',
    height: '2',
    corridor_side: 'left'
  });
  
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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
      floor: parseInt(formData.floor),
      width: parseInt(formData.width) || 2,
      height: parseInt(formData.height) || 2,
      corridor_side: formData.corridor_side
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
      floor: '1',
      width: '2',
      height: '2',
      corridor_side: 'left'
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
      floor: room.floor?.toString() || '1',
      width: room.width?.toString() || '2',
      height: room.height?.toString() || '2',
      corridor_side: room.corridor_side || 'left'
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
        return 'bg-blue-100 border-blue-500 hover:bg-blue-200';
      case 'office':
      case 'staff office':
        return 'bg-green-100 border-green-500 hover:bg-green-200';
      case 'meeting room':
      case 'conference room':
        return 'bg-purple-100 border-purple-500 hover:bg-purple-200';
      case 'innovation lab':
        return 'bg-orange-100 border-orange-500 hover:bg-orange-200';
      case 'workshop':
        return 'bg-yellow-100 border-yellow-500 hover:bg-yellow-200';
      case 'presentation room':
        return 'bg-pink-100 border-pink-500 hover:bg-pink-200';
      default:
        return 'bg-gray-100 border-gray-500 hover:bg-gray-200';
    }
  };

  const handleDragStart = (e: React.MouseEvent, room: Room) => {
    if (!isEditMode || !isAdmin) return;
    e.preventDefault();
    setDraggedRoom(room);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggedRoom || !isEditMode) return;
    
    const container = document.getElementById('map-grid-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - dragOffset.x) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top - dragOffset.y) / CELL_SIZE);
    
    const clampedX = Math.max(0, Math.min(x, GRID_COLS - (draggedRoom.width || 2)));
    const clampedY = Math.max(0, Math.min(y, GRID_ROWS - (draggedRoom.height || 2)));
    
    if (clampedX !== draggedRoom.position_x || clampedY !== draggedRoom.position_y) {
      const updatedRooms = rooms.map(r => 
        r.id === draggedRoom.id 
          ? { ...r, position_x: clampedX, position_y: clampedY }
          : r
      );
      setRooms(updatedRooms);
      
      setUnsavedChanges(prev => {
        const newChanges = new Map(prev);
        newChanges.set(draggedRoom.id, { 
          ...newChanges.get(draggedRoom.id),
          position_x: clampedX, 
          position_y: clampedY 
        });
        return newChanges;
      });
      
      setDraggedRoom({ ...draggedRoom, position_x: clampedX, position_y: clampedY });
    }
  }, [draggedRoom, isEditMode, rooms, dragOffset]);

  const handleDragEnd = () => {
    setDraggedRoom(null);
  };

  const saveAllPositions = async () => {
    const updates = Array.from(unsavedChanges.entries());
    
    for (const [roomId, changes] of updates) {
      const { error } = await supabase
        .from('rooms')
        .update(changes)
        .eq('id', roomId);
      
      if (error) {
        toast({
          title: 'Error',
          description: `Failed to save position for room`,
          variant: 'destructive'
        });
        return;
      }
    }
    
    setUnsavedChanges(new Map());
    toast({
      title: 'Success',
      description: 'All room positions saved successfully'
    });
    fetchRooms();
  };

  const resetPositions = () => {
    setUnsavedChanges(new Map());
    fetchRooms();
    toast({
      title: 'Reset',
      description: 'Room positions reset to last saved state'
    });
  };

  const getCorridorPosition = () => {
    return {
      left: GRID_COLS / 2 * CELL_SIZE - 20,
      top: 0,
      width: 40,
      height: GRID_ROWS * CELL_SIZE
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="text-2xl font-bold text-primary">
              NUST Technovation Centre Map
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
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
                <>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isEditMode}
                      onCheckedChange={setIsEditMode}
                      id="edit-mode"
                    />
                    <Label htmlFor="edit-mode" className="flex items-center gap-1">
                      <Grid3X3 className="w-4 h-4" />
                      Edit Layout
                    </Label>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetForm()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                        <div className="grid grid-cols-2 gap-4">
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
                            <Label htmlFor="corridor_side">Corridor Side</Label>
                            <Select value={formData.corridor_side} onValueChange={(value) => setFormData({ ...formData, corridor_side: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left Side</SelectItem>
                                <SelectItem value="right">Right Side</SelectItem>
                                <SelectItem value="top">Top Side</SelectItem>
                                <SelectItem value="bottom">Bottom Side</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="width">Width (grid units)</Label>
                            <Input
                              id="width"
                              type="number"
                              min="1"
                              max="6"
                              value={formData.width}
                              onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="height">Height (grid units)</Label>
                            <Input
                              id="height"
                              type="number"
                              min="1"
                              max="6"
                              value={formData.height}
                              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            />
                          </div>
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
                        <div className="grid grid-cols-2 gap-4">
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
                </>
              )}
            </div>
          </div>
          
          {isAdmin && isEditMode && (
            <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Move className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-800 flex-1">
                Drag rooms to reposition them on the map. Click Save when done.
              </span>
              {unsavedChanges.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={resetPositions}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={saveAllPositions}>
                    <Save className="w-4 h-4 mr-1" />
                    Save ({unsavedChanges.size})
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-lg p-4 overflow-x-auto">
          <div 
            id="map-grid-container"
            className="relative bg-background rounded shadow-inner"
            style={{ 
              width: GRID_COLS * CELL_SIZE, 
              height: GRID_ROWS * CELL_SIZE,
              minWidth: GRID_COLS * CELL_SIZE
            }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Grid lines for edit mode */}
            {isEditMode && isAdmin && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute top-0 bottom-0 w-px bg-gray-200"
                    style={{ left: i * CELL_SIZE }}
                  />
                ))}
                {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute left-0 right-0 h-px bg-gray-200"
                    style={{ top: i * CELL_SIZE }}
                  />
                ))}
              </div>
            )}

            {/* Central corridor */}
            <div 
              className="absolute bg-gray-300 flex items-center justify-center"
              style={getCorridorPosition()}
            >
              <span className="text-xs text-gray-600 font-medium whitespace-nowrap transform -rotate-90">
                Corridor
              </span>
            </div>

            {/* Rooms */}
            {getRoomsByFloor(floor).map((room) => {
              const roomWidth = (room.width || 2) * CELL_SIZE;
              const roomHeight = (room.height || 2) * CELL_SIZE;
              const posX = (room.position_x || 0) * CELL_SIZE;
              const posY = (room.position_y || 0) * CELL_SIZE;
              
              return (
                <div
                  key={room.id}
                  className={`absolute border-2 rounded-md flex flex-col items-center justify-center p-2 transition-shadow ${getRoomColor(room.type)} ${
                    isEditMode && isAdmin ? 'cursor-move shadow-md' : ''
                  } ${draggedRoom?.id === room.id ? 'opacity-70 z-50' : ''}`}
                  style={{
                    left: posX,
                    top: posY,
                    width: roomWidth,
                    height: roomHeight,
                  }}
                  onMouseDown={(e) => handleDragStart(e, room)}
                >
                  <div className="text-center overflow-hidden w-full">
                    <div className="font-bold text-xs truncate">{room.name}</div>
                    {room.capacity && roomHeight > 80 && (
                      <div className="text-xs text-muted-foreground">Cap: {room.capacity}</div>
                    )}
                    {roomHeight > 100 && (
                      <div className="text-xs text-muted-foreground truncate">{room.type}</div>
                    )}
                    {room.status !== 'available' && (
                      <div className={`text-xs mt-1 px-1 rounded ${
                        room.status === 'maintenance' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {room.status}
                      </div>
                    )}
                  </div>
                  
                  {isAdmin && !isEditMode && (
                    <div className="absolute -top-1 -right-1 flex gap-0.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-6 h-6 p-0 rounded-full shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoom(room);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-6 h-6 p-0 rounded-full shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded mr-2"></div>
              <span className="text-sm">Computer Labs</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded mr-2"></div>
              <span className="text-sm">Innovation Labs</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded mr-2"></div>
              <span className="text-sm">Meeting Rooms</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
              <span className="text-sm">Offices</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded mr-2"></div>
              <span className="text-sm">Workshops</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-pink-100 border-2 border-pink-500 rounded mr-2"></div>
              <span className="text-sm">Presentation Rooms</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
              <span className="text-sm">Corridor</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnovationCentreMap;
