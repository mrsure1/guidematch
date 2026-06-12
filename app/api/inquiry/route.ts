import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// 문의 수신자 이메일입니다.
// 환경변수에 여러 개가 들어오면 콤마 기준으로 분리해서 모두 발송합니다.
const recipientEmails = (process.env.ADMIN_EMAILS || "leeyob@gmail.com")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const categoryEmoji: Record<string, string> = {
  "예약/취소": "🛎️",
  "가이드 진행/가이드": "🧭",
  "결제/환불": "💳",
  "기타/피드백": "💬",
};

export async function POST(request: NextRequest) {
  try {
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "메일 발송 설정이 없습니다. RESEND_API_KEY를 확인해 주세요." },
        { status: 500 },
      );
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "문의 수신 이메일이 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { category, title, message, email, name } = body ?? {};

    // 필수값이 비어 있으면 바로 중단합니다.
    if (!category || !title || !message || !email || !name) {
      return NextResponse.json(
        { error: "모든 필수 항목을 입력해 주세요." },
        { status: 400 },
      );
    }

    if (typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "문의 내용은 최소 10자 이상 입력해 주세요." },
        { status: 400 },
      );
    }

    const emoji = categoryEmoji[String(category)] || "💬";
    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    console.log("[Inquiry] Recipient emails:", recipientEmails.join(", "));

    // Resend 클라이언트는 핸들러 안에서 지연 생성한다.
    // 모듈 로드 시점에 만들면 RESEND_API_KEY 없는 빌드 환경에서 생성자가 throw해
    // `next build`의 page-data 수집 단계가 깨진다(배포 실패).
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "GuideMatch 문의 <onboarding@resend.dev>",
      to: recipientEmails,
      replyTo: String(email),
      subject: `${emoji} [1:1문의] ${String(category)} - ${String(title)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1f2937;">
          <h1 style="margin: 0 0 8px; font-size: 24px;">새로운 1:1 문의가 접수되었습니다</h1>
          <p style="margin: 0 0 24px; color: #6b7280;">${now}</p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e5e7eb; width: 140px; font-weight: 700;">이름</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${String(name)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e5e7eb; font-weight: 700;">이메일</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${String(email)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e5e7eb; font-weight: 700;">문의 유형</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${String(category)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e5e7eb; font-weight: 700;">제목</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${String(title)}</td>
            </tr>
          </table>

          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; white-space: pre-wrap; line-height: 1.7;">
            ${String(message)}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Inquiry] Resend send error:", error);
      return NextResponse.json(
        { error: "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    console.log("[Inquiry] Mail sent successfully:", data?.id);

    return NextResponse.json({
      success: true,
      message: "문의가 정상적으로 접수되었습니다.",
    });
  } catch (err) {
    console.error("[Inquiry] Unexpected error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
