import { redirect } from "next/navigation";
import CheckoutClient from "@/app/traveler/bookings/components/CheckoutClient";
import { getCheckoutBooking } from "@/lib/bookings/getCheckoutBooking";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    method?: "toss" | "paypal" | "kakao";
    customerName?: string;
    customerEmail?: string;
    autoStart?: string;
  }>;
};

export default async function PaymentPopupPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { user, booking, fullBooking, bookingError } = await getCheckoutBooking(id);

  if (!user) {
    redirect("/login");
  }

  if (bookingError || !booking || !fullBooking) {
    return (
      <div className="min-h-screen bg-[#f6f4ef] p-6">
        <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-bold text-red-600">결제 정보를 불러오지 못했습니다</h1>
          <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-green-400">
            {JSON.stringify(bookingError, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (booking.status !== "confirmed") {
    redirect("/payment-popup/result?status=error&message=invalid-booking-state");
  }

  return (
    <CheckoutClient
      booking={fullBooking}
      popupMode
      initialPaymentMethod={query.method === "kakao" || query.method === "paypal" ? query.method : "toss"}
      initialTravelerName={query.customerName}
      initialTravelerEmail={query.customerEmail}
      autoStartPayment={query.autoStart === "1"}
    />
  );
}
