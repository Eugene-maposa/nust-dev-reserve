
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CentreMap = () => {
  const [floor, setFloor] = React.useState('1');

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-university-blue">Software Development Centre Map</h2>
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
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
          {floor === '1' && (
            <div className="w-full h-[400px] relative bg-white p-4 rounded shadow-inner">
              <div className="absolute top-4 left-4 w-[40%] h-[45%] border-2 border-university-blue bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Computer Lab A</div>
                  <div className="text-sm text-gray-600">Capacity: 30</div>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-[40%] h-[45%] border-2 border-university-blue bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Computer Lab B</div>
                  <div className="text-sm text-gray-600">Capacity: 25</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 w-[40%] h-[45%] border-2 border-university-blue bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Study Room 1</div>
                  <div className="text-sm text-gray-600">Capacity: 10</div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-[40%] h-[45%] border-2 border-university-blue bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Conference Room</div>
                  <div className="text-sm text-gray-600">Capacity: 15</div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[10%] h-[80%] bg-gray-300 flex items-center justify-center text-sm text-gray-700 font-medium rotate-90">
                Corridor
              </div>
            </div>
          )}
          
          {floor === '2' && (
            <div className="w-full h-[400px] relative bg-white p-4 rounded shadow-inner">
              <div className="absolute top-4 left-4 w-[60%] h-[45%] border-2 border-university-blue bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Computer Lab C</div>
                  <div className="text-sm text-gray-600">Capacity: 20</div>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-[30%] h-[45%] border-2 border-green-600 bg-green-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Staff Office</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 w-[40%] h-[45%] border-2 border-university-blue bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Study Room 2</div>
                  <div className="text-sm text-gray-600">Capacity: 8</div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-[50%] h-[45%] border-2 border-yellow-600 bg-yellow-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Server Room</div>
                  <div className="text-sm text-gray-600">Restricted Access</div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[10%] h-[80%] bg-gray-300 flex items-center justify-center text-sm text-gray-700 font-medium rotate-90">
                Corridor
              </div>
            </div>
          )}
          
          {floor === '3' && (
            <div className="w-full h-[400px] relative bg-white p-4 rounded shadow-inner">
              <div className="absolute top-4 left-4 w-[40%] h-[45%] border-2 border-green-600 bg-green-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Faculty Office 1</div>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-[40%] h-[45%] border-2 border-green-600 bg-green-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Faculty Office 2</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 w-[40%] h-[45%] border-2 border-green-600 bg-green-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Admin Office</div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-[40%] h-[45%] border-2 border-yellow-600 bg-yellow-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">Storage Room</div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[10%] h-[80%] bg-gray-300 flex items-center justify-center text-sm text-gray-700 font-medium rotate-90">
                Corridor
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-50 border border-university-blue mr-2"></div>
              <span className="text-sm">Bookable Rooms</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-50 border border-green-600 mr-2"></div>
              <span className="text-sm">Staff Areas</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-600 mr-2"></div>
              <span className="text-sm">Restricted Areas</span>
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

export default CentreMap;
