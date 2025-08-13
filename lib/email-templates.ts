export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'inquiry' | 'consultation' | 'trial' | 'enrollment' | 'follow_up';
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome_inquiry',
    name: 'Chào mừng khách hàng mới',
    subject: 'Chào mừng bạn đến với Meraki - Thông tin khóa học',
    category: 'inquiry',
    body: `Xin chào {{customerName}},

Cảm ơn bạn đã quan tâm đến các khóa học tại Meraki Education!

Chúng tôi rất vui mừng được đồng hành cùng bạn trong hành trình học tập. Meraki cung cấp các khóa học chất lượng cao với:

✨ Đội ngũ giảng viên giàu kinh nghiệm
✨ Phương pháp giảng dạy hiện đại
✨ Môi trường học tập thân thiện
✨ Hỗ trợ học viên tận tình

{{#if interestedProgram}}
Chúng tôi hiểu bạn quan tâm đến khóa học: {{interestedProgram}}
{{/if}}

Để được tư vấn chi tiết hơn, bạn có thể:
📞 Gọi hotline: 0123-456-789
💬 Nhắn tin Zalo: {{phone}}
📧 Email: khachhang@meraki.edu.vn

Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để tư vấn chi tiết.

Trân trọng,
Đội ngũ tư vấn Meraki Education
🌟 "Học với đam mê, thành công với Meraki" 🌟`
  },
  {
    id: 'consultation_followup',
    name: 'Theo dõi sau tư vấn',
    subject: 'Cảm ơn bạn đã tham gia tư vấn - Thông tin bổ sung',
    category: 'consultation',
    body: `Xin chào {{customerName}},

Cảm ơn bạn đã dành thời gian tham gia buổi tư vấn với chúng tôi hôm nay!

Như đã thảo luận, chúng tôi gửi bạn thông tin chi tiết về:
{{#if interestedProgram}}
📚 Khóa học: {{interestedProgram}}
{{/if}}

📋 Thông tin khóa học:
• Thời gian: [Thời gian cụ thể]
• Học phí: [Mức học phí]
• Ưu đãi đặc biệt: Giảm 15% cho đăng ký sớm
• Tặng kèm: Tài liệu học tập + Bộ kit học tập

🎯 Bước tiếp theo:
1. Đăng ký học thử MIỄN PHÍ
2. Tham gia lớp học thực tế
3. Nhận tư vấn 1-1 từ giảng viên

Để đăng ký học thử hoặc có thêm câu hỏi, vui lòng liên hệ:
📞 Hotline: 0123-456-789
💬 Zalo: {{phone}}

Chúng tôi rất mong được đồng hành cùng bạn!

Trân trọng,
{{consultantName}} - Tư vấn viên Meraki
khachhang@meraki.edu.vn`
  },
  {
    id: 'trial_invitation',
    name: 'Mời tham gia học thử',
    subject: 'Mời bạn tham gia buổi học thử MIỄN PHÍ tại Meraki',
    category: 'trial',
    body: `Xin chào {{customerName}},

🎉 Chúc mừng! Bạn đã được chấp nhận tham gia buổi học thử MIỄN PHÍ tại Meraki!

📅 Thông tin buổi học thử:
• Khóa học: {{interestedProgram}}
• Thời gian: [Ngày giờ cụ thể]
• Địa điểm: [Địa chỉ cơ sở]
• Giảng viên: [Tên giảng viên]

🎒 Chuẩn bị cho buổi học:
✅ Mang theo sổ ghi chép
✅ Đến sớm 15 phút để làm thủ tục
✅ Mang theo tinh thần học hỏi tích cực

🎁 Quà tặng đặc biệt:
• Tài liệu học tập miễn phí
• Voucher giảm giá 20% nếu đăng ký khóa học
• Tư vấn 1-1 với giảng viên

Nếu có bất kỳ thay đổi nào, vui lòng liên hệ ngay:
📞 Hotline: 0123-456-789
💬 Zalo: {{phone}}

Chúng tôi rất mong gặp bạn tại lớp học!

Trân trọng,
Đội ngũ Meraki Education
🌟 "Trải nghiệm học tập đỉnh cao" 🌟`
  },
  {
    id: 'enrollment_confirmation',
    name: 'Xác nhận đăng ký thành công',
    subject: '🎉 Chúc mừng! Đăng ký khóa học thành công tại Meraki',
    category: 'enrollment',
    body: `Xin chào {{customerName}},

🎉 CHÚC MỪNG! Bạn đã chính thức trở thành học viên của Meraki Education!

📋 Thông tin đăng ký:
• Học viên: {{studentName}}
• Khóa học: {{interestedProgram}}
• Mã học viên: [Mã số]
• Ngày bắt đầu: [Ngày cụ thể]

💳 Thông tin thanh toán:
• Học phí: {{#if budget}}{{budget}} VNĐ{{else}}[Số tiền]{{/if}}
• Đã thanh toán: [Số tiền đã thanh toán]
• Còn lại: [Số tiền còn lại]

📚 Chuẩn bị cho khóa học:
✅ Tài liệu học tập (sẽ được cung cấp)
✅ Dụng cụ học tập cần thiết
✅ Tham gia group học viên trên Zalo
✅ Tải app học tập Meraki

🎁 Ưu đãi học viên mới:
• Miễn phí tài liệu khóa đầu tiên
• Tư vấn học tập suốt khóa học
• Hỗ trợ sau khóa học 3 tháng

📞 Liên hệ hỗ trợ:
• Hotline: 0123-456-789
• Zalo: {{phone}}
• Email: khachhang@meraki.edu.vn

Chào mừng bạn đến với gia đình Meraki! 🏠

Trân trọng,
Ban Quản lý Khóa học
Meraki Education`
  },
  {
    id: 'follow_up_reminder',
    name: 'Nhắc nhở theo dõi',
    subject: 'Meraki nhớ bạn - Cập nhật thông tin khóa học mới',
    category: 'follow_up',
    body: `Xin chào {{customerName}},

Chúng tôi hy vọng bạn vẫn khỏe mạnh và hạnh phúc! 😊

Cách đây một thời gian, bạn đã quan tâm đến các khóa học tại Meraki. Chúng tôi muốn cập nhật cho bạn những thông tin mới nhất:

🆕 Khóa học mới:
• [Tên khóa học mới 1]
• [Tên khóa học mới 2]
• [Tên khóa học mới 3]

🎉 Ưu đãi đặc biệt tháng này:
• Giảm 25% học phí cho đăng ký sớm
• Tặng kèm khóa học online miễn phí
• Hỗ trợ trả góp 0% lãi suất

{{#if interestedProgram}}
📚 Cập nhật về khóa {{interestedProgram}}:
• Lịch khai giảng mới: [Ngày tháng]
• Ưu đãi đặc biệt cho khóa này
{{/if}}

Nếu bạn vẫn quan tâm hoặc muốn tìm hiểu thêm:
📞 Gọi ngay: 0123-456-789
💬 Nhắn Zalo: {{phone}}
📧 Email: khachhang@meraki.edu.vn

Chúng tôi luôn sẵn sàng hỗ trợ bạn!

Trân trọng,
Đội ngũ chăm sóc khách hàng
Meraki Education
💙 "Meraki - Nơi ước mơ thành hiện thực" 💙`
  }
];

export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return emailTemplates.filter(template => template.category === category);
}

export function getTemplateById(id: string): EmailTemplate | undefined {
  return emailTemplates.find(template => template.id === id);
}

export function renderTemplate(template: EmailTemplate, data: any): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  // Simple template rendering (replace {{variable}} with data)
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, data[key] || '');
    body = body.replace(regex, data[key] || '');
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  body = body.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
    return data[variable] ? content : '';
  });

  return { subject, body };
}
