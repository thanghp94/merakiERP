import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyLocation } from '../../../lib/utils/gps';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getClockRecords(req, res);
      case 'POST':
        return await createClockRecord(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ 
          success: false, 
          message: `Phương thức ${req.method} không được hỗ trợ` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ nội bộ' 
    });
  }
}

async function getClockRecords(req: NextApiRequest, res: NextApiResponse) {
  const { employee_id, date, status, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('employee_clock_ins')
    .select(`
      *,
      employees (
        id,
        full_name,
        data
      ),
      facilities (
        id,
        name,
        data,
        latitude,
        longitude
      )
    `)
    .order('work_date', { ascending: false })
    .order('clock_in_time', { ascending: false });

  if (employee_id) {
    query = query.eq('employee_id', employee_id);
  }

  if (date) {
    query = query.eq('work_date', date);
  }

  if (status) {
    // Status logic: if clock_out_time is null, it's 'active', otherwise 'completed'
    if (status === 'active') {
      query = query.is('clock_out_time', null);
    } else if (status === 'completed') {
      query = query.not('clock_out_time', 'is', null);
    }
  }

  if (limit) {
    query = query.limit(parseInt(limit as string));
  }

  if (offset) {
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách chấm công' 
    });
  }

  // Calculate total hours and status for each record
  const processedData = data?.map(record => {
    let totalHours = null;
    let status = 'active';

    if (record.clock_out_time) {
      const clockIn = new Date(record.clock_in_time);
      const clockOut = new Date(record.clock_out_time);
      totalHours = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) * 10) / 10;
      status = 'completed';
    }

    return {
      ...record,
      total_hours: totalHours,
      status
    };
  });

  return res.status(200).json({
    success: true,
    data: processedData,
    message: 'Lấy danh sách chấm công thành công'
  });
}

async function createClockRecord(req: NextApiRequest, res: NextApiResponse) {
  const { 
    employee_id, 
    type = 'clock_in', 
    latitude, 
    longitude, 
    data = {} 
  } = req.body;

  if (!employee_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID nhân viên là bắt buộc' 
    });
  }

  // GPS coordinates are required for location verification
  if (!latitude || !longitude) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vị trí GPS là bắt buộc để chấm công' 
    });
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    // Get all Meraki facilities for location verification
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, latitude, longitude, radius_meters, data')
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (facilitiesError) {
      console.error('Error fetching facilities:', facilitiesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể kiểm tra vị trí làm việc' 
      });
    }

    // Filter Meraki facilities
    const merakiFacilities = facilities?.filter(f => f.data?.type === 'Meraki') || [];

    if (merakiFacilities.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không tìm thấy địa điểm làm việc Meraki nào' 
      });
    }

    // Find the closest valid facility
    let closestFacility = null;
    let minDistance = Infinity;
    let isLocationValid = false;

    for (const facility of merakiFacilities) {
      const verification = verifyLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(facility.latitude),
        parseFloat(facility.longitude),
        facility.radius_meters || 20
      );

      if (verification.distance < minDistance) {
        minDistance = verification.distance;
        closestFacility = facility;
        if (verification.isValid) {
          isLocationValid = true;
        }
      }
    }

    if (!isLocationValid || !closestFacility) {
      return res.status(400).json({ 
        success: false, 
        message: `Vị trí không hợp lệ. Bạn cần ở trong vòng ${closestFacility?.radius_meters || 20}m từ địa điểm làm việc. Khoảng cách hiện tại: ${Math.round(minDistance)}m từ ${closestFacility?.name || 'địa điểm làm việc'}`,
        data: {
          distance: Math.round(minDistance),
          required_distance: closestFacility?.radius_meters || 20,
          facility_name: closestFacility?.name || 'Unknown'
        }
      });
    }

    if (type === 'clock_in') {
      // Check if there's already an active clock-in for today
      const { data: existingRecord } = await supabase
        .from('employee_clock_ins')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('work_date', today)
        .is('clock_out_time', null)
        .single();

      if (existingRecord) {
        return res.status(409).json({ 
          success: false, 
          message: 'Bạn đã chấm công vào hôm nay và chưa chấm công ra' 
        });
      }

      // Create new clock-in record with location verification
      const { data: clockRecord, error } = await supabase
        .from('employee_clock_ins')
        .insert({
          employee_id,
          work_date: today,
          clock_in_time: now.toISOString(),
          facility_id: closestFacility.id,
          clock_in_latitude: parseFloat(latitude),
          clock_in_longitude: parseFloat(longitude),
          location_verified: true,
          distance_meters: minDistance,
          data: {
            ...data,
            location_info: {
              facility_name: closestFacility.name,
              distance_meters: minDistance,
              verified_at: now.toISOString()
            }
          }
        })
        .select(`
          *,
          employees (
            id,
            full_name,
            data
          ),
          facilities (
            id,
            name,
            data
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Không thể tạo bản ghi chấm công vào' 
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          ...clockRecord,
          status: 'active',
          total_hours: null
        },
        message: `Chấm công vào thành công tại ${closestFacility.name} (${Math.round(minDistance)}m)`
      });

    } else if (type === 'clock_out') {
      // Find the active clock-in record for today
      const { data: activeRecord, error: findError } = await supabase
        .from('employee_clock_ins')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('work_date', today)
        .is('clock_out_time', null)
        .single();

      if (findError || !activeRecord) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy bản ghi chấm công vào cho hôm nay' 
        });
      }

      // Update with clock-out time and location
      const { data: updatedRecord, error: updateError } = await supabase
        .from('employee_clock_ins')
        .update({
          clock_out_time: now.toISOString(),
          data: { 
            ...activeRecord.data, 
            ...data,
            clock_out_location: {
              facility_name: closestFacility.name,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              distance_meters: minDistance,
              verified_at: now.toISOString()
            }
          }
        })
        .eq('id', activeRecord.id)
        .select(`
          *,
          employees (
            id,
            full_name,
            data
          ),
          facilities (
            id,
            name,
            data
          )
        `)
        .single();

      if (updateError) {
        console.error('Supabase error:', updateError);
        return res.status(500).json({ 
          success: false, 
          message: 'Không thể cập nhật bản ghi chấm công ra' 
        });
      }

      // Calculate total hours
      const clockIn = new Date(updatedRecord.clock_in_time);
      const clockOut = new Date(updatedRecord.clock_out_time);
      const totalHours = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) * 10) / 10;

      return res.status(200).json({
        success: true,
        data: {
          ...updatedRecord,
          status: 'completed',
          total_hours: totalHours
        },
        message: `Chấm công ra thành công tại ${closestFacility.name}! Tổng thời gian làm việc: ${totalHours} giờ`
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Loại chấm công không hợp lệ' 
    });

  } catch (error) {
    console.error('Clock record creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xử lý chấm công' 
    });
  }
}
