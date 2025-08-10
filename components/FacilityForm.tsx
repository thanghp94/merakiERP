import React, { useState, useEffect } from 'react';

interface Room {
  id: string;
  name: string;
  description: string;
}

interface FacilityFormProps {
  onSubmit: (facilityData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const FacilityForm: React.FC<FacilityFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    status: initialData.status || 'active',
    type: initialData.data?.type || '',
    address: initialData.data?.address || '',
    capacity: initialData.data?.capacity || '',
    established: initialData.data?.established || '',
    description: initialData.data?.description || ''
  });

  const [rooms, setRooms] = useState<Room[]>(
    initialData.data?.rooms || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facilityTypes, setFacilityTypes] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Fetch facility types from enum
  useEffect(() => {
    const fetchFacilityTypes = async () => {
      try {
        const response = await fetch('/api/metadata/enums?type=loai_co_so');
        const result = await response.json();
        
        if (result.success) {
          // Only use the enum values from database, no additional options
          setFacilityTypes(result.data);
        } else {
          console.error('Failed to fetch facility types:', result.message);
          // Fallback to hardcoded values
          setFacilityTypes([
            { value: 'Meraki', label: 'Meraki' },
            { value: 'Trường đối tác', label: 'Trường đối tác' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching facility types:', error);
        // Fallback to hardcoded values
        setFacilityTypes([
          { value: 'Meraki', label: 'Meraki' },
          { value: 'Trường đối tác', label: 'Trường đối tác' }
        ]);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchFacilityTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add room functions
  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: '',
      description: ''
    };
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  const updateRoom = (roomId: string, field: keyof Room, value: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, [field]: value } : room
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        status: formData.status,
        data: {
          type: formData.type,
          address: formData.address,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          established: formData.established,
          description: formData.description,
          rooms: rooms.filter(room => room.name.trim() !== '') // Only include rooms with names
        }
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          name: '',
          status: 'active',
          type: '',
          address: '',
          capacity: '',
          established: '',
          description: ''
        });
        setRooms([]);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Tên cơ sở *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập tên cơ sở"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Loại cơ sở
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={isLoadingTypes}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {isLoadingTypes ? 'Đang tải...' : 'Chọn loại cơ sở'}
            </option>
            {facilityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ cơ sở
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập địa chỉ cơ sở"
          />
        </div>

        {/* Multiple rooms section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-800">Thêm phòng học</h3>
            <button
              type="button"
              onClick={addRoom}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              ➕ Thêm phòng học
            </button>
          </div>

          {/* Multiple room fields */}
          {rooms.length > 0 && (
            <div className="space-y-4">
              {rooms.map((room, index) => (
                <div key={room.id} className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-700">Phòng học {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeRoom(room.id)}
                      className="px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      ❌ Xóa
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên phòng học *
                      </label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập tên phòng học (VD: Phòng A101)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả phòng học
                      </label>
                      <textarea
                        value={room.description}
                        onChange={(e) => updateRoom(room.id, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mô tả về phòng học (trang thiết bị, vị trí, đặc điểm...)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Sức chứa
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Số lượng học sinh tối đa"
            />
          </div>

          <div>
            <label htmlFor="established" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày thành lập
            </label>
            <input
              type="date"
              id="established"
              name="established"
              value={formData.established}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mô tả về cơ sở"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                setFormData({
                  name: '',
                  status: 'active',
                  type: '',
                  address: '',
                  capacity: '',
                  established: '',
                  description: ''
                });
                setRooms([]);
              }
            }}
          >
            {isEditing ? 'Hủy' : 'Xóa form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacilityForm;
