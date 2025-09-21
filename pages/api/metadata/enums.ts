import { NextApiRequest, NextApiResponse } from 'next';

// Static enum data for Firebase version
const enumData = {
  loai_co_so: [
    { value: 'Meraki', label: 'Meraki' },
    { value: 'Trường đối tác', label: 'Trường đối tác' }
  ],
  program_type: [
    { value: 'GrapeSEED', label: 'GrapeSEED' },
    { value: 'Pre-WSC', label: 'Pre-WSC' },
    { value: 'WSC', label: 'WSC' },
    { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
    { value: 'Gavel club', label: 'Gavel club' }
  ],
  unit_grapeseed: Array.from({ length: 30 }, (_, i) => ({
    value: `U${i + 1}`,
    label: `Unit ${i + 1}`
  }))
};

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
      const data = enumData[type as keyof typeof enumData];

      if (!data) {
        return res.status(404).json({
          success: false,
          message: `Enum type "${type}" không tồn tại`
        });
      }

      return res.status(200).json({
        success: true,
        data: data,
        message: `Lấy giá trị enum ${type} thành công`
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
