import { redirect } from "next/navigation";
import CheckoutClient from "@/app/traveler/bookings/components/CheckoutClient";
import { getCheckoutBooking } from "@/lib/bookings/getCheckoutBooking";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CheckoutPage({ params }: PageProps) {
  const t = await getTranslations("checkout");
  const { id } = await params;
  const { user, booking, fullBooking, bookingError } = await getCheckoutBooking(id);

  if (!user) {
    redirect("/login");
  }

  if (bookingError || !booking || !fullBooking) {
    return (
      <div className="m-10 rounded-xl border-4 border-red-500 bg-red-50 p-10">
        <h1 className="mb-4 text-2xl font-black text-red-600">
          {t("alerts.dataLoadFailed")}
        </h1>
        <pre className="overflow-auto rounded bg-gray-900 p-4 text-xs text-green-400">
          {JSON.stringify(bookingError, null, 2)}
        </pre>
      </div>
    );
  }

  if (booking.status !== "confirmed") {
    redirect("/traveler/bookings");
  }

  return <CheckoutClient booking={fullBooking} popupMode={false} />;
}
