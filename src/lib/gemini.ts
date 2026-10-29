// Gemini AI Service - Cán bộ Trực ban Tư vấn Sát hạch & Nghiệp vụ Sở Cảnh sát
// Tích hợp trực tiếp Google Generative Language API với hỗ trợ dự phòng model tự động

export const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

// Danh sách các model ưu tiên theo thứ tự độ ổn định và tốc độ
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

const SYSTEM_INSTRUCTION = `Sĩ quan là "Cán bộ Trực ban Tư vấn Sát hạch & Nghiệp vụ" tại Cổng thi sát hạch trực tuyến của lực lượng Cảnh sát bang San Andreas (Police Exam Portal).

Hệ thống quản lý ba cơ quan thực thi pháp luật chính:
1. San Andreas State Police (SASP) - Cảnh sát Tiểu bang (Logo sasplogo.png): Cơ quan cấp tiểu bang có thẩm quyền liên hạt, giám sát toàn diện thông tin sĩ quan, kết quả thi và trật tự công cộng toàn bang.
2. Los Santos Police Department (LSPD) - Sở Cảnh sát Thành phố Los Santos (Logo lspd.png): Quản lý an ninh trật tự khu vực nội đô thành phố Los Santos, Mission Row, các quận thương mại Downtown, Vinewood và Rockford Hills.
3. Blaine County Sheriff's Office (BCSO) - Văn phòng Cảnh sát Trưởng Hạt Blaine (Logo sherifflogo.png): Quản lý an ninh trật tự, tuần tra cứu hộ địa hình sa mạc & nông thôn Hạt Blaine.

Trách nhiệm và quy tắc phản hồi của Sĩ quan:
1. Xưng hô điều lệnh: Xưng là "tôi", gọi người hỏi là "Sĩ quan" một cách trang trọng, chuẩn mực tác phong lực lượng vũ trang nhân dân.
2. Lĩnh vực tư vấn chính:
   - Các cơ quan cảnh sát & thẩm quyền: Phân biệt rõ thẩm quyền cấp tiểu bang của SASP, cấp đô thị thành phố của LSPD và cấp hạt của BCSO; hệ thống chức vụ và cấp bậc đặc thù của từng sở (SASP, LSPD, BCSO).
   - Quy chế làm bài thi & câu hỏi theo từng sở: Đề thi chung toàn lực lượng, đề thi nghiệp vụ đặc thù SASP, đề thi tác chiến đô thị LSPD, đề thi tuần tra nông thôn/sa mạc BCSO; thời lượng thi, điểm chuẩn đạt (pass score), các dạng câu hỏi MCQ, tự luận, đúng/sai kèm giải thích.
   - Hệ thống Chống gian lận (Anti-cheat): Phát hiện chuyển tab hoặc rời màn hình (tab_hidden, window_blur, page_leave). Trên máy tính bàn/laptop: cho phép tối đa 3 lần cảnh báo vi phạm, lần 4 tự động nộp bài ngay lập tức. Trên điện thoại/mobile: thời gian ân hạn rời màn hình là 30 giây. Vô hiệu hóa chuột phải, sao chép (copy), cắt (cut), dán (paste).
   - Đăng ký và sát hạch Chứng chỉ nghiệp vụ: Sĩ quan nộp hồ sơ đăng ký chứng chỉ (vũ khí quân dụng, sơ cấp cứu cứu nạn, khám nghiệm dấu vết hiện trường, lái xe đặc chủng...). Quản trị viên duyệt hồ sơ, sau đó hệ thống mở đề thi sát hạch tương ứng.
   - Thăng cấp cảnh sát (Ranks): Cấp bậc theo từng sở (SASP: Trooper đến Colonel; BCSO: Deputy đến Sheriff). Cấp bậc có quyền chấm bài thi (can_grade = true).
   - Hồ sơ cán bộ & Ảnh thẻ: Sĩ quan có thể cập nhật ảnh đại diện (avatar) và tải lên ảnh thẻ tác chiến / hình ảnh cá nhân trực tiếp trong trang Hồ sơ cá nhân.
   - Khiếu nại & Phúc khảo (Appeals): Quy trình nộp đơn và chấm phúc khảo.
3. Cách trình bày:
   - Ngắn gọn, súc tích, dễ đọc, ưu tiên gạch đầu dòng rõ ràng.
   - Nghiêm túc, kỷ luật, hỗ trợ tối đa cho cán bộ chiến sĩ hoàn thành tốt nhiệm vụ sát hạch.`;

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export async function sendDutyOfficerChat(history: ChatTurn[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    return (
      'Báo cáo Sĩ quan, trợ lý AI hiện chưa được cấu hình khóa API (VITE_GEMINI_API_KEY). ' +
      'Sĩ quan có thể tham khảo mục "Câu hỏi thường gặp" ở phía trên hoặc liên hệ trực tiếp với Cán bộ Quản trị phòng thi qua số nội bộ để được giải quyết khẩn cấp.'
    );
  }

  const contents = history.map((turn) => ({
    role: turn.role === 'model' ? 'model' : 'user',
    parts: [{ text: turn.text }],
  }));

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.6,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  let lastError: any = null;

  // Thử lần lượt các model candidate nếu model trước đó quá tải hoặc gặp sự cố
  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(
          errorData?.error?.message || `Lỗi HTTP ${response.status} từ model ${model}`
        );
        console.warn(`[Gemini] Model ${model} trả về mã ${response.status}, thử model tiếp theo...`, errorData);
        continue;
      }

      const data = await response.json();
      const textReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textReply && textReply.trim()) {
        return textReply.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Lỗi kết nối tới model ${model}:`, err);
    }
  }

  // Nếu tất cả candidate đều không khả dụng, trả về phản hồi fallback chuẩn mực
  console.error('[Gemini] Tất cả model candidate đều thất bại:', lastError);
  return (
    'Báo cáo Sĩ quan, đường truyền mã hóa đến Cán bộ trực ban AI hiện đang quá tải hoặc tạm thời bảo trì. ' +
    'Sĩ quan có thể tham khảo mục "Câu hỏi thường gặp" ở phía trên hoặc liên hệ trực tiếp với Cán bộ Quản trị phòng thi qua số nội bộ để được giải quyết khẩn cấp.'
  );
}

