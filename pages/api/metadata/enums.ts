import { NextApiRequest, NextApiResponse } from 'next';
import { COLLECTIONS } from '../../../lib/firebase-admin';
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Tham số "type" là bắt buộc'
      });
    }

    try {
      // Try to get enum values from Firestore metadata collection
      const enumDoc = await adminDb
        .collection(COLLECTIONS.METADATA)
        .doc('enums')
        .collection(type)
        .orderBy('order', 'asc')
        .get();

      if (!enumDoc.empty) {
        const enumValues = enumDoc.docs.map(doc => ({
          value: doc.id,
          label: doc.data().label || doc.id,
          ...doc.data()
        }));

        return res.status(200).json({
          success: true,
          data: enumValues,
          message: `Lấy giá trị enum ${type} thành công`
        });
      }

      // Fallback values for common enum types
      let fallbackData = [];
      
      switch (type) {
        case 'program_type':
          fallbackData = [
            { value: 'GrapeSEED', label: 'GrapeSEED', order: 1 },
            { value: 'Pre-WSC', label: 'Pre-WSC', order: 2 },
            { value: 'WSC', label: 'WSC', order: 3 },
            { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học', order: 4 },
            { value: 'Gavel club', label: 'Gavel club', order: 5 }
          ];
          break;

        case 'unit_grapeseed':
          fallbackData = [];
          for (let i = 1; i <= 30; i++) {
            fallbackData.push({ value: `U${i}`, label: `Unit ${i}`, order: i });
          }
          break;

        case 'loai_co_so':
        case 'facility_type':
          fallbackData = [
            { value: 'Meraki', label: 'Meraki', order: 1 },
            { value: 'Trường đối tác', label: 'Trường đối tác', order: 2 }
          ];
          break;

        case 'student_status':
          fallbackData = [
            { value: 'active', label: 'Đang học', order: 1 },
            { value: 'inactive', label: 'Tạm nghỉ', order: 2 },
            { value: 'graduated', label: 'Tốt nghiệp', order: 3 },
            { value: 'suspended', label: 'Đình chỉ', order: 4 }
          ];
          break;

        case 'class_status':
          fallbackData = [
            { value: 'active', label: 'Đang hoạt động', order: 1 },
            { value: 'inactive', label: 'Tạm nghỉ', order: 2 },
            { value: 'completed', label: 'Hoàn thành', order: 3 }
          ];
          break;

        case 'enrollment_status':
          fallbackData = [
            { value: 'active', label: 'Đang học', order: 1 },
            { value: 'completed', label: 'Hoàn thành', order: 2 },
            { value: 'dropped', label: 'Bỏ học', order: 3 },
            { value: 'transferred', label: 'Chuyển lớp', order: 4 }
          ];
          break;

        case 'attendance_status':
          fallbackData = [
            { value: 'present', label: 'Có mặt', order: 1 },
            { value: 'absent', label: 'Vắng mặt', order: 2 },
            { value: 'late', label: 'Muộn', order: 3 },
            { value: 'excused', label: 'Nghỉ phép', order: 4 }
          ];
          break;

        case 'finance_status':
          fallbackData = [
            { value: 'pending', label: 'Chờ xử lý', order: 1 },
            { value: 'completed', label: 'Hoàn thành', order: 2 },
            { value: 'cancelled', label: 'Hủy bỏ', order: 3 }
          ];
          break;

        case 'transaction_type':
          fallbackData = [
            { value: 'payment', label: 'Thanh toán', order: 1 },
            { value: 'refund', label: 'Hoàn tiền', order: 2 },
            { value: 'fee', label: 'Phí', order: 3 },
            { value: 'discount', label: 'Giảm giá', order: 4 }
          ];
          break;

        case 'task_status':
          fallbackData = [
            { value: 'pending', label: 'Chờ xử lý', order: 1 },
            { value: 'in_progress', label: 'Đang thực hiện', order: 2 },
            { value: 'completed', label: 'Hoàn thành', order: 3 },
            { value: 'cancelled', label: 'Hủy bỏ', order: 4 }
          ];
          break;

        case 'task_priority':
          fallbackData = [
            { value: 'low', label: 'Thấp', order: 1 },
            { value: 'medium', label: 'Trung bình', order: 2 },
            { value: 'high', label: 'Cao', order: 3 },
            { value: 'urgent', label: 'Khẩn cấp', order: 4 }
          ];
          break;

        case 'employee_status':
          fallbackData = [
            { value: 'active', label: 'Đang làm việc', order: 1 },
            { value: 'inactive', label: 'Tạm nghỉ', order: 2 },
            { value: 'terminated', label: 'Nghỉ việc', order: 3 }
          ];
          break;

        default:
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy enum type: ${type}`
          });
      }

      // If we have fallback data, optionally store it in Firestore for future use
      if (fallbackData.length > 0) {
        try {
          const batch = adminDb.batch();
          const enumCollectionRef = adminDb
            .collection(COLLECTIONS.METADATA)
            .doc('enums')
            .collection(type);

          fallbackData.forEach(item => {
            const docRef = enumCollectionRef.doc(item.value);
            batch.set(docRef, {
              label: item.label,
              order: item.order,
              created_at: new Date().toISOString()
            });
          });

          await batch.commit();
          console.log(`Enum ${type} stored in Firestore for future use`);
        } catch (error) {
          console.error(`Failed to store enum ${type} in Firestore:`, error);
        }
      }

      return res.status(200).json({
        success: true,
        data: fallbackData.map(item => ({ value: item.value, label: item.label })),
        message: `Lấy giá trị enum ${type} thành công (fallback)`
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không xác định',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }
}